import numpy as np

def levenshtein_edit_list(text1, text2):
    """ 
    Compute the Levenshtein distance and extract the edit operations between text1 and text2.
    
    Parameters:
    text1 (str): The original text.
    text2 (str): The target text.
    
    Returns:
    list of tuples: A list of edit operations.
                    Each operation is represented as a tuple ('operation', index_in_text1, index_in_text2).
                    Operations can be 'match', 'insert', 'delete', or 'replace'.
    """
    len1, len2 = len(text1), len(text2)
    dp = np.zeros((len1 + 1, len2 + 1), dtype=int)

    for i in range(len1 + 1):
        dp[i][0] = i
    for j in range(len2 + 1):
        dp[0][j] = j

    for i in range(1, len1 + 1):
        for j in range(1, len2 + 1):
            if text1[i - 1] == text2[j - 1]:
                dp[i][j] = dp[i - 1][j - 1]
            else:
                dp[i][j] = 1 + min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1])

    # Backtrack to find the edit list
    i, j = len1, len2
    edit_list = []

    while i > 0 and j > 0:
        if text1[i - 1] == text2[j - 1]:
            edit_list.append(('match', i - 1, j - 1))
            i -= 1
            j -= 1
        elif dp[i][j] == dp[i - 1][j - 1] + 1:
            edit_list.append(('replace', i - 1, j - 1))
            i -= 1
            j -= 1
        elif dp[i][j] == dp[i - 1][j] + 1:
            edit_list.append(('delete', i - 1, j))
            i -= 1
        else:
            edit_list.append(('insert', i, j - 1))
            j -= 1

    while i > 0:
        edit_list.append(('delete', i - 1, j))
        i -= 1

    while j > 0:
        edit_list.append(('insert', i, j - 1))
        j -= 1

    edit_list.reverse()
    return edit_list

def generate_bounding_boxes(text1, bbox1, text2):
    """
    Generate bounding boxes for text2 based on the bounding boxes of text1 and Levenshtein edit operations.
    
    Parameters:
    text1 (str): The original text with known bounding boxes.
    bbox1 (list of dicts): A list of bounding boxes corresponding to each character in text1. 
                           Each bounding box is represented as a dictionary with keys: x1, y1, x2, y2, width, height, pageNumber.
    text2 (str): The new text for which we need to generate bounding boxes.
    
    Returns:
    list of dicts: A list of bounding boxes corresponding to each character in text2.
    """
    edit_list = levenshtein_edit_list(text1, text2)
    print(edit_list)
    bbox2 = []
    i, j = 0, 0

    for operation, idx1, idx2 in edit_list:
        if operation == 'match' or operation == 'replace':
            bbox2.append(bbox1[idx1])
            i += 1
            j += 1
        elif operation == 'insert':
            # Insert a placeholder bounding box, or estimate based on nearby bounding boxes
            # Here, we'll just use the previous bounding box as a placeholder
            if bbox2:
                bbox2.append(bbox2[-1])
            else:
                bbox2.append({
                    "x1": 0, "y1": 0, "x2": 0, "y2": 0,
                    "width": bbox1[0]["width"],
                    "height": bbox1[0]["height"],
                    "pageNumber": bbox1[0]["pageNumber"]
                })  # Fallback placeholder
            j += 1
        elif operation == 'delete':
            i += 1

    return bbox2


text1 = "helo"
bbox1 = [
    {
        "x1": 0, "y1": 0, "x2": 10, "y2": 10,
        "width": 595.2760009765625, "height": 793.7009887695312,
        "pageNumber": 1
    },
    {
        "x1": 10, "y1": 0, "x2": 20, "y2": 10,
        "width": 595.2760009765625, "height": 793.7009887695312,
        "pageNumber": 1
    },
    {
        "x1": 20, "y1": 0, "x2": 30, "y2": 10,
        "width": 595.2760009765625, "height": 793.7009887695312,
        "pageNumber": 1
    },
    {
        "x1": 30, "y1": 0, "x2": 40, "y2": 10,
        "width": 595.2760009765625, "height": 793.7009887695312,
        "pageNumber": 1
    },
    {
        "x1": 40, "y1": 0, "x2": 50, "y2": 10,
        "width": 595.2760009765625, "height": 793.7009887695312,
        "pageNumber": 1
    }
]
text2 = "he lo"


bbox2 = generate_bounding_boxes(text1, bbox1, text2)
print(bbox2)  # Output: corresponding bounding boxes for "helo"