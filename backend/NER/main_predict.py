import torch
import torch.autograd
from torch.utils.data import DataLoader
import copy
import NER.config as config
import NER.data_loader as data_loader
import NER.utils as utils
from NER.model import Model

def split_continuous_arrays(arr):
    result = []
    temp_array = []

    for i in range(len(arr) - 1):
        temp_array.append(arr[i])

        # Check if the next element breaks the continuity
        if arr[i] + 1 != arr[i + 1]:
            result.append(temp_array)
            temp_array = []

    # Include the last element in the last subarray
    temp_array.append(arr[-1])
    result.append(temp_array)
    return result


def model_predict(model, data_loader, data):
    model.eval()
    result = []
    i = 0
    with torch.no_grad():
        for data_batch in data_loader:
            sentence_batch = data[i:i+config.batch_size]
            entity_text = data_batch[-1]
            data_batch = [data.cuda() for data in data_batch[:-1]]
            bert_inputs, grid_labels, grid_mask2d, pieces2word, dist_inputs, sent_length = data_batch

            outputs = model(bert_inputs, grid_mask2d, dist_inputs, pieces2word, sent_length)
            length = sent_length

            grid_mask2d = grid_mask2d.clone()

            outputs = torch.argmax(outputs, -1)
            ent_c, ent_p, ent_r, decode_entities = utils.decode(outputs.cpu().numpy(), entity_text, length.cpu().numpy())

            for ent_list, sentence in zip(decode_entities, sentence_batch):
                sentence = sentence["sentence"]
                instance = {"sentence": sentence, "entities": []}
                for ent in ent_list:
                    instance["entities"].append({"text": [sentence[x] for x in ent[0]],
                                                "type": config.vocab.id_to_label(ent[1]),
                                                "index": ent[0]})
                result.append(instance)
            i += config.batch_size
    return result


# Load config
config = config.Config("NER/config/polymer_MatSciBERT.json")

def load_ner_model():
    logger = utils.get_logger(config.dataset)    
    config.logger = logger

    # Load vocab
    vocab = data_loader.Vocabulary()
    label2id = {'<pad>': 0, '<suc>': 1, 'monomer': 2, 'organic': 3, 'inorganic': 4, 'condition': 5, 'polymer_family': 6, 'syn_method': 7, 'prop_name': 8, 'prop_value': 9, 'ref_exp': 10, 'char_method': 11, 'polymer': 12, 'material_amount': 13, 'composite': 14, 'other_material': 15}
    id2label = {v:k for k,v in label2id.items()}
    vocab.label2id = label2id
    vocab.id2label = id2label
    config.label_num = len(vocab.label2id)
    print(vocab.label2id)
    config.vocab = vocab

    # Load model    
    logger.info("Building Model")
    model = Model(config)
    model = model.cuda()
    model.load_state_dict(torch.load(config.save_path),  strict=False)
    model.eval()


    device = 0
    if torch.cuda.is_available():
        torch.cuda.set_device(device)
    return model, logger, config

def inference(model, logger,config, test_data):
    logger.info("Loading Data")
    datasets, ori_data = data_loader.load_data_bert_predict(test_data, config)
    test_loader_real = DataLoader(dataset=datasets,
                   batch_size=config.batch_size,
                   collate_fn=data_loader.collate_fn,
                   shuffle=False,
                   num_workers=4,
                   drop_last=False)


    print('Predicting NER ...')
    result = model_predict(model, test_loader_real, ori_data)
    print('Finished predicting.')
    print('Converting to Brat format...')
    assert len(result) == len(ori_data)

    raw_text = []
    abs_anns = [] # abstract/paragraph
    char_len = 0
    final_result = {}
    no_discontinuous_mentions = 0
    #print(len(ori_data))
    for i in range(len(ori_data)):
        # print(ori_data[i]["doc_ID"])
        assert ori_data[i]['sentence'] == result[i]['sentence']
        # print(len(ori_data[i]['sentence']), len(result[i]['sentence']))
        raw_text = []
        abs_anns = [] # abstract/paragraph
        if ori_data[i]['sent_ID'] == 1:
            char_len = 0    
        s = ' '.join(ori_data[i]['sentence'])
        # print(len(s))
        raw_text.append(s)
        sent_anns = result[i]['entities'] # predictions for each sentence
        #print(sent_anns)
        for ann in sent_anns: # e.g., {"text": ["in", "-", "situ", "polymerization"], "type": "syn_method", "index": [1, 2, 3, 4]}
            offsets = split_continuous_arrays(ann['index'])

            offset_string = []
            for offset in offsets:
                w_idx_start = offset[0]
                w_idx_end = offset[-1]
                c_idx_start = len(' '.join(ori_data[i]['sentence'][:w_idx_start]))
                if w_idx_start != 0:
                    c_idx_start += 1
                c_idx_end = len(' '.join(ori_data[i]['sentence'][:w_idx_end+1]))

                offset_string.append(str(c_idx_start + char_len) + ' ' + str(c_idx_end + char_len))
            offset_string = ';'.join(offset_string)
            if ';' in offset_string:
                no_discontinuous_mentions += 1
            
            #if [ann[0] + char_len, ann[1] + char_len, ann[2]] not in abs_anns: # Avoid duplicates
                #abs_anns.append([ann[0] + char_len, ann[1] + char_len, ann[2]])

            if [offset_string, ann['type'], ' '.join(ann['text'])] not in abs_anns: # Avoid duplicates
                abs_anns.append([offset_string, ann['type'], ' '.join(ann['text'])])

        if ori_data[i]["doc_ID"] not in final_result:
            final_result[ori_data[i]["doc_ID"]] = {
                "text": "",
                "entities": []
            }
        final_result[ori_data[i]["doc_ID"]]["text"] += ' '.join(raw_text) + ' '
        for k in range(len(abs_anns)):
            entity_info = abs_anns[k][0].split(' ')
            entity_positions = []
            for pos in entity_info:
                entity_positions += pos.split(';')
            # Convert to pair of two elements
            entity_positions = [[int(entity_positions[i]), int(entity_positions[i+1])] for i in range(0, len(entity_positions), 2)]
            index = len(final_result[ori_data[i]["doc_ID"]]["entities"])            
            final_result[ori_data[i]["doc_ID"]]["entities"].append([f'T{index+1}', abs_anns[k][1].upper(), entity_positions, abs_anns[k][2]])
        char_len = char_len + len(s) + 1

    # sort the result by key
    # print(final_result.keys())
    final_result = list(dict(sorted(final_result.items())).values())
    # final_result.append(tmp_cp)
    print('# of discontinuous mentions:', no_discontinuous_mentions)
    torch.cuda.empty_cache()
    print('Finished.')
    return final_result