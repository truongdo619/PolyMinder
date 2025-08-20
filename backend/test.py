# from pdf_processing import process_pdf_to_text, convert_pdf_to_text_and_bounding_boxes
# from pdfdataextractor import Reader
import pymupdf
from tqdm import tqdm
import fitz
from typing import List

import magic_pdf
# check_text("Transport properties")
# check_text("x-ray scattering",mode=0)
# check_text("angle neutron")

import json
import re
import os
import asyncio
from datetime import datetime
import traceback

from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
import httpx

from magic_pdf.data.data_reader_writer import FileBasedDataWriter, FileBasedDataReader
from magic_pdf.data.dataset import PymuDocDataset
from magic_pdf.model.doc_analyze_by_custom_model import doc_analyze
from magic_pdf.config.enums import SupportedPdfParseMethod
from celery.result import AsyncResult
from celery_app import app as celery_app

from ner_re_processing import convert_to_NER_model_input_format, convert_to_RE_model_input_format, convert_to_output_v2
from EAE.predict_EAE import predict as eae_predict
from schemas.document import Rect, CreateEntitySchema, Position
from dev_tasks import process_pdf_task, re_run_re, re_run_for_changed_para, re_run, process_pdf_task_with_json, process_text_task
from database import get_dev_db as get_db
from crud.psql import document as document_crud
from utils import utils

TEST_USER_ID="5779"

color_map = {
    "POLYMER": "#ff4500",
    "PROP_NAME": "#1e90ff",
    "CHAR_METHOD": "#A0778A",
    "POLYMER_FAMILY": "#00ff00",
    "PROP_VALUE": "#ffd700",
    "MONOMER": "#B8BDD3",
    "OTHER_MATERIAL": "#1976d2",
    "COMPOSITE": "#8400ff",
    "SYN_METHOD": "#f09bc5",
    "EVENT": "#32CD32",
    "CONDITION": "#ffe000",
    "MATERIAL_AMOUNT": "#a0522d",
    "REF_EXP": "#bd0ea5",
    "INORGANIC": "#00ffff",
    "ORGANIC": "#ff00ff"
}

TARGET_URL = "http://192.168.10.2:8000/process"
# TARGET_URL= "http://192.168.10.7:8000/v1/models"
# class TextRequest(BaseModel):
#     model: str ="Qwen/Qwen2.5-7B-Instruct"
#     prompt: str
#     max_tokens: int=2048
#     temperature: int=0.8
class TextRequest(BaseModel):
    text: str 

async def forward_text(request: TextRequest):
    # 1. Configure a longer timeout on the HTTP client
    timeout = httpx.Timeout(
        connect=10.0,   # wait up to 10s to establish connection
        read=60.0,      # wait up to 60s for a server response
        write=10.0,
        pool=5.0
    )
    async with httpx.AsyncClient(timeout=timeout) as client:
        try:
            # 2. Optionally also pass a per-request timeout
            resp = await client.post(
                TARGET_URL,
                json=request.dict(),
                timeout=timeout
            )
            resp.raise_for_status()
        except httpx.HTTPError as e:
            # if the upstream call fails (timeout or other), return a 502
            raise HTTPException(status_code=502, detail=str(e))
        return resp.json()

async def main():
    # assume new_table_data is defined somewhere above
    file_path = 'uploads/yoonessi2011.pdf'
    mineru_json_content = parse_layout_with_mineru(file_path)
    mineru_json = json.loads(mineru_json_content)
    table_data = [table for page_infor in mineru_json['pdf_info'] for table in page_infor["tables"]]
    new_table_data=[]
    for table in table_data:
        new_table_data_format={
            "table_body":"",
            "table_caption":"",
            "table_footnote":"",
            "table_name":"",
            "context":""
        }
        for block in table["blocks"]:
            content =''
            for line in block["lines"]:
                for span in line["spans"]:
                    if "content" in span:
                        content+= span['content']
                    elif 'html' in span:
                        content+= span['html']
            new_table_data_format[block["type"]] = content
            # elif block["type"] == "table_body":
            #     new_table_data_format["table_body"] = content
            # elif block["type"] == "table_footnote":
            #     new_table_data_format["table_footnote"] = content
            match = re.search(r"Table\s+\d+", new_table_data_format["table_caption"])

            if match:
                print("Found table name:", match.group())
                new_table_data_format["table_name"] = match.group()
            else:
                print("Table name not found.")
        new_table_data.append(new_table_data_format)
    print(new_table_data)
    para_data = extract_mineru_result(mineru_json)
    para_data = extract_text_n_bbox_using_pymupdf_from_mineru_result(file_path, para_data)
    para_data = merge_broken_paragraph(para_data)
    block_texts_data, block_bb_data = get_bbox_n_text_seperated(para_data)

    for table in new_table_data:
        for para in block_texts_data:
            if table["table_name"] in para:
                table["context"] = para
                break
    print(new_table_data)
    
    prompts = [build_prompt(table) for table in new_table_data]
    print(prompts)
    prompts: List[str] = [build_prompt(table) for table in new_table_data]
    print("Prompts to send:", prompts)

    # create a list of TextRequest objects
    requests = [TextRequest(text=prompt) for prompt in prompts]

    # fire off all requests concurrently
    # tasks = [forward_text(req) for req in requests]
    try:
        # responses = await asyncio.gather(*tasks)
        for req in requests:
            response = await forward_text(req)
            print("Got responses:", response) 
    except HTTPException as e:
        print(f"Upstream error: {e.detail}")
        # return

    # do something with responses
    

def build_prompt(data_point):
    prompt = f"""Please convert the following HTML table into a detailed natural language paragraph. Use the additional context provided to enrich and clarify the description. Present the information row by row, clearly articulating the content of each cell within each row so that named entity recognition (NER) models can easily identify and extract all individual data points. Ensure that the resulting text distinctly expresses the data from every column for each row, maintaining a structure that preserves the granularity and traceability of the original table.\n\n"""
    
    if data_point.get("context"):
        prompt += "Surrounding text:\n"
        # for context in data_point["context"]:
        #     prompt += f"{context.strip()}\n"
        prompt += data_point["context"].strip()+"\n"
        prompt += "\n"
        
    if data_point.get("table_caption"):
        prompt += "Caption:\n"
        # for caption in data_point["table_caption"]:
        prompt += data_point["table_caption"].strip()+"\n"
        prompt += "\n"
        
    if data_point.get("table_footnote"):
        prompt += "Table footnote:\n"
        # for footnote in data_point["table_footnote"]:
        #     prompt += f"{footnote.strip()}\n"
        prompt += data_point["table_footnote"].strip()+"\n"
        prompt += "\n"
        
    prompt += f'HTML table:\n{data_point["table_body"].strip()}\n'
    return prompt

def update_bbox_n_text_after_normalize(para_data, normalized_text, normalized_bbox):
    for para, text, bbox in list(zip(para_data, normalized_text, normalized_bbox)):
        para["text"] = text
        para["bbox"] = bbox
    return para_data

def iou(box1, box2):
    """
    Compute the Intersection over Union (IoU) between two bounding boxes.
    
    Each box is represented as (x_min, y_min, x_max, y_max).
    """
    x1_min, y1_min, x1_max, y1_max = box1
    x2_min, y2_min, x2_max, y2_max = box2
    
    # Compute intersection coordinates
    x_inter_min = max(x1_min, x2_min)
    y_inter_min = max(y1_min, y2_min)
    x_inter_max = min(x1_max, x2_max)
    y_inter_max = min(y1_max, y2_max)
    
    # Compute intersection area
    inter_width = max(0, x_inter_max - x_inter_min)
    inter_height = max(0, y_inter_max - y_inter_min)
    intersection_area = inter_width * inter_height
    
    # Compute both box areas
    box1_area = (x1_max - x1_min) * (y1_max - y1_min)
    box2_area = (x2_max - x2_min) * (y2_max - y2_min)
    
    # Compute union area
    union_area = box1_area + box2_area - intersection_area
    
    # Compute IoU
    iou_value = intersection_area / union_area if union_area != 0 else 0
    return iou_value

def find_best_overlap(target_box, box_list):
    """
    Find the bounding box in box_list with the highest IoU with target_box.
    """
    best_box = None
    best_iou = 0
    best_box_id = -1

    for box_id, box in enumerate(box_list):
        current_iou = iou(target_box, box["bbox"])
        if current_iou > best_iou:
            best_iou = current_iou
            best_box = box
            best_box_id = box_id

    return best_box, best_box_id, best_iou


def read_json(json_path):
    with open(json_path, 'r') as json_file:
        json_content = json.load(json_file)
    return json_content


def get_blocks(mineru_page_content):
    content_block_names = ["para_blocks", "discarded_blocks", "images", "tables"]
    blocks = []
    for block_name in content_block_names:
        for block in mineru_page_content[block_name]:
            if "blocks" in block:
                for sub_block in block["blocks"]:
                    if "bbox" not in sub_block:
                        continue
                    if len(sub_block["bbox"]) != 4:
                        continue
                    tmp = {
                        "bbox": sub_block["bbox"],
                        "type": sub_block["type"]
                    }
                    blocks.append(tmp)
            else:
                if "bbox" not in block:
                    continue
                if len(block["bbox"]) != 4:
                    continue
                tmp = {
                    "bbox": block["bbox"],
                    "type": block["type"]
                }
            blocks.append(tmp)
    return blocks


def get_block_dictionary(mineru_json_content):
    page_num = len(mineru_json_content["pdf_info"])
    page_to_blocks = {}
    for i in range(page_num):
        blocks = get_blocks(mineru_json_content["pdf_info"][i])
        page_to_blocks[i] = blocks
    return page_to_blocks


def parse_layout_with_mineru(pdf_file_name):

    # prepare env
    local_image_dir = "test_middle_output/mineru_output/images"

    os.makedirs(local_image_dir, exist_ok=True)

    image_writer = FileBasedDataWriter(local_image_dir)

    # read bytes
    reader1 = FileBasedDataReader("")
    pdf_bytes = reader1.read(pdf_file_name)  # read the pdf content

    # proc
    ## Create Dataset Instance
    ds = PymuDocDataset(pdf_bytes)

    ## inference
    if ds.classify() == SupportedPdfParseMethod.OCR:
        infer_result = ds.apply(doc_analyze, ocr=True)

        ## pipeline
        pipe_result = infer_result.pipe_ocr_mode(image_writer)

    else:
        infer_result = ds.apply(doc_analyze, ocr=False)

        ## pipeline
        pipe_result = infer_result.pipe_txt_mode(image_writer)

    mineru_json_content = pipe_result.get_middle_json()
    return mineru_json_content


def reorder_paragraph_with_mineru(pdf_file_path, pymupdf_json_content):
    mineru_json_content =  read_json("output/yoonessi2011/auto/yoonessi2011_middle.json")
    block_dictionary = get_block_dictionary(mineru_json_content)

    # # Parse the layout with Mineru
    # mineru_json_content = parse_layout_with_mineru(pdf_file_path)
    
    # # Get the block dictionary, mapping from page number to list of blocks
    # block_dictionary = get_block_dictionary(json.loads(mineru_json_content))

    results = []
    for para in pymupdf_json_content["brat_format_output"]:
        page = para["bounding_box"]["pageNumber"] - 1
        block_list = block_dictionary[page]
        target_box = [para["bounding_box"]["x1"], para["bounding_box"]["y1"], para["bounding_box"]["x2"], para["bounding_box"]["y2"]]
        best_box, best_box_id, _ = find_best_overlap(target_box, block_list)

        if best_box_id == -1:
            continue

        ordered_para = para.copy()
        ordered_para["mineru_block_id"] = best_box_id
        ordered_para["block_type"] = best_box["type"]
        results.append(ordered_para)

    # Sort the results by page number and Mineru block ID
    sortered_results = sorted(results, key=lambda x: (x["bounding_box"]["pageNumber"], x['mineru_block_id']))
    return sortered_results


# Read the JSON content from PyMuPDF

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
    for index, rect in enumerate( sample_box):
        if index >= len(sample):
            continue
        container[container_pos].append(sample[index])
        rect_container[container_pos].append(rect)

        if index < len(sample_box)-1:
            if compare_rect(rect, sample_box[index-1]):
                line_down+=1
                # print(sample[index])
                if sample_box[index+1]['x1'] - min_x >6 or (max_x - rect['x2']) >6:
                    break_line+=1
                    container.append([])
                    rect_container.append([])
                    container_pos+=1
    
    # print(line_down) 
    # print(break_line) 
    for index, para in enumerate(container):
        container[index] = "".join(para)

    # print(container)
    container, rect_container = remove_blank_text(container, rect_container)
    return container, rect_container

def divide_paragraphs(all_pages_text_data, all_pages_bb_data):
    container = []
    rect_container = []
    for para, para_bb in list(zip(all_pages_text_data, all_pages_bb_data)):
        try:
            new_paras, new_bb = check_if_there_is_break(para, para_bb)

            container.extend(new_paras)
            rect_container.extend(new_bb)
        except:
            print("error happened at ")
            print(all_pages_text_data.index(para))
    
    return container, rect_container

def remove_blank_text(container, rect_container):
    removed = 0
    for index, text in enumerate(container):
        if text.strip()=="":
            container.remove(container[index-removed])
            rect_container.remove(rect_container[index-removed])
    return container, rect_container

# check_if_there_is_break(sample, box_sample)
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
    # all_pages_text_data, all_pages_bb_data = divide_paragraphs(all_pages_text_data, all_pages_bb_data)
    return all_pages_text_data, all_pages_bb_data


def check_sample(sample, box_sample):
    print(sample)
    print(len(sample))
    
    print(box_sample[20])
    print(sample[20])
    print(box_sample[1750])
    print(sample[1750])
    print(type(box_sample[-1]))
    print(len(sample))
    print(len(box_sample))
    # for box in box_sample:
    #     print(box)
    # print(len(sample))
    # print(len(box_sample))

def test_take_text_page_clip(file_path,sample_box):
    document = fitz.open(file_path)

    # def extract_text_and_bounding_boxes(page, page_number):
    #     text_page = page.get_textpage()
    #     text = text_page.extractRAWDICT()
    #     block_texts_data = []
    #     block_bb_data = []
    #     print(text)
    # for page_number in range(len(document)):
        
    #     page = document.load_page(page_number)

    #     block_texts_data, block_bb_data = extract_text_and_bounding_boxes(page, page_number + 1)
    page = document.load_page(0)
    text_page = page.get_textpage(clip=sample_box)
    print(type(text_page))
    # print(text_page)
    text = text_page.extractRAWDICT()
    print(text)
    block_texts_data = []
    block_bb_data = []
    page_number = 1
    for block in text['blocks']:
        if 'lines' in block:
            block_text, char_bounding_boxes = collect_text_n_bbox(block,page,page_number)
            block_texts_data.append(block_text.strip())
            block_bb_data.append(char_bounding_boxes)
    print(block_texts_data)
    return block_texts_data, block_bb_data


def collect_text_n_bbox(block,page,page_number):
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
    assert len(block_text) == len(char_bounding_boxes), "Mismatch between text and bounding boxes"
    return block_text, char_bounding_boxes
 

def collect_para(para_list, result_list, page_idx,width, height):
    '''
    This function is for collect infor of para in each list of different para, it only collect bbox, type and index.
    '''

    for para in para_list:
        # x1,y1,x2,y2 = para["bbox"]
        # rect = pymupdf.Rect(x1,y1,x2,y2)
        if "blocks" in para:
            result_list = collect_para(para["blocks"],result_list,page_idx,width, height)
        else:
            if para["type"] =="discarded":
                index = 999999
            else:
                index = para["index"]
            if para["type"] =="title":
                lines = para["lines"]
                title = lines[0]["spans"][0]["content"].lower()
                if "reference" in title:
                    para["type"]="reference_title"
                #     meet_reference_title = True
                # else:
                #     meet_reference_title = False
                    # skip = False
            # if skip==False:
            result_list.append({
                "type":para["type"],
                "width":width,
                "height":height,
                "rect":para["bbox"],
                "page_number": [page_idx],
                "index":index,
            })
            # if meet_reference_title:
            #     skip=True
    return result_list

def sort_by_page_and_index(objects):
    return sorted(objects, key=lambda obj: (obj.get("page_number", float('inf')), obj.get("index", float('inf'))))

def extract_mineru_result(mineru_json):
    # block_texts_data = [] 
    # block_bb_data = []
    para_data = []
    pdf_info_object = mineru_json['pdf_info']
    for index, page_infor in enumerate(pdf_info_object):
        images = page_infor["images"]
        tables = page_infor["tables"]
        para_blocks = page_infor["para_blocks"]
        discarded_blocks = page_infor["discarded_blocks"]
        page_idx = int(page_infor["page_idx"]) + 1
        width, height = page_infor["page_size"]
        para_data = collect_para(para_blocks, para_data,page_idx,width, height)
        # para_data = collect_para(images, para_data,page_idx,width, height)
        para_data = collect_para(discarded_blocks, para_data,page_idx,width, height)
        # para_data = collect_para(tables, para_data,page_idx,width, height)
    # para_data = sort_by_page_and_index(para_data)
    return para_data

def remove_reference(para_data):
    new_result = []
    meet_reference_title=False
    
    for para in para_data:
        if para["type"] == "reference_title":
            meet_reference_title=True
        if meet_reference_title:
            if para["type"] =="title":
                meet_reference_title = False
        else:
            new_result.append(para)
    return new_result
def check_ignore_get_text(para_type):
    ingore_list = [
        "table_body",
        # "table",
        # "image",
        "discarded",
        "image_body",
        "image_caption",
        "table_caption"

    ]
    if para_type in ingore_list:
        return True
    else:
        return False



def merge_bounding_boxes(boxes):
    x1 = min(box['x1'] for box in boxes)
    y1 = min(box['y1'] for box in boxes)
    x2 = max(box['x2'] for box in boxes)
    y2 = max(box['y2'] for box in boxes)
    return {'x1': x1, 'y1': y1, 'x2': x2, 'y2': y2}


def check_break_at_head(para):
    return abs(para["bbox"][0]["x1"] - para["bounding_box"][0]["x1"]) > 3
    
def check_break_at_end(para):
    # print(para.keys())
    return abs(para["bbox"][-1]["x2"] - para["bounding_box"][0]["x2"]) > 3

def is_same_type_para_by_length(para1, para2):
    length1 =  abs(para1["bounding_box"][0]["x2"]-para1["bounding_box"][0]["x1"])
    length2 =  abs(para2["bounding_box"][0]["x2"]-para2["bounding_box"][0]["x1"])
    if abs(length1-length2) > 20:
        return False
    else:
        return True

def generate_graphs(entities, relations):
    from collections import defaultdict

    # Map entity ID to entity details
    entity_map = {e[0]: e for e in entities}

    # Build reverse and forward lookup of relations for each entity
    parents_map = defaultdict(list)
    children_map = defaultdict(list)
    for rel in relations:
        rel_id, rel_type, args = rel
        src = args[0][1]
        tgt = args[1][1]
        children_map[src].append((tgt, rel_type))
        parents_map[tgt].append((src, rel_type))

    # Build a graph for each entity
    all_graphs = {}

    for root_id in entity_map.keys():
        nodes = []
        edges = []

        id_map = {}  # maps entity ID to node ID in the graph
        node_counter = 1

        def add_node(entity_id, x, y):
            nonlocal node_counter
            if entity_id in id_map:
                return id_map[entity_id]
            ent = entity_map[entity_id]
            node_id = str(node_counter)
            node_counter += 1
            id_map[entity_id] = node_id
            nodes.append({
                "id": node_id,
                "data": {"label": f"{ent[1]}: {ent[3]}"},
                "position": {"x": x, "y": y},
                "className": ent[1],
                "sourcePosition": "right",
                "targetPosition": "left"
            })
            return node_id

        root_node_id = add_node(root_id, 250, 0)

        # Add parent nodes (to the left)
        for i, (parent_id, rel_type) in enumerate(parents_map[root_id]):
            parent_y = i * 100
            parent_node_id = add_node(parent_id, 0, parent_y)
            edges.append({
                "id": f"e{parent_node_id}-{root_node_id}",
                "source": parent_node_id,
                "target": root_node_id,
                "type": "straight",
                "label": rel_type,
                "markerEnd": {"type": "Arrow"}
            })

        # Add child nodes (to the right)
        for i, (child_id, rel_type) in enumerate(children_map[root_id]):
            child_y = i * 100
            child_node_id = add_node(child_id, 500, child_y)
            edges.append({
                "id": f"e{root_node_id}-{child_node_id}",
                "source": root_node_id,
                "target": child_node_id,
                "type": "straight",
                "label": rel_type,
                "markerEnd": {"type": "Arrow"}
            })

        all_graphs[root_id] = {
            "nodes": nodes,
            "edges": edges
        }

    return all_graphs

def extract_text_n_bbox_using_pymupdf_from_mineru_result(file_path,para_data):
    document = fitz.open(file_path)
    # block_texts_data = []
    # block_bb_data = []
    for page_number in range(len(document)):
        page_data = document.load_page(page_number)
        for_print_page_data = []
        for para in para_data:
            if check_ignore_get_text(para["type"]):
                para["text"] = "@"
                x1,y1,x2,y2 = para['rect']
                para["bbox"] = [
                    {
                        "x1": x1,
                        "y1": y1,
                        "x2": x2,
                        "y2": y2,
                        "width": para["width"],
                        "height": para["height"],
                        "pageNumber": para["page_number"][0]
                    }
                ]
                para["bounding_box"] = [merge_bounding_boxes(para["bbox"])]
                continue
            if para["page_number"][0] == (page_number+1):    
                threshhold = 5
                x1,y1,x2,y2 = para['rect']
                bounding_box = {'x1': 0, 'y1': 0, 'x2': 0, 'y2': 0}
                padding =0
                # loop_again = False
                while (abs(bounding_box["y1"] - y1) > threshhold or abs(bounding_box["y2"] - y2) > threshhold) and (padding <= 5):
                    new_y2 = y2-padding
                    new_y1 = y1+padding
                    padding += 1
                    rect = pymupdf.Rect(x1,new_y1,x2,new_y2)
                    text_page = page_data.get_textpage(clip=rect)
                    text = text_page.extractRAWDICT()
                    
                    if len(text['blocks']) > 1:
                        print("WE have error during locate bounding box!!!!!!!!!!!!")
                    block_texts_data = ""
                    block_bb_data = []
                    for block in text['blocks']:
                        if 'lines' in block:
                            block_text, char_bounding_boxes = collect_text_n_bbox(block,page_data,page_number+1)
                            block_texts_data+=block_text
                            block_bb_data.extend(char_bounding_boxes)
                    assert len(block_texts_data) == len(block_bb_data), "Mismatch between text and bounding boxes"
                    if len(block_bb_data) == 0 :
                        print(rect)
                        print(text)
                        continue
                    bounding_box = merge_bounding_boxes(block_bb_data)
                for_print_page_data.append(text)
                if len(block_bb_data) != 0:
                    para["text"] = block_texts_data
                    para["bbox"] = block_bb_data
                    para["bounding_box"] = [merge_bounding_boxes(para["bbox"])]
                else:
                    para["text"] = "@"
                    x1,y1,x2,y2 = para['rect']
                    para["type"] = "discarded"
                    para["bbox"] = [
                                    {
                                        "x1": x1,
                                        "y1": y1,
                                        "x2": x2,
                                        "y2": y2,
                                        "width": para["width"],
                                        "height": para["height"],
                                        "pageNumber": para["page_number"][0]
                                    }
                                ]
                    para["bounding_box"] = [merge_bounding_boxes(para["bbox"])]
            assert len(para.get("text","")) == len(para.get("bbox",[])), "Mismatch between text and bounding boxes"    
        with open("test_middle_output/page_data_{}.json".format(page_number),'w',encoding='utf-8') as f:
            json.dump(for_print_page_data,f)
    return para_data

def get_bbox_n_text_seperated(para_data):
    block_texts_data = []
    block_bb_data = []
    for para in para_data:
        block_texts_data.append(para["text"])
        block_bb_data.append(para["bbox"])
    return block_texts_data, block_bb_data

def check_if_mergable(text_para_data, para_data):
    # print()
    merge_list = []
    for index,para_tuple in enumerate(text_para_data):
        para_index, para = para_tuple
        if index>=len(text_para_data)-1:
            continue
        if check_break_at_end(para) == False and check_break_at_head(text_para_data[index+1][1])==False and check_same_width_para(para,text_para_data[index+1][1]):
            # if is_same_type_para_by_length(para, text_para_data[index+1][1]):
            if para_index+1 <len(para_data) and para_data[para_index+1]["type"] == "text":
                merge_list.append([para_index,text_para_data[index+1][0]])
    return merge_list

def check_same_width_para(para1, para2):
    width1=abs(para1["bounding_box"][0]["x1"] - para1["bounding_box"][0]["x2"])
    width2=abs(para2["bounding_box"][0]["x1"] - para2["bounding_box"][0]["x2"])
    if abs(width1-width2) < 3:
        return True
    return False

def merge_para_data(para_data, merge_list):
    # Sort merge_list by tail descending, so popping won't affect earlier indices
    merge_list_sorted = sorted(merge_list, key=lambda x: x[1], reverse=True)
    
    for head, tail in merge_list_sorted:
        # Check data consistency
        assert len(para_data[head]["text"]) == len(para_data[head]["bbox"]), \
            f"Mismatch before merge at head {head}: len text {len(para_data[head]['text'])}, len bbox {len(para_data[head]['bbox'])}"
        assert len(para_data[tail]["text"]) == len(para_data[tail]["bbox"]), \
            f"Mismatch before merge at tail {tail}: len text {len(para_data[tail]['text'])}, len bbox {len(para_data[tail]['bbox'])}"
    
        para_data[head]["bbox"].append(para_data[head]["bbox"][-1])
        para_data[head]["bbox"].extend(para_data[tail]["bbox"])
        para_data[head]["text"]+=" "
        para_data[head]["text"]+=para_data[tail]["text"]
        para_data[head]["bounding_box"].extend(para_data[tail]["bounding_box"])
        para_data[head]["page_number"].extend(para_data[tail]["page_number"])
        # Validate after merge
        assert len(para_data[head]["text"]) == len(para_data[head]["bbox"]), \
            f"Mismatch after merge at head {head}: len text {len(para_data[head]['text'])}, len bbox {len(para_data[head]['bbox'])}"
        
        # Remove the merged element at tail index
        para_data.pop(tail)
    return para_data


def merge_broken_paragraph(para_data):
    text_para_data = []
    for index, para in enumerate(para_data):
        if para["type"]=="text":
            text_para_data.append((index,para))
        print("index: {} , type: {}".format(index, para["type"]))
        # print(para["bounding_box"][0]["x2"]-para["bounding_box"][0]["x1"])
    merge_list = check_if_mergable(text_para_data,para_data)
    para_data = merge_para_data(para_data, merge_list)
    for index, para in enumerate(para_data):
        print("index: {} , type: {}".format(index, para["type"]))
    return para_data

def processing_pdf_using_mineru_and_pymupdf(file_path):
    mineru_json_content = parse_layout_with_mineru(file_path)
    # # print(type(mineru_json_content))
    mineru_json = json.loads(mineru_json_content)
    para_data = extract_mineru_result(mineru_json)
    para_data = extract_text_n_bbox_using_pymupdf_from_mineru_result(file_path, para_data)
    para_data = merge_broken_paragraph(para_data)
    block_texts_data, block_bb_data = get_bbox_n_text_seperated(para_data)
    return block_texts_data, block_bb_data, para_data


def process_doc(file_path):
    
    from NER.main_predict import inference, load_ner_model
    from RE.main_predict import predict_re, load_re_model
    ner_model, ner_logger, ner_config = load_ner_model(new_model=False)
    re_tokenizer, re_base_model, re_config, re_args = load_re_model(new_model=False)


    all_pages_text_data, all_pages_bb_data, para_data = processing_pdf_using_mineru_and_pymupdf(file_path)

    with open("test_middle_output/raw_para_data.json", 'w',encoding='utf-8') as f:
        json.dump(para_data,f)
    
    ner_model_output = inference(ner_model, ner_logger,ner_config,convert_to_NER_model_input_format(all_pages_text_data))
    re_model_input = convert_to_RE_model_input_format(ner_model_output)
    model_output = predict_re(re_args, re_tokenizer, re_base_model,re_config, re_model_input, ner_model_output)  

    output, normalized_bb, normalized_text = convert_to_output_v2(model_output, all_pages_bb_data, all_pages_text_data, para_data=para_data)
    
    para_data = update_bbox_n_text_after_normalize(para_data,normalized_text,normalized_bb)
    
    with open("test_middle_output/relation_output.json", 'w',encoding='utf-8') as f:
        json.dump(model_output,f)
    with open("test_middle_output/para_data.json", 'w',encoding='utf-8') as f:
        json.dump(para_data,f)
    with open("test_middle_output/final_output.json", 'w',encoding='utf-8') as f:
        json.dump(output,f)
    return output

def inject_into_final_output(brat_output, graphs):
    for section in brat_output["brat_format_output"]:
        section_graphs = {}
        for entity in section.get("entities", []):
            entity_id = entity[0]
            if entity_id in graphs:
                section_graphs[entity_id] = graphs[entity_id]
        section["graphs"] = section_graphs
    return brat_output
import re
def parse_id(combined_id):

    match = re.match(r"^para(\d+)_(\S+)$", combined_id)
    para_id = int(match.group(1))
    entity_id = match.group(2)
    return para_id, entity_id

def cast_dict_to_rect(rect_dict):
    x1 = rect_dict.get("x1",0)
    x2 = rect_dict.get("x2",0)
    y1 = rect_dict.get("y1",0)
    y2 = rect_dict.get("y2",0)
    rect = pymupdf.Rect(x1,y1,x2,y2)
    return rect

def hex_to_rgb(hex_color):
    """Convert hex color to RGB."""
    # Remove the '#' if it exists
    hex_color = hex_color.lstrip('#')
    
    # Convert the hex string to RGB using int with base 16
    r = int(hex_color[0:2], 16)
    g = int(hex_color[2:4], 16)
    b = int(hex_color[4:6], 16)
    
    return r, g, b
def rgb_to_color_format(r, g, b):
    """Convert RGB values to the format described in the documentation."""
    stroke_color = [r / 255.0, g / 255.0, b / 255.0]
    return stroke_color

def get_color_for_entity_type(entity_type):
    r, g, b = hex_to_rgb(color_map.get(entity_type,"#ffffff"))
    stroke_color = rgb_to_color_format(r, g, b)
    return stroke_color, stroke_color

def check_long_boudingrect(rect):
    return abs(rect.get("x2",0)-rect.get("x1",0)) < 10

def compose_relation(relations):
    simplied_rel = ["{} \n \t {} : {}".format(rel.get("type"),rel.get("arg_type"),rel.get("arg_text")) for rel in relations]
    return "\n".join(simplied_rel)

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
        # if char_list[0]["pageNumber"] != entity_rects[0].pageNumber:
        #     continue
        flattened_char_positions = [(idx, Rect(**char)) for idx, char in enumerate(char_list)]

        
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
        # print("scaled_entity_rects in decision func: ",scaled_entity_rects)
        # Compare each scaled entity rectangle with character positions
        for scaled_entity_rect in scaled_entity_rects:
            for idx, char_rect in flattened_char_positions:

                if check_character_inside_bounding_rect(scaled_entity_rect,char_rect):
                    # If scaled entity rect overlaps with character rect, add index to relative indices
                    relative_indices.append(idx)

        # Remove duplicates and sort the indices
        if relative_indices != []:
            found_para_id = para_id
            found_idx = sorted(list(set(relative_indices)))

    return found_para_id, found_idx
def check_character_inside_bounding_rect(scaled_entity_rect, char_rect):
    # if char_rect.y2>255 and char_rect.y2<270:
            # print(char_rect)
    if scaled_entity_rect.pageNumber == char_rect.pageNumber:
        if scaled_entity_rect.x1 - char_rect.x2 <= 2.75:
            if scaled_entity_rect.x2 - char_rect.x1 >= -2.75:
                if scaled_entity_rect.y1 <= char_rect.y2:
                    if scaled_entity_rect.y2 >= char_rect.y1: #case character lie totally inside the bounding box
                        # print(char_rect)
                        if abs(scaled_entity_rect.y1 - char_rect.y1) <3:
                            # print(char_rect)
                            if abs(scaled_entity_rect.y2 - char_rect.y2) <3:
                                return True
        # else:

    return False

trigger_pattern_tag = [
    'PROP_NAME'
]

from collections import defaultdict

# from collections import defaultdict

from collections import defaultdict

def wrap_prop_name_tags(obj):
    text = obj["text"]
    entities = obj["entities"]

    # 1. Collect and merge all PROP_NAME spans
    spans = []
    if len(entities) > 4:
        for _id, ent_type, positions, _txt in entities:
            if ent_type != "PROP_NAME":
                continue
            starts = [h for h, t in positions]
            ends   = [t for h, t in positions]
            spans.append((min(starts), max(ends)))
    else:
        for _id, ent_type, positions, _txt in entities:
            if ent_type != "PROP_NAME":
                continue
            starts = [h for h, t in positions]
            ends   = [t for h, t in positions]
            spans.append((min(starts), max(ends)))
    # 2. Remove spans fully contained within others
    spans.sort(key=lambda x: (x[0], -(x[1] - x[0])))
    merged = []
    for s in spans:
        if not any(s[0] >= m[0] and s[1] <= m[1] for m in merged):
            merged.append(s)

    # 3. Build gap‐based markers
    n = len(text)
    opens  = defaultdict(list)  # opens at gap i (before text[i])
    closes = defaultdict(list)  # closes at gap i (before text[i])
    for start, end in merged:
        opens[start].append("<PROP_NAME>")
        closes[end].append("</PROP_NAME>")

    # 4. Assemble result by walking gaps 0..n
    out = []
    for gap in range(n + 1):
        # first close any tags ending here
        for tag in closes[gap]:
            out.append(tag)
        # then open any tags starting here
        for tag in opens[gap]:
            out.append(tag)
        # then emit the character at this gap (if any)
        if gap < n:
            out.append(text[gap])

    return "".join(out)





async def upload_queue(file_path,file_name):
    db = next(get_db())

    current_doc = document_crud.create_document(
        db, TEST_USER_ID, [], file_path,  file_name, [], [], {}, [], []
    )
    info_obj = {
            "id": current_doc.id,
            "filename": current_doc.FileName,
            "upload_time": current_doc.UploadTime,
            "entities": 0,
            "relations": 0,
            "pages": 0,
            "status": "queued"
        }
    current_doc.set_infor(info_obj)
    current_doc = document_crud.update_document(db,current_doc.id,current_doc)
    # Enqueue the task
    task = process_pdf_task.apply_async(
        args=[file_path, TEST_USER_ID, current_doc.id]
    )

    task_result = AsyncResult(task.id, app=celery_app).get()
    db.refresh(current_doc)
    relations = current_doc.get_relations()
    # for index, para in enumerate(relations):
    #     if index > 10: 
    #         break
    # text_for_eae=wrap_entities_with_tags(para)
    # print("=="*100)
    # print("=="*100)
    # print(text_for_eae)
    # print("=="*100)
    # print("=="*100)
    db.close()
    return relations    

# def justify_event_format(event_list, para_infor):
#     event_dict = {}
#     event_dict["text"] = para_infor["text"]
#     for event in event_list:
#         event_info=event["event"]

#     return event_dict


import copy
import re

def add_char_positions(event_obj: dict, relation_obj: dict) -> dict:
    """
    For each trigger/argument in event_obj["events"], find its character span in relation_obj["text"]
    using a resilient whitespace‐and‐subword matching strategy, then update:
      - trigger["char_start"], trigger["char_end"]
      - trigger["text"] to the exact substring in relation_obj["text"]
      - same for each argument
    """
    text = relation_obj["text"]
    out = copy.deepcopy(event_obj)

    # Precompute whitespace‐stripped text + index map
    nospace, idx_map = [], []
    for i, ch in enumerate(text):
        if not ch.isspace():
            nospace.append(ch)
            idx_map.append(i)
    nospace = "".join(nospace)

    def find_span(phrase: str) -> tuple[int,int]:
        norm = phrase.strip()
        # 1) Flexible whitespace regex
        esc = re.escape(norm)
        pattern = esc.replace(r"\ ", r"\s+")
        m = re.search(pattern, text)
        if m:
            return m.start(), m.end()
        # 2) Collapsed‐spaces fallback
        collapsed = re.sub(r"\s+", "", norm)
        idx2 = nospace.find(collapsed)
        if idx2 != -1:
            start = idx_map[idx2]
            end   = idx_map[idx2 + len(collapsed) - 1] + 1
            return start, end
        # 3) Token‐by‐token
        tokens = re.split(r"\s+", norm)
        search_pos = 0
        for tok in tokens:
            i = text.find(tok, search_pos)
            if i < 0:
                print("text to find: ",text)
                print("subtoken to find: ",tok)
                raise ValueError(f"Cannot find subtoken {tok!r} of {phrase!r}")
            if tok is tokens[0]:
                start = i
            search_pos = i + len(tok)
        end = search_pos
        return start, end

    for ev in out["events"]:
        # Trigger
        s, e = find_span(ev["trigger"]["text"])
        ev["trigger"]["char_start"] = s
        ev["trigger"]["char_end"]   = e
        # Update trigger text to exact substring
        ev["trigger"]["text"] = text[s:e]

        # Arguments
        for arg in ev.get("arguments", []):
            s, e = find_span(arg["text"])
            arg["char_start"] = s
            arg["char_end"]   = e
            # Update argument text too
            arg["text"] = text[s:e]
    return out

def add_entitiy_tow_wrapper(wrapper, infor, para_id,new_id, new_head, new_tail):
    wrapper[para_id]["entities"].append([
        new_id,
        infor.comment,
        [[
            new_head,
            new_tail
        ]],
        infor.user_comment,
        wrapper[para_id]["text"][new_head:new_tail]
    ])
    return wrapper

def reformat_events(event_obj: dict, relation_obj: dict) -> tuple[dict, dict]:
    """
    1) Adds missing triggers into relation_obj["entities"] (as T#).
    2) Builds new_events_obj:
       - entities: [all triggers as ETx, then all arguments as ETx]
       - triggers: [T#, event_type, [span]]
       - events: [E#, T#, [[role, ETx], …]]
    3) Returns (new_events_obj, adjusted_relation_obj).
    """
    # 1) Deep-copy inputs
    rel = copy.deepcopy(relation_obj)
    ev_list = copy.deepcopy(event_obj)["events"]
    text = rel["text"]

    # helper to get next T# for triggers
    def next_T_id():
        nums = [int(m.group(1)) for ent in rel["entities"]
                         if (m := re.match(r"T(\d+)$", ent[0]))]
        return max(nums, default=0) + 1

    # ensure a trigger exists in rel["entities"], return its T#
    def find_or_add_trigger(span, snippet):
        for ent in rel["entities"]:
            if ent[1] == "PROP_NAME" and span in ent[2]:
                return ent[0]
        new_id = f"T{next_T_id()}"
        rel["entities"].append([new_id, "PROP_NAME", [span], "", snippet])
        return new_id

    # 2) First pass: collect
    flat_triggers   = []  # list of [T#, event_type, [span]]
    argument_entries = []  # list of (role, span, snippet) in order seen

    for ev in ev_list:
        # Trigger
        t0, t1 = ev["trigger"]["char_start"], ev["trigger"]["char_end"]
        tsp = [t0, t1]
        tsn = text[t0:t1]
        tid = find_or_add_trigger(tsp, tsn)
        flat_triggers.append([tid, ev["event_type"], [tsp]])

        # Arguments
        for arg in ev.get("arguments", []):
            a0, a1 = arg["char_start"], arg["char_end"]
            asp = [a0, a1]
            snip = text[a0:a1]
            key = (arg["role"], tuple(asp), snip)
            if key not in argument_entries:
                argument_entries.append(key)

    # 3) Assign ETx IDs
    et_map = {}
    new_entities = []
    idx = 1

    # 3a) Triggers first
    for tid, _, spans in flat_triggers:
        if tid not in et_map:
            et_map[tid] = tid
            # retrieve its entity record from rel
            for ent in rel["entities"]:
                if ent[0] == tid:
                    new_entities.append([
                        et_map[tid],      # new ETx
                        ent[1],           # PROP_NAME
                        [ent[2][0]],      # span
                        ent[3] if len(ent)>4 else "",           # comment
                        ent[-1]            # text
                    ])
                    break
            idx += 1

    # 3b) Then arguments
    for role, span, snip in argument_entries:
        # use span as a tuple for uniqueness
        key = (role, tuple(span), snip)
        if key not in et_map:
            new_ent = [
                "",
                role.upper(),
                [list(span)],
                "",
                snip
            ]
            id = next(
                (ent[0] for ent in rel.get("entities",[]) if (ent[1]==new_ent[1] and ent[2]==new_ent[2])),
                f"T{utils.decide_new_ent_number_on_1_paragraph(rel)}"
                )
            
            new_ent[0] = id
            et_map[key] = id
            rel.get("entities",[]).append(new_ent)
            new_entities.append(new_ent)
            idx += 1
            
    # 4) Build the final new_events_obj
    new_events_obj = {
        "text": text,
        "entities": new_entities,
        "triggers": flat_triggers,
        "events": []
    }

    for i, ev in enumerate(ev_list, start=1):
        # trigger ID stays T#
        t0, t1 = ev["trigger"]["char_start"], ev["trigger"]["char_end"]
        tid = find_or_add_trigger([t0, t1], text[t0:t1])
        # argument role→ETx
        role_pairs = []
        for arg in ev.get("arguments", []):
            key = (arg["role"], tuple([arg["char_start"], arg["char_end"]]), text[arg["char_start"]:arg["char_end"]])
            role_pairs.append([arg["role"], et_map[key]])
        new_events_obj["events"].append([f"E{i}", tid, role_pairs])

    # 5) adjusted_relation_obj: only updated by added triggers
    adjusted_relation = {**relation_obj, "entities": rel["entities"]}

    return new_events_obj, adjusted_relation


def add_event(entities_wrapper):
    for index, para in enumerate(entities_wrapper):
        text_for_eae=wrap_prop_name_tags(para)
        try:
            event_output = eae_predict(text_for_eae)
            
        except:
            print(traceback.format_exc())
            event_output = []
        if len(event_output) >0:
            new_events = add_char_positions(event_output[0], para)
            new_events_obj, new_para = reformat_events(new_events, para)
        else:
            new_events_obj = {
                "entities":[],
                "triggers":[],
                "events":[]
            }
            new_para = para
        new_para["events_info"] = new_events_obj
        entities_wrapper[index] = new_para
    
    return entities_wrapper

if __name__ =="__main__":
    file_path = 'uploads/yoonessi2011.pdf'
    filename = 'yoonessi2011.pdf'
    
    filename="polymers-16-02966.pdf"
    file_path = f'uploads/{filename}'
    doc_id=10631713
    # db = next(get_db())
    # current_doc = document_crud.get_document(db,doc_id)
    # relations = current_doc.get_relations()
    # relations = add_event(relations)

    import os, sys
    # BASE_DIR = os.getenv("ANNOTATOR_BASE", "/default/path/to/repo")
    # if BASE_DIR not in sys.path:
    #     sys.path.append(BASE_DIR)

    from annotators.polymer.annotator import PolymerAnnotator

    import importlib

    def load_annotator(module_name: str, class_name: str):
        """
        Dynamically import an annotator by module and class name.
        """
        module = importlib.import_module(module_name)
        return getattr(module, class_name)

    AnnotatorClass = load_annotator(
        module_name="annotators.polymer.annotator",
        class_name="PolymerAnnotator"
    )
    annotator = AnnotatorClass()
    ########################TEST SCPECIAL CHARACTER FROM EVENT EXTRACTION
                                # from PIL import Image
                                # from PIL import ImageFont
                                # from PIL import ImageDraw

                                # def draw_char(char: str, typeface: str, size: int) -> Image:
                                #     # font = ImageFont.truetype(f'{typeface}.ttf', size)
                                #     font = ImageFont.load_default()
                                #     img = Image.new('L', (size, size))
                                #     draw = ImageDraw.Draw(img)
                                #     draw.text((0, 0), char, 255, font=font)
                                #     return img

                                # import numpy as np

                                # def render(char: str, typeface='Helvetica', size=10) -> np.ndarray:
                                #     img = draw_char(char, typeface=typeface, size=size)
                                #     return np.asarray(img)

                                # def encode_char(char, typeface='Helvetica', size=10):
                                #     img = draw_char(char, typeface=typeface, size=size)
                                #     grayscale = np.asarray(img)
                                #     bitmap = (grayscale > 0).astype('uint8')
                                #     return ''.join(map(str, (bit for row in bitmap for bit in row)))

                                # print(encode_char('μ') == encode_char('µ'))

                                # import pandas as pd
                                # from tqdm import tqdm

                                # # Meta: I like walrus operators 🤟
                                # char_codes = pd.DataFrame(
                                #     {
                                #         'char': (char := chr(i)),
                                #         'code': (code := encode_char(char, size=20)),
                                #         'n_bits': sum(bit == '1' for bit in code)
                                #     }
                                #     for i in tqdm(range(0x10ffff))
                                # )

                                # groups = (
                                #     char_codes
                                #     .query('n_bits > 0')
                                #     .groupby('code')['char']
                                #     .apply(list)
                                # )
                                # homoglyph_groups = groups[(1 < groups.apply(len)) & (groups.apply(len) < 10_000)]
                                # from collections import defaultdict
                                # from itertools import permutations

                                # homoglyphs = defaultdict(set)
                                # for group in homoglyph_groups:
                                #     for a, b in permutations(group, 2):
                                #         homoglyphs[a].add(b)
                                # print(homoglyphs['μ'])

    # parse_layout_with_mineru(file_path)
    # file_path = 'uploads/39045.pdf'
    # file_path = 'uploads/d4py00623b.pdf'
    # file_path = 'uploads/namazi2011.pdf'
    # file_path="uploads/lisheng-tang-advanced-elasticity-and-biodegradability.pdf"
    # file_path="uploads/s13233-025-00400-y.pdf"
    # file_path="uploads/s13233-025-00416-4.pdf"
    # # # print(type(mineru_json_content))
    # mineru_json = json.loads(mineru_json_content)
    # # with open("test_middle_output/mineru_output.json",'w',encoding='utf-8') as f:
    # #     json.dump(mineru_json,f)
    # # mineru_json = read_json("test_middle_output/mineru_output.json")
    
    # block_texts_data, block_bb_data, para_data = processing_pdf_using_mineru_and_pymupdf(file_path, para_data)

    # with open("test_para_data.json",'w',encoding='utf-8') as f:
    #     json.dump(para_data,f)
    # with open("test_para_data.json",'r',encoding='utf-8') as f:
    #     para_data = json.load(f)
    # for para in para_data:
    #     print(para.keys())
    #     if "bbox" not in para:
    #         print(para["type"])
    #         print(para["index"])
    # para_data = merge_broken_paragraph(para_data)
    # output = process_doc(file_path)
    # with open("test_middle_output/raw_para_data.json", 'r',encoding='utf-8') as f:
    #     raw_para_data = json.load(f)
    # with open("test_middle_output/relation_output.json", 'r',encoding='utf-8') as f:
    #     relations_output = json.load(f)
    # with open("test_middle_output/final_output.json",'r',encoding='utf-8') as f:
    #     output = json.load(f)
    # with open("test_middle_output/para_data.json",'r',encoding='utf-8') as f:
    #     para_data = json.load(f)
    # print(relations_output[75])

    ##################### TEST WRONG POSITION
                                        # test_string="This versatile material not only improves the durability and efficiency of these products but also contributes to advances"
                                        # test_relation = list(filter(lambda e: test_string in e["text"], relations_output))
                                        # test_para_data = list(filter(lambda e: test_string in e["text"], para_data))
                                        # test_raw_para_data = list(filter(lambda e: test_string in e["text"], raw_para_data))
                                        # # test_relation = [relations_output[87]]
                                        # # test_para_data = [para_data[87]]
                                        # print(test_para_data[0]["text"])
                                        # sub_string="healing"
                                        # positions = [match.start() for match in re.finditer(sub_string, test_para_data[0]["text"])]
                                        # # raw_positions = [match.start() for match in re.finditer(sub_string, test_raw_para_data[0]["text"])]
                                        # # print(raw_positions)
                                        # print(positions)
                                        # # for pos in positions:
                                            
                                        # #     end_pos = pos+len(sub_string)-1
                                        # #     print(end_pos)
                                        # #     print(test_para_data[0]["bbox"][end_pos])
                                        # print("normalized text")
                                        # for i in range(1360,1372):
                                        #     print(test_para_data[0]["text"][i])
                                        #     print(test_para_data[0]["bbox"][i])
                                        # print("raw text")
                                        # # for i in range(1313,1327):
                                        # #     print(test_raw_para_data[0]["text"][i])
                                        # #     print(test_raw_para_data[0]["bbox"][i])
                                        # first_server_rect = para_data[0]["bbox"][0]
                                        
                                        # target_pos =    Rect(x1=287.0999755859375, y1=341.18328857421875, x2=303.83331298828125, y2=355.3499450683594, width=793.7013333333332, height=1054.4879999999998, pageNumber=3)
                                        # width_scale = first_server_rect["width"] / target_pos.width
                                        # height_scale = first_server_rect["height"] / target_pos.height
                                        # scaled_target_pos = Rect(
                                        #         x1=target_pos.x1 * width_scale,
                                        #         y1=target_pos.y1 * height_scale,
                                        #         x2=target_pos.x2 * width_scale,
                                        #         y2=target_pos.y2 * height_scale,
                                        #         width=793.7013333333332, height=1054.4879999999998, pageNumber=3
                                        #     )
                                        # print(scaled_target_pos)
                                        # all_pages_text_data, all_pages_bb_data = get_bbox_n_text_seperated(test_para_data)
                                        # output, normalized_bb, normalized_text = convert_to_output_v2(test_relation, all_pages_bb_data, all_pages_text_data, para_data=test_para_data)
                                        # print("=="*100)
                                        # # print(test_para_data)

    ######## TEST FOR LOCATE NEW ENTITY FOR CREATE ENTITY FUNCTION #########################
    
    
                                                            # entity_rects=[Rect(x1=103.68333435058594, y1=341.183349609375, x2=163.76666259765625, y2=355.3500213623047, width=793.7013333333332, height=1054.4879999999998, pageNumber=3)]
                                                            # page_number=entity_rects[0].pageNumber-1
                                                            # with open("test_middle_output/para_data.json",'r',encoding='utf-8') as f:
                                                            #     old_para_data = json.load(f)
                                                            # first_server_rect = old_para_data[0]["bbox"][0]
                                                            # width_scale = first_server_rect["width"] / entity_rects[0].width
                                                            # height_scale = first_server_rect["height"] / entity_rects[0].height

                                                                

                                                            # scaled_entity_rects = [
                                                            #     pymupdf.Rect(
                                                            #         rect.x1 * width_scale,
                                                            #         rect.y1 * height_scale,
                                                            #         rect.x2 * width_scale,
                                                            #         rect.y2 * height_scale,
                                                            #     )
                                                            #     for rect in entity_rects
                                                            # ]
                                                            
                                                            # rect = scaled_entity_rects[0]
                                                            # print("scaled_entity_rects ",rect)
                                                            # document = fitz.open(file_path)
                                                            # page_data = document.load_page(page_number)
                                                            # text_page = page_data.get_textpage(rect)
                                                            
                                                            # text = text_page.extractRAWDICT()
                                                            # block_texts_data = ""
                                                            # block_bb_data = []
                                                            # for block in text['blocks']:
                                                            #     if 'lines' in block:
                                                            #         block_text, char_bounding_boxes = collect_text_n_bbox(block,page_data,page_number)
                                                            #         block_texts_data+=block_text.strip()
                                                            #         block_bb_data.extend(char_bounding_boxes)
                                                            # bounding_box = merge_bounding_boxes(block_bb_data)
                                                            # print(bounding_box)
                                                            # print(block_texts_data)

                                                            # entity= CreateEntitySchema(comment='ORGANIC', 
                                                            #                            para_id=0, 
                                                            #                            position=Position(
                                                            #                                                 rects=[Rect(x1=103.68333435058594, y1=341.183349609375, x2=163.76666259765625, y2=355.3500213623047, width=793.7013333333332, height=1054.4879999999998, pageNumber=3)], 
                                                            #                                                 boundingRect=Rect(x1=103.68333435058594, y1=341.183349609375, x2=163.76666259765625, y2=355.3500213623047, width=793.7013333333332, height=1054.4879999999998, pageNumber=3)
                                                            #                                             ), 
                                                            #                             document_id=80891565, 
                                                            #                             update_id=50653770, 
                                                            #                             scale_value=1.0
                                                            #                             )
                                                            # old_text, old_pos = get_bbox_n_text_seperated(old_para_data)
                                                            # found_para_id, found_idx = decide_new_pos(entity,old_pos)
                                                            # print("scaled_entity_rects ",rect)
                                                            # print("C pos ",old_pos[found_para_id][1328])
                                                            # print(found_para_id)
                                                            # print(found_idx)
                                                            # new_head = found_idx[0]
                                                            # new_tail = found_idx[-1]
                                                            # found_text=old_text[found_para_id][new_head:new_tail]
                                                            # print(found_text)

    

    # print(output)
    # print(relations_output.index(list(test_relation)[0]))
    # print()
    # pdf_format_output = output.get("pdf_format_output",[])
    # doc = pymupdf.open(file_path)
    
    # for annotator in pdf_format_output:
    #     # para_id, entity_id = parse_id(annotator.get("id",""))
    #     entity_id = annotator.get("id","")

    #     rects_list = annotator.get("position",{}).get("rects",[])
    #     entity_type= annotator.get("comment")
    #     content = annotator.get("content",{}).get("text","")
    #     relations = compose_relation(annotator.get("relations",[]))
    #     boundingRect = annotator.get("position",{}).get("boundingRect")
    #     breakable = False
    #     for rect in rects_list:
    #         if len(rects_list) >= 5 and check_long_boudingrect(boundingRect):
    #             rect = boundingRect
    #             breakable = True
    #         stroke_color, fill_color = get_color_for_entity_type(entity_type)
    #         pageNumber = rect.get("pageNumber",1) - 1
    #         page = doc[pageNumber]
    #         highlight = page.add_rect_annot(cast_dict_to_rect(rect))
            
    #         highlight.set_info(info={"content": f"Entity {entity_id}\nContent: '{content}' \nType: {entity_type} \n\n {relations}" })
    #         highlight.set_colors(stroke=stroke_color, fill=fill_color)
    #         highlight.set_opacity(0.6)
    #         highlight.update()
    #         if breakable:
    #             break
    #         # print(highlight)
    # # # with open("test_middle_output/all_graphs.json",'w',encoding='utf-8') as f:
    # # #     json.dump(all_graphs,f)
    # doc.save("test_middle_output/output_highlighted.pdf")
    # doc.close()
    # # brat_output = inject_into_final_output(final_output,all_graphs)
    # with open("test_middle_output/final_brat_output.json", 'w',encoding='utf-8') as f:
    #     json.dump(final_output,f)
# import pymupdf
# import fitz

# file_path = "/home/antrieu/drive/RIKEN/uploads/yoonessi2011.pdf"
    
    # rect = pymupdf.Rect(42,
    #                     525,
    #                     294,
    #                     597)
    # text_page = page_data.get_textpage(rect)
    # text = text_page.extractRAWDICT()
    # block_texts_data = ""
    # block_bb_data = []
    # for block in text['blocks']:
    #     if 'lines' in block:
    #         block_text, char_bounding_boxes = collect_text_n_bbox(block,page_data,6)
    #         block_texts_data+=block_text.strip()
    #         block_bb_data.extend(char_bounding_boxes)
    # bounding_box = merge_bounding_boxes(block_bb_data)
    # print(bounding_box)
    # print(block_texts_data)

    # TEST EVENT EXTRACTION
    # 

                                                                                # relations = asyncio.run(upload_queue(file_path, filename))
                                                                                # # with open("test_middle_output/final_output.json",'r',encoding='utf-8') as f:
                                                                                # #         output = json.load(f)
                                                                                # start = datetime.now()
                                                                                # ee_inputs = []
                                                                                # for index, para in enumerate(relations):
                                                                                #     # if index > 10: 
                                                                                #     #     break
                                                                                #     text_for_eae=wrap_prop_name_tags(para)
                                                                                    
                                                                                    
                                                                                #     try:
                                                                                #         output = eae_predict(text_for_eae)
                                                                                        
                                                                                #     except:
                                                                                #         print(traceback.format_exc())
                                                                                #         output = []
                                                                                #     print("=="*100)
                                                                                #     print("=="*100)
                                                                                #     print(para)
                                                                                #     print("=="*100)
                                                                                #     print("=="*100)
                                                                                #     print(text_for_eae)
                                                                                #     print("=="*100)
                                                                                #     print("=="*100)
                                                                                #     print(output)
                                                                                #     print("=="*100)
                                                                                #     print("=="*100)
                                                                                #     if len(output) >0:
                                                                                #         # new = build_event_structure_with_original_triggers(para, output[0])
                                                                                #         new_events = add_char_positions(output[0], para)
                                                                                        
                                                                                #         print(new_events)
                                                                                #         for event in new_events["events"]:
                                                                                #             arguments = event["arguments"]
                                                                                #             for arg in arguments:
                                                                                #                 print("**"*100)
                                                                                #                 print("**"*100)
                                                                                #                 print(arg["text"])
                                                                                #                 print(para["text"][arg["char_start"]:arg["char_end"]])
                                                                                #                 print("**"*100)
                                                                                #                 print("**"*100)
                                                                                #         new_events_obj, para = reformat_events(new_events, para)
                                                                                #         print("++"*100)
                                                                                #         print(para)
                                                                                #         print("++"*100)
                                                                                #         print(new_events_obj)
                                                                                #         print("++"*100)
                                                                                # end = datetime.now()
                                                                                # dist = end-start 
                                                                                # print(dist.seconds)

    # data = forward_text()
    # asyncio.run(main())