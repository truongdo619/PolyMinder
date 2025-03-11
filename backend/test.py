from pdf_processing import process_pdf_to_text, convert_pdf_to_text_and_bounding_boxes




# check_text("Transport properties")
# check_text("x-ray scattering",mode=0)
# check_text("angle neutron")
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
def check_sample(sample, box_sample):
    print(sample)
    print(box_sample[0])
    print(box_sample[-1])
    print(len(sample))
    print(len(box_sample))
    # for box in box_sample:
    #     print(box)
    # print(len(sample))
    # print(len(box_sample))
if __name__ =="__main__":
    # file_path = 'uploads/yoonessi2011.pdf'
    # file_path = 'uploads/39045.pdf'
    file_path = 'uploads/namazi2011.pdf'
    all_pages_text_data, all_pages_bb_data = convert_pdf_to_text_and_bounding_boxes(file_path)
    sample_id = 96
    sample = all_pages_text_data[sample_id]
    box_sample = all_pages_bb_data[sample_id]
    check_sample(sample, box_sample)
    print("now the second sample")
    second_sample_id = 89
    second_sample = all_pages_text_data[second_sample_id]
    second_box_sample = all_pages_bb_data[second_sample_id]
    check_sample(second_sample, second_box_sample)
    # container, rect_container = check_if_there  _is_break(sample,box_sample)
    # for text, box in list(zip(container,rect_container)):
    #     print(text)
    #     for pos in box:
    #         print(pos)
    # print(len(container))
    # print(sample)




    # print("start")
    # print(len(all_pages_text_data))
    # print(len(all_pages_bb_data))
    # all_pages_text_data, all_pages_bb_data = divide_paragraphs(all_pages_text_data, all_pages_bb_data)
    # print(len(all_pages_text_data))
    # print(len(all_pages_bb_data))