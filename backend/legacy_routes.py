from fastapi import APIRouter, File, UploadFile, Request
from fastapi.responses import JSONResponse
from fastapi.responses import FileResponse
import os
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from datetime import timedelta, datetime
from typing import List
from crud.psql import user as user_crud
from crud.psql import document as document_crud
from models.psql import user as user_model
from models.psql import document as document_model
from utils import utils
from database import get_db
from typing import List  
from config import UPLOAD_DIR

from ner_re_processing import convert_to_NER_model_input_format, convert_to_RE_model_input_format, convert_to_output_v2
from pdf_processing import process_pdf_to_text, convert_pdf_to_text_and_bounding_boxes
# from NER.main_predict import inference
# from RE.main_predict import predict_re
import json
from schemas import user  as user_schemas 
from schemas import document as document_schemas
from celery.result import AsyncResult
from celery_app import app as celery_app
from tasks import process_pdf_task, re_run_re, re_run_for_changed_para, re_run
import time

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")

DOCUMENTS_DIR="uploads"
log_folder = "stable_logs"
router = APIRouter()



# @router.post("/process-pdf/")
# async def upload_pdf(file: UploadFile = File(...)):
#     if file.content_type != "application/pdf":
#         return JSONResponse(status_code=400, content={"message": "Only PDF files are allowed"})

#     file_location = os.path.join(UPLOAD_DIR, file.filename)
#     with open(file_location, "wb") as f:
#         f.write(await file.read())

#     sections = process_pdf_to_text(file_location)
#     data_mapping = {}
#     paragraphs = []
#     for key in sections.keys():
#         data_mapping[key] = (len(paragraphs), len(paragraphs) + len(sections[key]))
#         paragraphs += sections[key]
#     ner_model_output = inference(convert_to_NER_model_input_format(paragraphs))
#     re_model_input = convert_to_RE_model_input_format(ner_model_output)
#     try:
#         model_output = predict_re(re_model_input, ner_model_output)
#     except Exception as e:
#         print("Failed to predict relations!")
#         return ner_model_output
    
#     result = {}
#     for key in data_mapping.keys():
#         start, end = data_mapping[key]
#         result[key] = model_output[start:end]
#     return result


# @router.post("/process-pdf-sample/")
# async def process_pdf_sample(file: UploadFile = File(...)):
#     if file.content_type != "application/pdf":
#         return JSONResponse(status_code=400, content={"message": "Only PDF files are allowed"})

#     file_location = os.path.join(UPLOAD_DIR, file.filename)
#     with open(file_location, "wb") as f:
#         f.write(await file.read())

#     return data_sample


# @router.post("/process-pdf-v2/")
# async def process_pdf_v2(file: UploadFile = File(...)):
#     if file.content_type != "application/pdf":
#         return JSONResponse(status_code=400, content={"message": "Only PDF files are allowed"})

#     file_location = os.path.join(UPLOAD_DIR, file.filename)
#     with open(file_location, "wb") as f:
#         f.write(await file.read())

#     all_pages_text_data, all_pages_bb_data = convert_pdf_to_text_and_bounding_boxes(file_location)
#     ner_model_output = inference(convert_to_NER_model_input_format(all_pages_text_data))
#     re_model_input = convert_to_RE_model_input_format(ner_model_output)
#     model_output = predict_re(re_model_input, ner_model_output)
#     output  = convert_to_output_v2(model_output, all_pages_bb_data, all_pages_text_data)
#     # output = {"doc":all_pages_text_data}
#     return output

# @router.post("/process-pdf-demo/")
# async def process_pdf_demo(file: UploadFile = File(...)):
#     if file.content_type != "application/pdf":
#         return JSONResponse(status_code=400, content={"message": "Only PDF files are allowed"})

#     file_location = os.path.join(UPLOAD_DIR, file.filename)
#     with open(file_location, "wb") as f:
#         f.write(await file.read())

#     all_pages_text_data, all_pages_bb_data = convert_pdf_to_text_and_bounding_boxes(file_location)
#     ner_model_output = inference(convert_to_NER_model_input_format(all_pages_text_data))
#     tmp_json_data = convert_to_NER_model_input_format(all_pages_text_data)
#     doc_id_list = list(set([item["doc_ID"] for item in tmp_json_data]))
#     # print(doc_id_list)
#     # print(all_pages_bb_data)
#     # ner_model_output[0]["para_index"] = 0
#     re_model_input = convert_to_RE_model_input_format(ner_model_output)
#     model_output = predict_re(re_model_input, ner_model_output)
#     output, normalized_all_pages_bb_data, normalized_all_pages_text_data = convert_to_output_v2(model_output, all_pages_bb_data, all_pages_text_data)
    
#     # for box in normalized_all_pages_bb_data:
#     #     # print( box)
#     #     if box == []:
#     #         continue
#     #     else:
#     #         page_num = box[-1][-1]["pageNumber"]
    
#     output = {"origin_text": all_pages_text_data[5],"doc":output["pdf_format_output"][5],"doc2":output["brat_format_output"][5],"bbox":all_pages_bb_data[5],"rel":normalized_all_pages_bb_data[5]}
#     return output

@router.post("/extract-pdf/")
async def extract_pdf(file: UploadFile = File(...)):
    if file.content_type != "application/pdf":
        return JSONResponse(status_code=400, content={"message": "Only PDF files are allowed"})

    file_location = os.path.join(UPLOAD_DIR, file.filename)
    with open(file_location, "wb") as f:
        f.write(await file.read())

    return process_pdf_to_text(file_location)




from jose import JWTError, jwt

def get_current_user(request: Request,db: Session = Depends(get_db), token: str = Depends(oauth2_scheme)):
    headers = request.headers
    print("Request Headers:", headers)
    
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Need to refresh token",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = utils.decode_token(token, utils.SECRET_KEY)
        if payload is None:
            raise credentials_exception
        username: str = payload.get("sub")
        # if username is None:
        #     raise credentials_exception
        token_data = user_schemas.TokenData(username=username)
    except:
        raise credentials_exception
    
    user = db.query(user_model.User).filter(user_model.User.username == token_data.username).first()
    if user is None:
        raise credentials_exception
    return user


@router.post("/register/")
@router.post("/register")
def register(user: user_schemas.UserCreate, db: Session = Depends(get_db)):
    db_user = user_crud.get_user_by_username(db, user.username)
    if db_user:
        raise HTTPException(status_code=400, detail="Username already registered")
    
    # Check if email is already registered
    db_email = user_crud.get_user_by_email(db, user.email)
    if db_email:
        raise HTTPException(status_code=400, detail="Email already registered")

    hashed_password = utils.get_password_hash(user.password)
    user.password = hashed_password
    new_user = user_crud.create_user(db, user)
    return new_user

@router.post("/login", response_model=user_schemas.TokenRefresh)  # Changed to /login
@router.post("/login/", response_model=user_schemas.TokenRefresh) 
def login_for_access_token(db: Session = Depends(get_db), form_data: OAuth2PasswordRequestForm = Depends()):
    # Try to find user by username first
    sttime = datetime.now().strftime('%Y%m%d_%H:%M:%S - ')
    utils.logging(log_folder,sttime)
    logging_state = {
        "API": "/login",
        "user": form_data.username
    }
    utils.logging(log_folder, json.dumps(logging_state))


    db_user = user_crud.get_user_by_username(db, form_data.username)
    print( form_data.username)
    print( form_data.password)
    # If not found by username, try to find by email
    if not db_user:
        db_user = user_crud.get_user_by_email(db, form_data.username)
    
    if not db_user or not utils.verify_password(form_data.password, db_user.hashed_password):
        utils.logging(log_folder, "Incorrect username, email, or password")
        utils.h_log(log_folder)
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
        utils.logging(log_folder, "login sucessfully")
        utils.h_log(log_folder)
    except Exception as E:
        utils.logging(log_folder, str(E))
        utils.h_log(log_folder)
        print(E)
    return {"access_token": access_token, "refresh_token": refresh_token, "token_type": "bearer"}


@router.post("/refresh-token", response_model=user_schemas.Token)
def refresh_access_token(refresh_token: str, db: Session = Depends(get_db)):
    sttime = datetime.now().strftime('%Y%m%d_%H:%M:%S - ')
    utils.logging(log_folder,sttime)
    logging_state = {
        "API": "/refresh-token",
        "refresh_token": refresh_token
    }
    utils.logging(log_folder, json.dumps(logging_state))

    token_data = utils.decode_token(refresh_token, utils.REFRESH_SECRET_KEY)
    if not token_data:
        utils.logging(log_folder, "Could not validate refresh token")
        utils.h_log(log_folder)
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate refresh token",
            headers={"WWW-Authenticate": "Bearer"},
        )

    db_refresh_token = user_crud.get_refresh_token(db, refresh_token)
    if not db_refresh_token or db_refresh_token.expires_at < datetime.utcnow():
        utils.logging(log_folder, "Refresh token expired or invalid")
        utils.h_log(log_folder)
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Refresh token expired or invalid",
            headers={"WWW-Authenticate": "Bearer"},
        )

    user = user_crud.get_user_by_username(db, token_data["sub"])
    if not user:
        utils.logging(log_folder, "User not found")
        utils.h_log(log_folder)
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found",
            headers={"WWW-Authenticate": "Bearer"},
        )

    access_token_expires = timedelta(minutes=utils.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = utils.create_access_token(
        data={"sub": user.username}, expires_delta=access_token_expires
    )
    utils.logging(log_folder, "restore sucessfully")
    utils.h_log(log_folder)
    return {"access_token": access_token, "token_type": "bearer"}


@router.post("/process-pdf-v3/")
async def process_pdf_v3(file: UploadFile = File(...),db: Session = Depends(get_db)):

    file_location = os.path.join(UPLOAD_DIR, file.filename)
    sttime = datetime.now().strftime('%Y/%m/%d %H:%M:%S')
    utils.logging(log_folder,sttime)
    logging_state = {
        "API": "/process-pdf-v3/",
        "filename": file.filename,
        "file_location": file_location
    }
    utils.logging(log_folder, json.dumps(logging_state))

    with open(file_location, "wb") as f:
        f.write(await file.read())
    current_user = user_crud.get_user(db,1)
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
    utils.logging(log_folder, json.dumps(info_obj))
    current_doc.set_infor(info_obj)
    current_doc = document_crud.update_document(db,current_doc.id,current_doc)
    # Enqueue the task
    task = process_pdf_task.apply_async(
        args=[file_location, current_user.id, current_doc.id]
    )
    print(info_obj)
    logging_state = {
        "task_id": task.id
    }
    utils.logging(log_folder, json.dumps(logging_state))

    task_result = AsyncResult(task.id, app=celery_app)
    while task_result.state == "PENDING":
        print("waiting for queue")
        time.sleep(1)
        
    db.refresh(current_doc)
    print("done")
    model_output = current_doc.get_relations()
    all_pages_bb_data = current_doc.get_positions()
    all_pages_text_data = current_doc.get_paragraphs()
    
    output, normalized_all_pages_bb_data, normalized_all_pages_text_data = convert_to_output_v2(model_output, all_pages_bb_data, all_pages_text_data)
    current_doc.set_positions(normalized_all_pages_bb_data)
    current_doc.set_paragraphs(normalized_all_pages_text_data)
    current_doc = document_crud.update_document(db,current_doc.id,current_doc)
    utils.logging(log_folder, json.dumps(current_doc.get_infor()))
    utils.h_log(log_folder)
    # current_doc = document_crud.create_document(db,current_user.id,normalized_all_pages_text_data,file_location,file.filename,ner_model_output,model_output,{},normalized_all_pages_bb_data,[])
    output["document_id"] = current_doc.id
    output["filename"] = current_doc.FileName
    output["update_id"] = -1
    return output


# @router.post("/upload-pdf/")
# async def upload_file(current_user: user_model.User = Depends(get_current_user),file: UploadFile = File(...),db: Session = Depends(get_db)):
#     # try:
#     #     current_user = get_current_user(db,token)
#     # except :
#     #     return {"message":"cretidential failed !!!!!"}
#     if file.content_type != "application/pdf":
#         return JSONResponse(status_code=400, content={"message": "Only PDF files are allowed"})


#     file_location = os.path.join(UPLOAD_DIR, file.filename)
#     with open(file_location, "wb") as f:
#         f.write(await file.read())

#     all_pages_text_data, all_pages_bb_data = convert_pdf_to_text_and_bounding_boxes(file_location)
    
#     ner_model_output = inference(convert_to_NER_model_input_format(all_pages_text_data))
#     if file.filename =="namazi2011.pdf":
#         ner_model_output[4]["entities"][2][3]="TiO2"
#         ner_model_output[4]["entities"][2][2][0][0]+=4
#         for index,ent in enumerate(ner_model_output[15]["entities"]):
#             if ent[3]=="PEFCs.Amongpolybenzimidazolederivatives":
#                 ner_model_output[15]["entities"][index][3]="polybenzimidazole"
#                 ner_model_output[15]["entities"][index][2][0][0]+=11
#                 ner_model_output[15]["entities"][index][2][0][1]-=11

#         ner_model_output[5]["entities"]=[]
#         ner_model_output[6]["entities"]=[]
#     re_model_input = convert_to_RE_model_input_format(ner_model_output)
#     model_output = predict_re(re_model_input, ner_model_output)

#     output, normalized_all_pages_bb_data, normalized_all_pages_text_data = convert_to_output_v2(model_output, all_pages_bb_data, all_pages_text_data)
#     ##### store raw text and bbox, in later call out can run convert_to_output_v2 normally
#     current_doc = document_crud.create_document(db,current_user.id,all_pages_text_data,file_location,file.filename,ner_model_output,model_output,{},all_pages_bb_data,[])

#     ##### store normilized text and bbox, but some doc may meet error while running convert_to_output_v2
#     # current_doc = document_crud.create_document(db,current_user.id,normalized_all_pages_text_data,file_location,file.filename,ner_model_output,model_output,{},normalized_all_pages_bb_data,[])
    
#     num_ent, num_rel = utils.count_ent_and_rel(model_output)
#     page_num = 0
#     #### use loop to avoid the last element is empty list
#     for box in normalized_all_pages_bb_data:
#         if box == []:
#             continue
#         else:
#             ##### in the case that did normalize text and bbox
#             page_num = box[-1]["pageNumber"]
#             ##### in the case that did not normalize text and bbox
#             # page_num = box[-1][-1]["pageNumber"]
    
#     info_obj = {
#         "id":current_doc.id,
#         "filename":file.filename,
#         "upload_time":current_doc.UploadTime,
#         "entities":num_ent,
#         "relations":num_rel,
#         "pages":page_num,
#         "status":"completed"
#     }
#     current_doc.set_infor(info_obj)
#     current_doc = document_crud.update_document(db,current_doc.id,current_doc)
#     return info_obj

# @router.post("/process-text/")
# async def process_text(text:document_schemas.TextUpload,db: Session = Depends(get_db)):
#     start = datetime.now()
#     ner_model_output = inference(convert_to_NER_model_input_format([text.text]))
#     re_model_input = convert_to_RE_model_input_format(ner_model_output)
#     model_output = predict_re(re_model_input, ner_model_output)

#     end = datetime.now()
#     dist = end- start
#     print(dist)
#     return model_output

# @router.get("/experiments/")
# async def process_text():
#     test_folder = "./NERE_test/test"
#     filenames = os.listdir(test_folder)
#     dists = []
#     sum = timedelta(seconds=0,milliseconds=0)
#     time = 0
#     for filename in filenames:
#         if ".txt" in filename:
#             time+=1
#             filepath = os.path.join(test_folder,filename)
#             with open(filepath,'r',encoding='utf-8') as f:
#                 lines = f.readlines()
#                 content = " ".join(lines)
#             start = datetime.now()
#             ner_model_output = inference(convert_to_NER_model_input_format([content]))
#             re_model_input = convert_to_RE_model_input_format(ner_model_output)
#             model_output = predict_re(re_model_input, ner_model_output)
#             end = datetime.now()
#             dist = end- start
#             sum+= timedelta(seconds=dist.seconds,milliseconds=dist.microseconds)
#             dists.append({"file":filename,"time":str(dist)})
#     dists.append({"sum":sum,"time":time})
#     return dists

# @router.post("/experiments2/")
# async def process_text(data: document_schemas.ParaUpdate,current_user: user_model.User = Depends(get_current_user),db: Session = Depends(get_db)):
    
#     document = document_crud.get_document(db,data.document_id)
#     update = document_crud.get_last_update(db,data.document_id,current_user.id)
#     update.set_paragraphs(data.paragraphs)
#     # update = document_crud.modify_update_as_object(db,update.id,update)
#     user_notes = update.get_user_notes()
#     update_content = []
#     for id,para in enumerate(data.paragraphs):
#         update_content.append({
#             "para_id":id,
#             "text": para
#         })
#     update_note = {
#         "action":"update",
#         "target":"para",
#         "content":update_content
#     }
#     user_notes.append(update_note)
#     update.set_user_notes(user_notes)
#     print(user_notes)
#     # update = document_crud.update_update(db,update.id,update.get_paragraphs(),update.get_entities(),update.get_relations(),[],[],user_notes)
#     update = document_crud.modify_update_as_object(db,update.id,update)
#     return update

@router.post("/edit-paragraph")
async def update_paragraph(data: document_schemas.ParaUpdate,current_user: user_model.User = Depends(get_current_user),db: Session = Depends(get_db)):
    # if current_user is not None:

    # fix the entities collection from the latest update version
    # load data from database

    sttime = datetime.now().strftime('%Y/%m/%d %H:%M:%S')
    utils.logging(log_folder,sttime)
    logging_state = {
        "API": "/edit-paragraph",
        "user": current_user.username,
        "doc_id": data.document_id,
        "update_id":data.update_id
    }
    utils.logging(log_folder, json.dumps(logging_state))

    start = datetime.now()
    document = document_crud.get_document(db,data.document_id)
    # update = document_crud.get_last_update(db,data.document_id,current_user.id)
    if data.update_id is not None:
        update = document_crud.get_current_temporary_update(db,current_user.id,data.update_id,data.document_id)
        # user_notes = update.get_user_notes()
        # old_pos = document.get_positions()
        # old_text = document.get_paragraphs()
        # old_entity = document.get_entities()
        # old_relations = document.get_relations()
    # finished load data
    else:
        update = document_crud.get_update_by_doc_and_user(db,data.document_id,current_user.id)
    user_notes = update.get_user_notes()
    old_pos = document.get_positions()
    old_text = document.get_paragraphs()
    old_entity = document.get_entities()
    old_relations = document.get_relations()

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

    new_output, _, _ = convert_to_output_v2(old_relations, new_pos, data.paragraphs)

    ### formating new output to return to frontend  
    new_output["document_id"] = data.document_id
    new_output["update_id"] = update.id
    new_output["filename"] = document.FileName
    # print(data.paragraphs)
    end = datetime.now()
    dist = end-start
    print(dist.seconds)
    utils.logging(log_folder, f"server took {dist} seconds")
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
    sttime = datetime.now().strftime('%Y/%m/%d %H:%M:%S')
    utils.logging(log_folder,sttime)
    logging_state = {
        "API": f"/get-document/{document_id}"
    }
    utils.logging(log_folder, json.dumps(logging_state))

    document = document_crud.get_document(db,document_id)
    last_update = document_crud.get_last_update(db,document_id,current_user.id)
    # TODO: reformat this function
    # 1. last_update no longer be able to be None
    # 2. Need to perform user notes before send to users

    if last_update.get_user_notes()!= []:
        user_notes = last_update.get_user_notes()
        paragraphs,old_bboxs, change_ids = utils.execute_user_note_on_paragraphs(user_notes,document.get_paragraphs(),document.get_positions())

        relations = document.get_relations()
        relations = utils.execute_user_note_on_entities(user_notes,relations)
        relations = utils.execute_user_note_on_relations(user_notes,relations)


        output, normalized_all_pages_bb_data, normalized_all_pages_text_data = convert_to_output_v2(relations, old_bboxs, paragraphs)
        output["document_id"] = document.id
        output["filename"] = document.FileName
        output["update_id"] = last_update.id
    else:
        output, normalized_all_pages_bb_data, normalized_all_pages_text_data = convert_to_output_v2(document.get_relations(), document.get_positions(), document.get_paragraphs())
        output["document_id"] = document.id
        output["filename"] = document.FileName
        output["update_id"] = -1
    utils.h_log(log_folder)
    return output

@router.post("/get-demo/")
async def get_document_as_id(request: Request,db: Session = Depends(get_db)):
    print(request.headers)
    return "ok"


@router.get("/delete-document/{document_id}")
def delete_document(document_id:int, current_user: user_model.User = Depends(get_current_user),db: Session = Depends(get_db)):
    sttime = datetime.now().strftime('%Y/%m/%d %H:%M:%S')
    utils.logging(log_folder,sttime)
    logging_state = {
        "API": f"/delete-document/{document_id}",
        "user":current_user.username
    }
    utils.logging(log_folder, json.dumps(logging_state))

    try:
        msg = document_crud.delete_document(db,document_id)
        utils.h_log(log_folder)
        return msg
    except:
        utils.logging(log_folder,"error")
        utils.h_log(log_folder)
        credentials_exception = HTTPException(
            status_code=status. HTTP_500_INTERNAL_SERVER_ERROR ,
            detail="server error"
        )
        raise credentials_exception

@router.post("/download-document/{document_id}")
async def download_document(document_id:int, current_user: user_model.User = Depends(get_current_user),db: Session = Depends(get_db)):
    sttime = datetime.now().strftime('%Y/%m/%d %H:%M:%S')
    utils.logging(log_folder,sttime)
    logging_state = {
        "API": f"/download-document/{document_id}",
        "user":current_user.username
    }
    utils.logging(log_folder, json.dumps(logging_state))

    doc = document_crud.get_document(db,document_id)
    file_name = doc.FileName
    # Construct the file path
    # file_path = os.path.join(DOCUMENTS_DIR, f"{document_id}.pdf")
    file_path = os.path.join(DOCUMENTS_DIR, file_name)
    # Check if the file exists
    if os.path.exists(file_path):
        # Serve the file as a downloadable response
        utils.logging(log_folder, "done")
        utils.h_log(log_folder)
        return FileResponse(file_path, media_type='application/pdf', filename=file_name)
    else:
        utils.logging(log_folder, "File not found")
        utils.h_log(log_folder)
        return {"error": "File not found"}

@router.post("/documents")
async def get_user_document(current_user: user_model.User = Depends(get_current_user),db: Session = Depends(get_db)):
    # TODO: add user note and synchronize with 1 update only
    sttime = datetime.now().strftime('%Y/%m/%d %H:%M:%S')
    utils.logging(log_folder,sttime)
    logging_state = {
        "API": "/documents",
        "user":current_user.username,

    }
    utils.logging(log_folder, json.dumps(logging_state))

    documents = document_crud.get_user_document(db,current_user.id)
    print(current_user.id)
    result = []
    for doc in documents:
        info_obj = doc.get_infor()
        result.append(info_obj)
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
    # print(cur_entities[0])
    
    update.set_entities(cur_entities)  
    update = document_crud.modify_update_as_object(db,update.id,update)
    # print(update.get_entities()[0]["entities"])
    # GET new relations set
    
    task = re_run_re.apply_async(
        args=[update.id, document.UserID, document.id]
    )
    task_result = AsyncResult(task.id, app=celery_app)
    while task_result.state == "PENDING":
        print("waiting for queue")
        time.sleep(1)
    db.refresh(update)
    paragraphs,old_bboxs, change_ids =utils.execute_user_note_on_paragraphs(update.get_user_notes(),document.get_paragraphs(),document.get_positions()) 
    new_relation = update.get_relations()
    new_output, _, _ = convert_to_output_v2(new_relation, old_bboxs, paragraphs)
    new_output["document_id"] = entity.document_id
    new_output["update_id"] = update.id
    new_output["filename"] = document.FileName
    utils.h_log(log_folder)
    return new_output

@router.post("/delete-entity")
async def delete_entity(entity:document_schemas.DeleteEntitySchema,current_user: user_model.User = Depends(get_current_user),db: Session = Depends(get_db)):
    sttime = datetime.now().strftime('%Y/%m/%d %H:%M:%S')
    utils.logging(log_folder,sttime)
    logging_state = {
        "API": "/delete-entity",
        "user":current_user.username,
        "document_id": entity.document_id,
        "update_id": entity.update_id,
        "ids": entity.ids
    }
    utils.logging(log_folder, json.dumps(logging_state))

    document = document_crud.get_document(db,entity.document_id)
    update = document_crud.get_last_update(db,document.id,current_user.id)
    user_notes = update.get_user_notes()
    origin_entities = update.get_entities()
    cur_entities = utils.execute_user_note_on_entities(user_notes,origin_entities)


    action = {
        "action":"delete",
        "target":"ent",
    }
    delete_content=[]
    for id in entity.ids:
        
        para_id = int(id.split("_")[0].replace("para",""))
        entity_id = id.split("_")[1]
        # for 
        for e in cur_entities[para_id]["entities"]:
            if e[0] == entity_id:
                delete_content.append({
                    "para_id":para_id,
                    "ent_id":entity_id,
                    "ent_type":e[1],
                    "ent_text":e[-1],
                    "head":e[2][0][0],
                    "tail":e[2][0][1],
                })
                cur_entities[para_id]["entities"].remove(e)
        # Add to note and save to update
    action["content"] =  delete_content
    user_notes.append(action)
    update.set_user_notes(user_notes)
    update = document_crud.modify_update_as_object(db,update.id,update)
    return return_formated_result(db,entity,document,update,cur_entities)

@router.post("/update-entity")
async def update_entity(entity:document_schemas.UpdateEntitySchema,current_user: user_model.User = Depends(get_current_user),db: Session = Depends(get_db)):
    # TODO: consider if need to save the old version before the update 
    sttime = datetime.now().strftime('%Y/%m/%d %H:%M:%S')
    utils.logging(log_folder,sttime)
    logging_state = {
        "API": "/update-entity",
        "user":current_user.username,
        "id": entity.id,
        "document_id": entity.document_id,
        "update_id": entity.update_id,
        "head_pos": entity.head_pos,
        "tail_pos": entity.tail_pos,
        "type": entity.type
    }
    utils.logging(log_folder, json.dumps(logging_state))

    # update,document = collect_update(db,current_user,entity)    
    # cur_entities = update.get_entities() 

    document = document_crud.get_document(db,entity.document_id)
    update = document_crud.get_last_update(db,document.id,current_user.id)
    user_notes = update.get_user_notes()
    origin_entities = update.get_entities()
    cur_entities = utils.execute_user_note_on_entities(user_notes,origin_entities)
    
    action = {
        "action":"update",
        "target":"ent",
    }
    update_content=[]
    
    id = entity.id
    para_id = int(id.split("_")[0].replace("para",""))
    entity_id = id.split("_")[1]
    
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
                    "old_ent_type":e[1],
                    "old_ent_text":e[-1],
                    "old_head":e[2][0][0],
                    "old_tail":e[2][0][1],
                    "old_id": e[0],
                    "old_edit_status": "none" if "edit_status" not in e else e["edit_status"]
                })
            e[1] = entity.type
            e[2] = [[entity.head_pos,entity.tail_pos]]
            e[-1] = cur_entities[para_id]["text"][entity.head_pos:entity.tail_pos]
            
            
    print(cur_entities[para_id]["entities"])    
    action["content"] =  update_content
    user_notes.append(action)
    edit_status_change_list = user_notes[0]
    edit_status_change_list["content"][para_id] = utils.add_edit_status(edit_status_change_list["content"][para_id],"entities",entity_id)
    user_notes[0] = edit_status_change_list
    update.set_user_notes(user_notes)
    update = document_crud.modify_update_as_object(db,update.id,update)

    return return_formated_result(db,entity,document,update,cur_entities)

@router.post("/create-entity")
async def create_entity(entity:document_schemas.LegacyCreateEntitySchema,current_user: user_model.User = Depends(get_current_user),db: Session = Depends(get_db)): 
    '''
    the legacy function for version 2.0, not working for version 3.0
    '''
    # update,document = collect_update(db,current_user,entity)
    # 
    # cur_entities = update.get_entities()
    sttime = datetime.now().strftime('%Y/%m/%d %H:%M:%S')
    utils.logging(log_folder,sttime)
    logging_state = {
        "API": "/update-entity",
        "user":current_user.username,
        "comment": entity.comment,
        "para_id": entity.para_id,
        "document_id": entity.document_id,
        "update_id": entity.update_id,
        "head_pos": entity.head_pos,
        "tail_pos": entity.tail_pos,
        "scale_value": entity.scale_value,
    }
    utils.logging(log_folder, json.dumps(logging_state))
    if entity.position is not None:
        utils.log_position(log_folder,entity.position)
    
    document = document_crud.get_document(db,entity.document_id)
    update = document_crud.get_last_update(db,document.id,current_user.id)
    user_notes = update.get_user_notes()
    origin_entities = update.get_entities()
    cur_entities = utils.execute_user_note_on_entities(user_notes,origin_entities)
    if entity.head_pos is not None:
        if entity.head_pos < 0: 
            new_head = 0
        else:
            new_head = entity.head_pos
        new_tail = entity.tail_pos
        new_id_number = utils.decide_new_ent_number(origin_entities,user_notes,entity.para_id)
        new_id = f"T{new_id_number}"

        cur_entities[entity.para_id]["entities"].append([
            new_id,
            entity.comment,
            [[
                new_head,
                new_tail
            ]],
            cur_entities[entity.para_id]["text"][new_head:new_tail]
        ])

        add_content=[
            {
                "para_id":entity.para_id,
                "ent_type":entity.comment,
                "ent_id":new_id,
                "ent_text":cur_entities[ entity.para_id]["text"][new_head:new_tail],
                "head": new_head,
                "tail": new_tail
            }
        ]

        action = {
            "action":"add",
            "target":"ent",
            "content":add_content
        }
        user_notes.append(action)
        update.set_user_notes(user_notes)
        update = document_crud.modify_update_as_object(db,update.id,update)
        return return_formated_result(db,entity,document,update,cur_entities)
    else:
        user_notes = update.get_user_notes()
        origin_entities = update.get_entities()
        cur_entities = utils.execute_user_note_on_entities(user_notes,origin_entities)
        para_id,idx = utils.decide_new_pos(entity,document.get_positions())
        if len(idx) == 0:
            print(entity)
        print(para_id)
        print(idx)
        # return idx
        new_head = idx[0]
        new_tail = idx[-1]
        new_id_number = utils.decide_new_ent_number(origin_entities,user_notes,para_id)
        new_id = f"T{new_id_number}"

        cur_entities[para_id]["entities"].append([
            new_id,
            entity.comment,
            [[
                new_head,
                new_tail
            ]],
            cur_entities[para_id]["text"][new_head:new_tail]
        ])

        add_content=[
            {
                "para_id":para_id,
                "ent_type":entity.comment,
                "ent_id":new_id,
                "ent_text":cur_entities[ para_id]["text"][new_head:new_tail],
                "head": new_head,
                "tail": new_tail
            }
        ]

        action = {
            "action":"add",
            "target":"ent",
            "content":add_content
        }
    
        user_notes.append(action)
        update.set_user_notes(user_notes)
        update = document_crud.modify_update_as_object(db,update.id,update)
        return return_formated_result(db,entity,document,update,cur_entities)
    
@router.post("/update-relations")
async def update_relation(entity:document_schemas.UpdateRelationSchema,current_user: user_model.User = Depends(get_current_user),db: Session = Depends(get_db)):
    # TODO: add user note and synchronize with 1 update only
    # update,document = collect_update(db,current_user,entity)
    sttime = datetime.now().strftime('%Y/%m/%d %H:%M:%S')
    utils.logging(log_folder,sttime)
    logging_state = {
        "API": "/update-relations",
        "user":current_user.username,
        "entity_id":entity.entity_id,
        "doc_id": entity.document_id,
        "update_id": entity.update_id
    }
    utils.logging(log_folder, json.dumps(logging_state))
    utils.log_relation(log_folder, entity.relations)

    document = document_crud.get_document(db,entity.document_id)
    update = document_crud.get_last_update(db,document.id,current_user.id)
    user_notes = update.get_user_notes()

    id = entity.entity_id
    para_id = int(id.split("_")[0].replace("para",""))
    entity_id = id.split("_")[1]
    new_relations = entity.relations 
    converted_relations = []
    for n_rel in new_relations:

        if n_rel.id is None:
            r_id = " "
        else:
            if "para" in n_rel.id:
                r_id = n_rel.id.split("_")[1]
            else:
                r_id = n_rel.id
        type = n_rel.type
        arg_id = n_rel.arg_id.split("_")[1]
        converted_relations.append([r_id,type,[["Arg1",entity_id],["Arg2",arg_id]]])
    print("new rel ",converted_relations) ######


    cur_relations = update.get_relations() #######
    # cur_relations = utils.execute_user_note_on_relations(user_notes,relations)
    # print(cur_relations[para_id].keys())
    if "relations" not in cur_relations[para_id]:
        cur_relations[para_id]["relations"] = []
    original_relations = cur_relations[para_id]["relations"]
    
    new_relations, user_notes = utils.update_relations(original_relations,converted_relations,entity_id,user_notes,para_id)

    cur_relations[para_id]["relations"] = new_relations

    update.set_user_notes(user_notes)

    
    print("total relation ",new_relations)
    paragraphs,old_bboxs, change_ids = utils.execute_user_note_on_paragraphs(user_notes=user_notes,paragraphs=document.get_paragraphs(),old_bboxs=document.get_positions())
    new_output, _, _ = convert_to_output_v2(cur_relations, old_bboxs, paragraphs)
    update = document_crud.modify_update_as_object(db,update.id,update)
    new_output["document_id"] = entity.document_id
    new_output["update_id"] = update.id
    new_output["filename"] = document.FileName
    utils.h_log(log_folder)
    return new_output
    # return return_formated_result(db,entity,document,update,cur_entities)

@router.get("/re-extract-relations/{document_id}")
async def re_extract_relations(document_id:int,current_user: user_model.User = Depends(get_current_user),db: Session = Depends(get_db)):
    sttime = datetime.now().strftime('%Y/%m/%d %H:%M:%S')
    utils.logging(log_folder,sttime)
    logging_state = {
        "API": f"/re-extract-relations/{document_id}",
        "user":current_user.username,
        "doc_id": document_id,
    }
    utils.logging(log_folder, json.dumps(logging_state))

    document = document_crud.get_document(db,document_id)
    update = document_crud.get_last_update(db,document_id,current_user.id)
    logging_state = {
        "update_id": update.id,
    }
    utils.logging(log_folder, json.dumps(logging_state))
    # user_notes = update.get_user_notes()
    # paragraphs,old_bboxs, change_ids = utils.execute_user_note_on_paragraphs(user_notes=user_notes,paragraphs=document.get_paragraphs(),old_bboxs=document.get_positions())
    
    # cur_entities = update.get_entities()
    # cur_entities = utils.execute_user_note_on_entities(user_notes,origin_entities)

    return format_output_for_rerun(document,current_user,update,db)

@router.get("/re-extract-all/{document_id}")
async def re_extract_all(document_id:int,current_user: user_model.User = Depends(get_current_user),db: Session = Depends(get_db)):
    sttime = datetime.now().strftime('%Y/%m/%d %H:%M:%S')
    utils.logging(log_folder,sttime)
    logging_state = {
        "API": f"/re-extract-relations/{document_id}",
        "user":current_user.username,
        "doc_id": document_id,
    }
    utils.logging(log_folder, json.dumps(logging_state))

    document = document_crud.get_document(db,document_id)
    update = document_crud.get_last_update(db,document_id,current_user.id)
    logging_state = {
        "update_id": update.id,
    }
    utils.logging(log_folder, json.dumps(logging_state))
    # user_notes = update.get_user_notes()
    # paragraphs,old_bboxs, change_ids = utils.execute_user_note_on_paragraphs(user_notes=user_notes,paragraphs=document.get_paragraphs(),old_bboxs=document.get_positions())
    
    # ner_model_output = inference(convert_to_NER_model_input_format(paragraphs))
    # cur_ent = utils.execute_user_note_on_entities(user_notes,ner_model_output)

    return format_output_for_rerun(document,current_user,update,db,run_ner=True)

def format_output_for_rerun(document,current_user,update,db, run_ner = False):
    # re_model_input = convert_to_RE_model_input_format(cur_entities)
    # model_output = predict_re(re_model_input, cur_entities)

    # cur_relations = utils.execute_user_note_on_relations(user_notes,model_output)
    # 
    task = re_run.apply_async(
        args=[update.id, current_user.id, document.id, run_ner]
    )
    utils.logging(log_folder, json.dumps({"task_id":task.id}))
    task_result = AsyncResult(task.id, app=celery_app)
    while task_result.state == "PENDING":
        print("waiting for queue")
        time.sleep(1)
    db.refresh(update)
    cur_relations = update.get_relations()
    paragraphs,old_bboxs, change_ids = utils.execute_user_note_on_paragraphs(user_notes=update.get_user_notes(),paragraphs=document.get_paragraphs(),old_bboxs=document.get_positions())
    output, normalized_all_pages_bb_data, normalized_all_pages_text_data = convert_to_output_v2(cur_relations, old_bboxs, paragraphs)
    output["document_id"] = document.id
    output["filename"] = document.FileName
    output["update_id"] = update.id
    utils.h_log(log_folder)
    return output


@router.post("/change-edit-status")
async def mark_edit(edit_entity: document_schemas.ChangeEditStatusSchema,current_user: user_model.User = Depends(get_current_user),db: Session = Depends(get_db)):
    # try:
    sttime = datetime.now().strftime('%Y/%m/%d %H:%M:%S')
    utils.logging(log_folder,sttime)
    logging_state = {
        "API": "/change-edit-status",
        "user":current_user.username,
        "doc_id": edit_entity.document_id,
        "update_id": edit_entity.update_id,
        "entity_id": edit_entity.id,
    }
    utils.logging(log_folder, json.dumps(logging_state))

    document = document_crud.get_document(db,edit_entity.document_id)
    update = document_crud.get_last_update(db,edit_entity.document_id,current_user.id)
    user_notes = update.get_user_notes()
    edit_status_change_list = user_notes[0]
    cur_relations = document.get_relations()
    cur_relations = utils.execute_user_note_on_relations(user_notes,cur_relations)
    id = edit_entity.id
    para_id = int(id.split("_")[0].replace("para",""))
    entity_id = id.split("_")[1]

    if entity_id.startswith("T"):
        edit_status_change_list["content"][para_id] = utils.add_edit_status(edit_status_change_list["content"][para_id],"entities",entity_id)
        if "relations" in cur_relations[para_id]:
            relations = cur_relations[para_id]["relations"]
            print(relations)
            for rel in relations:
                if rel[2][0][1] == entity_id:
                    edit_status_change_list["content"][para_id] = utils.add_edit_status(edit_status_change_list["content"][para_id],"relations",rel[0])
    else:
        edit_status_change_list["content"][para_id] = utils.add_edit_status(edit_status_change_list["content"][para_id],"relations",entity_id)
    user_notes[0] = edit_status_change_list
    update.set_user_notes(user_notes)

    update = document_crud.modify_update_as_object(db,update.id,update)
    utils.h_log(log_folder)
    return "ok"

    
@router.get("/download-editted-entities/{document_id}")
async def download_edit_entity(document_id:int, current_user: user_model.User = Depends(get_current_user),db: Session = Depends(get_db)):
    sttime = datetime.now().strftime('%Y/%m/%d %H:%M:%S')
    utils.logging(log_folder,sttime)
    logging_state = {
        "API": f"/download-editted-entities/{document_id}",
        "user":current_user.username,
        "doc_id": document_id
    }
    utils.logging(log_folder, json.dumps(logging_state))

    document = document_crud.get_document(db,document_id)
    update = document_crud.get_last_update(db,document_id,current_user.id)
    user_notes = update.get_user_notes()
    cur_entities = update.get_entities()
    cur_relations = document.get_relations()
    cur_relations = utils.execute_user_note_on_relations(user_notes,cur_relations)
    edit_status_list = user_notes[0]["content"]
    result= []
    for index, edit_status in enumerate(edit_status_list):
        if len(edit_status["entities"]) >0:
            
            tmp = {}
            tmp_e = []
            for status in edit_status["entities"]:
                if status["status"] != "none":
                    tmp = cur_entities[index]
                    cf_e = next((obj for obj in cur_entities[index]["entities"] if obj[0] == status["id"]), None)
                    if cf_e is not None:
                        tmp_e.append(cf_e)
            tmp["entities"] = tmp_e
            
            if len(edit_status["relations"]) >0:
                print(edit_status["relations"])
                tmp_r = []
                if "relations" in cur_relations[index]:
                    for status in edit_status["relations"]:
                        if status["status"] != "none":
                            cf_r = next((obj for obj in cur_relations[index]["relations"] if obj[0] == status["id"]), None)
                            if cf_r is not None:
                                tmp_r.append(cf_r)
                    tmp["relations"] = tmp_r
                else:
                    tmp["relations"] = []
            else:
                tmp["relations"] = []
            
            result.append(tmp)
    utils.h_log(log_folder)
    return result

@router.get("/download-all-entities/{document_id}")
async def download_all_entity(document_id:int, current_user: user_model.User = Depends(get_current_user),db: Session = Depends(get_db)):
    sttime = datetime.now().strftime('%Y/%m/%d %H:%M:%S')
    utils.logging(log_folder,sttime)
    logging_state = {
        "API": f"/download-all-entities/{document_id}",
        "user":current_user.username,
        "doc_id": document_id
    }
    utils.logging(log_folder, json.dumps(logging_state))


    document = document_crud.get_document(db,document_id)
    update = document_crud.get_last_update(db,document_id,current_user.id)
    logging_state = {
        "update_id": update.id
    }
    utils.logging(log_folder, json.dumps(logging_state))
    user_notes = update.get_user_notes()
    # paragraphs,old_bboxs, change_ids = utils.execute_user_note_on_paragraphs(user_notes=user_notes,paragraphs=document.get_paragraphs(),old_bboxs=document.get_positions())
    cur_entities = update.get_entities()
    # re_model_input = convert_to_RE_model_input_format(cur_entities)
    # model_output = predict_re(re_model_input, cur_entities)
    # cur_relations = utils.execute_user_note_on_relations(user_notes,model_output)
    # output, normalized_all_pages_bb_data, normalized_all_pages_text_data = convert_to_output_v2(cur_relations, old_bboxs, paragraphs)
    # output["document_id"] = document.id
    # output["filename"] = document.FileName
    # output["update_id"] = -1
    utils.h_log(log_folder)
    return cur_entities

@router.post("/download-entity/")
async def download_entity(entity_id:document_schemas.ChangeEditStatusSchema, current_user: user_model.User = Depends(get_current_user),db: Session = Depends(get_db)):
    sttime = datetime.now().strftime('%Y/%m/%d %H:%M:%S')
    utils.logging(log_folder,sttime)
    logging_state = {
        "API": "/download-entity/",
        "user":current_user.username,
        "doc_id": entity_id.document_id,
        "update_id":entity_id.update_id,
        "entity_id":entity_id.id
    }
    utils.logging(log_folder, json.dumps(logging_state))

    document = document_crud.get_document(db,entity_id.document_id)
    update = document_crud.get_last_update(db,entity_id.document_id,current_user.id)
    user_notes = update.get_user_notes()
    # paragraphs,old_bboxs, change_ids = utils.execute_user_note_on_paragraphs(user_notes=user_notes,paragraphs=document.get_paragraphs(),old_bboxs=document.get_positions())
    cur_entities = update.get_entities()
    id = entity_id.id
    para_id = int(id.split("_")[0].replace("para",""))
    ent_id = id.split("_")[1]
    result  = cur_entities[para_id]
    result["entities"] = next((obj for obj in cur_entities[para_id]["entities"] if obj[0] == ent_id), None)
    if "relations" in cur_entities[para_id]:
        result["relations"] = [(obj for obj in cur_entities[para_id]["relations"] if obj[2][0][1] == ent_id)]
    else:
        result["relations"] = []
    
    utils.h_log(log_folder)
    return result

@router.post("/download-entity-type/")
async def download_entity_type(entity_id:document_schemas.DownloadEntity, current_user: user_model.User = Depends(get_current_user),db: Session = Depends(get_db)):
    
    sttime = datetime.now().strftime('%Y/%m/%d %H:%M:%S')
    utils.logging(log_folder,sttime)
    logging_state = {
        "API": "/download-entity-type/",
        "user":current_user.username,
        "doc_id": entity_id.document_id,
        "update_id":entity_id.update_id,
        "type":entity_id.type
    }
    utils.logging(log_folder, json.dumps(logging_state))

    document = document_crud.get_document(db,entity_id.document_id)
    update = document_crud.get_last_update(db,entity_id.document_id,current_user.id)
    user_notes = update.get_user_notes()
    # paragraphs,old_bboxs, change_ids = utils.execute_user_note_on_paragraphs(user_notes=user_notes,paragraphs=document.get_paragraphs(),old_bboxs=document.get_positions())
    cur_entities = update.get_entities()
    result = []
    for para in cur_entities:
        tmp = para
        tmp_ent = []
        for ent in tmp["entities"]:
            if ent[1] == entity_id.type:
                tmp_ent.append(ent)
        tmp["entities"] = tmp_ent
        tmp["relations"] = []
        result.append(tmp)
    utils.h_log(log_folder)
    return result

@router.post("/download-infor-para/")
async def download_infor_para(download_request:document_schemas.DownloadParaEntity, current_user: user_model.User = Depends(get_current_user),db: Session = Depends(get_db)):
    sttime = datetime.now().strftime('%Y/%m/%d %H:%M:%S')
    utils.logging(log_folder,sttime)
    logging_state = {
        "API": "/download-infor-para/",
        "user":current_user.username,
        "doc_id": download_request.document_id,
        "update_id":download_request.update_id,
        "para_id":download_request.para_id
    }
    utils.logging(log_folder, json.dumps(logging_state))

    document = document_crud.get_document(db,download_request.document_id)
    update = document_crud.get_last_update(db,download_request.document_id,current_user.id)
    user_notes = update.get_user_notes()
    # paragraphs,old_bboxs, change_ids = utils.execute_user_note_on_paragraphs(user_notes=user_notes,paragraphs=document.get_paragraphs(),old_bboxs=document.get_positions())
    cur_entities = update.get_entities()
    result = []
    ori_rel = document.get_relations()
    cur_rel = utils.execute_user_note_on_relations(user_notes,ori_rel)
    utils.h_log(log_folder)
    return cur_rel[download_request.para_id]

@router.post("/download-filtered-info/")
async def download_filtered_entity(download_request:document_schemas.DownloadFiltering, current_user: user_model.User = Depends(get_current_user),db: Session = Depends(get_db)):
    sttime = datetime.now().strftime('%Y/%m/%d %H:%M:%S')
    utils.logging(log_folder,sttime)
    logging_state = {
        "API": "/download-filtered-info/",
        "user":current_user.username,
        "doc_id": download_request.document_id,
        "update_id":download_request.update_id,
        # "para_id":download_request.para_id
    }
    utils.logging(log_folder, json.dumps(logging_state))

    document = document_crud.get_document(db,download_request.document_id)
    update = document_crud.get_last_update(db,download_request.document_id,current_user.id)
    print(download_request)
    user_notes = update.get_user_notes()
    ori_rel = document.get_relations()
    cur_rel = utils.execute_user_note_on_relations(user_notes,ori_rel)
    ent_result = utils.filter_entities(cur_rel,download_request.filtering_entity_types)
    # print(ent_result)
    print("-----------------------------------")

    rel_result = utils.filter_relations(cur_rel, download_request.filtering_relation_types)
    
    # print(ent_result)
    
    print("-----------------------------------")
    # print(cur_rel)

    result = utils.merge_filtered_entities(ent_result, rel_result)
    utils.h_log(log_folder)
    return result

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

    sttime = datetime.now().strftime('%Y/%m/%d %H:%M:%S')
    utils.logging(log_folder,sttime)
    logging_state = {
        "API": "/upload-pdf-queue/",
        "user":current_user.username,
        "file_location": file_location,
        "filename": file.filename
    }
    utils.logging(log_folder, json.dumps(logging_state))

    # save document to data before enqueue the task

    
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
    utils.logging(log_folder, json.dumps({
        "task_id": task.id
    }))
    utils.h_log(log_folder)
    return {"task_id": task.id, "status": "queued", "infor":info_obj}

@router.get("/task-status/{task_id}/")
async def get_task_status(task_id: str):
    task_result = AsyncResult(task_id, app=celery_app)
    if task_result.state == "PENDING":
        return {"task_id": task_id, "status": "pending"}
    elif task_result.state == "SUCCESS":
        return {"task_id": task_id, "status": "completed", "result": task_result.result}
    elif task_result.state == "FAILURE":
        return {"task_id": task_id, "status": "failed", "error": str(task_result.info)}
    else:
        return {"task_id": task_id, "status": task_result.state}
    
@router.post("/save/")
async def create_new_update(
    update_entity = document_schemas.NewUpdateEntity,
    current_user: user_model.User = Depends(get_current_user),
    db: Session = Depends(get_db)
    ):
    
    return {"status":"done"}