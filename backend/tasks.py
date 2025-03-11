from celery_app import app
from utils.utils import read_json_file_utf8
from ner_re_processing import convert_to_NER_model_input_format, convert_to_RE_model_input_format, convert_to_output_v2
from pdf_processing import process_pdf_to_text, convert_pdf_to_text_and_bounding_boxes
from NER.main_predict import inference, load_ner_model
from RE.main_predict import predict_re, load_re_model
from crud.psql import user as user_crud
from crud.psql import document as document_crud
from models.psql import user as user_model
from models.psql import document as document_model
from utils import utils
from database import get_db

from datetime import datetime
import traceback

import smtplib
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
gmail_app_password="goir ptrm pzau pikb"

ner_model = None
ner_logger = None
ner_config = None
re_tokenizer =None
re_base_model = None
re_config = None

def serialize(value):
    if isinstance(value, datetime):
        return value.strftime("%Y/%m/%d, %H:%M:%S")
    return value

def convert_statistic_info(statistic_info):
    """
    Convert datetime objects in the dictionary to ISO 8601 strings.
    """
    
    
    return {key: serialize(value) for key, value in statistic_info.items()}



def send_email(to_email,user ,document):
    # Set up the SMTP server
    smtp_host = 'smtp.gmail.com'  # Replace with your SMTP server
    smtp_port = 587  # Port for TLS
    from_email = 'polyminder.no.reply@gmail.com'  # Replace with your email
    password = gmail_app_password  # Replace with your email password
    email_title ="[Polyminder] Document Processing Notification"
    # Create the email message
    msg = MIMEMultipart()
    msg['From'] = from_email
    msg['To'] = to_email
    msg['Subject'] = email_title
    current_infor = document.get_infor()
    # Attach the body with the msg instance
    filename = current_infor["filename"]
    upload_time = current_infor["upload_time"]
    entities = current_infor["entities"]
    relations = current_infor["relations"]
    pages = current_infor["pages"]
    status = current_infor["status"]
    html_content = f"""
    <html>
    <body>
        <p>Dear Mr/Mrs <b>{user.username}</b>,</p>
        <p>The processing of document with id : {document.id} has been completed . Please go check the result at you home page.</p>
        <h3>Document Details:</h3>
            <ul>
                <li><strong>Document ID:</strong> {document.id}</li>
                <li><strong>File name:</strong> {filename}</li>
                <li><strong>Submitted on:</strong> {upload_time}</li>
                <li><strong>Number of extracted Entities:</strong> {entities}</li>
                <li><strong>Number of extracted Relations:</strong> {relations}</li>
                <li><strong>Number of pages:</strong> {pages}</li>
                <li><strong>Status:</strong> {status}</li>
            </ul>
        <p> Thank you for using service of Polyminder!</P>
        <p>Best regards</p>
    </body>
    </html>
    """
    msg.attach(MIMEText(html_content, 'html'))

    # Connect to the SMTP server
    try:
        server = smtplib.SMTP(smtp_host, smtp_port)
        server.starttls()  # Use TLS for security
        server.login(from_email, password)  # Login with your email and password

        # Send the email
        server.sendmail(from_email, to_email, msg.as_string())
        print("Email sent successfully!")

    except Exception as e:
        print(f"Failed to send email. Error: {str(e)}")

    finally:
        server.quit()

@app.task
def process_pdf_task(file_path, user_id, doc_id):
    # Initialize DB session from `db_url`
    global ner_model, ner_logger, ner_config, re_tokenizer, re_base_model, re_config
    if ner_model is None:
        # The first time the worker calls this task, load the model
        # from NER.main_predict import load_model
        ner_model, ner_logger, ner_config = load_ner_model()
    if re_base_model is None:
        re_tokenizer, re_base_model, re_config = load_re_model()
    db = next(get_db())
    
    try:
        user = user_crud.get_user(db,user_id)
        print("start parsing pdf")
        all_pages_text_data, all_pages_bb_data = convert_pdf_to_text_and_bounding_boxes(file_path)
        print("parsed {} paragraphs".format(len(all_pages_text_data)))
        print(all_pages_text_data)
        print("done parsing pdf")
        current_doc = document_crud.get_document(db,doc_id)
        print("start ner pdf")
        ner_model_output = inference(ner_model, ner_logger,ner_config,convert_to_NER_model_input_format(all_pages_text_data))
        print("start predict re")
        re_model_input = convert_to_RE_model_input_format(ner_model_output)
        model_output = predict_re(re_tokenizer, re_base_model,re_config, re_model_input, ner_model_output)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            
        print("done predict re")
        output, normalized_bb, normalized_text = convert_to_output_v2(model_output, all_pages_bb_data, all_pages_text_data)
        # current_doc = document_crud.get_document(db,current_doc.id)
        current_doc.set_positions(normalized_bb)
        current_doc.set_paragraphs(normalized_text)
        current_doc.set_relations(model_output)
        current_doc.set_entities(ner_model_output)
        # Save document to the database
        # current_doc = document_crud.create_document(
        #     db, user_id, normalized_text, file_path, filename, ner_model_output, model_output, {}, normalized_bb, []
        # )
        print("done save re and ner, ")
        print("start count num_rel ")
        num_ent, num_rel = utils.count_ent_and_rel(model_output)
        page_num = 0
    #### use loop to avoid the last element is empty list
        for box in all_pages_bb_data:
            if box == []:
                continue
            else:
                ##### in the case that did normalize text and bbox
                page_num = box[-1]["pageNumber"]
                ##### in the case that did not normalize text and bbox
                # page_num = box[-1][-1]["pageNumber"]
        print("done count num_rel ")
        info_obj = {
            "id": current_doc.id,
            "filename": current_doc.FileName,
            "upload_time": serialize(current_doc.UploadTime),
            "entities": num_ent,
            "relations": num_rel,
            "pages": page_num,
            "status": "completed"
        }
        current_doc.set_infor(info_obj)
        print("start update document ")
        document_crud.update_document(db, current_doc.id, current_doc)
        print("done update document ")
        send_email(user.email,user,current_doc)
        return info_obj
    except:
        print(traceback.format_exc())
        current_doc = document_crud.get_document(db,doc_id)
        info_obj = {
            "id": current_doc.id,
            "filename": current_doc.FileName,
            "upload_time": serialize(current_doc.UploadTime),
            "entities": 0,
            "relations": 0,
            "pages": 0,
            "status": "Failed"
        }
        current_doc.set_infor(info_obj)
        document_crud.update_document(db, current_doc.id, current_doc)
        send_email(user.email,user,current_doc)
    finally:
        db.close()  

@app.task
def re_run_re(update_id, user_id, document_id):
    global ner_model, ner_logger, ner_config, re_tokenizer, re_base_model, re_config
    if ner_model is None:
        # The first time the worker calls this task, load the model
        # from NER.main_predict import load_model
        ner_model, ner_logger, ner_config = load_ner_model()
    if re_base_model is None:
        re_tokenizer, re_base_model, re_config = load_re_model()
    db = next(get_db())
    try:
        update = document_crud.get_current_temporary_update(db,user_id,update_id,document_id)
        entities = update.get_entities()
        new_re_model_input = convert_to_RE_model_input_format(entities)
        new_relation = predict_re(re_tokenizer, re_base_model,re_config,new_re_model_input, entities)
        new_relation = utils.execute_user_note_on_relations(update.get_user_notes(),new_relation)
        update.set_relations(new_relation)
        update = document_crud.modify_update_as_object(db,update.id,update)
    finally:
        db.close()  

@app.task
def re_run(update_id, user_id, document_id, run_ner):
    global ner_model, ner_logger, ner_config, re_tokenizer, re_base_model, re_config
    if ner_model is None:
        # The first time the worker calls this task, load the model
        # from NER.main_predict import load_model
        ner_model, ner_logger, ner_config = load_ner_model()
    if re_base_model is None:
        re_tokenizer, re_base_model, re_config = load_re_model()
    db = next(get_db())
    try:
        document = document_crud.get_document(db,document_id)
        update = document_crud.get_current_temporary_update(db,user_id,update_id,document_id)
        # update = document_crud.get_last_update(db,document_id,current_user.id)
        user_notes = update.get_user_notes()
        paragraphs,old_bboxs, change_ids = utils.execute_user_note_on_paragraphs(user_notes=user_notes,paragraphs=document.get_paragraphs(),old_bboxs=document.get_positions())
        if run_ner:
            ner_model_output = inference(ner_model, ner_logger,ner_config,convert_to_NER_model_input_format(paragraphs))
            cur_entities = utils.execute_user_note_on_entities(user_notes,ner_model_output)
        else:
            cur_entities = update.get_entities()

        re_model_input = convert_to_RE_model_input_format(cur_entities)
        model_output = predict_re(re_tokenizer, re_base_model,re_config,re_model_input, cur_entities)
        cur_relations = utils.execute_user_note_on_relations(user_notes,model_output)

        update.set_relations(cur_relations)
        update = document_crud.modify_update_as_object(db,update.id,update)
    finally:
        db.close()  

@app.task
def re_run_for_changed_para(update_id, user_id, document_id):
    global ner_model, ner_logger, ner_config, re_tokenizer, re_base_model, re_config
    if ner_model is None:
        # The first time the worker calls this task, load the model
        # from NER.main_predict import load_model
        ner_model, ner_logger, ner_config = load_ner_model()
    if re_base_model is None:
        re_tokenizer, re_base_model, re_config = load_re_model()
    db = next(get_db())
    try:
        update = document_crud.get_current_temporary_update(db,user_id,update_id,document_id)
        document = document_crud.get_document(db,document_id)
        user_notes = update.get_user_notes()
        old_entity = document.get_entities()
        old_relations = document.get_relations()

        changed_ids, changed_para, changed_old_text, changed_old_pos = [], [], [], []
        old_para = document.get_paragraphs()
        old_bboxs =document.get_positions()
        new_para , new_bbox, change_ids = utils.execute_user_note_on_paragraphs(user_notes,old_para, old_bboxs)
        for index, para in enumerate(new_para):
            if para != old_para[index]:
                changed_ids.append(index)
                changed_para.append(para)
                changed_old_text.append(old_para[index])
                changed_old_pos.append(old_bboxs[index])
                print("----------------------------------")
                print(old_para[index])
                print(para)
        print("changed_ids", changed_ids)
        new_ner = inference(ner_model, ner_logger,ner_config,convert_to_NER_model_input_format(changed_para))
        new_re_model_input = convert_to_RE_model_input_format(new_ner)
        new_model_output = predict_re(re_tokenizer, re_base_model,re_config,new_re_model_input, new_ner)
        for id,index in enumerate(changed_ids):
            old_entity[index] = new_ner[id]
            old_relations[index] = new_model_output[id]

        update.set_entities(old_entity)
        update.set_relations(old_relations)
        update = document_crud.modify_update_as_object(db,update.id,update)
    finally:
        db.close()  


