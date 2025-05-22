
import os
import re

import time
import json

from typing import List
from datetime import timedelta, datetime

from fastapi import APIRouter, File, UploadFile, Request
from fastapi.responses import JSONResponse
from fastapi.responses import FileResponse
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm

from sqlalchemy.orm import Session
from crud.psql import user as user_crud
from crud.psql import document as document_crud
from models.psql import user as user_model
from models.psql import document as document_model
# from database import get_db
from database import get_dev_db as get_db
# from database import get_db as get_db
from config import UPLOAD_DIR
from jose import JWTError, jwt
from schemas import user  as user_schemas 
from schemas import document as document_schemas

from celery.result import AsyncResult
from celery_app import app as celery_app
# from tasks import process_pdf_task, re_run_re, re_run_for_changed_para, re_run

from dev_tasks import process_pdf_task, re_run_re, re_run_for_changed_para, re_run
from ner_re_processing import convert_to_NER_model_input_format, convert_to_RE_model_input_format, convert_to_output_v2
from utils import utils


oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")

HIGHLIGHTED_DOCUMENT_FOLDER_PATH="highlighted_documents"
DOCUMENTS_DIR="uploads"
log_folder = "dev_logs"
router = APIRouter()


def get_current_user(request: Request,db: Session = Depends(get_db), token: str = Depends(oauth2_scheme)):
    headers = request.headers
    print("Request Headers:", headers)
    
    try:
        payload = utils.decode_token(token, utils.SECRET_KEY)
        username: str = payload.get("sub")
        token_data = user_schemas.TokenData(username=username)
        user = db.query(user_model.User).filter(user_model.User.username == token_data.username).first()
        if user is None:
            raise ValueError("user is none")
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Need to refresh token",
            headers={"WWW-Authenticate": "Bearer"},
        ) from e 
    return user


@router.post("/register/")
@router.post("/register")
def register(user: user_schemas.UserCreate, db: Session = Depends(get_db)):
    db_user_existed = user_crud.get_user_by_username(db, user.username) is not None
    if db_user_existed:
        raise HTTPException(status_code=400, detail="Username already registered")
    
    # Check if email is already registered
    db_email_existed = user_crud.get_user_by_email(db, user.email) is not None
    if db_email_existed:
        raise HTTPException(status_code=400, detail="Email already registered")

    hashed_password = utils.get_password_hash(user.password)
    user.password = hashed_password
    new_user = user_crud.create_user(db, user)
    return new_user

@router.post("/login", response_model=user_schemas.TokenRefresh)  # Changed to /login
@router.post("/login/", response_model=user_schemas.TokenRefresh) 
def login_for_access_token(db: Session = Depends(get_db), form_data: OAuth2PasswordRequestForm = Depends()):
    # Try to find user by username first
    db_user = user_crud.get_user_by_username(db, form_data.username)
    print( form_data.username)
    print( form_data.password)
    # If not found by username, try to find by email
    if not db_user:
        db_user = user_crud.get_user_by_email(db, form_data.username)
    
    if not db_user or not utils.verify_password(form_data.password, db_user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username, email, or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    access_token_expires = timedelta(minutes=utils.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = utils.create_access_token(
        data={"sub": db_user.username}, expires_delta=access_token_expires
    )
    refresh_token_expires = timedelta(days=utils.REFRESH_TOKEN_EXPIRE_DAYS)
    refresh_token = utils.create_refresh_token(
        data={"sub": db_user.username}, expires_delta=refresh_token_expires
    )
    try:
        user_crud.create_token(db, access_token, datetime.utcnow() + access_token_expires, db_user)
        user_crud.create_refresh_token(db, refresh_token, datetime.utcnow() + refresh_token_expires, db_user)
    except Exception as E:
        print(E)
    return {"access_token": access_token, "refresh_token": refresh_token, "token_type": "bearer"}


@router.post("/refresh-token", response_model=user_schemas.Token)
def refresh_access_token(refresh_token: str, db: Session = Depends(get_db)):
    token_data = utils.decode_token(refresh_token, utils.REFRESH_SECRET_KEY)
    if not token_data:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate refresh token",
            headers={"WWW-Authenticate": "Bearer"},
        )

    db_refresh_token = user_crud.get_refresh_token(db, refresh_token)
    if not db_refresh_token or db_refresh_token.expires_at < datetime.utcnow():
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Refresh token expired or invalid",
            headers={"WWW-Authenticate": "Bearer"},
        )

    user = user_crud.get_user_by_username(db, token_data["sub"])
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found",
            headers={"WWW-Authenticate": "Bearer"},
        )

    access_token_expires = timedelta(minutes=utils.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = utils.create_access_token(
        data={"sub": user.username}, expires_delta=access_token_expires
    )
    return {"access_token": access_token, "token_type": "bearer"}

@router.get("/protected")
def protected_route(current_user: user_model.User = Depends(get_current_user)):
    return {"message": f"Hello, {current_user.username}! You are authenticated."}


def specific_data():
    return None

@router.post("/process-pdf-v3/")
async def process_pdf_v3(current_user: user_model.User = Depends(get_current_user),file: UploadFile = File(...),db: Session = Depends(get_db)):

    file_location = os.path.join(UPLOAD_DIR, file.filename)
    with open(file_location, "wb") as f:
        f.write(await file.read())

    # all_pages_text_data, all_pages_bb_data = convert_pdf_to_text_and_bounding_boxes(file_location)
    current_doc = document_crud.create_document(
        db, current_user.id, [], file_location,  file.filename, [], [], {}, [], []
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
        args=[file_location, current_user.id, current_doc.id]
    )
    print(info_obj)
    task_result = AsyncResult(task.id, app=celery_app).get()

    # while task_result.state == "PENDING":
    #     print("waiting for queue")
    #     time.sleep(1)
        
    db.refresh(current_doc)
    print("done")
    model_output = current_doc.get_relations()
    all_pages_bb_data = current_doc.get_positions()
    all_pages_text_data = current_doc.get_paragraphs()
    
    output, normalized_all_pages_bb_data, normalized_all_pages_text_data = convert_to_output_v2(model_output, all_pages_bb_data, all_pages_text_data)
    current_doc.set_positions(normalized_all_pages_bb_data)
    current_doc.set_paragraphs(normalized_all_pages_text_data)
    current_doc = document_crud.update_document(db,current_doc.id,current_doc)
    # current_doc = document_crud.create_document(db,current_user.id,normalized_all_pages_text_data,file_location,file.filename,ner_model_output,model_output,{},normalized_all_pages_bb_data,[])
    output["document_id"] = current_doc.id
    output["filename"] = current_doc.FileName
    output["update_id"] = -1
    
    return output



@router.post("/experiments2/")
async def process_text(data: document_schemas.ParaUpdate,current_user: user_model.User = Depends(get_current_user),db: Session = Depends(get_db)):
    
    document = document_crud.get_document(db,data.document_id)
    update = document_crud.get_last_update(db,data.document_id,current_user.id)
    update.set_paragraphs(data.paragraphs)
    # update = document_crud.modify_update_as_object(db,update.id,update)
    user_notes = update.get_user_notes()
    
    update_note = {
        "action":"update",
        "target":"para",
        "content":[{
            "para_id":id,
            "text": para
        }for id,para in enumerate(data.paragraphs)]
    }
    user_notes.append(update_note)
    update.set_user_notes(user_notes)
    print(user_notes)
    # update = document_crud.update_update(db,update.id,update.get_paragraphs(),update.get_entities(),update.get_relations(),[],[],user_notes)
    update = document_crud.modify_update_as_object(db,update.id,update)
    return update




@router.post("/edit-paragraph")
async def update_paragraph(data: document_schemas.ParaUpdate,current_user: user_model.User = Depends(get_current_user),db: Session = Depends(get_db)):
    sttime = datetime.now().strftime('%Y/%m/%d %H:%M:%S')
    utils.logging(log_folder,sttime)
    logging_state = {
        "API": "/edit-paragraph",
        "document_id":data.document_id,
        "update_id":data.update_id,
        "paragraphs":data.paragraphs
    }
    utils.logging(log_folder, json.dumps(logging_state))

    start = datetime.now()
    document = document_crud.get_document(db,data.document_id)
    # update = document_crud.get_last_update(db,data.document_id,current_user.id)
    update = document_crud.get_current_temporary_update(db,current_user.id,data.update_id,data.document_id)
    user_notes = update.get_user_notes()
    para_data = document.get_paragraphs()
    
    
    if type(para_data[0]) == str:
        old_pos = document.get_positions()
        old_text = para_data
        old_text, old_pos,change_ids, para_data = utils.execute_user_note_on_paragraphs(user_notes, old_text, old_pos)
    else:
        old_text,old_pos = utils.get_bbox_n_text_seperated(para_data)
        old_text, old_pos,change_ids, para_data = utils.execute_user_note_on_paragraphs(user_notes, old_text, old_pos,para_data=para_data)
    old_entity = document.get_entities()
    old_relations = document.get_relations()
    # finished load data


    ### detect changes in new paragraphs
    changed_ids, changed_para, changed_old_text, changed_old_pos = [], [], [], []
    for index, para in enumerate(data.paragraphs):
        if para != old_text[index]:
            changed_ids.append(index)
            changed_para.append(para)
            changed_old_text.append(old_text[index])
            changed_old_pos.append(old_pos[index])
            print("----------------------------------")
            print(old_text[index])
            print(para)
    print("changed_ids", changed_ids)
    
    ### start to re processing with new paragraphs
    # 
    # 
    changed_pos = utils.organize_new_box(changed_old_text,changed_old_pos,changed_para)
    update_content = []
    for id in changed_ids:
        update_content.append({
            "para_id":id,
            "text": data.paragraphs[id]
        })
    update_note = {
        "action":"update",
        "target":"para",
        "content":update_content
    }
    user_notes.append(update_note)
    update.set_user_notes(user_notes)
    update = document_crud.modify_update_as_object(db,update.id,update)
    
    # GET new NER and new RE set 
    #  Enqueue
    task = re_run_for_changed_para.apply_async(
        args=[update.id, current_user.id, document.id]
    )
    task_result = AsyncResult(task.id, app=celery_app)
    while task_result.state == "PENDING":
        print("waiting for queue")
        time.sleep(1)
    db.refresh(update)

    new_pos = old_pos
    old_relations = update.get_relations()
    

    ### reassign changes in entities and relation to save in future uses
    for id,index in enumerate(changed_ids):
        new_pos[index] = changed_pos[id]

    # new_output, _, _ = convert_to_output_v2(old_relations, new_pos, data.paragraphs)
    if type(para_data[0]) == str:
        new_output, normalized_all_pages_bb_data, normalized_all_pages_text_data = convert_to_output_v2(old_relations, new_pos, data.paragraphs)
    else:
        new_output, normalized_all_pages_bb_data, normalized_all_pages_text_data = convert_to_output_v2(old_relations, new_pos, data.paragraphs,para_data=para_data)

    ### formating new output to return to frontend  
    new_output["document_id"] = data.document_id
    new_output["update_id"] = update.id
    new_output["filename"] = document.FileName
    user_notes = update.get_user_notes()
    v_list = utils.collect_visible_list(user_notes)
    new_output = utils.apply_visibility_to_result(new_output,v_list)
    # print(data.paragraphs)
    end = datetime.now()
    dist = end-start
    print(dist.seconds)
    utils.h_log(log_folder)
    return new_output

@router.post("/get-update")
async def get_update(update_id:document_schemas.UpdateIDSchema, current_user: user_model.User = Depends(get_current_user),db: Session = Depends(get_db)):
    update = document_crud.get_update(db,update_id.update_id)
    return update

@router.get("/get-document-demo/{document_id}")
async def get_document(document_id:int,db: Session = Depends(get_db)):
    document = document_crud.get_document(db,document_id)
    print(str(document.UploadTime))
    return document.id

@router.post("/get-document/{document_id}")
async def get_document_as_id(document_id:int, current_user: user_model.User = Depends(get_current_user),db: Session = Depends(get_db)):
    document = document_crud.get_document(db,document_id)
    last_update = document_crud.get_last_update(db,document_id,current_user.id)
    # TODO: reformat this function
    # 1. get last update need to be reworked. Since update id no longer incremental -> need another method to get last update
    if last_update.get_user_notes():
        user_notes = last_update.get_user_notes()
        para_data = document.get_paragraphs()
        if type(para_data[0]) == str:
            paragraphs,bbox, change_ids = utils.execute_user_note_on_paragraphs(user_notes,document.get_paragraphs(),document.get_positions())
        else:
            paragraphs,bbox = utils.get_bbox_n_text_seperated(para_data)
            paragraphs,bbox, change_ids,para_data  = utils.execute_user_note_on_paragraphs(user_notes,paragraphs,bbox,para_data=para_data)
        # para_id=75
        # print("para_id ",para_id)
        # print(paragraphs[para_id])
        # if len(bbox[para_id])>1136:
        #     print("bbox[para_id][1136] ", bbox[para_id][1136])
            # print("normalized_bbox_item[1136] ",bbox[1136])
        
    
        relations = last_update.get_relations()
        if relations==[]:
            relations = document.get_relations()
            relations = utils.execute_user_note_on_relations(user_notes,relations)
        # new_para, new_bbox, entities, relations, change_ids = utils.execute_user_note_on_all_data(user_notes,document.get_paragraphs(),document.get_positions(),document.get_entities(), document.get_relations())
        
        # print(bbox[96][-1])
        if type(para_data[0]) == str:
            output, normalized_all_pages_bb_data, normalized_all_pages_text_data = convert_to_output_v2(relations, bbox, paragraphs)
        else:
            output, normalized_all_pages_bb_data, normalized_all_pages_text_data = convert_to_output_v2(relations, bbox, paragraphs,para_data=para_data)
        # 
        output["document_id"] = document.id
        output["filename"] = document.FileName
        output["update_id"] = last_update.id
        v_list = utils.collect_visible_list(user_notes)
        output = utils.apply_visibility_to_result(output,v_list)
    else:
        output, normalized_all_pages_bb_data, normalized_all_pages_text_data = convert_to_output_v2(document.get_relations(), document.get_positions(), document.get_paragraphs())
        output["document_id"] = document.id
        output["filename"] = document.FileName
        output["update_id"] = -1
    return output

@router.post("/get-demo/")
async def get_document_as_id(request: Request,db: Session = Depends(get_db)):
    print(request.headers)
    return "ok"


@router.get("/delete-document/{document_id}")
def delete_document(document_id:int, current_user: user_model.User = Depends(get_current_user),db: Session = Depends(get_db)):
    try:
        msg = document_crud.delete_document(db,document_id)
        return msg
    except:
        credentials_exception = HTTPException(
            status_code=status. HTTP_500_INTERNAL_SERVER_ERROR ,
            detail="server error"
        )
        raise credentials_exception

@router.post("/download-document/{document_id}")
async def download_document(document_id:int, current_user: user_model.User = Depends(get_current_user),db: Session = Depends(get_db)):
    doc = document_crud.get_document(db,document_id)
    file_name = doc.FileName
    # Construct the file path
    # file_path = os.path.join(DOCUMENTS_DIR, f"{document_id}.pdf")
    file_path = os.path.join(DOCUMENTS_DIR, file_name)
    # Check if the file exists
    if os.path.exists(file_path):
        # Serve the file as a downloadable response
        return FileResponse(file_path, media_type='application/pdf', filename=file_name)
    else:
        return {"error": "File not found"}

@router.post("/documents")
async def get_user_document(current_user: user_model.User = Depends(get_current_user),db: Session = Depends(get_db)):
    # TODO: add user note and synchronize with 1 update only
    documents = document_crud.get_user_document(db,current_user.id)
    print(current_user.id)

    result = []
    for doc in documents:
        try:
            info_obj = doc.get_infor()
            result.append(info_obj)
        except:
            print(doc.id)
            continue
            
    return result

def collect_update(db,current_user,entity):
    document = document_crud.get_document(db,entity.document_id)
    update = None
    if entity.update_id >0:
        update = document_crud.get_update(db,entity.update_id)
        print("upper if    ",update)
    else:
        update = document_crud.create_update(db,current_user.id,entity.document_id,[],document.get_entities(),document.get_relations(),[],[],[],document.get_infor())
        print(update)
    return update,document

def return_formated_result(db,entity,document,update,cur_entities):
    db.refresh(update)

    para_data = document.get_paragraphs()
    if type(para_data[0])==str:
        old_paragraphs = para_data
        old_bbox = document.get_positions()
        paragraphs,old_bboxs, change_ids =utils.execute_user_note_on_paragraphs(update.get_user_notes(),old_paragraphs,old_bbox) 
    else:
        old_paragraphs,old_bbox = utils.get_bbox_n_text_seperated(para_data)
        paragraphs,old_bboxs, change_ids,para_data =utils.execute_user_note_on_paragraphs(update.get_user_notes(),old_paragraphs,old_bbox,para_data=para_data) 
    
    new_relation = update.get_relations()
    if new_relation == []:
        new_relation = document.get_relations()
        new_relation = utils.execute_user_note_on_relations(update.get_user_notes(), new_relation)
    if type(para_data[0])==str:
        new_output, _, _ = convert_to_output_v2(new_relation, old_bboxs, paragraphs)
    else:
        new_output, _, _ = convert_to_output_v2(new_relation, old_bboxs, paragraphs,para_data=para_data)
    print(new_relation[7]["entities"])
    new_output["document_id"] = entity.document_id
    new_output["update_id"] = update.id
    new_output["filename"] = document.FileName
    user_notes = update.get_user_notes()
    v_list = utils.collect_visible_list(user_notes)
    new_output = utils.apply_visibility_to_result(new_output,v_list)
    utils.h_log(log_folder)
    return new_output

@router.post("/delete-entity")
async def delete_entity(entity:document_schemas.DeleteEntitySchema,current_user: user_model.User = Depends(get_current_user),db: Session = Depends(get_db)):

    document = document_crud.get_document(db,entity.document_id)
    # update = document_crud.get_last_update(db,document.id,current_user.id)
    update = document_crud.get_current_temporary_update(db,current_user.id,entity.update_id,entity.document_id)
    user_notes = update.get_user_notes()
    cur_entities = update.get_entities()
    cur_relations = update.get_relations()

    if cur_entities==[]:
        cur_entities = document.get_entities()
        cur_entities = utils.execute_user_note_on_entities(user_notes,cur_entities)
    if cur_relations==[]:
        cur_relations = document.get_relations()
        cur_relations = utils.execute_user_note_on_relations(user_notes,cur_relations)
    
    

    action = {
        "action":"delete",
        "target":"ent",
    }
    delete_content=[]
    for id in entity.ids:
        para_id, entity_id = document_schemas.UpdateEntitySchema.parse_id(id) 
        delete_content = [
            {
                "para_id":para_id,
                "ent_id":entity_id,
                "ent_type":e[1],
                "ent_text":e[-1],
                "head":e[2][0][0],
                "tail":e[2][0][1],
                "comment":e[-2] if len(e)==5 else ""
            }
            for e in cur_entities[para_id]["entities"] if e[0] == entity_id
        ]
        cur_entities[para_id]["entities"] = list(filter(lambda e: e[0] != entity_id, cur_entities[para_id]["entities"]))
        cur_relations[para_id]["entities"] = list(filter(lambda e: e[0] != entity_id, cur_relations[para_id]["entities"]))
        cur_relations[para_id]["relations"] =  list(filter(lambda r: entity_id not in (r[2][0][1],r[2][1][1]), cur_relations[para_id].get("relations",[])))

    action["content"] =  delete_content
    user_notes.append(action)
    update.set_user_notes(user_notes)
    update.set_entities(cur_entities)  
    update.set_relations(cur_relations)
    update = document_crud.modify_update_as_object(db,update.id,update)
    return return_formated_result(db,entity,document,update,cur_entities)

def execute_update_on_entities_wrapper(update_infor, wrapper,para_id):
    for e in wrapper[para_id]["entities"]:
        if len(e) < 5:
            e.append("")
            e[-1],e[-2] = e[-2],e[-1]
        if e[0] == update_infor.entity_id:    
            e[1] = update_infor.type
            e[2] = [[update_infor.head_pos,update_infor.tail_pos]]
            e[-1] = wrapper[para_id]["text"][update_infor.head_pos:update_infor.tail_pos]
            e[-2] = update_infor.user_comment
    return wrapper
@router.post("/update-entity")
async def update_entity(entity:document_schemas.UpdateEntitySchema,current_user: user_model.User = Depends(get_current_user),db: Session = Depends(get_db)):
    # TODO: consider if need to save the old version before the update 
    
    # update,document = collect_update(db,current_user,entity)    
    # cur_entities = update.get_entities() 

    document = document_crud.get_document(db,entity.document_id)
    # update = document_crud.get_last_update(db,document.id,current_user.id)
    update = document_crud.get_current_temporary_update(db,current_user.id,entity.update_id,entity.document_id)
    user_notes = update.get_user_notes()
    cur_entities = update.get_entities()
    if cur_entities ==[]:
        cur_entities = document.get_entities()
        cur_entities = utils.execute_user_note_on_entities(user_notes,cur_entities)
    
    cur_relations = update.get_relations()
    if cur_relations == []:
        cur_relations = document.get_relations()
        cur_relations = utils.execute_user_note_on_relations(user_notes,cur_relations)
    action = {
        "action":"update",
        "target":"ent",
    }
    update_content=[]
    para_id = entity.para_id
    entity_id = entity.entity_id
    

    for e in cur_entities[para_id]["entities"]:
        if e[0] == entity_id:
            update_content.append({
                    "para_id":para_id,
                    "ent_id":entity_id,
                    "ent_type": entity.type ,
                    "ent_text":cur_entities[para_id]["text"][entity.head_pos:entity.tail_pos],
                    "head":entity.head_pos,
                    "tail":entity.tail_pos,
                    "edit_status": "confirmed",
                    "comment": entity.user_comment,
                    "old_ent_type":e[1],
                    "old_ent_text":e[-1],
                    "old_head":e[2][0][0],
                    "old_tail":e[2][0][1],
                    "old_id": e[0],
                    "old_comment": e[-2] if len(e)==5 else "",
                    "old_edit_status": "none" if "edit_status" not in e else e["edit_status"]
                })
    cur_entities =  execute_update_on_entities_wrapper(entity, cur_entities,para_id)
    cur_relations =  execute_update_on_entities_wrapper(entity, cur_relations,para_id)

    print(cur_entities[para_id]["entities"])    
    action["content"] =  update_content
    user_notes.append(action)
    edit_status_change_list = user_notes[0]
    edit_status_change_list["content"][para_id] = utils.add_edit_status(edit_status_change_list["content"][para_id],"entities",entity_id)
    user_notes[0] = edit_status_change_list
    update.set_user_notes(user_notes)
    update.set_entities(cur_entities)  
    update.set_relations(cur_relations)  

    update = document_crud.modify_update_as_object(db,update.id,update)
    return return_formated_result(db,entity,document,update,cur_entities)



@router.post("/create-entity")
async def create_entity(entity:document_schemas.CreateEntitySchema,current_user: user_model.User = Depends(get_current_user),db: Session = Depends(get_db)): 
    sttime = datetime.now().strftime('%Y/%m/%d %H:%M:%S')
    utils.logging(log_folder,sttime)
    
    logging_state = {
        "API": "/create-entity",
        "comment": entity.comment,
        "para_id": entity.para_id,
        "position": json.dumps(utils.compose_position_object_from_Position(entity.position)),
        "document_id": entity.document_id,
        "update_id": entity.update_id,
        "scale_value": entity.scale_value,
    }
    utils.logging(log_folder, json.dumps(logging_state))

    document = document_crud.get_document(db,entity.document_id)
    # update = document_crud.get_last_update(db,document.id,current_user.id)
    update = document_crud.get_current_temporary_update(db,current_user.id,entity.update_id,entity.document_id)
    user_notes = update.get_user_notes()
    
    cur_entities = update.get_entities()
    if cur_entities==[]:
        cur_entities = document.get_entities()
        cur_entities = utils.execute_user_note_on_entities(user_notes,cur_entities)
    
    cur_relations = update.get_relations()
    if cur_relations == []:
        cur_relations = document.get_relations()
        cur_relations = utils.execute_user_note_on_relations(user_notes,cur_relations)

    para_data = document.get_paragraphs()
    if type(para_data[0])==str:
        old_pos = document.get_positions()
        old_text= para_data
        old_text, old_pos, change_ids = utils.execute_user_note_on_paragraphs(user_notes, old_text, old_pos)
    else:
        old_text, old_pos = utils.get_bbox_n_text_seperated(para_data)
        old_text, old_pos,change_ids, para_data = utils.execute_user_note_on_paragraphs(user_notes, old_text, old_pos,para_data=para_data)


    para_id,idx = utils.decide_new_pos(entity,old_pos)

    if len(idx) == 0:
        print(entity)
    print(para_id)
    print(idx)
    # return idx
    new_head = idx[0]
    new_tail = idx[-1]
    new_id_number = utils.decide_new_ent_number(cur_entities,user_notes,para_id)
    new_id = f"T{new_id_number}"
    def add_entitiy_tow_wrapper(wrapper, infor, para_id,new_id, new_head, new_tail):
        wrapper[para_id]["entities"].append([
            new_id,
            infor.comment,
            [[
                new_head,
                new_tail
            ]],
            infor.user_comment,
            cur_entities[para_id]["text"][new_head:new_tail]
        ])
        return wrapper
    cur_entities = add_entitiy_tow_wrapper(cur_entities, entity, para_id,new_id, new_head, new_tail)
    cur_relations = add_entitiy_tow_wrapper(cur_relations, entity, para_id,new_id, new_head, new_tail)

    # print(cur_relations[7]["entities"])
    add_content=[
        {
            "para_id":para_id,
            "ent_type":entity.comment,
            "ent_id":new_id,
            "ent_text":cur_entities[ para_id]["text"][new_head:new_tail],
            "head": new_head,
            "tail": new_tail,
            "user_comment": entity.user_comment
        }
    ]
    print("add_content ",add_content)
    utils.logging(log_folder, json.dumps(add_content))
    action = {
        "action":"add",
        "target":"ent",
        "content":add_content
    }
    user_notes.append(action)
    update.set_entities(cur_entities)
    update.set_user_notes(user_notes)
    update.set_relations(cur_relations)
    
    update = document_crud.modify_update_as_object(db,update.id,update)
    new_relations = update.get_relations()
    # print(new_relations[7]["entities"])

    return return_formated_result(db,entity,document,update,cur_entities)

@router.post("/update-relations")
async def update_relation(entity:document_schemas.UpdateRelationSchema,current_user: user_model.User = Depends(get_current_user),db: Session = Depends(get_db)):
    # TODO: add user note and synchronize with 1 update only
    # update,document = collect_update(db,current_user,entity)

    document = document_crud.get_document(db,entity.document_id)
    update = document_crud.get_current_temporary_update(db,current_user.id,entity.update_id,entity.document_id)
    user_notes = update.get_user_notes()

    # id = entity.entity_id
    # para_id = int(id.split("_")[0].replace("para",""))
    # entity_id = id.split("_")[1]

    para_id, entity_id = document_schemas.UpdateEntitySchema.parse_id(entity.entity_id)

    new_relations = entity.relations 
    converted_relations = []
    for n_rel in new_relations:

        if n_rel.id is None:
            r_id = " "
        elif "para" in n_rel.id:
            para_id_, r_id = document_schemas.Relation.parse_id(n_rel.id) #n_rel.id.split("_")[1]
            assert para_id_ == para_id
        else:
            raise ValueError("malformed relation id")
            # r_id = n_rel.id

        rel_type = n_rel.type
        para_id_, arg2_id = document_schemas.UpdateEntitySchema.parse_id(n_rel.arg_id) #n_rel.arg_id.split("_")[1]
        assert para_id_ == para_id
        converted_relations.append([r_id,rel_type,[["Arg1",entity_id],["Arg2",arg2_id]]])


    print("new rel ",converted_relations) ######


    # cur_relations = update.get_relations()
    # if cur_relations == []:
    #     cur_relations = document.get_relations() #######
    #     # cur_relations = utils.execute_user_note_on_entities(user_notes,cur_relations)
    #     cur_relations = utils.execute_user_note_on_relations(user_notes,cur_relations)
    

    cur_relations = update.get_relations() or utils.execute_user_note_on_relations(user_notes,document.get_relations())

    original_relations = cur_relations[para_id].get("relations",[]) 
    
    new_relations, user_notes = utils.update_relations(original_relations,converted_relations,entity_id,user_notes,para_id)

    cur_relations[para_id]["relations"] = new_relations

    update.set_user_notes(user_notes)
    update.set_relations(cur_relations)
    
    # print("total relation ",new_relations)
    para_data = document.get_paragraphs()
    # print("type of para_data",type(para_data))
    if type(para_data[0]) == str:
        paragraphs, old_bboxs = para_data, document.get_positions()
    else:
        paragraphs, old_bboxs = utils.get_bbox_n_text_seperated(para_data)

    paragraphs, old_bboxs, change_ids = utils.execute_user_note_on_paragraphs(user_notes,paragraphs,old_bboxs)

    # if type(para_data[0]) == str:
    #     new_output, _, _ = convert_to_output_v2(cur_relations, old_bboxs, paragraphs)
    # else:
    #     new_output, _, _ = convert_to_output_v2(cur_relations, old_bboxs, paragraphs, para_data=para_data)

    new_output, _, _ = convert_to_output_v2(cur_relations, old_bboxs, paragraphs, 
                            para_data=para_data if type(para_data[0]) != str else None)

    update = document_crud.modify_update_as_object(db,update.id,update)
    new_output["document_id"] = entity.document_id
    new_output["update_id"] = update.id
    new_output["filename"] = document.FileName
    user_notes = update.get_user_notes()
    v_list = utils.collect_visible_list(user_notes)
    new_output = utils.apply_visibility_to_result(new_output,v_list)
    return new_output
    # return return_formated_result(db,entity,document,update,cur_entities)

@router.get("/re-extract-relations/{document_id}")
async def re_extract_relations(document_id:int,current_user: user_model.User = Depends(get_current_user),db: Session = Depends(get_db)):
    document = document_crud.get_document(db,document_id)
    update = document_crud.get_last_update(db,document_id,current_user.id)
    # user_notes = update.get_user_notes()
    # paragraphs,old_bboxs, change_ids = utils.execute_user_note_on_paragraphs(user_notes=user_notes,paragraphs=document.get_paragraphs(),old_bboxs=document.get_positions())
    
    # cur_entities = update.get_entities()
    # cur_entities = utils.execute_user_note_on_entities(user_notes,origin_entities)

    return format_output_for_rerun(document,current_user,update,db)

@router.get("/re-extract-all/{document_id}")
async def re_extract_all(document_id:int,current_user: user_model.User = Depends(get_current_user),db: Session = Depends(get_db)):
    document = document_crud.get_document(db,document_id)
    update = document_crud.get_last_update(db,document_id,current_user.id)
    # user_notes = update.get_user_notes()
    # paragraphs,old_bboxs, change_ids = utils.execute_user_note_on_paragraphs(user_notes=user_notes,paragraphs=document.get_paragraphs(),old_bboxs=document.get_positions())
    
    # ner_model_output = inference(convert_to_NER_model_input_format(paragraphs))
    # cur_ent = utils.execute_user_note_on_entities(user_notes,ner_model_output)

    return format_output_for_rerun(document,current_user,update,db,run_ner=True)

def format_output_for_rerun(document,current_user,update,db, run_ner = False):

    task = re_run.apply_async(
        args=[update.id, current_user.id, document.id, run_ner]
    )
    task_result = AsyncResult(task.id, app=celery_app).get()
    db.refresh(update)
    cur_relations = update.get_relations()
    
    para_data=document.get_paragraphs()
    if type(para_data[0])==str:
        old_bboxs=document.get_positions()
        paragraphs = para_data
        paragraphs,old_bboxs, change_ids = utils.execute_user_note_on_paragraphs(update.get_user_notes(),paragraphs,old_bboxs)
        output, normalized_all_pages_bb_data, normalized_all_pages_text_data = convert_to_output_v2(cur_relations, old_bboxs, paragraphs)
    else:
        paragraphs,old_bboxs = utils.get_bbox_n_text_seperated(para_data)
        paragraphs,old_bboxs, change_ids = utils.execute_user_note_on_paragraphs(update.get_user_notes(),paragraphs,old_bboxs)
        output, normalized_all_pages_bb_data, normalized_all_pages_text_data = convert_to_output_v2(cur_relations, old_bboxs, paragraphs,para_data=para_data)
    output["document_id"] = document.id
    output["filename"] = document.FileName
    output["update_id"] = update.id

    return output

@router.post("/change-edit-status")
async def mark_edit(edit_entity: document_schemas.ChangeEditStatusSchema,current_user: user_model.User = Depends(get_current_user),db: Session = Depends(get_db)):
    # try:
        document = document_crud.get_document(db,edit_entity.document_id)
        # update = document_crud.get_last_update(db,edit_entity.document_id,current_user.id)
        update = document_crud.get_current_temporary_update(db,current_user.id,edit_entity.update_id,edit_entity.document_id)
        user_notes = update.get_user_notes()
        edit_status_change_list = user_notes[0]
        
        cur_relations = update.get_relations() or utils.execute_user_note_on_relations(user_notes,document.get_relations())
        
        id = edit_entity.id

        if document_schemas.UpdateEntitySchema.valid_id(id):
            para_id, entity_id = document_schemas.UpdateEntitySchema.parse_id(id)
            edit_status_change_list["content"][para_id] = utils.add_edit_status(edit_status_change_list["content"][para_id],"entities",entity_id)

            for rel in cur_relations[para_id].get("relations",[]):
                if rel[2][0][1] != entity_id: continue
                # FIXME: function add_edit_status did not add relation id into edit_status_change_list['relations']
                edit_status_change_list["content"][para_id] = utils.add_edit_status(edit_status_change_list["content"][para_id],"relations",rel[0])

        elif document_schemas.Relation.valid_id(id):
            para_id, entity_id = document_schemas.Relation.parse_id(id)
            edit_status_change_list["content"][para_id] = utils.add_edit_status(edit_status_change_list["content"][para_id],"relations",entity_id)

        else:
            raise ValueError("Invalid id")

        user_notes[0] = edit_status_change_list
        edit_status_lits = edit_status_change_list["content"]
        for index, note_list in enumerate(edit_status_lits):
            try:
                cur_relations[index]["edit_status"] = note_list
            except:
                print("+++++++++++++++++++++++++++")
                print(len(cur_relations))
                print("+++++++++++++++++++++++++++")
                print(index)
                print("++++++++++++++++++++++++++++++")
                print(note_list)

        update.set_user_notes(user_notes)
        update.set_relations(cur_relations)
        update = document_crud.modify_update_as_object(db,update.id,update)

        return "ok"

    


@router.post("/upload-pdf-queue/")
async def upload_queue(
    current_user: user_model.User = Depends(get_current_user),
    file: UploadFile = File(...),
    db: Session = Depends(get_db)
):
    
    if file.content_type != "application/pdf":
        return JSONResponse(status_code=400, content={"message": "Only PDF files are allowed"})

    file_location = os.path.join(UPLOAD_DIR, file.filename)
    with open(file_location, "wb") as f:
        f.write(await file.read())

    # save document to data before enqueue the task
    sttime = datetime.now().strftime('%Y/%m/%d %H:%M:%S')
    utils.logging(log_folder,sttime)
    logging_state = {
        "API": "/upload-pdf-queue/",
        "filename": file.filename,
        "file_location": file_location
    }
    utils.logging(log_folder, json.dumps(logging_state))

    current_doc = document_crud.create_document(
        db, current_user.id, [], file_location,  file.filename, [], [], {}, [], []
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
    utils.logging(log_folder, json.dumps(info_obj))
    
    
    current_doc.set_infor(info_obj)
    current_doc = document_crud.update_document(db,current_doc.id,current_doc)
    # Enqueue the task
    task = process_pdf_task.apply_async(
        args=[file_location, current_user.id, current_doc.id]
    )
    logging_state = {
        "task_id": task.id
    }
    utils.logging(log_folder, json.dumps(logging_state))
    utils.h_log(log_folder)
    return {"task_id": task.id, "status": "queued", "infor":info_obj}

# @router.get("/task-status/{task_id}/")
# async def get_task_status(task_id: str):
#     task_result = AsyncResult(task_id, app=celery_app)
#     if task_result.state == "PENDING":
#         return {"task_id": task_id, "status": "pending"}
#     elif task_result.state == "SUCCESS":
#         return {"task_id": task_id, "status": "completed", "result": task_result.result}
#     elif task_result.state == "FAILURE":
#         return {"task_id": task_id, "status": "failed", "error": str(task_result.info)}
#     else:
#         return {"task_id": task_id, "status": task_result.state}
    
def handle_pending(task_id, task_result):
    return {"task_id": task_id, "status": "pending"}

def handle_success(task_id, task_result):
    return {"task_id": task_id, "status": "completed", "result": task_result.result}

def handle_failure(task_id, task_result):
    return {"task_id": task_id, "status": "failed", "error": str(task_result.info),"result": "failed"}

def handle_default(task_id, task_result):
    return {"task_id": task_id, "status": task_result.state}

status_handlers = {
    "PENDING": handle_pending,
    "SUCCESS": handle_success,
    "FAILURE": handle_failure
}

@router.get("/task-status/{task_id}/")
async def get_task_status(task_id: str):
    task_result = AsyncResult(task_id, app=celery_app)
    handler = status_handlers.get(task_result.state, handle_default)
    return handler(task_id, task_result)

@router.post("/save/")
async def create_new_update(
    update_entity : document_schemas.NewUpdateEntity,
    current_user: user_model.User = Depends(get_current_user),
    db: Session = Depends(get_db)
    ):
    sttime = datetime.now().strftime('%Y/%m/%d %H:%M:%S')
    utils.logging(log_folder,sttime)
    logging_state = {
        "API": f"/save/"
    }
    utils.logging(log_folder, json.dumps(logging_state))
    print(update_entity.document_id)
    currtime = datetime.now()
    uploadtime = currtime.strftime('%d-%m-%Y %H:%M:%S')
    # update = document_crud.get_last_update(db,update_entity.document_id,current_user.id)
    update = document_crud.get_update_of_user(db,update_entity.document_id,update_entity.update_id,current_user.id )
    # update = document_crud.get_update(db,update_entity.update_id)
    update.Name =update_entity.update_name
    update.UploadDate = uploadtime
    update.checkpoint = 1
    update = document_crud.modify_update_as_object(db,update.id,update)
    # delete not suitable update



    cur_update = document_crud.create_update_as_object(db,update)
    cur_update.FatherID=update.id
    cur_update = document_crud.modify_update_as_object(db,cur_update.id,cur_update)
    # Need to return id of new update
    utils.h_log(log_folder)
    return {"update_id":cur_update.id}

@router.get("/get-update-history/{document_id}")
async def get_update_history(
    document_id:int,
    current_user: user_model.User = Depends(get_current_user),
    db: Session = Depends(get_db)
    ):
    updates = document_crud.get_list_updates(db,current_user.id,document_id)

    return {"updates":updates}

@router.get("/get-document/{document_id}/{update_id}")
async def get_document_as_id(document_id:int,update_id:int, current_user: user_model.User = Depends(get_current_user),db: Session = Depends(get_db)):
    sttime = datetime.now().strftime('%Y/%m/%d %H:%M:%S')
    utils.logging(log_folder,sttime)
    logging_state = {
        "API": f"/get-document/{document_id}/{update_id}",
        "document_id": document_id,
        "update_id": update_id,
    }
    utils.logging(log_folder, json.dumps(logging_state))
    document = document_crud.get_document(db,document_id)
    # last_update = document_crud.get_last_update(db,document_id,current_user.id)
    # if update_id < 0:
    #     output, normalized_all_pages_bb_data, normalized_all_pages_text_data = convert_to_output_v2(document.get_relations(), document.get_positions(), document.get_paragraphs())
    #     output["document_id"] = document.id
    #     output["filename"] = document.FileName
    #     output["update_id"] = -1
    # else:
        # last_update = document_crud.get_update_of_user(db,update_id,current_user.id)
    last_update = document_crud.get_current_temporary_update(db,current_user.id,update_id,document_id)
        # TODO: reformat this function
        # 1. last_update no longer be able to be None
        # 2. Need to perform user notes before send to users
        # delete
    if last_update.get_user_notes():
        user_notes = last_update.get_user_notes()
        para_data = document.get_paragraphs()
        if type(para_data[0])==str:
            old_bboxs = document.get_positions()
            paragraphs = para_data
            
        else:
            paragraphs,old_bboxs = utils.get_bbox_n_text_seperated(para_data)
        paragraphs,old_bboxs, change_ids = utils.execute_user_note_on_paragraphs(user_notes, paragraphs,old_bboxs )

        relations = document.get_relations()
        # relations = utils.execute_user_note_on_entities(user_notes,relations)
        relations = utils.execute_user_note_on_relations(user_notes,relations)

        # last_update = document_crud.create_update_as_object(db,last_update)select
        if type(para_data[0])==str:
            output, normalized_all_pages_bb_data, normalized_all_pages_text_data = convert_to_output_v2(relations, old_bboxs, paragraphs)
        else:
            output, normalized_all_pages_bb_data, normalized_all_pages_text_data = convert_to_output_v2(relations, old_bboxs, paragraphs, para_data=para_data)
        output["document_id"] = document.id
        output["filename"] = document.FileName
        output["update_id"] = last_update.id
        user_notes = last_update.get_user_notes()
        v_list = utils.collect_visible_list(user_notes)
        output = utils.apply_visibility_to_result(output,v_list)
    
    utils.h_log(log_folder)
    return output

@router.post("/forget-password/")
async def forget_password(email:user_schemas.ResetRequest,db: Session = Depends(get_db)):
    sttime = datetime.now().strftime('%Y/%m/%d %H:%M:%S')
    utils.logging(log_folder,sttime)
    logging_state = {
        "API": "/forget-password",
        "email":email.email,
    }
    utils.logging(log_folder, json.dumps(logging_state))

    user = user_crud.get_user_by_email(db,email.email)

    if user:
        reset_token_expires = timedelta(minutes=utils.RESET_TOKEN_EXPIRE_MINUTES)
        reset_token = utils.create_access_token(
            data={"sub": user.username}, expires_delta=reset_token_expires
        )
        reset_link = f"{utils.ROOT_PAGE_ADDRESS}{reset_token}"
        utils.logging(log_folder, reset_link)
        utils.h_log(log_folder)
        if utils.send_reset_password_email(email.email,reset_link, user.username):
            return "Reset password email sent successully"
        else:
            return "Failed to send reset password email"
    else:
        utils.h_log(log_folder)
        return "There is no user registered with this email"
    
@router.post("/reset-password/")
async def reset_password(reset_infor:user_schemas.ResetPassword ,db: Session = Depends(get_db)):
    sttime = datetime.now().strftime('%Y/%m/%d %H:%M:%S')
    utils.logging(log_folder,sttime)
    logging_state = {
        "API": "/reset-password/",
        "new_password":reset_infor.new_password
    }
    utils.logging(log_folder, json.dumps(logging_state))

    reset_token = reset_infor.token
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Reset token no longer valid",
        headers={"WWW-Authenticate": "Bearer"},
    )
    payload = utils.decode_token(reset_token, utils.SECRET_KEY)
    if payload is None:
        raise credentials_exception
    username: str = payload.get("sub")
    # if username is None:
    #     raise credentials_exception
    # token_data = user_schemas.TokenData(username=username)
    user = user_crud.get_user_by_username(db,username)

    hashed_password = utils.get_password_hash(reset_infor.new_password)

    user.hashed_password = hashed_password

    # user = user_crud.reset_password(db,user)
    user = user_crud.update_password(db,user.id,hashed_password)

    utils.h_log(log_folder)
    return "ok"
    
@router.post("/update-user-infor")
async def update_user_infor(infor: user_schemas.UpdateUSerInfor, db:Session = Depends(get_db), current_user: user_model.User = Depends(get_current_user)):
    sttime = datetime.now().strftime('%Y/%m/%d %H:%M:%S')
    utils.logging(log_folder,sttime)

    infor.password = infor.password and utils.get_password_hash(infor.password)

    logging_state = dict({
        "API": "/update-user-infor",
        "user": current_user.username,
            
        }, **{
            attr:getattr(infor,attr) for attr in type(infor).model_fields
        }
    )
    utils.logging(log_folder, json.dumps(logging_state))

    infor.username = None

    for attr in type(infor).model_fields:
        if (value:=getattr(infor,attr)) is not None:
            setattr(current_user,attr,value)

    user = user_crud.update_user(db,current_user, current_user.id)
    user.hashed_password = ""
    utils.h_log(log_folder)
    return user

@router.post("/change-password")
async def change_password(infor: user_schemas.ChangePassword, db:Session = Depends(get_db), current_user: user_model.User = Depends(get_current_user)):
    sttime = datetime.now().strftime('%Y/%m/%d %H:%M:%S')
    utils.logging(log_folder,sttime)
    logging_state = {
        "API": "/update-user-infor",
        "user": current_user.username,
        # "old_password":infor.old_password,
        # "new_password":infor.new_password,
    }
    utils.logging(log_folder, json.dumps(logging_state))
    if utils.verify_password(infor.old_password, current_user.hashed_password):
        hashed_password = utils.get_password_hash(infor.new_password)
        current_user.hashed_password = hashed_password
        user = user_crud.update_user(db,current_user, current_user.id)
        result={"msg":"done"}
    else:
        result={"msg":"wrong password"}
    utils.logging(log_folder, json.dumps(result))
    utils.h_log(log_folder)
    return result

@router.get("/get-user-infor")
async def get_user_infor(db:Session = Depends(get_db), current_user: user_model.User = Depends(get_current_user)):
    user = user_crud.get_user(db,current_user.id)
    sttime = datetime.now().strftime('%Y/%m/%d %H:%M:%S')
    utils.logging(log_folder,sttime)
    logging_state = {
        "API": "/get-user-infor",
        "user": current_user.username
    }
    utils.logging(log_folder, json.dumps(logging_state))
    result_obj = {
        "username": user.username,
        "email": user.email,
        "fullname": user.fullname,
        "workplace": user.workplace,
        "address": user.address,
        "phone": user.phone,
    }
    for key in result_obj:
        if result_obj[key] is None:
            result_obj[key] = ""
    return result_obj

@router.post("/contact-support")
async def change_password(infor: user_schemas.ContactSupport, db:Session = Depends(get_db)):
    sttime = datetime.now().strftime('%Y/%m/%d %H:%M:%S')
    utils.logging(log_folder,sttime)
    logging_state = {
        "API": "/contact-support",
        "name":infor.name,
        "email":infor.email,
        "content":infor.content
    }
    utils.logging(log_folder, json.dumps(logging_state))
    try:
        utils.send_contact_support_email(infor.email, infor.name, infor.content)
        result={"msg":"done"}
    except:
        result={"msg":"cannot send email"}
    utils.logging(log_folder, json.dumps(result))
    utils.h_log(log_folder)
    return result

@router.post("/reorder-paragraph")
async def update_paragraph(data: document_schemas.ReorderPara,current_user: user_model.User = Depends(get_current_user),db: Session = Depends(get_db)):
    sttime = datetime.now().strftime('%Y/%m/%d %H:%M:%S')
    utils.logging(log_folder,sttime)
    logging_state = {
        "API": "/reorder-paragraph",
        "user": current_user.username,
        "doc":data.document_id,
        "update":data.update_id,
        "old para id":data.old_para_id,
        "new order": data.paragraphs
    }
    utils.logging(log_folder, json.dumps(logging_state))
    start = datetime.now()
    document = document_crud.get_document(db,data.document_id)
    # update = document_crud.get_last_update(db,data.document_id,current_user.id)
    update = document_crud.get_current_temporary_update(db,current_user.id,data.update_id,data.document_id)
    user_notes = update.get_user_notes()
    
    para_data = document.get_paragraphs()
    if type(para_data[0])==str:
        old_pos = document.get_positions()
        old_text= para_data
        old_text, old_pos, change_ids = utils.execute_user_note_on_paragraphs(user_notes, old_text, old_pos)
    else:
        old_text, old_pos = utils.get_bbox_n_text_seperated(para_data)
        old_text, old_pos,change_ids, para_data = utils.execute_user_note_on_paragraphs(user_notes, old_text, old_pos,para_data=para_data)
    
    old_entity = update.get_entities()
    old_relations = update.get_relations()

    if old_relations ==[]:
        old_relations = document.get_relations()
        old_relations = utils.execute_user_note_on_relations(user_notes,old_relations)
    if old_entity ==[]:
        old_entity = document.get_entities()
        old_entity = utils.execute_user_note_on_entities(user_notes,old_entity)
    # finished load data
    old_edit_status=user_notes[0]["content"]
    cur_para , cur_pos, change_ids = utils.execute_user_note_on_paragraphs(user_notes, old_text, old_pos)
    new_text = []
    new_pos = []
    new_entities = []
    new_relations = []
    new_edit_status = []
    new_para_data = []
    add_content=[
        {
            "new_order":data.paragraphs
        }
    ]

    action = {
        "action":"reorder",
        "target":"all",
        "content":add_content
    }
    user_notes.append(action)
    for index in data.paragraphs:
        # real_index = index -1 
        print(index)
        new_text.append(cur_para[index])
        new_pos.append(cur_pos[index])
        new_entities.append(old_entity[index])
        new_relations.append(old_relations[index])
        new_edit_status.append(old_edit_status[index])
        if type(para_data[0])!=str:
            new_para_data.append(para_data[index])
    user_notes[0]['content'] = new_edit_status
    update.set_user_notes(user_notes)
    update.set_entities(new_entities)
    update.set_relations(new_relations)
    
    update = document_crud.modify_update_as_object(db,update.id,update)
    
    if type(para_data[0])==str:
        new_output, _, _ = convert_to_output_v2(new_relations, new_pos, new_text)
    else:
        new_output, _, _ = convert_to_output_v2(new_relations, new_pos, new_text,para_data=new_para_data)
    ### formating new output to return to frontend  
    new_output["document_id"] = data.document_id
    new_output["update_id"] = update.id
    new_output["filename"] = document.FileName
    # print(data.paragraphs)
    end = datetime.now()
    dist = end-start
    print(dist.seconds)
    utils.h_log(log_folder)
    return new_output

@router.post("/get-nodes-and-edges")
async def get_nodes_and_edges(
    infor: document_schemas.ChangeEditStatusSchema,
    db: Session = Depends(get_db),
    current_user: user_model.User = Depends(get_current_user)
):
    # Logging start
    now_str = datetime.now().strftime('%Y/%m/%d %H:%M:%S')
    utils.logging(log_folder, now_str)
    utils.logging(log_folder, json.dumps({
        "API": "/get-nodes-and-edges",
        "document_id": infor.document_id,
        "update_id": infor.update_id,
        "id": infor.id
    }))

    # Parse identifiers
    para_id, entity_id = infor.id.split("_")
    para_id = int(para_id.replace("para", ""))

    # Fetch updates and relations
    last_update = document_crud.get_current_temporary_update(db, current_user.id, infor.update_id, infor.document_id)
    document = document_crud.get_document(db, infor.document_id)
    relations_data = last_update.get_relations() or document.get_relations()
    para = relations_data[para_id]
    entities = para["entities"]

    # Find entity type and name
    ent_type, ent_name = next(
        (etype, ename) for eid, etype, *_ , ename in entities if eid == entity_id
    )

    # Get graph
    relations = para.get("relations", [])
    all_graphs = utils.generate_graphs_manual(entities, relations)

    # Load visualization config
    config = utils.load_graph_config()

    if entity_id in all_graphs:
        result = all_graphs[entity_id]
    else:
        result = {
            "nodes": [{
                "id": "1",
                "data": {"label": f"{ent_type}: {ent_name}"},
                "position": config["default_node"]["position"],
                "className": ent_type,
                "sourcePosition": config["default_node"]["sourcePosition"],
                "targetPosition": config["default_node"]["targetPosition"]
            }],
            "edges": [],
            "options": config["options"]
        }

    utils.h_log(log_folder)
    return result

@router.post("/set-visible")
async def set_visible(infor: document_schemas.VisibleList, db:Session = Depends(get_db), current_user: user_model.User = Depends(get_current_user)):
    sttime = datetime.now().strftime('%Y/%m/%d %H:%M:%S')
    utils.logging(log_folder,sttime)
    logging_state = {
        "API": "/set-visible",
        "document_id":infor.document_id,
        "update_id":infor.update_id,
        "visible_list":infor.visible_list
    }
    utils.logging(log_folder, json.dumps(logging_state))
    document = document_crud.get_document(db,infor.document_id)
    # update = document_crud.get_last_update(db,data.document_id,current_user.id)
    update = document_crud.get_current_temporary_update(db,current_user.id,infor.update_id,infor.document_id)

    user_notes = update.get_user_notes()
    add_content={
            "visible_list":infor.visible_list
        }
    
    action = {
        "action":"update_visible",
        "target":"visible",
        "content":add_content
    }
    user_notes.append(action)
    update.set_user_notes(user_notes)
    update = document_crud.modify_update_as_object(db,update.id,update)
    
    utils.h_log(log_folder)
    
    para_data = document.get_paragraphs()
    relations = update.get_relations()
    if relations == []:
        relations = document.get_relations()
    # new_relations = utils.execute_user_note_on_entities(user_notes,relations)
        relations = utils.execute_user_note_on_relations(user_notes,relations)
    
    if type(para_data[0])==str:
        old_pos = document.get_positions()
        old_text = para_data
        cur_para , cur_pos, change_ids = utils.execute_user_note_on_paragraphs(user_notes, old_text, old_pos)
        new_output, _, _ = convert_to_output_v2(relations, cur_pos, cur_para)
    else:
        old_text, old_pos = utils.get_bbox_n_text_seperated(para_data)
        paragraphs,bbox, change_ids,new_para_data  = utils.execute_user_note_on_paragraphs(user_notes,old_text,old_pos,para_data=para_data)
        new_output, _, _ = convert_to_output_v2(relations, bbox, paragraphs,para_data=new_para_data)
    ### formating new output to return to frontend  
    new_output["document_id"] = infor.document_id
    new_output["update_id"] = update.id
    new_output["filename"] = document.FileName
    print()
    new_output = utils.apply_visibility_to_result(new_output,infor.visible_list)
    
    return new_output


@router.get("/download-editted-entities/{document_id}")
async def download_edit_entity(document_id:int, current_user: user_model.User = Depends(get_current_user),db: Session = Depends(get_db)):
    document = document_crud.get_document(db,document_id)
    # TODO: Need to check what update should be picked here
    update = document_crud.get_last_update(db,document_id,current_user.id)


    user_notes = update.get_user_notes()
    cur_entities = update.get_entities()
    cur_relations = document.get_relations()
    cur_relations = utils.execute_user_note_on_relations(user_notes,cur_relations)
    edit_status_list = user_notes[0]["content"]
    result = []
    
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

@router.get("/download-all-entities/{document_id}")
async def download_all_entity(document_id:int, current_user: user_model.User = Depends(get_current_user),db: Session = Depends(get_db)):
    document = document_crud.get_document(db,document_id)
    update = document_crud.get_last_update(db,document_id,current_user.id)
    user_notes = update.get_user_notes()
    # paragraphs,old_bboxs, change_ids = utils.execute_user_note_on_paragraphs(user_notes=user_notes,paragraphs=document.get_paragraphs(),old_bboxs=document.get_positions())
    cur_entities = document.get_entities()
    cur_entities = utils.execute_user_note_on_entities(user_notes,cur_entities)
    cur_relations = document.get_relations()
    cur_relations = utils.execute_user_note_on_relations(user_notes,cur_relations)
    # re_model_input = convert_to_RE_model_input_format(cur_entities)
    # model_output = predict_re(re_model_input, cur_entities)
    # cur_relations = utils.execute_user_note_on_relations(user_notes,model_output)
    # output, normalized_all_pages_bb_data, normalized_all_pages_text_data = convert_to_output_v2(cur_relations, old_bboxs, paragraphs)
    # output["document_id"] = document.id
    # output["filename"] = document.FileName
    # output["update_id"] = -1
    visible_list = utils.collect_visible_list(user_notes)
    result = utils.filter_with_visible_list(cur_relations,visible_list)
     
    return result

@router.post("/download-entity/")
async def download_entity(entity_id:document_schemas.ChangeEditStatusSchema, current_user: user_model.User = Depends(get_current_user),db: Session = Depends(get_db)):
    document = document_crud.get_document(db,entity_id.document_id)
    update = document_crud.get_last_update(db,entity_id.document_id,current_user.id)
    user_notes = update.get_user_notes()
    # paragraphs,old_bboxs, change_ids = utils.execute_user_note_on_paragraphs(user_notes=user_notes,paragraphs=document.get_paragraphs(),old_bboxs=document.get_positions())
    cur_entities = update.get_entities()

    para_id, ent_id = document_schemas.UpdateEntitySchema.parse_id(entity_id.id)

    result  = cur_entities[para_id]
    result["entities"] = next((obj for obj in cur_entities[para_id]["entities"] if obj[0] == ent_id), None)
    if "relations" in cur_entities[para_id]:
        result["relations"] = [(obj for obj in cur_entities[para_id]["relations"] if obj[2][0][1] == ent_id)]
    else:
        result["relations"] = []
    return result

@router.post("/download-entity-type/")
async def download_entity_type(entity_id:document_schemas.DownloadEntity, current_user: user_model.User = Depends(get_current_user),db: Session = Depends(get_db)):
    document = document_crud.get_document(db,entity_id.document_id)
    update = document_crud.get_last_update(db,entity_id.document_id,current_user.id)
    user_notes = update.get_user_notes()
    cur_entities = update.get_entities()

    result = cur_entities
    for para in result:
        para["relations"] = []
        para["entities"] = [ent for ent in para["entities"] if ent[1] == entity_id.type]

    return result

@router.post("/download-infor-para/")
async def download_infor_para(download_request:document_schemas.DownloadParaEntity, current_user: user_model.User = Depends(get_current_user),db: Session = Depends(get_db)):
    document = document_crud.get_document(db,download_request.document_id)
    update = document_crud.get_last_update(db,download_request.document_id,current_user.id)
    user_notes = update.get_user_notes()
    # paragraphs,old_bboxs, change_ids = utils.execute_user_note_on_paragraphs(user_notes=user_notes,paragraphs=document.get_paragraphs(),old_bboxs=document.get_positions())
    cur_entities = update.get_entities()
    result = []
    ori_rel = document.get_relations()
    cur_rel = utils.execute_user_note_on_relations(user_notes,ori_rel)
    
    return cur_rel[download_request.para_id]

@router.post("/download-filtered-info/")
async def download_filtered_entity(
    download_request:document_schemas.DownloadFiltering, 
    current_user: user_model.User = Depends(get_current_user),
    db: Session = Depends(get_db)
    ):
    
    document = document_crud.get_document(db,download_request.document_id)
    update = document_crud.get_last_update(db,download_request.document_id,current_user.id)
    print(download_request)
    user_notes = update.get_user_notes()
    ori_rel = document.get_relations()

    cur_rel = utils.execute_user_note_on_relations(user_notes,ori_rel)
    ent_result = utils.filter_entities(cur_rel,download_request.filtering_entity_types)
    rel_result = utils.filter_relations(cur_rel, download_request.filtering_relation_types)
    result = utils.merge_filtered_entities(ent_result, rel_result)
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

def download_editted(info, current_user, db):
    document = document_crud.get_document(db,info.document_id)
    # TODO: Need to check what update should be picked here
    update = document_crud.get_last_update(db,info.document_id,current_user.id)
    user_notes = update.get_user_notes()
    cur_entities = update.get_entities()
    cur_relations = document.get_relations()
    cur_relations = utils.execute_user_note_on_relations(user_notes,cur_relations)
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

download_handlers={
    "all": download_default,
    "confirmed": download_editted,
    "filter": download_filter,
    "entity_type": download_entity_type
}

@router.post("/download-json/")
async def download_json(
    infor: document_schemas.DownloadJSONSchema,
    current_user: user_model.User = Depends(get_current_user),
    db: Session = Depends(get_db)
    ):
    sttime = datetime.now().strftime('%Y/%m/%d %H:%M:%S')
    utils.logging(log_folder,sttime)
    logging_state = {
        "API": "/download-highlighted-document",
        "document_id":infor.document_id,
        "update_id":infor.update_id,
        **{
            attr:getattr(infor,attr) for attr in type(infor).model_fields
        }
    }
    utils.logging(log_folder, json.dumps(logging_state,default=document_schemas.custom_serializer))
    handler = download_handlers.get(infor.mode, download_default)

    return handler(infor, current_user, db )

@router.post("/download-highlighted-document")
async def download_highlighted_document(infor: document_schemas.DownloadDocumentSchema, db:Session = Depends(get_db), current_user: user_model.User = Depends(get_current_user)):
    sttime = datetime.now().strftime('%Y/%m/%d %H:%M:%S')
    utils.logging(log_folder,sttime)
    logging_state = {
        "API": "/download-highlighted-document",
        "document_id":infor.document_id,
        "update_id":infor.update_id,
        **{
            attr:getattr(infor,attr) for attr in type(infor).model_fields
        }
    }
    utils.logging(log_folder, json.dumps(logging_state,default=document_schemas.custom_serializer))
    last_update = document_crud.get_current_temporary_update(db, current_user.id, infor.update_id, infor.document_id)
    document = document_crud.get_document(db, infor.document_id)
    
    user_notes = last_update.get_user_notes()
    para_data = document.get_paragraphs()
    if type(para_data[0]) == str:
        paragraphs,bbox, _ = utils.execute_user_note_on_paragraphs(user_notes,document.get_paragraphs(),document.get_positions())
    else:
        paragraphs,bbox = utils.get_bbox_n_text_seperated(para_data)
        paragraphs,bbox, _ , para_data  = utils.execute_user_note_on_paragraphs(user_notes,paragraphs,bbox,para_data=para_data)
    handler = download_handlers.get(infor.mode, download_default)
    relations = handler(infor, current_user, db )
    # print(bbox[96][-1])
    if type(para_data[0]) == str:
        output, _, _ = convert_to_output_v2(relations, bbox, paragraphs,full_data_mode=False)
    else:
        output, _, _ = convert_to_output_v2(relations, bbox, paragraphs,para_data=para_data,full_data_mode=False)

    hightlighted_filename = "highlighted_"+document.FileName
    output_file_path = os.path.join(HIGHLIGHTED_DOCUMENT_FOLDER_PATH)
    utils.create_highlighted_pdf_file(document.FilePath,output,output_file_path)
    return FileResponse(output_file_path, filename=hightlighted_filename)