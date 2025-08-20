from sqlalchemy.orm import Session
import unittest

import sys
sys.path.append("/home/antrieu/RIKEN/")




# from schemas import document as document_schemas
from schemas.document import UpdateEventSchema, Event
from database import get_dev_db as get_db
from models.psql import user as user_model
from crud.psql import document as document_crud
from crud.psql import user as user_crud
from utils.utils import get_cur_relations_entities, compose_update_event_content
from utils import utils


def edit_event(update_info: UpdateEventSchema, db:Session, current_user: user_model.User):
    """
    This function is used to edit the event of the document.
    Input:
        update_infor: document_schemas.UpdateEventSchema
            document_id: int
            update_id: int
            para_id: int
            event: {
                event_id: str
                trigger_id: str
                arguments: List[List[str]]
            }
    Output:
        Same output as /get-document/{document_id}
    """
    document = document_crud.get_document(db,update_info.document_id)
    update = document_crud.get_last_update(db,update_info.document_id,current_user.id)
    user_notes = update.get_user_notes()
    para_data = document.get_paragraphs()
    if type(para_data[0]) == str:
        paragraphs,bbox, _ ,_= utils.execute_user_note_on_paragraphs(user_notes,document.get_paragraphs(),document.get_positions())
    else:
        paragraphs,bbox = utils.get_bbox_n_text_seperated(para_data)
        paragraphs,bbox, _ , para_data  = utils.execute_user_note_on_paragraphs(user_notes,paragraphs,bbox,para_data=para_data)
    
    cur_entities, cur_relations = get_cur_relations_entities(document,update,user_notes)
    for index, event in enumerate(cur_relations[update_info.para_id].get("events_info",{}).get("events",[])):
        event_id, trigger_id, arguments = event
        if event_id == update_info.event.event_id:
            cur_relations[update_info.para_id].get("events_info",{}).get("events",[])[index][2] = update_info.event.arguments
            cur_relations[update_info.para_id].get("events_info",{}).get("events",[])[index][1] = update_info.event.trigger_id
                
    
    old_event = next((event for event in cur_relations[update_info.para_id].get("events_info").get("events") if event[0]==update_info.event.event_id),[])
    update_content = compose_update_event_content(update_info, old_event)
    action = {
            "action":"update",
            "target":"event",
            "content":  update_content
        }
    user_notes.append(action)
    return cur_relations, user_notes

class TestEditEvent(unittest.TestCase):
    # original event {
        #     "document_id":48032864,
        #     "update_id":19858594,
        #     "para_id":7,
        #     "event":{
        #             "event_id": "E1",
        #             "trigger_id": "T1",
        #             "arguments":
        #             [
        #                 [
        #                         "Polymer",
        #                         "ET9"
        #                 ],
        #                 [
        #                         "Value",
        #                         "ET10"
        #                 ]
        #             ] 
        #     }
        # }
    
    def test_change_argument_1(self):
        
        db = next(get_db())
        current_user = user_crud.get_user_by_username(db,"an")
        update_event = Event(
            event_id="E1",
            trigger_id="T1",
            arguments=[
                        [
                            "Condition",
                            "ET18"
                        ],
                        [
                            "Value",
                            "ET10"
                        ]
                    ]
        )
        update_info = UpdateEventSchema(
            document_id=48032864,
            update_id=19858594,
            para_id=7,
            event=update_event
        )
        cur_relations, user_notes = edit_event(update_info,db,current_user)
        result_event_arg1 = next(event[2][0] for event in cur_relations[update_info.para_id]["events_info"]["events"] if event[0]==update_event.event_id)
        self.assertListEqual(result_event_arg1, update_event.arguments[0])
    
    def test_change_argument_2(self):
        
        db = next(get_db())
        current_user = user_crud.get_user_by_username(db,"an")
        update_event = Event(
            event_id="E1",
            trigger_id="T1",
            arguments=[
                        [
                            "Condition",
                            "ET18"
                        ],
                        [
                            "Value",
                            "ET17"
                        ]
                    ]
        )
        update_info = UpdateEventSchema(
            document_id=48032864,
            update_id=19858594,
            para_id=7,
            event=update_event
        )
        cur_relations, user_notes = edit_event(update_info,db,current_user)
        result_event_arg1 = next(event[2][1] for event in cur_relations[update_info.para_id]["events_info"]["events"] if event[0]==update_event.event_id)
        self.assertListEqual(result_event_arg1, update_event.arguments[1])

    def test_change_trigger_id(self):
        
        db = next(get_db())
        current_user = user_crud.get_user_by_username(db,"an")
        update_event = Event(
            event_id="E1",
            trigger_id="T15",
            arguments=[
                        [
                            "Condition",
                            "ET18"
                        ],
                        [
                            "Value",
                            "ET17"
                        ]
                    ]
        )
        update_info = UpdateEventSchema(
            document_id=48032864,
            update_id=19858594,
            para_id=7,
            event=update_event
        )
        cur_relations, user_notes = edit_event(update_info,db,current_user)
        result_trigger_id = next(event[1] for event in cur_relations[update_info.para_id]["events_info"]["events"] if event[0]==update_event.event_id)
        self.assertSequenceEqual(result_trigger_id, update_event.trigger_id)

    def test_usernote(self):
        
        db = next(get_db())
        current_user = user_crud.get_user_by_username(db,"an")
        update_event = Event(
            event_id="E1",
            trigger_id="T15",
            arguments=[
                        [
                            "Condition",
                            "ET18"
                        ],
                        [
                            "Value",
                            "ET17"
                        ]
                    ]
        )
        update_info = UpdateEventSchema(
            document_id=48032864,
            update_id=19858594,
            para_id=7,
            event=update_event
        )
        cur_relations, user_notes = edit_event(update_info,db,current_user)
        last_note = user_notes[-1]
        self.assertSequenceEqual(last_note["target"], "event")

if __name__ == "__main__":
    unittest.main()
    
