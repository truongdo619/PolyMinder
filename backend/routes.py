from fastapi import APIRouter, File, UploadFile
from fastapi.responses import JSONResponse
import os
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from datetime import timedelta, datetime
from typing import List
from crud import user as user_crud
from crud import document as document_crud
from models import user as user_model
from models import document as document_model
from utils import utils
from database import get_db
from typing import List  
from config import UPLOAD_DIR
from utils.utils import read_json_file_utf8
from ner_re_processing import convert_to_NER_model_input_format, convert_to_RE_model_input_format, convert_to_output_v2
from pdf_processing import process_pdf_to_text, convert_pdf_to_text_and_bounding_boxes
from NER.main_predict import inference
from RE.main_predict import predict_re
import json
from schemas import user  as user_schemas 
from schemas import document as document_schemas



oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")



router = APIRouter()

data_sample = read_json_file_utf8("sample_output.json")

@router.post("/process-pdf/")
async def upload_pdf(file: UploadFile = File(...)):
    if file.content_type != "application/pdf":
        return JSONResponse(status_code=400, content={"message": "Only PDF files are allowed"})

    file_location = os.path.join(UPLOAD_DIR, file.filename)
    with open(file_location, "wb") as f:
        f.write(await file.read())

    sections = process_pdf_to_text(file_location)
    data_mapping = {}
    paragraphs = []
    for key in sections.keys():
        data_mapping[key] = (len(paragraphs), len(paragraphs) + len(sections[key]))
        paragraphs += sections[key]
    ner_model_output = inference(convert_to_NER_model_input_format(paragraphs))
    re_model_input = convert_to_RE_model_input_format(ner_model_output)
    try:
        model_output = predict_re(re_model_input, ner_model_output)
    except Exception as e:
        print("Failed to predict relations!")
        return ner_model_output
    
    result = {}
    for key in data_mapping.keys():
        start, end = data_mapping[key]
        result[key] = model_output[start:end]
    return result


@router.post("/process-pdf-sample/")
async def process_pdf_sample(file: UploadFile = File(...)):
    if file.content_type != "application/pdf":
        return JSONResponse(status_code=400, content={"message": "Only PDF files are allowed"})

    file_location = os.path.join(UPLOAD_DIR, file.filename)
    with open(file_location, "wb") as f:
        f.write(await file.read())

    return data_sample


@router.post("/process-pdf-v2/")
async def process_pdf_v2(file: UploadFile = File(...)):
    if file.content_type != "application/pdf":
        return JSONResponse(status_code=400, content={"message": "Only PDF files are allowed"})

    file_location = os.path.join(UPLOAD_DIR, file.filename)
    with open(file_location, "wb") as f:
        f.write(await file.read())

    all_pages_text_data, all_pages_bb_data = convert_pdf_to_text_and_bounding_boxes(file_location)
    ner_model_output = inference(convert_to_NER_model_input_format(all_pages_text_data))
    re_model_input = convert_to_RE_model_input_format(ner_model_output)
    model_output = predict_re(re_model_input, ner_model_output)
    output  = convert_to_output_v2(model_output, all_pages_bb_data, all_pages_text_data)
    # output = {"doc":all_pages_text_data}
    return output

@router.post("/process-pdf-demo/")
async def process_pdf_demo(file: UploadFile = File(...)):
    if file.content_type != "application/pdf":
        return JSONResponse(status_code=400, content={"message": "Only PDF files are allowed"})

    file_location = os.path.join(UPLOAD_DIR, file.filename)
    with open(file_location, "wb") as f:
        f.write(await file.read())

    all_pages_text_data, all_pages_bb_data = convert_pdf_to_text_and_bounding_boxes(file_location)
    ner_model_output = inference(convert_to_NER_model_input_format(all_pages_text_data))
    # ner_model_output[0]["para_index"] = 0
    re_model_input = convert_to_RE_model_input_format(ner_model_output)
    model_output = predict_re(re_model_input, ner_model_output)
    # output  = convert_to_output_v2(model_output, all_pages_bb_data, all_pages_text_data)
    output = {"origin_text": all_pages_text_data,"doc":model_output}
    return output

@router.post("/extract-pdf/")
async def extract_pdf(file: UploadFile = File(...)):
    if file.content_type != "application/pdf":
        return JSONResponse(status_code=400, content={"message": "Only PDF files are allowed"})

    file_location = os.path.join(UPLOAD_DIR, file.filename)
    with open(file_location, "wb") as f:
        f.write(await file.read())

    return process_pdf_to_text(file_location)




from jose import JWTError, jwt

def get_current_user(db: Session = Depends(get_db), token: str = Depends(oauth2_scheme)):
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
def login_for_access_token(db: Session = Depends(get_db), form_data: OAuth2PasswordRequestForm = Depends()):
    # Try to find user by username first
    db_user = user_crud.get_user_by_username(db, form_data.username)
    
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

@router.post("/process-pdf-v3/")
async def process_pdf_v3(current_user: user_model.User = Depends(get_current_user),file: UploadFile = File(...),db: Session = Depends(get_db)):
    # try:
    #     current_user = get_current_user(db,token)
    # except :
    #     return {"message":"cretidential failed !!!!!"}
    if file.content_type != "application/pdf":
        return JSONResponse(status_code=400, content={"message": "Only PDF files are allowed"})

    file_location = os.path.join(UPLOAD_DIR, file.filename)
    with open(file_location, "wb") as f:
        f.write(await file.read())

    all_pages_text_data, all_pages_bb_data = convert_pdf_to_text_and_bounding_boxes(file_location)
    # ner_model_output=[]
    # for index,single_paragraph in enumerate(all_pages_text_data):
    #     para_ner_model_output = inference(convert_to_NER_model_input_format([single_paragraph]))
    #     para_ner_model_output[0]["para_index"]=index
    #     ner_model_output.extend(para_ner_model_output)

    ner_model_output = inference(convert_to_NER_model_input_format(all_pages_text_data))
    re_model_input = convert_to_RE_model_input_format(ner_model_output)
    model_output = predict_re(re_model_input, ner_model_output)
    output, normalized_all_pages_bb_data, normalized_all_pages_text_data = convert_to_output_v2(model_output, all_pages_bb_data, all_pages_text_data)
    current_doc = document_crud.create_document(db,current_user.id,normalized_all_pages_text_data,file_location,file.filename,ner_model_output,model_output,{},normalized_all_pages_bb_data)
    output["document_id"] = current_doc.id
    output["filename"] = current_doc.FileName
    return output

@router.post("/edit-paragraph")
def update_paragraph(data: document_schemas.ParaUpdate,current_user: user_model.User = Depends(get_current_user),db: Session = Depends(get_db)):
    # if current_user is not None:
    start = datetime.now()
    document = document_crud.get_document(db,data.document_id)
    old_pos = document.get_positions()
    old_text = document.get_paragraphs()
    old_entity = document.get_entities()
    old_relations = document.get_relations()
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
    changed_pos = utils.organize_new_box(changed_old_text,changed_old_pos,changed_para)
    # new_ner_model_output = inference(convert_to_NER_model_input_format(data.paragraphs))
    # new_ner_model_output = old_entity
    new_ner = inference(convert_to_NER_model_input_format(changed_para))
    new_re_model_input = convert_to_RE_model_input_format(new_ner)
    new_model_output = predict_re(new_re_model_input, new_ner)
    new_pos = old_pos
    for id,index in enumerate(changed_ids):
        old_entity[index] = new_ner[id]
        old_relations[index] = new_model_output[id]
        new_pos[index] = changed_pos[id]
    new_output, _, _ = convert_to_output_v2(old_relations, new_pos, data.paragraphs)
    update = document_crud.create_update(db,current_user.id,data.document_id,data.paragraphs,old_entity,old_relations,[],new_pos,[])
    new_output["document_id"] = data.document_id
    new_output["update_id"] = update.id
    new_output["filename"] = document.FileName
    # print(data.paragraphs)
    end = datetime.now()
    dist = end-start
    print(dist.seconds)
    return new_output

@router.post("/get-update")
def get_update(update_id:document_schemas.UpdateIDSchema, current_user: user_model.User = Depends(get_current_user),db: Session = Depends(get_db)):
    update = document_crud.get_update(db,update_id.update_id)
    return update

@router.post("/get-document")
def get_document(doc_id:document_schemas.DocIDSchema, current_user: user_model.User = Depends(get_current_user),db: Session = Depends(get_db)):
    document = document_crud.get_document(db,doc_id.doc_id)
    return document.get_paragraphs()

def collect_update(db,current_user,entity):
    document = document_crud.get_document(db,entity.document_id)
    update = None
    if entity.update_id >0:
        update = document_crud.get_update(db,entity.update_id)
    else:
        update = document_crud.create_update(db,current_user.id,entity.document_id,document.get_paragraphs(),document.get_entities(),document.get_relations(),document.get_events(),document.get_positions(),[])
    return update,document

def return_formated_result(db,entity,document,update,cur_entities):
    print(cur_entities[0])
    update.set_entities(cur_entities)  
    new_re_model_input = convert_to_RE_model_input_format(cur_entities)
    new_relation = predict_re(new_re_model_input, cur_entities)
    update.set_relations(new_relation)
    update = document_crud.modify_update_as_object(db,update.id,update)
    new_output, _, _ = convert_to_output_v2(new_relation, update.get_positions(), update.get_paragraphs())
    
    new_output["document_id"] = entity.document_id
    new_output["update_id"] = update.id
    new_output["filename"] = document.FileName
    return new_output

@router.post("/delete-entity")
def delete_entity(entity:document_schemas.DeleteEntitySchema,current_user: user_model.User = Depends(get_current_user),db: Session = Depends(get_db)):
    update,document = collect_update(db,current_user,entity)

    cur_entities = update.get_entities()
    for id in entity.ids:
        
        para_id = int(id.split("_")[0].replace("para",""))
        entity_id = id.split("_")[1]
        # for 
        for e in cur_entities[para_id]["entities"]:
            if e[0] == entity_id:
                cur_entities[para_id]["entities"].remove(e)

    return return_formated_result(db,entity,document,update,cur_entities)

@router.post("/update-entity")
def update_entity(entity:document_schemas.UpdateEntitySchema,current_user: user_model.User = Depends(get_current_user),db: Session = Depends(get_db)):
    update,document = collect_update(db,current_user,entity)    

    cur_entities = update.get_entities() 
    # cur_entities = document.get_entities() 
    id = entity.id
    para_id = int(id.split("_")[0].replace("para",""))
    entity_id = id.split("_")[1]
    for e in cur_entities[para_id]["entities"]:
        if e[0] == entity_id:
            e[1] = entity.type
            # e[2][0] = entity.head_pos
            # e[2][-1] = entity.tail_pos
            e[2] = [[entity.head_pos,entity.tail_pos]]
            e[-1] = cur_entities[para_id]["text"][entity.head_pos:entity.tail_pos]
    print(cur_entities[para_id]["entities"])
    return return_formated_result(db,entity,document,update,cur_entities)

@router.post("/create-entity")
def delete_entity(entity:document_schemas.CreateEntitySchema,current_user: user_model.User = Depends(get_current_user),db: Session = Depends(get_db)): 
    update,document = collect_update(db,current_user,entity)

    cur_entities = update.get_entities()
    new_id_number = len(cur_entities[entity.para_id]["entities"])+1
    new_id = f"T{new_id_number}"
    cur_entities[entity.para_id]["entities"].append([
        new_id,
        entity.comment,
        [[
            entity.head_pos,
            entity.tail_pos
        ]],
        cur_entities[entity.para_id]["text"][entity.head_pos:entity.tail_pos]
    ])

    return return_formated_result(db,entity,document,update,cur_entities)



@router.post("/update-relations")
def update_relation(entity:document_schemas.UpdateRelationSchema,current_user: user_model.User = Depends(get_current_user),db: Session = Depends(get_db)):
    update,document = collect_update(db,current_user,entity)
    id = entity.entity_id
    para_id = int(id.split("_")[0].replace("para",""))
    entity_id = id.split("_")[1]
    new_relations = entity.relations
    converted_relations = []
    for n_rel in new_relations:
        # if "para" in n_rel.id:
        #     r_id = n_rel.id.split("_")[1]
        # else:
        #     r_id = n_rel.id
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
    print("new rel ",converted_relations)
    relations = update.get_relations()
    


    original_relations = relations[para_id]["relations"]
    # new_relations = utils.compare_versions(utils.filter_by_arg1(original_relations,entity_id),converted_relations)
    new_relations = utils.update_relations(original_relations,converted_relations,entity_id)
    relations[para_id]["relations"] = new_relations
    update.set_relations(relations)
    update = document_crud.modify_update_as_object(db,update.id,update)
    print("total relation ",new_relations)
    new_output, _, _ = convert_to_output_v2(relations, update.get_positions(), update.get_paragraphs())
    new_output["document_id"] = entity.document_id
    new_output["update_id"] = update.id
    new_output["filename"] = document.FileName
    return new_output
    # return return_formated_result(db,entity,document,update,cur_entities)

