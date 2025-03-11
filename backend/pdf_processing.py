from pdfdataextractor import Reader
import pymupdf
from tqdm import tqdm
import fitz

def convert_pdf_to_text_v2(path, min_length):
    file = Reader()
    data_json = {}
    pdf = file.read_file(path)
    if type(pdf.abstract()) is list:
        data_json["Abstract"] = pdf.abstract()
    else:
        data_json["Abstract"] = [pdf.abstract()]
    sections = pdf.section()
    if len(sections.keys()) == 0:
        raise Exception("No sections found in the PDF file.")

    def remove_references_and_acknowledge(sections):
        for key in list(sections.keys()):
            if "reference" in key.lower() or "acknowledge" in key.lower():
                sections.pop(key)
        return sections

    def remove_short_paragraphs(sections, min_length):
        result = {}
        for key in list(sections.keys()):
            tmp = []
            for paragraph in sections[key]:
                if len(paragraph) > min_length:
                    tmp.append(paragraph)
            result[key] = tmp
        return result

    data_json = remove_references_and_acknowledge(data_json)
    data_json = remove_short_paragraphs(data_json, min_length=min_length)
    return data_json


def convert_pdf_to_text_v1(path, min_length):
    def process_blocks(blocks, min_length):
        paragraphs = []
        for block in tqdm(blocks):
            text = block[4].replace("\n", " ")
            if len(text) > min_length:
                paragraphs.append(text)
        return paragraphs
    
    all_paragraphs = []
    with pymupdf.open(path) as doc:
        for page in doc:
            blocks = page.get_text("blocks")
            all_paragraphs += process_blocks(blocks, min_length)
    return {"Full Document": all_paragraphs}


# def convert_pdf_to_text_and_bounding_boxes(path):
#     document = fitz.open(path)

#     def extract_text_and_bounding_boxes(page, page_number):
#         text_page = page.get_textpage()
#         text = text_page.extractRAWDICT()
#         block_texts_data = []
#         block_bb_data = []
#         for block in text['blocks']:
#             if 'lines' in block:
#                 block_text = ""
#                 char_bounding_boxes = []
#                 for line in block['lines']:
#                     for span in line['spans']:
#                         for char in span['chars']:
#                             c = char['c']
#                             bbox = char['bbox']
#                             block_text += c
#                             position = {
#                                 "x1": bbox[0],
#                                 "y1": bbox[1],
#                                 "x2": bbox[2],
#                                 "y2": bbox[3],
#                                 "width": page.rect.width,
#                                 "height": page.rect.height,
#                                 "pageNumber": page_number
#                             }
#                             char_bounding_boxes.append(position)
#                 block_texts_data.append(block_text)
#                 block_bb_data.append(char_bounding_boxes)
#         return block_texts_data, block_bb_data
    
#     all_pages_text_data = []
#     all_pages_bb_data = []
#     for page_number in range(len(document)):
#         page = document.load_page(page_number)
#         block_texts_data, block_bb_data = extract_text_and_bounding_boxes(page, page_number+1)
#         all_pages_text_data += block_texts_data
#         all_pages_bb_data += block_bb_data
#     return all_pages_text_data, all_pages_bb_data

def compare_rect(rect1, rect2):
    if rect1["x1"]!=rect2["x1"] or rect1["x2"]!=rect2["x2"] or rect1["y1"]!=rect2["y1"] or rect1["y2"]!=rect2["y2"]:
        return False
    return True

def check_if_there_is_break(sample, sample_box):
    min_x = 10000
    max_x = 0
    line_down= 0 
    break_line = 0 
    container = [[]]
    rect_container = [[]]
    container_pos = 0
    for index, rect in enumerate( sample_box):
        if rect["x1"] < min_x:
            min_x = rect["x1"]
        if rect["x2"] > max_x:
            max_x = rect["x2"]
    if len(sample)!= len(sample_box):
        print("sample:  ",sample)
        print("num sample:  ",len(sample))
        print("num pos:   ",len(sample_box))
    for index, rect in enumerate( sample_box):
        if index >= len(sample):
            continue

        container[container_pos].append(sample[index])
        rect_container[container_pos].append(rect)

        if index < len(sample_box)-1:
            if compare_rect(rect, sample_box[index-1]):
                line_down+=1
                # print(sample[index])
                if sample_box[index+1]['x1'] - min_x >6 or (max_x - rect['x2']) >11:
                    break_line+=1
                    container.append([])
                    rect_container.append([])
                    container_pos+=1
    
    # print(line_down) 
    # print(break_line) 
    for index, para in enumerate(container):
        container[index] = "".join(para)
    # for index, rect_list in enumerate(rect_container):
    #     if rect_list == []:
    #         rect_container.remove(rect_list)
    #         container.remove(container[index])
    # print(container)
    container, rect_container = remove_blank_text(container, rect_container)
    return container, rect_container

def remove_blank_text(container, rect_container):
    removed = 0
    for index, text in enumerate(container):
        if text.strip()=="":
            container.remove(container[index-removed])
            rect_container.remove(rect_container[index-removed])
    return container, rect_container


def divide_paragraphs(all_pages_text_data, all_pages_bb_data):
    container = []
    rect_container = []
    for para, para_bb in list(zip(all_pages_text_data, all_pages_bb_data)):
        new_paras, new_bb = check_if_there_is_break(para, para_bb)
        container.extend(new_paras)
        rect_container.extend(new_bb)
    container, rect_container = remove_blank_pos(container, rect_container)
    return container, rect_container

def remove_blank_pos(all_pages_text_data, all_pages_bb_data):
    blank_id = []
    for index, box in enumerate(all_pages_bb_data):
        if box == []:
            blank_id.append(index)
    removed = 0
    for id in blank_id:
        all_pages_bb_data.remove(all_pages_bb_data[id-removed])
        all_pages_text_data.remove(all_pages_text_data[id-removed])
        removed+=1
    return all_pages_text_data, all_pages_bb_data

def convert_pdf_to_text_and_bounding_boxes(path):
    document = fitz.open(path)

    def extract_text_and_bounding_boxes(page, page_number):
        text_page = page.get_textpage()
        text = text_page.extractRAWDICT()
        block_texts_data = []
        block_bb_data = []
        for block in text['blocks']:
            if 'lines' in block:
                block_text = ""
                char_bounding_boxes = []
                last_char_bbox = None
                last_char_c = ''
                for line in block['lines']:
                    for span in line['spans']:
                        for char in span['chars']:
                            c = char['c']
                            bbox = char['bbox']

                            if last_char_bbox is not None:
                                y_diff = bbox[1] - last_char_bbox[3]  # Vertical difference
                                # Adjust the threshold based on your PDF's font size and spacing
                                if y_diff > 0:  # Threshold for detecting a new line
                                    # New line detected
                                    if last_char_c == '-':
                                        # Dehyphenate: remove the hyphen and don't add space
                                        block_text = block_text + c
                                        # Remove the last bounding box (hyphen)
                                        # Add current character's bounding box
                                        char_bounding_boxes.append({
                                            "x1": bbox[0],
                                            "y1": bbox[1],
                                            "x2": bbox[2],
                                            "y2": bbox[3],
                                            "width": page.rect.width,
                                            "height": page.rect.height,
                                            "pageNumber": page_number
                                        })
                                    else:
                                        # Add a space before the new line
                                        block_text += ' ' + c
                                        # Create a placeholder bounding box for the space
                                        space_bbox = {
                                            "x1": last_char_bbox[0],
                                            "y1": last_char_bbox[1],
                                            "x2": last_char_bbox[2],
                                            "y2": last_char_bbox[3],
                                            "width": page.rect.width,
                                            "height": page.rect.height,
                                            "pageNumber": page_number
                                        }
                                        char_bounding_boxes.append(space_bbox)
                                        # Add current character's bounding box
                                        char_bounding_boxes.append({
                                            "x1": bbox[0],
                                            "y1": bbox[1],
                                            "x2": bbox[2],
                                            "y2": bbox[3],
                                            "width": page.rect.width,
                                            "height": page.rect.height,
                                            "pageNumber": page_number
                                        })
                                else:
                                    # Same line
                                    block_text += c
                                    char_bounding_boxes.append({
                                        "x1": bbox[0],
                                        "y1": bbox[1],
                                        "x2": bbox[2],
                                        "y2": bbox[3],
                                        "width": page.rect.width,
                                        "height": page.rect.height,
                                        "pageNumber": page_number
                                    })
                            else:
                                # First character
                                block_text += c
                                char_bounding_boxes.append({
                                    "x1": bbox[0],
                                    "y1": bbox[1],
                                    "x2": bbox[2],
                                    "y2": bbox[3],
                                    "width": page.rect.width,
                                    "height": page.rect.height,
                                    "pageNumber": page_number
                                })

                            # Update last_char_c and last_char_bbox
                            last_char_c = c
                            last_char_bbox = bbox

                # Ensure that block_text and char_bounding_boxes have the same length
                assert len(block_text) == len(char_bounding_boxes), "Mismatch between text and bounding boxes"

                block_texts_data.append(block_text.strip())
                block_bb_data.append(char_bounding_boxes)
        return block_texts_data, block_bb_data

    all_pages_text_data = []
    all_pages_bb_data = []
    for page_number in range(len(document)):
        page = document.load_page(page_number)
        block_texts_data, block_bb_data = extract_text_and_bounding_boxes(page, page_number + 1)
        # if block_texts_data=="":
        #     continue
        for index,block_text in enumerate(block_texts_data):
            if block_text=="":
                # all_pages_text_data[-1]+= " "
                # all_pages_bb_data[-1].append(block_bb_data[index][0])
                continue
            else:
                all_pages_text_data.append(block_text)
                all_pages_bb_data.append(block_bb_data[index])
        # all_pages_text_data += block_texts_data
        # all_pages_bb_data += block_bb_data
    all_pages_text_data, all_pages_bb_data = divide_paragraphs(all_pages_text_data, all_pages_bb_data)
    return all_pages_text_data, all_pages_bb_data


def process_pdf_to_text(path, min_length=20):
    try:
        print("Processing PDF file using convert_pdf_to_text_v2 ...")
        return convert_pdf_to_text_v2(path, min_length)
    except Exception:
        print("Failed to process PDF file using convert_pdf_to_text_v2!")
        print("Processing PDF file using convert_pdf_to_txt_file_v1 ...")
        return convert_pdf_to_text_v1(path, min_length)
