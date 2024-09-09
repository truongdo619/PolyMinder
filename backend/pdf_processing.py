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
                for line in block['lines']:
                    for span in line['spans']:
                        for char in span['chars']:
                            c = char['c']
                            bbox = char['bbox']
                            block_text += c
                            position = {
                                "x1": bbox[0],
                                "y1": bbox[1],
                                "x2": bbox[2],
                                "y2": bbox[3],
                                "width": page.rect.width,
                                "height": page.rect.height,
                                "pageNumber": page_number
                            }
                            char_bounding_boxes.append(position)
                block_texts_data.append(block_text)
                block_bb_data.append(char_bounding_boxes)
        return block_texts_data, block_bb_data
    
    all_pages_text_data = []
    all_pages_bb_data = []
    for page_number in range(len(document)):
        page = document.load_page(page_number)
        block_texts_data, block_bb_data = extract_text_and_bounding_boxes(page, page_number+1)
        all_pages_text_data += block_texts_data
        all_pages_bb_data += block_bb_data
    return all_pages_text_data, all_pages_bb_data


def process_pdf_to_text(path, min_length=20):
    try:
        print("Processing PDF file using convert_pdf_to_text_v2 ...")
        return convert_pdf_to_text_v2(path, min_length)
    except Exception:
        print("Failed to process PDF file using convert_pdf_to_text_v2!")
        print("Processing PDF file using convert_pdf_to_txt_file_v1 ...")
        return convert_pdf_to_text_v1(path, min_length)
