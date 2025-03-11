
import numpy as np
import torch
import ujson as json
from torch.utils.data import DataLoader
from transformers import AutoConfig, AutoModel, AutoTokenizer
from RE.model import DocREModel
from RE.utils import set_seed
#from prepro import read_docred
#import wandb
from tqdm import tqdm
import RE.config as config

docred_rel2id = json.load(open('RE/meta/rel2id_polymer.json', 'r'))

def read_docred_real(data, tokenizer, max_seq_length=1024):
    i_line = 0
    pos_samples = 0
    neg_samples = 0
    features = []
    for sample in tqdm(data, desc="Example"):
        sents = []
        sent_map = []

        entities = sample['vertexSet']
        entity_start, entity_end = [], []
        for entity in entities:
            for mention in entity:
                sent_id = mention["sent_id"]
                pos = mention["pos"]
                entity_start.append((sent_id, pos[0],))
                entity_end.append((sent_id, pos[1] - 1,))
        for i_s, sent in enumerate(sample['sents']):
            new_map = {}
            for i_t, token in enumerate(sent):
                tokens_wordpiece = tokenizer.tokenize(token)
                if (i_s, i_t) in entity_start:
                    tokens_wordpiece = ["*"] + tokens_wordpiece
                if (i_s, i_t) in entity_end:
                    tokens_wordpiece = tokens_wordpiece + ["*"]
                new_map[i_t] = len(sents)
                sents.extend(tokens_wordpiece)
            new_map[i_t + 1] = len(sents)
            sent_map.append(new_map)

        train_triple = {}
        if "labels" in sample:
            for label in sample['labels']:
                evidence = label['evidence']
                r = int(docred_rel2id[label['r']])
                if (label['h'], label['t']) not in train_triple:
                    train_triple[(label['h'], label['t'])] = [
                        {'relations': r, 'evidence': evidence}]
                else:
                    train_triple[(label['h'], label['t'])].append(
                        {'relations': r, 'evidence': evidence})

        entity_pos = []
        for e in entities:
            entity_pos.append([])
            for m in e:
                start = sent_map[m["sent_id"]][m["pos"][0]]
                end = sent_map[m["sent_id"]][m["pos"][1]]
                entity_pos[-1].append((start, end,))

        relations, hts = [], []
        for h, t in train_triple.keys():
            relation = [0] * len(docred_rel2id)
            for mention in train_triple[h, t]:
                relation[mention["relations"]] = 1
                evidence = mention["evidence"]
            relations.append(relation)
            hts.append([h, t])
            pos_samples += 1

        for h in range(len(entities)):
            for t in range(len(entities)):
                if h != t and [h, t] not in hts:
                    relation = [1] + [0] * (len(docred_rel2id) - 1)
                    relations.append(relation)
                    hts.append([h, t])
                    neg_samples += 1
        assert len(relations) == len(entities) * (len(entities) - 1)

        sents = sents[:max_seq_length - 2]
        input_ids = tokenizer.convert_tokens_to_ids(sents)
        input_ids = tokenizer.build_inputs_with_special_tokens(input_ids)

        i_line += 1
        feature = {'input_ids': input_ids,
                   'entity_pos': entity_pos,
                   'labels': relations,
                   'hts': hts,
                   'title': sample['title'],
                   'entities': entities,
                   }
        features.append(feature)

    print("# of documents {}.".format(i_line))
    print("# of positive examples {}.".format(pos_samples))
    print("# of negative examples {}.".format(neg_samples))
    return features


def collate_fn_real(batch): # For real data (prediction)
    max_len = max([len(f["input_ids"]) for f in batch])
    input_ids = [f["input_ids"] + [0] * (max_len - len(f["input_ids"])) for f in batch]
    input_mask = [[1.0] * len(f["input_ids"]) + [0.0] * (max_len - len(f["input_ids"])) for f in batch]
    labels = [f["labels"] for f in batch]
    entity_pos = [f["entity_pos"] for f in batch]
    hts = [f["hts"] for f in batch]
    input_ids = torch.tensor(input_ids, dtype=torch.long)
    input_mask = torch.tensor(input_mask, dtype=torch.float)
    #output = (input_ids, input_mask, labels, entity_pos, hts)
    output = (input_ids, input_mask, labels, entity_pos, hts, [f["entities"] for f in batch])
    #output = (input_ids, input_mask, labels, entity_pos, hts, [f["title"] for f in batch]) # DEBUG
    return output

def convert_sentence_to_output_format(sentence):
    row = sentence.split('\t')
    relation_id = row[0]
    relation_info = row[1].split(" ")
    relation_type = relation_info[0]
    arg1 = relation_info[1].split(":")
    arg2 = relation_info[2].split(":")
    return [relation_id, relation_type, [arg1, arg2]]

def report(args, model, features, ner_data):

    dataloader = DataLoader(features, batch_size=args.test_batch_size, shuffle=False, collate_fn=collate_fn_real, drop_last=False)
    preds = []
    for batch in dataloader:
        model.eval()

        inputs = {'input_ids': batch[0].to(args.device),
                  'attention_mask': batch[1].to(args.device),
                  'entity_pos': batch[3],
                  'hts': batch[4],
                  }

        with torch.no_grad():
            pred, *_ = model(**inputs)
            pred = pred.cpu().numpy()
            pred[np.isnan(pred)] = 0
            preds.append(pred)

    # if no relation is predicted, return ner_data
    if len(preds) == 0:
        return ner_data
    
    preds = np.concatenate(preds, axis=0).astype(np.float32)
    #preds = to_official(preds, features)

    # to_official
    #rel2id = json.load(open('meta/rel2id_polymer.json', 'r')) # polymer data
    id2rel = {value: key for key, value in docred_rel2id.items()}

    h_idx, t_idx, title, entities = [], [], [], []

    for f in features:
        hts = f["hts"]
        h_idx += [ht[0] for ht in hts]
        t_idx += [ht[1] for ht in hts]
        title += [f["title"] for ht in hts]
        entities += [f["entities"] for ht in hts]

    res = []
    rel_anns_brat_format = {}
    for i in range(preds.shape[0]):
        pred = preds[i]
        pred = np.nonzero(pred)[0].tolist()
        for p in pred:
            if p != 0:
                res.append(
                    {
                        'title': title[i],
                        'h_idx': h_idx[i],
                        'h_mention': entities[i][h_idx[i]][0]['name'], # get 1st mention of entity (one entity has several mentions, all of them are same in polymer abstract's setting)
                        # 'h_mention': entities[i][h_idx[i]]
                        't_idx': t_idx[i],
                        't_mention': entities[i][t_idx[i]][0]['name'],
                        #'t_mention': entities[i][t_idx[i]]
                        'r': id2rel[p],
                    }
                )
                min_entity_pair_dist = 1e6
                brat_head_entity_mention_id = brat_tail_entity_mention_id = -1
                for e1 in entities[i][h_idx[i]]:
                    for e2 in entities[i][t_idx[i]]:
                        #print(title[i], entities[i][h_idx[i]], entities[i][t_idx[i]], int(e1['pos'][0]), int(e2['pos'][0]))
                        #if abs(int(e1['pos'][0]) - int(e2['pos'][0])) < min_entity_pair_dist:
                            #min_entity_pair_dist = abs(int(e1['pos'][0]) - int(e2['pos'][0]))
                        if 100 * abs(int(e1['sent_id']) - int(e2['sent_id'])) + abs(int(e1['pos'][0]) - int(e2['pos'][0])) < min_entity_pair_dist: # Add 100 to penalize mentions in other sentences3
                            min_entity_pair_dist = 100 * abs(int(e1['sent_id']) - int(e2['sent_id'])) + abs(int(e1['pos'][0]) - int(e2['pos'][0]))
                            brat_head_entity_mention_id = e1['brat_entity_mention_id']
                            brat_tail_entity_mention_id = e2['brat_entity_mention_id']
                #print(brat_head_entity_mention_id, brat_tail_entity_mention_id)

                if title[i] not in rel_anns_brat_format:
                    rel_anns_brat_format[title[i]] = [id2rel[p] + ' Arg1:T' + str(brat_head_entity_mention_id) + ' Arg2:T' + str(brat_tail_entity_mention_id)]
                else:
                    rel_anns_brat_format[title[i]] = rel_anns_brat_format[title[i]] + [id2rel[p] + ' Arg1:T' + str(brat_head_entity_mention_id) + ' Arg2:T' + str(brat_tail_entity_mention_id)]

    print(rel_anns_brat_format.keys())
    for key, value in rel_anns_brat_format.items(): # for each abstract, key: title, value: relation annotations. e.g., 'abbreviation_of Arg1:T8 Arg2:T7'
        para_id = int(key)
        ent_id_type_map = {}
        ent_id_start_offset_map = {}
        ner_data[para_id]['relations'] = []
        for entity in ner_data[para_id]['entities']:
            ent_id_type_map[entity[0]] = entity[1]
            ent_id_start_offset_map[entity[0]] = entity[2][0][0]

        for rel_id in range(len(value)):
            filter = False # focus on particular relations
            if filter:
                if abs(ent_id_start_offset_map[value[rel_id].split(' ')[1].split(':')[1]] - ent_id_start_offset_map[value[rel_id].split(' ')[2].split(':')[1]]) <= 200: # maximum distance (# of characters) between 2 entities in a relation
                    # keep only 'has_property' and 'has_value'
                    if value[rel_id].split(' ')[0] == 'has_property':
                        if ent_id_type_map[value[rel_id].split(' ')[1].split(':')[1]] in ['POLYMER', 'REF_EXP'] and ent_id_type_map[value[rel_id].split(' ')[2].split(':')[1]] in ['PROP_NAME']: # POLYMER relevent
                            ner_data[para_id]['relations'].append(convert_sentence_to_output_format('R' + str(rel_id+1) + '\t' + value[rel_id]))
                    elif value[rel_id].split(' ')[0] == 'has_value':
                        if ent_id_type_map[value[rel_id].split(' ')[1].split(':')[1]] in ['POLYMER', 'PROP_NAME', 'REF_EXP'] and ent_id_type_map[value[rel_id].split(' ')[2].split(':')[1]] in ['PROP_VALUE']: # POLYMER relevant
                            ner_data[para_id]['relations'].append(convert_sentence_to_output_format('R' + str(rel_id+1) + '\t' + value[rel_id]))
                    elif value[rel_id].split(' ')[0] == 'refers_to':
                        if ent_id_type_map[value[rel_id].split(' ')[1].split(':')[1]] in ['REF_EXP']:
                            ner_data[para_id]['relations'].append(convert_sentence_to_output_format('R' + str(rel_id+1) + '\t' + value[rel_id]))
            else:
                ner_data[para_id]['relations'].append(convert_sentence_to_output_format('R' + str(rel_id+1) + '\t' + value[rel_id]))
    return ner_data


# Load config
args = config.Config("RE/config/DocRE_model_MatSciBERT.json")
print(config)
device = torch.device("cuda:0" if torch.cuda.is_available() else "cpu")
args.n_gpu = torch.cuda.device_count()
args.device = device

# Load model
def load_re_model():
    config = AutoConfig.from_pretrained(
        args.model_name_or_path,
        num_labels=args.num_class,
    )
    tokenizer = AutoTokenizer.from_pretrained(
        args.model_name_or_path,
    )
    base_model = AutoModel.from_pretrained(
        args.model_name_or_path,
        from_tf=bool(".ckpt" in args.model_name_or_path),
        config=config,
    )
    set_seed(args)
    return tokenizer, base_model, config


def predict_re(tokenizer, base_model,config,  test_data, ner_data):
    test_features = read_docred_real(test_data, tokenizer, max_seq_length=args.max_seq_length)
    config.cls_token_id = tokenizer.cls_token_id
    config.sep_token_id = tokenizer.sep_token_id
    config.transformer_type = args.transformer_type

    model = DocREModel(config, base_model, num_labels=args.num_labels).to(args.device)
    model.load_state_dict(torch.load(args.load_path))
    pred = report(args, model, test_features, ner_data)
    return pred