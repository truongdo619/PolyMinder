import json
from config import DEBUG, nlp

def convert_to_NER_model_input_format(paragraphs):
    json_list = []
    for idx, paragraph_text in enumerate(paragraphs):
        output = nlp.annotate(paragraph_text, properties={
            'annotators': 'tokenize',
            'outputFormat': 'json'
        })
        if DEBUG:
            print(output)
        
        if type(output) == str:
            output = json.loads(output)
        
        sent_id = 0
        for sentence in output['sentences']:
            sent_id += 1
            json_item = {}
            json_item_tokens = []
            text = []
            for token in sentence['tokens']:
                text.append(token['word'])

            json_item_tokens = text

            json_item['sentence'] = json_item_tokens
            json_item['ner'] = []
            json_item['doc_ID'] = idx + 1
            json_item['sent_ID'] = sent_id

            json_list.append(json_item)

    return json_list


def convert_to_RE_model_input_format(ner_output_paragraphs):
    count_multi_span = 0
    json_list = []
    for idx, paragraph in enumerate(ner_output_paragraphs):
        entities = []
        for entity in paragraph["entities"]:
            entity_id, entity_type, entity_loc, entity_text = entity[0], entity[1], entity[2], entity[3]
            ent = {}
            ent['standoff_id'] = int(entity_id[1:])
            if len(entity_loc) > 1:
                count_multi_span += 1
            else:
                ent['entity_type'] = entity_type
                ent['offset_start'] = int(entity_loc[0][0])
                ent['offset_end'] = int(entity_loc[0][1])
                ent['word'] = entity_text
                entities.append(ent)

        output = nlp.annotate(paragraph["text"], properties={
            'annotators': 'tokenize',
            'outputFormat': 'json'
        })
        
        if type(output) == str:
            output = json.loads(output)
    
        json_item = {}
        json_item_sents = []
        json_item_vertexSet = {}

        sent_id = -1
        for sentence in output['sentences']:
            sent_id += 1
            json_item_tokens = []
            text = []
            for token in sentence['tokens']:
                text.append(token['word'])
            json_item_tokens = text

            for entity in entities:
                if entity['entity_type'] == 'Material-Property':
                    continue
                start = -1
                end = -1
                token_idx = 0
                for token in sentence['tokens']:
                    offset_start = int(token['characterOffsetBegin'])
                    offset_end = int(token['characterOffsetEnd'])

                    if offset_start == entity['offset_start']:
                        start = token_idx
                    if offset_end == entity['offset_end']:
                        end = token_idx + 1
                    token_idx += 1
                    if start != -1 and end != -1:
                        separated_tokens = []
                        for i in range(start, end):
                            separated_tokens.append(sentence['tokens'][i]['word'])

                        if (' '.join(separated_tokens) + '\t' + entity['entity_type']) not in json_item_vertexSet:
                            json_item_vertexSet[' '.join(separated_tokens) + '\t' + entity['entity_type']] = [{'name': ' '.join(separated_tokens), 'sent_id': sent_id, 'pos': [start, end], 'type': entity['entity_type'], 'brat_entity_mention_id': entity['standoff_id']}]
                        else:
                            json_item_vertexSet[' '.join(separated_tokens) + '\t' + entity['entity_type']] = json_item_vertexSet.get(' '.join(separated_tokens) + '\t' + entity['entity_type']) + [{'name': ' '.join(separated_tokens), 'sent_id': sent_id, 'pos': [start, end], 'type': entity['entity_type'], 'brat_entity_mention_id': entity['standoff_id']}]
                        break
            json_item_sents.append(json_item_tokens)
        
        json_item['title'] = str(idx)
        json_item['sents'] = json_item_sents

        vertexSet = list(json_item_vertexSet.values())
        json_item['vertexSet'] = vertexSet
        json_item['labels'] = []

        if len(json_item['vertexSet']) >= 2:
            json_list.append(json_item)

    return json_list

def build_character_mapping(model_output_text, original_text):
    mapping_dict = {}
    current_original_idx = -1
    for idx, char in enumerate(model_output_text):
        if current_original_idx < len(original_text) - 1:
            if char == original_text[current_original_idx+1]:
                current_original_idx += 1
        mapping_dict[idx] = current_original_idx
    return mapping_dict

def normalize_org_text_and_bbox(model_output_item, bbox_item, org_text_item):
    normalized_bbox, normalized_org_text = [], []
    set_model_output_item = set(model_output_item)  
    for idx, character in enumerate(org_text_item):
        if character not in set_model_output_item:
            continue
        normalized_org_text.append(character)
        normalized_bbox.append(bbox_item[idx])
    return normalized_org_text, normalized_bbox

def brat_output_text_bb_convert(brat_output_text, bbox, character_mapping_dict):
    output = []
    for char_idx, char in enumerate(brat_output_text):
        output.append(bbox[character_mapping_dict[char_idx]])
    return output

def convert_to_output_v2(model_output, bbox, org_texts):
    final_result = []
    brat_format_output = model_output.copy()
    nomalized_org_texts, normalized_bbox_items = [], []
    for para_id, para_output in enumerate(model_output):
        nomalized_org_text, normalized_bbox_item = normalize_org_text_and_bbox(para_output["text"], bbox[para_id], org_texts[para_id])
        character_mapping_dict = build_character_mapping(para_output["text"], nomalized_org_text)
        nomalized_org_texts.append(para_output["text"])
        normalized_bbox_items.append(brat_output_text_bb_convert(para_output["text"], normalized_bbox_item, character_mapping_dict))
        
        # Raise error if the length of the normalized text and bounding box is not the same
        if len(nomalized_org_text) != len(normalized_bbox_item):
            raise ValueError("The length of the normalized text and bounding box is not the same.")

        num_new_add_entity = 0
        paragraph_bounding_box = merge_bounding_boxes(bbox[para_id])  # Get the bounding box for the entire paragraph
        for entity in para_output["entities"]:
            
            current_item = {
                "content": {
                    "text": entity[-1]
                },
                "id": f"para{para_id}_" + entity[0],
                "comment": entity[1],
                "position": {
                    "rects": get_span_bounding_boxes(character_mapping_dict[entity[2][0][0]], character_mapping_dict[entity[2][0][1]-1], normalized_bbox_item)
                },
                "relations": [],
                "para_id": para_id
            }
            current_item["position"]["boundingRect"] = []
            if len(current_item["position"]["rects"]) > 0:
                current_item["position"]["boundingRect"] = merge_bounding_boxes(current_item["position"]["rects"])
            final_result.append(current_item)
            num_new_add_entity += 1

        if "relations" in para_output:
            # print(para_output["relations"])
            for relation in para_output["relations"]:
                arg1_id = int(relation[2][0][1][1:]) - num_new_add_entity - 1
                arg2_id = int(relation[2][1][1][1:]) - num_new_add_entity - 1
                final_result[arg1_id]["relations"].append({
                    "type": relation[1],
                    "arg_type": final_result[arg2_id]["comment"],
                    "arg_text": final_result[arg2_id]["content"]["text"],
                    "id": f"para{para_id}_" + relation[0],
                    "arg_id": f"para{para_id}_{relation[2][1][1]}"
                })
        brat_format_output[para_id]["bounding_box"] = paragraph_bounding_box  # Add paragraph bounding box to brat_format_output

    return {"pdf_format_output": final_result, "brat_format_output": brat_format_output}, normalized_bbox_items, nomalized_org_texts

def get_span_bounding_boxes(start_pos, end_pos, char_bounding_boxes):
    span_bounding_boxes = []
    span_boxes = [char for idx, char in enumerate(char_bounding_boxes) if start_pos <= idx <= end_pos]

    if not span_boxes:
        return span_bounding_boxes
    
    span_boxes.sort(key=lambda x: (x['y1'], x['x1']))

    current_row = []
    current_y = span_boxes[0]['y1']

    for char in span_boxes:
        if char['y1'] != current_y:
            if current_row:
                merged_box = merge_bounding_boxes(current_row)
                span_bounding_boxes.append(merged_box)
            current_row = [char]
            current_y = char['y1']
        else:
            current_row.append(char)

    if current_row:
        merged_box = merge_bounding_boxes(current_row)
        span_bounding_boxes.append(merged_box)

    return span_bounding_boxes

def merge_bounding_boxes(boxes):
    x1 = min(box['x1'] for box in boxes)
    y1 = min(box['y1'] for box in boxes)
    x2 = max(box['x2'] for box in boxes)
    y2 = max(box['y2'] for box in boxes)
    return {'x1': x1, 'y1': y1, 'x2': x2, 'y2': y2, "width": boxes[0]["width"], "height": boxes[0]["height"],"pageNumber": boxes[0]["pageNumber"]}
