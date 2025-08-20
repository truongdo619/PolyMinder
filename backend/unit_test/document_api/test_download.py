from sqlalchemy.orm import Session
import unittest
import copy

import sys
sys.path.append("/home/antrieu/RIKEN/")


# from schemas import document as document_schemas
from schemas.document import DownloadDocumentSchema, Filtering
from database import get_dev_db as get_db
from models.psql import user as user_model
from crud.psql import document as document_crud
from crud.psql import user as user_crud
from utils.utils import get_cur_relations_entities, compose_update_event_content
from utils import utils
from ner_re_processing import convert_to_output_v2

def download_editted(info, current_user, db):
    document = document_crud.get_document(db,info.document_id)
    # TODO: Need to check what update should be picked here
    update = document_crud.get_last_update(db,info.document_id,current_user.id)
    user_notes = update.get_user_notes()
    
    cur_entities, cur_relations = get_cur_relations_entities(document,update,user_notes)

    edit_status_list = user_notes[0]["content"]
    result= []
    for cur_para_entities, cur_para_relations, para_edit_status in zip(cur_entities, cur_relations, edit_status_list):
        if not para_edit_status.get("entities"): continue
        tmp = dict()

        for status in para_edit_status["entities"]:
            if status["status"] != "none":
                tmp.update(cur_para_entities)
                break
        
        editted_entities_ids = {status["id"] for status in para_edit_status["entities"] if status["status"] != "none"}
        tmp["entities"] = list(filter(lambda e: e[0] in editted_entities_ids, cur_para_entities["entities"]))    

        editted_relations_ids = {status["id"] for status in para_edit_status["relations"] if status["status"] != "none"}
        tmp["relations"] = list(filter(lambda r: r[0] in editted_relations_ids, cur_para_relations.get("relations",[])))
        result.append(tmp)
    return result

def download_filter(info, current_user, db):
    document = document_crud.get_document(db,info.document_id)
    update = document_crud.get_last_update(db,info.document_id,current_user.id)
    print(info)
    user_notes = update.get_user_notes()
    ori_rel = document.get_relations()

    cur_rel = utils.execute_user_note_on_relations(user_notes,ori_rel)
    ent_result = utils.filter_entities(cur_rel,info.filtering_entity_types)
    rel_result = utils.filter_relations(cur_rel, info.filtering_relation_types)
    result = utils.merge_filtered_entities(ent_result, rel_result)
    return result

def download_entity_type(info, current_user, db):
    update = document_crud.get_last_update(db,info.document_id,current_user.id)
    cur_entities = update.get_entities()

    result = cur_entities
    for para in result:
        para["relations"] = []
        para["entities"] = [ent for ent in para["entities"] if ent[1] == info.type]
    return result

def download_default(info, current_user, db):
    document = document_crud.get_document(db,info.document_id)
    update = document_crud.get_last_update(db,info.document_id,current_user.id)
    user_notes = update.get_user_notes()
    
    cur_entities = document.get_entities()
    cur_entities = utils.execute_user_note_on_entities(user_notes,cur_entities)
    cur_relations = document.get_relations()
    cur_relations = utils.execute_user_note_on_relations(user_notes,cur_relations)
    
    visible_list = utils.collect_visible_list(user_notes)
    result = utils.filter_with_visible_list(cur_relations,visible_list)

    return result


download_handlers={
    "all": download_default,
    "confirmed": download_editted,
    "filter": download_filter,
    "entity_type": download_entity_type
}

def download_highlighted_document(info,current_user,db):

    last_update = document_crud.get_current_temporary_update(db, current_user.id, info.update_id, info.document_id)
    document = document_crud.get_document(db, info.document_id)
    
    user_notes = last_update.get_user_notes()
    para_data = document.get_paragraphs()
    if type(para_data[0]) == str:
        paragraphs,bbox, _,_ = utils.execute_user_note_on_paragraphs(user_notes,document.get_paragraphs(),document.get_positions())
    else:
        paragraphs,bbox = utils.get_bbox_n_text_seperated(para_data)
        paragraphs,bbox, _ , para_data  = utils.execute_user_note_on_paragraphs(user_notes,paragraphs,bbox,para_data=para_data)
    handler = download_handlers.get(info.mode, download_default)
    relations = handler(info, current_user, db )

    cur_entities, cur_relations = get_cur_relations_entities(document,last_update,user_notes)
    print("original len of filtered relations", len(relations))
    print("original len of filtered relations", len(cur_relations))
    relations = utils.convert_output_to_full_pdf_creating(relations,cur_relations)
    print("len of converted relations", len(relations))
    # print(bbox[96][-1])
    # if type(para_data[0]) == str:
    #     output, _, _ = convert_to_output_v2(relations, bbox, paragraphs,full_data_mode=False)
    # else:
    #     output, _, _ = convert_to_output_v2(relations, bbox, paragraphs,para_data=para_data,full_data_mode=False)

    return relations, cur_relations
    # hightlighted_filename = "highlighted_"+document.FileName
    # output_file_path = os.path.join(HIGHLIGHTED_DOCUMENT_FOLDER_PATH)
    # utils.create_highlighted_pdf_file(document.FilePath,output,output_file_path)
    # return FileResponse(output_file_path, filename=hightlighted_filename)


def convert_output_to_full_pdf_creating(output, original_wrapper):
    """
    This function is used to insert the blank paragraphs to the filtered relations and entities.
    """
    if len(output)==len(original_wrapper):
        return output

    new_output = []
    for para in original_wrapper:
        keep_text_only=True
        for output_para in output:
            if para["text"]==output_para["text"]:
                new_output.append(copy.deepcopy(output_para))
                keep_text_only=False
        if keep_text_only:
            new_para = copy.deepcopy(para)
            new_para["entities"]=[]
            new_para["relations"]=[]
            new_para["events_info"]={
                "events":[],
                "entities":[],
                "triggers":[]
            }
            new_output.append(new_para)
    return new_output

class Test_download_with_default_setting(unittest.TestCase):
    def test_convert_output_to_full_pdf_creating_function(self):
        db = next(get_db())
        current_user = user_crud.get_user_by_username(db,"an")
        info= DownloadDocumentSchema(
            document_id= 37341707,
            update_id= 44349079,
            para_id=7,
            mode="all",
        )
        last_update = document_crud.get_current_temporary_update(db, current_user.id, info.update_id, info.document_id)
        document = document_crud.get_document(db, info.document_id)
        
        user_notes = last_update.get_user_notes()
        handler = download_handlers.get(info.mode, download_default)
        
        cur_entities, cur_relations = get_cur_relations_entities(document,last_update,user_notes)
        relations = handler(info, current_user, db )
        new_relations = convert_output_to_full_pdf_creating(relations,cur_relations)
        self.assertEqual(len(cur_relations),len(new_relations))

class Test_download_with_confirmed_setting(unittest.TestCase):
    def Test_convert_output_to_full_pdf_creating_function(self):
        db = next(get_db())
        current_user = user_crud.get_user_by_username(db,"an")
        info= DownloadDocumentSchema(
            document_id= 37341707,
            update_id= 44349079,
            para_id=7,
            mode="confirmed",
        )
        last_update = document_crud.get_current_temporary_update(db, current_user.id, info.update_id, info.document_id)
        document = document_crud.get_document(db, info.document_id)
        
        user_notes = last_update.get_user_notes()
        handler = download_handlers.get(info.mode, download_default)
        
        cur_entities, cur_relations = get_cur_relations_entities(document,last_update,user_notes)
        relations = handler(info, current_user, db )
        new_relations = convert_output_to_full_pdf_creating(relations,cur_relations)
        self.assertEqual(len(cur_relations),len(new_relations))

class Test_download_with_filter_setting(unittest.TestCase):
    def testcase1(self):
        db = next(get_db())
        current_user = user_crud.get_user_by_username(db,"an")
        info= DownloadDocumentSchema(
            document_id= 37341707,
            update_id= 44349079,
            para_id=7,
            mode="filter",
            filtering_entity_types=[
               Filtering(
                   type="POLYMER",
                   sub_type=[
                        "has_property",
                        "has_value",
                        "has_amount",
                        "has_condition",
                        "abbreviation_of",
                        "refers_to",
                        "synthesised_by",
                        "characterized_by",
                        "None"
                   ]
               ) ,
               Filtering(
                   type="CONDITION",
                   sub_type=[
                        "has_property",
                        "has_value",
                        "has_amount",
                        "has_condition",
                        "abbreviation_of",
                        "refers_to",
                        "synthesised_by",
                        "characterized_by",
                        "None"
                   ]
               ) 
            ],
            filtering_relation_types=[]
        )
        last_update = document_crud.get_current_temporary_update(db, current_user.id, info.update_id, info.document_id)
        document = document_crud.get_document(db, info.document_id)
        
        user_notes = last_update.get_user_notes()
        handler = download_handlers.get(info.mode, download_default)
        
        cur_entities, cur_relations = get_cur_relations_entities(document,last_update,user_notes)
        relations = handler(info, current_user, db)
        new_relations = convert_output_to_full_pdf_creating(relations,cur_relations)
        num_differ_ent=0
        filtered_ent_type=[filter_opt.type for filter_opt in info.filtering_entity_types]
        for para in relations:
            for ent in para["entities"]:
                if ent[1] not in filtered_ent_type:
                    num_differ_ent+=1
        self.assertEqual(num_differ_ent,0)

class Test_convert_output_to_full_pdf_creating_function_with_entity_type_setting(unittest.TestCase):
    def testcase1(self):
        db = next(get_db())
        current_user = user_crud.get_user_by_username(db,"an")
        info= DownloadDocumentSchema(
            document_id= 37341707,
            update_id= 44349079,
            para_id=7,
            mode="entity_type",
            type="CONDITION"
        )
        last_update = document_crud.get_current_temporary_update(db, current_user.id, info.update_id, info.document_id)
        document = document_crud.get_document(db, info.document_id)
        
        user_notes = last_update.get_user_notes()
        handler = download_handlers.get(info.mode, download_default)
        
        cur_entities, cur_relations = get_cur_relations_entities(document,last_update,user_notes)
        relations = handler(info, current_user, db )
        new_relations = convert_output_to_full_pdf_creating(relations,cur_relations)
        self.assertEqual(len(cur_relations),len(new_relations))

if __name__ == "__main__":
    unittest.main()
    
