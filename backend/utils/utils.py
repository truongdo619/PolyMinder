import json

def read_json_file_utf8(file_path):
    with open(file_path, 'r', encoding='utf-8') as f:
        data = json.load(f)
    return data
from typing import Optional
from passlib.context import CryptContext
from jose import JWTError, jwt
from datetime import datetime, timedelta
import numpy as np
# Secret keys for access and refresh tokens
SECRET_KEY = "12345678"
REFRESH_SECRET_KEY = "0987654321"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 900
REFRESH_TOKEN_EXPIRE_DAYS = 7

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

def generate_bounding_boxes(text1, bbox1, text2):
    bbox2 = []
    for op, idx1, _ in levenshtein_edit_list(text1, text2):
        if op != 'delete':
            bbox2.append(bbox1[idx1] if op != 'insert' else bbox2[-1] if bbox2 else {
                "x1": 0, "y1": 0, "x2": 0, "y2": 0,
                "width": bbox1[0]["width"], "height": bbox1[0]["height"],
                "pageNumber": bbox1[0]["pageNumber"]})
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

def delete_relations(original_rels,deleted_rel):
    delete_id = []
    for rel in deleted_rel:
        delete_id.append(rel[0])
    for rel in original_rels:
        if rel[0] in delete_id:
            original_rels.remove(rel)
    return original_rels

def update_relation(original_rels,updated_rel):
    update_id = []
    # print(updated_rel)
    for rel in updated_rel:
        update_id.append(rel[0])
    for index,rel in enumerate(original_rels):
        if rel[0] in update_id:
            original_rels[index] = updated_rel[update_id.index(rel[0])]
            # print(updated_rel[update_id.index(rel[0])])
    # print(original_rels)
    return original_rels

def add_relation(original_rels,added_rel):
    for rel in added_rel:
        id = len(original_rels)+1
        new_id = f"R{id}"
        rel[0] = new_id
        original_rels.append(rel)
    return original_rels

def update_relations(total_orginal_list,new_list,arg1_id):
    original_list_arg1 = filter_by_arg1(total_orginal_list,arg1_id)
    deleted_elements, updated_elements, added_elements = compare_versions(original_list_arg1, new_list)
    total_orginal_list = add_relation(total_orginal_list,added_elements)
    total_orginal_list = update_relation(total_orginal_list,updated_elements)
    total_orginal_list = delete_relations(total_orginal_list,deleted_elements)
    return total_orginal_list