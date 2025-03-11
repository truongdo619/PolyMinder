import os
import copy
import json
from schemas.document import Rect
def read_json_file_utf8(file_path):
    with open(file_path, 'r', encoding='utf-8') as f:
        data = json.load(f)
    return data
from typing import Optional
from passlib.context import CryptContext
from jose import JWTError, jwt
from datetime import datetime, timedelta
import numpy as np
import smtplib
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText


gmail_app_password="goir ptrm pzau pikb"
# Secret keys for access and refresh tokens
SECRET_KEY = "12345678"
REFRESH_SECRET_KEY = "0987654321"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 900
RESET_TOKEN_EXPIRE_MINUTES = 300
REFRESH_TOKEN_EXPIRE_DAYS = 90
ROOT_PAGE_ADDRESS ="https://dd91-150-65-242-35.ngrok-free.app/#/reset-password/?token="
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password):
    return pwd_context.hash(password)

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=150)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=150)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

def create_refresh_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(days=7)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, REFRESH_SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

def decode_token(token: str, secret_key: str):
    try:
        payload = jwt.decode(token, secret_key, algorithms=[ALGORITHM])
        return payload
    except JWTError:
        return None

# def levenshtein_edit_list(text1, text2):
#     """ 
#     Compute the Levenshtein distance and extract the edit operations between text1 and text2.
    
#     Parameters:
#     text1 (str): The original text.
#     text2 (str): The target text.
    
#     Returns:
#     list of tuples: A list of edit operations.
#                     Each operation is represented as a tuple ('operation', index_in_text1, index_in_text2).
#                     Operations can be 'match', 'insert', 'delete', or 'replace'.
#     """
#     len1, len2 = len(text1), len(text2)
#     dp = np.zeros((len1 + 1, len2 + 1), dtype=int)

#     for i in range(len1 + 1):
#         dp[i][0] = i
#     for j in range(len2 + 1):
#         dp[0][j] = j

#     for i in range(1, len1 + 1):
#         for j in range(1, len2 + 1):
#             if text1[i - 1] == text2[j - 1]:
#                 dp[i][j] = dp[i - 1][j - 1]
#             else:
#                 dp[i][j] = 1 + min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1])

#     # Backtrack to find the edit list
#     i, j = len1, len2
#     edit_list = []

#     while i > 0 and j > 0:
#         if text1[i - 1] == text2[j - 1]:
#             edit_list.append(('match', i - 1, j - 1))
#             i -= 1
#             j -= 1
#         elif dp[i][j] == dp[i - 1][j - 1] + 1:
#             edit_list.append(('replace', i - 1, j - 1))
#             i -= 1
#             j -= 1
#         elif dp[i][j] == dp[i - 1][j] + 1:
#             edit_list.append(('delete', i - 1, j))
#             i -= 1
#         else:
#             edit_list.append(('insert', i, j - 1))
#             j -= 1

#     while i > 0:
#         edit_list.append(('delete', i - 1, j))
#         i -= 1

#     while j > 0:
#         edit_list.append(('insert', i, j - 1))
#         j -= 1

#     edit_list.reverse()
#     return edit_list

# def generate_bounding_boxes(text1, bbox1, text2):
#     """
#     Generate bounding boxes for text2 based on the bounding boxes of text1 and Levenshtein edit operations.
    
#     Parameters:
#     text1 (str): The original text with known bounding boxes.
#     bbox1 (list of dicts): A list of bounding boxes corresponding to each character in text1. 
#                            Each bounding box is represented as a dictionary with keys: x1, y1, x2, y2, width, height, pageNumber.
#     text2 (str): The new text for which we need to generate bounding boxes.
    
#     Returns:
#     list of dicts: A list of bounding boxes corresponding to each character in text2.
#     """
#     edit_list = levenshtein_edit_list(text1, text2)
#     print(edit_list)
#     bbox2 = []
#     i, j = 0, 0

#     for operation, idx1, idx2 in edit_list:
#         if operation == 'match' or operation == 'replace':
#             bbox2.append(bbox1[idx1])
#             i += 1
#             j += 1
#         elif operation == 'insert':
#             # Insert a placeholder bounding box, or estimate based on nearby bounding boxes
#             # Here, we'll just use the previous bounding box as a placeholder
#             if bbox2:
#                 bbox2.append(bbox2[-1])
#             else:
#                 bbox2.append({
#                     "x1": 0, "y1": 0, "x2": 0, "y2": 0,
#                     "width": bbox1[0]["width"],
#                     "height": bbox1[0]["height"],
#                     "pageNumber": bbox1[0]["pageNumber"]
#                 })  # Fallback placeholder
#             j += 1
#         elif operation == 'delete':
#             i += 1

#     return bbox2

# def organize_new_box(old_paragraph, old_box, new_papragraph):
#     new_box = []
#     for index, old_paragraph in enumerate(old_paragraph):
#         new_one = new_papragraph[index]
#         box = old_box[index]
#         if old_paragraph!=new_one:
#             new_box_ = generate_bounding_boxes(old_paragraph,box,new_one)
#             new_box.append(new_box_)
#         else:
#             new_box.append(box)
#     return new_box
def levenshtein_edit_list(text1, text2):
    len1, len2 = len(text1), len(text2)
    dp = np.arange(len2 + 1)
    prev = np.zeros(len2 + 1, dtype=int)

    for i in range(1, len1 + 1):
        prev, dp = dp, prev
        dp[0] = i
        for j in range(1, len2 + 1):
            cost = 0 if text1[i - 1] == text2[j - 1] else 1
            dp[j] = min(dp[j - 1] + 1, prev[j] + 1, prev[j - 1] + cost)

    i, j, edit_list = len1, len2, []
    while i > 0 and j > 0:
        if text1[i - 1] == text2[j - 1]:
            edit_list.append(('match', i - 1, j - 1))
            i -= 1; j -= 1
        elif dp[j] == prev[j - 1] + 1:
            edit_list.append(('replace', i - 1, j - 1))
            i -= 1; j -= 1
        elif dp[j] == prev[j] + 1:
            edit_list.append(('delete', i - 1, j))
            i -= 1
        else:
            edit_list.append(('insert', i, j - 1))
            j -= 1

    while i > 0: edit_list.append(('delete', i - 1, j)); i -= 1
    while j > 0: edit_list.append(('insert', i, j - 1)); j -= 1
    return edit_list[::-1]

# def generate_bounding_boxes(text1, bbox1, text2):
#     bbox2 = []
#     for op, idx1, _ in levenshtein_edit_list(text1, text2):
#         if op != 'delete':
#             bbox2.append(bbox1[idx1] if op != 'insert' else bbox2[-1] if bbox2 else {
#                 "x1": 0, "y1": 0, "x2": 0, "y2": 0,
#                 "width": bbox1[0]["width"], "height": bbox1[0]["height"],
#                 "pageNumber": bbox1[0]["pageNumber"]})
#     return bbox2

def generate_bounding_boxes(text1, bbox1, text2):
    bbox2 = []
    last_bbox = None
    
    for op, idx1, _ in levenshtein_edit_list(text1, text2):
        if op != 'delete':
            if op == 'insert':
                # Default to the position of the first character's bbox (bbox1[0])
                new_bbox = {
                    "x1": bbox1[0]["x1"],
                    "y1": bbox1[0]["y1"],
                    "x2": bbox1[0]["x2"],
                    "y2": bbox1[0]["y2"],
                    "width": bbox1[0]["width"],
                    "height": bbox1[0]["height"],
                    "pageNumber": bbox1[0]["pageNumber"]
                }
            else:
                # For 'replace' or 'equal', use the bbox1 at idx1
                new_bbox = bbox1[idx1]
            
            # If we already have a bbox, adjust the x2 to extend to the current bbox
            if last_bbox:
                last_bbox["x2"] = new_bbox["x2"]  # Extend the x2 to match the current new_bbox
            
            # Add the new bounding box to bbox2
            bbox2.append(new_bbox)
            last_bbox = new_bbox  # Update the last_bbox reference

    return bbox2



def organize_new_box(old_paragraph, old_box, new_paragraph):
    return [generate_bounding_boxes(op, ob, np) if op != np else ob for op, ob, np in zip(old_paragraph, old_box, new_paragraph)]

def filter_by_arg1(input_list, arg1_value):
    # Create a list to store the matching elements
    matching_elements = []

    # Iterate over the elements in the input list
    for element in input_list:
        # Check if the element has a matching Arg1 value
        for arg in element[2]:
            if arg[0] == "Arg1" and arg[1] == arg1_value:
                matching_elements.append(element)
                break

    return matching_elements

def compare_versions(original_list, new_list):
    deleted_elements = []
    added_elements = []
    updated_elements = []

    # Convert the lists into dictionaries for easier comparison
    original_dict = {element[0]: element for element in original_list}
    new_dict = {element[0]: element for element in new_list}

    # Check for deleted and updated elements
    for key in original_dict:
        if key not in new_dict:
            deleted_elements.append(original_dict[key])
        elif original_dict[key] != new_dict[key]:
            updated_elements.append(new_dict[key])

    # Check for added elements
    for key in new_dict:
        if key not in original_dict:
            added_elements.append(new_dict[key])

    return deleted_elements, updated_elements, added_elements
    # original_list = update_relation(original_list,updated_elements)
    # original_list = add_relation(original_list,added_elements)
    # original_list = delete_relations(original_list,deleted_elements)
    # return original_list

def delete_relations(original_rels,deleted_rel,para_id):
    delete_id = []
    for rel in deleted_rel:
        delete_id.append(rel[0])
    action = {
        "action":"delete",
        "target":"rel"
    }
    action_content = []
    for rel in original_rels:
        if rel[0] in delete_id:
            action_content.append({
                "para_id":para_id,
                "rel":rel
                })
            original_rels.remove(rel)
    action["content"] = action_content
    return original_rels, action

def update_relation(original_rels,updated_rel,para_id):
    update_id = []
    # print(updated_rel)
    for rel in updated_rel:
        update_id.append(rel[0])
    
    action = {
        "action":"update",
        "target":"rel"
    }
    action_content = []
    for index,rel in enumerate(original_rels):
        if rel[0] in update_id:
            original_rels[index] = updated_rel[update_id.index(rel[0])]
            action_content.append({
                    "para_id":para_id,
                    "rel":updated_rel[update_id.index(rel[0])]
                })
            # print(updated_rel[update_id.index(rel[0])])
    # print(original_rels)
    action["content"] = action_content
    return original_rels, action

def decide_new_num_rel(original_rels, user_notes):
    extra_number = 0
    for action in user_notes:
        if action["action"]=='add' and action["target"]=="relation":
            extra_number+=1
    return len(original_rels) + extra_number

def add_relation(original_rels,added_rel,user_notes,para_id):
    action = {
        "action":"add",
        "target":"rel"
    }
    action_content=[]
    for rel in added_rel:
        id = decide_new_num_rel(original_rels, user_notes)+1
        new_id = f"R{id}"
        rel[0] = new_id
        original_rels.append(rel)
        action_content.append({
                "para_id":para_id,
                "rel":rel
                })
    action["content"] = action_content
    return original_rels, action

def update_relations(total_orginal_list,new_list,arg1_id,user_notes,para_id):
    original_list_arg1 = filter_by_arg1(total_orginal_list,arg1_id)
    deleted_elements, updated_elements, added_elements = compare_versions(original_list_arg1, new_list)
    total_orginal_list, add_action = add_relation(total_orginal_list,added_elements,user_notes,para_id)
    total_orginal_list, upd_action = update_relation(total_orginal_list,updated_elements,para_id)
    total_orginal_list, del_action = delete_relations(total_orginal_list,deleted_elements,para_id)
    user_notes.extend([add_action,upd_action,del_action])
    return total_orginal_list, user_notes

def count_ent(ent_list):
    num = 0
    for ent in ent_list:
        num += len(ent["entities"])
    return num

def count_ent_and_rel(obj_list):
    num_ent = 0
    num_rel = 0
    for obj in obj_list:
        num_ent += len(obj["entities"])
        if "relations" in obj:
            num_rel+= len(obj["relations"])
    return num_ent, num_rel

import time
import random
def generate_id():
    unique_id = int(time.time() * 1000) + random.randint(0, 999)
    print(unique_id)
    return unique_id

def execute_user_note_on_entities(user_notes, entities):
    for note in user_notes:
        if note["target"]=="ent":
            actions = note["action"]
            for ent in note["content"]:
                para_id = ent["para_id"]
                ent_id = ent["ent_id"]
                ent_type = ent["ent_type"]
                ent_text = ent["ent_text"]
                
                if actions=="add":
                    entities[para_id]["entities"].append([
                        ent_id,
                        ent_type,
                        [[ent["head"],ent["tail"]]],
                        ent_text
                    ])
                if actions=="delete":
                    for e in entities[para_id]["entities"]:
                        if e[1] == ent_type and e[-1]==ent_text and e[2][0][0]==ent["head"] and e[2][0][1]==ent["tail"] :
                            entities[para_id]["entities"].remove(e)
                
                if actions=="update":
                    print(actions)
                    for index, e in enumerate(entities[para_id]["entities"]):
                        if e[1]==ent["old_ent_type"] and e[-1]==ent["old_ent_text"] and e[2][0][0]==ent["old_head"] and e[2][0][1]==ent["old_tail"] :
                            entities[para_id]["entities"][index] = [
                                                                        ent_id,
                                                                        ent_type,
                                                                        [[ent["head"],ent["tail"]]],
                                                                        ent_text
                                                                    ]
        else:   
            continue
    return entities

def execute_user_note_on_paragraphs(user_notes, paragraphs, old_bboxs):
    change_ids = []
    # changed_para = []
    print(len(paragraphs))
    print(len(old_bboxs))
    new_para = copy.deepcopy(paragraphs)
    new_bbox = copy.deepcopy(old_bboxs)
    for note in user_notes:
        if note["target"]=="para":
            for para in note["content"]:
                # print(para)
                para_id = para["para_id"]
                text = para["text"]
                change_ids.append(para_id)
                changed_pos = organize_new_box([paragraphs[para_id]],[old_bboxs[para_id]],[text])
                new_bbox[para_id] = changed_pos[0]
                new_para[para_id] = text
        else:
            continue
    return new_para , new_bbox, change_ids

def execute_user_note_on_relations(user_notes, relations):
    # check if result is no longer keep the id when user make update, check both text and type
    for note in user_notes:
        if note["target"] == "relation":
            action = note["action"]
            if action =="add":
                for packed_rel in note["content"]:
                    para_id = packed_rel["para_id"]
                    rel = packed_rel["rel"]
                    relations[para_id]["relations"].append(rel)
            if action =="delete":
                for packed_rel in note["content"]:
                    para_id = packed_rel["para_id"]
                    rel = packed_rel["rel"]
                    for index, relation in enumerate(relations[para_id]["relations"]):
                        # relations[para_id]["relations"].remove(rel)
                        if relation[1] == rel[1] and relation[2] == rel[2] :

                            relations[para_id]["relations"].remove(relation)
            if action == "update":
                for packed_rel in note["content"]:
                    para_id = packed_rel["para_id"]
                    rel = packed_rel["rel"]
                    r_id = rel[0]
                    for index, orel in enumerate(relations[para_id]["relations"]):
                        if orel[1] == rel[1] and orel[2] == rel[2] :
                            rel[0] = relations[para_id]["relations"][index][0]
                            relations[para_id]["relations"][index] = rel
        if note["target"]=="edit_status":
            edit_status_lits = note["content"]
            for index, note_list in enumerate(edit_status_lits):
                try:
                    relations[index]["edit_status"] = note_list
                except:
                    print("+++++++++++++++++++++++++++")
                    print(len(relations))
                    print("+++++++++++++++++++++++++++")
                    print(index)
                    print("++++++++++++++++++++++++++++++")
                    print(note_list)
    return relations

# def add_init_edit_status_2_relation_list(relations):
    

def decide_new_ent_number(entities,user_note,para_id):
    base_number = len(entities[para_id]["entities"])
    extra_number = 1 
    for action in user_note:
        if action["action"] == "add" and action["target"] == "ent":
            for ent in action["content"]:
                if ent["para_id"] == para_id:
                    extra_number +=1
    
    return base_number + extra_number

def add_edit_status(array, field_name, id):
    added = False
    for ele in array[field_name]:
        if "id" in ele:
            if ele["id"] == id:
                if ele["status"] == "none":
                    ele["status"] = "confirmed"
                else:
                    ele["status"] = "none"
                added=True
    if added:
        return array
    else:
        array[field_name].append({
            "id":id,
            "status":"confirmed"
        })
        return array

def decide_new_pos(new_entity,char_positions):
    """
    Calculate the relative character positions in a paragraph based on the new entity's absolute positions.
    
    :param entity: CreateEntitySchema, the new entity with absolute positions.
    :param char_positions: List of character positions in the paragraph, where each character is represented by a Rect.
    :return: List of indices representing the relative character positions covered by the new entity.
    """
    print("original entity", new_entity)
    entity_rects = new_entity.position.rects
    print("original new entity rects", entity_rects)
    found_para_id = -1
    found_idx = []
    for para_id, char_list in enumerate(char_positions):
        relative_indices = []
        # Flatten character positions for easy comparison
        if char_list[0]["pageNumber"] != entity_rects[0].pageNumber:
            continue
        flattened_char_positions = [(idx, Rect(**char)) for idx, char in enumerate(char_list)]
        # flattened_char_positions = []
        # for i, char_list in enumerate(char_positions):
        #     # print(char_list[0])
        #     # print(entity_rects[0])
            
        #         for char in char_list:
        #             flattened_char_positions.append((i, Rect(**char)))
        
        # Assume the first character rect from the server as a reference for scaling
        if not flattened_char_positions:
            return []

        _, first_server_rect = flattened_char_positions[0]
        
        # Calculate scale factors based on width and height
        width_scale = first_server_rect.width / entity_rects[0].width
        height_scale = first_server_rect.height / entity_rects[0].height

        
        # Scale the entity's rects to match the server's coordinate system
        scaled_entity_rects = [
            Rect(
                x1=rect.x1 * width_scale,
                y1=rect.y1 * height_scale,
                x2=rect.x2 * width_scale,
                y2=rect.y2 * height_scale,
                width=first_server_rect.width,
                height=first_server_rect.height,
                pageNumber=rect.pageNumber
            )
            for rect in entity_rects
        ]
        print("rects after scaled",scaled_entity_rects)
        # print("flattened_char_positions rects ",flattened_char_positions[0])
        # Compare each scaled entity rectangle with character positions
        for scaled_entity_rect in scaled_entity_rects:
            for idx, char_rect in flattened_char_positions:
                # print(char_rect.pageNumber)
                # if scaled_entity_rect.pageNumber == char_rect.pageNumber:
                #     print(char_rect.pageNumber)
                # print(char_rect)
                if (
                    scaled_entity_rect.pageNumber == char_rect.pageNumber and
                    scaled_entity_rect.x1 <= char_rect.x2 and
                    scaled_entity_rect.x2 >= char_rect.x1 and
                    scaled_entity_rect.y1 <= char_rect.y2 and
                    scaled_entity_rect.y2 >= char_rect.y1
                ):
                    # If scaled entity rect overlaps with character rect, add index to relative indices
                    relative_indices.append(idx)
        # print(flattened_char_positions[25])
        # print(scaled_entity_rects)
        # Remove duplicates and sort the indices
        # return para_id,sorted(list(set(relative_indices)))
        if relative_indices != []:
            found_para_id = para_id
            found_idx = sorted(list(set(relative_indices)))
    return found_para_id, found_idx
    # return 0,0

def check_if_rel_is_filtered(rel,entities,entity_type_filters):
    match = False
    head_ent_id = rel[2][0][1]
    tail_ent_id = rel[2][1][1]
    head_type = (ent[1] for ent in entities if ent[0]== head_ent_id)
    tail_type = (ent[1] for ent in entities if ent[0]== tail_ent_id)
    for type in entity_type_filters:
        if type == head_type or type== tail_type:
            match = True
    return match


def filter_entities_by_relations( relations_obj, ent_filters, rel_filters):
    filtered_data = []

    for paragraph in relations_obj:
        tmp_obj = copy.deepcopy(paragraph)
        del tmp_obj["edit_status"]
        filtered_entities = []
        filtered_relations = []
        if "relations" not in paragraph:
            tmp_obj["entities"] = filtered_entities
            tmp_obj["relations"] = filtered_relations
            filtered_data.append(tmp_obj)
            continue
        # Filter relations based on rel_filters
        # for relation in paragraph["relations"]:
        #     if relation[1] in rel_filters:
        #         # print(relation)
        #         filtered_relations.append(relation)

        if "None" in rel_filters or "none" in rel_filters:
            exist_relation_entity_ids = {
                role[1]
                for relation in tmp_obj["relations"]
                for role in relation[2]
            }
        else:
            exist_relation_entity_ids = {
                entity[0] for entity in tmp_obj["entities"]
            }
        # Find relevant relations based on rel_filters
        relevant_relations = [
            relation for relation in tmp_obj["relations"] if relation[1] in rel_filters
        ]
        
        # Collect IDs of entities involved in relevant relations
        related_entity_ids = {
            role[1]
            for relation in relevant_relations
            for role in relation[2]
        }
        # print(related_entity_ids)
        # Filter entities based on ent_filters and their involvement in relevant relations
        
        filter_ent_id = []
        for entity in tmp_obj["entities"]:
            if entity[1] == ent_filters and entity[0] in related_entity_ids:
                filtered_entities.append(entity)
                filter_ent_id.append(entity[0])
            if entity[0] not in exist_relation_entity_ids:
                filtered_entities.append(entity)
        # Add paragraph with filtered entities if any entities remain
        # if filtered_entities:
        #     filtered_data.append({
        #         "text": paragraph["text"],
        #         "entities": filtered_entities
        #     })
        filtered_relations = []
        for relations in relevant_relations:
            satify_filter = False
            if relations[2][0][1] in filter_ent_id or relations[2][1][1] in filter_ent_id:
                satify_filter = True
            if satify_filter:
                filtered_relations.append(relations)

        tmp_obj["entities"] = filtered_entities
        tmp_obj["relations"] = filtered_relations
        filtered_data.append(tmp_obj)
    return filtered_data

def merge_ents(ent_list1, ent_list2):
    for ent in ent_list2:
        duplicated = False
        for ori_ent in ent_list1:
            if ent[0] == ori_ent[1]:
                duplicated= True
        if duplicated != True:
            ent_list1.append(ent)
    return ent_list1

def merge_filtered_entities(merge_container, filtered_entities):
    if merge_container == []:
        return filtered_entities
    else:
        # print(merge_container)
        for index, para in enumerate(merge_container):
            m_ents = para["entities"]
            f_ents = filtered_entities[index]["entities"]

            m_rels = para["relations"]
            f_rels = filtered_entities[index]["relations"]

            m_ents = merge_ents(m_ents,f_ents)
            m_rels = merge_ents(m_rels,f_rels)
            # print(m_ents)
            para["entities"] = m_ents
            para["relations"] = m_rels
        # print(filtered_entities)
        return merge_container


def filter_relations_by_entities(
    relations_obj,
    rel_filters,
    ents_filters
):
    filtered_data = []

    for paragraph in relations_obj:
        tmp_obj =  copy.deepcopy(paragraph)
        del tmp_obj["edit_status"]
        filtered_entities = []
        filtered_relations = []
        if "relations" not in tmp_obj:
            tmp_obj["entities"] = filtered_entities
            tmp_obj["relations"] = filtered_relations
            filtered_data.append(tmp_obj)
            continue
        # Collect IDs of entities that match the ents_filters
        filtered_entity_ids = {
            entity[0]
            for entity in tmp_obj["entities"]
            if entity[1] in ents_filters
        }
        related_entity_ids = []
        # Filter relations based on rel_filters and involvement of filtered entities
        for relation in tmp_obj["relations"]:
            if relation[1] == rel_filters:
                # Check if any entity in the relation roles is in the filtered_entity_ids
                if any(role[1] in filtered_entity_ids for role in relation[2]):
                    filtered_relations.append(relation)
                    related_entity_ids.append(relation[2][0][1])
                    related_entity_ids.append(relation[2][1][1])
        # Add paragraph with filtered relations if any relations remain
        # if filtered_relations:
        #     filtered_data.append({
        #         "text": paragraph["text"],
        #         "relations": filtered_relations
        #     })
        for entity in tmp_obj["entities"]:
            if entity[0] in filtered_entity_ids and entity[0] in related_entity_ids:
                filtered_entities.append(entity)

        tmp_obj["entities"] = filtered_entities
        tmp_obj["relations"] = filtered_relations
        filtered_data.append(tmp_obj)

    return filtered_data

def filter_entities(relations_obj, filtering_entity_types):
    
    ent_result = []
    if len(filtering_entity_types)==0:
        filtered_data = []
        for para in relations_obj:
            tmp_obj = copy.deepcopy(para)
            del tmp_obj["edit_status"]
            tmp_obj["entities"] = []
            tmp_obj["relations"] = []
            filtered_data.append(tmp_obj)
        return filtered_data

    for entity_type in filtering_entity_types:
        filtered_ent = filter_entities_by_relations(relations_obj,entity_type.type,entity_type.sub_type)
        # print(filtered_ent)
        ent_result = merge_filtered_entities(ent_result, filtered_ent)
        
    return ent_result

def filter_relations(relations_obj, filtering_relation_types):
    
    rel_result = []
    if len(filtering_relation_types)==0:
        rel_result = []
        for para in relations_obj:
            tmp_obj = copy.deepcopy(para)
            # del tmp_obj["edit_status"]
            tmp_obj["entities"] = []
            tmp_obj["relations"] = []
            rel_result.append(tmp_obj)
        return rel_result
    for relation_type in filtering_relation_types:
        filtered_rel = filter_relations_by_entities(relations_obj,relation_type.type,relation_type.sub_type)
        rel_result = merge_filtered_entities(rel_result, filtered_rel)

    return rel_result

def filter_non_para(para, bbox):
    return para, bbox


def compose_password_reset_email(reset_link: str, recipient_email: str, username: str) -> dict:
    """
    Compose a subject and body for the password-reset email.
    Returns a dictionary with 'subject' and 'body_text' (and optionally 'body_html').
    """
    
    subject = "[Polyminder] Reset your password"
    
    body_text = f"""\
        Hello,

        We received a request to reset the password for your account ({recipient_email}). 
        If you did not request a password reset, please ignore this email.

        To reset your password, please click the link below (or copy and paste it into your browser):
        {reset_link}

        This link will expire in 30 minutes.

        Best regards,
        Your Company Name
        """

            # (Optional) HTML version of the email
    body_html = f"""\
        <html>
        <body>
            <p>Hello,</p>
            <p>We received a request to reset the password for your account {username} ({recipient_email}). 
            If you did not request a password reset, please ignore this email.</p>
            <p>To reset your password, please click 
            <a href="{reset_link}">here</a> 
            (or copy and paste the URL below into your browser):</p>
            <p>{reset_link}</p>
            <p>This link will expire in 30 minutes.</p>
            <p>Best regards,<br>[Polyminder]</p>
        </body>
        </html>
        """

    return {
        "subject": subject,
        "body_text": body_text,
        "body_html": body_html
    }

def send_reset_password_email(to_email,reset_link, username ):
    # Set up the SMTP server
    smtp_host = 'smtp.gmail.com'  # Replace with your SMTP server
    smtp_port = 587  # Port for TLS
    from_email = 'polyminder.no.reply@gmail.com'  # Replace with your email
    password = gmail_app_password  # Replace with your email password
    email_title ="[Polyminder] Document Processing Notification"
    # Create the email message
    mail_obj = compose_password_reset_email(reset_link, to_email, username)
    msg = MIMEMultipart()
    msg['From'] = from_email
    msg['To'] = to_email
    msg['Subject'] = mail_obj['subject']
    
    msg.attach(MIMEText(mail_obj['body_html'], 'html'))
    result = False
    # Connect to the SMTP server
    try:
        server = smtplib.SMTP(smtp_host, smtp_port)
        server.starttls()  # Use TLS for security
        server.login(from_email, password)  # Login with your email and password

        # Send the email
        server.sendmail(from_email, to_email, msg.as_string())
        print("Email sent successfully!")
        result = True
    except Exception as e:
        print(f"Failed to send email. Error: {str(e)}")
        result = False
    finally:
        server.quit()
    
    return result

def decide_log_file():
    current_date = datetime.now()
    filename=f"{current_date.day}_{current_date.month}_{current_date.year}.txt"
    return filename

def logging(folder_path, content):
    path = os.path.join(folder_path,decide_log_file())
    with open(path, 'a', encoding='utf-8') as f:
        f.write(content)
        f.write("\n")

def h_log(folder_path):
    path = os.path.join(folder_path,decide_log_file())
    with open(path, 'a', encoding='utf-8') as f:
        f.write("=="*1000)
        f.write("\n")

def log_position(folder_path, position):
    
    state = {
        "position":{
            "rects":[

            ],
            "boundingRect":{
                "x1": position.boundingRect.x1,
                "y1": position.boundingRect.y1,
                "x2": position.boundingRect.x2,
                "y2": position.boundingRect.y2,
                "width": position.boundingRect.width,
                "height": position.boundingRect.height,
                "pageNumber": position.boundingRect.pageNumber,
            }
        }
    }
    for rect in position.rects:
        state["position"]["rects"].append(
            {
                "x1": rect.x1,
                "y1": rect.y1,
                "x2": rect.x2,
                "y2": rect.y2,
                "width": rect.width,
                "height": rect.height,
                "pageNumber": rect.pageNumber,
            }
        )
    logging(folder_path,json.dumps(state))

def log_relation(folder_path, relations):
    state = {
        "relations":[

        ]
    }
    for relation in relations:
        state["relations"].append({
            "type": relation.type,
            "arg_type": relation.arg_type,
            "arg_id": relation.arg_id,
            "arg_text": relation.arg_text,
            "id": relation.id,
        })
    logging(folder_path,json.dumps(state))