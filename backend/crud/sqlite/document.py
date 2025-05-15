from sqlalchemy.orm import Session
from models.sqlite.document import Document,Update
from sqlalchemy import and_
from datetime import datetime
import random
def create_document(db: Session, user_id: int, paragraphs: list, file_path: str, file_name: str, entities: dict, relation: dict, event: dict, position: dict, infor: dict):
    new_id = generate_unique_id(db,Document)
    document = Document(
        id=new_id,
        UserID=user_id,
        FilePath=file_path,
        FileName=file_name
    )
    document.set_paragraphs(paragraphs)
    document.set_entities(entities)
    document.set_relations(relation)
    document.set_events(event)
    document.set_positions(position)
    document.set_infor(infor)
    print(document.UploadTime)
    db.add(document)
    db.commit()
    db.refresh(document)
    return document

def update_document(db:Session,document_id: int,document: Document ):
    doc = db.query(Document).filter_by(id=document_id).first()
    if doc:
        doc.set_paragraphs(document.get_paragraphs())
        doc.set_entities(document.get_entities())
        doc.set_relations(document.get_relations())
        doc.set_events(document.get_events())
        doc.set_positions(document.get_positions())
        doc.set_infor(document.get_infor())
        db.commit()
        db.refresh(doc)
        return doc

def get_document(db: Session, document_id: int):
    document = db.query(Document).filter(Document.id == document_id).first()
    if document:
        return document
        # return {
        #     "id": document.id,
        #     "Paragraphs": document.get_paragraphs(),
        #     "FilePath": document.FilePath,
        #     "FileName": document.FileName,
        #     "Entities": document.get_entities(),
        #     "Relation": document.get_relation(),
        #     "Event": document.get_event(),
        #     "Position": document.get_position(),
        #     "UserID": document.UserID
        # }

def delete_document(db:Session,document_id: int):
    doc = db.query(Document).filter(Document.id == document_id).first()
    # updates = db.query(Update).filter()
    # Check if document exists
    if doc:
        #delete the relevant updates
        db.query(Update).filter(Update.DocumentID == document_id).delete()
        # Delete the document
        
        db.delete(doc)
        # Commit the changes to the database
        db.commit()
        return {"message": "Document deleted successfully"}
    else:
        return {"error": "Delete incompleted"}

def create_update(db: Session, user_id: int,document_id:int, paragraphs: list, entities: dict, relation: dict, event: dict, position: dict, userNote: dict):
    update = Update(
        UserID=user_id,
        DocumentID=document_id
    )
    update.set_paragraphs(paragraphs)
    update.set_entities(entities)
    update.set_relations(relation)
    update.set_events(event)
    update.set_positions(position)
    update.set_user_notes(userNote)
    db.add(update)
    db.commit()
    db.refresh(update)
    return update

def get_update_of_user(db: Session, document_id: int, user_id:int):
    update = db.query(Update).filter(and_(Update.DocumentID == document_id,Update.UserID==user_id)).first()
    if update:
        return update
        # return {
        #     "id": update.id,
        #     "DocumentID": update.DocumentID,
        #     "Paragraphs": update.get_paragraphs(),
        #     "FilePath": update.FilePath,
        #     "FileName": update.FileName,
        #     "Entities": update.get_entities(),
        #     "Relation": update.get_relation(),
        #     "Event": update.get_event(),
        #     "UserNote": update.get_user_note(),
        #     "Position": update.get_position(),
        #     "UserID": update.UserID
        # }
    
def get_update(db: Session, update_id: int):
    update = db.query(Update).filter(Update.id == update_id).first()
    if update:
        return update
        # return {
        #     "id": update.id,
        #     "DocumentID": update.DocumentID,
        #     "Paragraphs": update.get_paragraphs(),
        #     "Entities": update.get_entities(),
        #     "Relation": update.get_relation(),
        #     "Event": update.get_event(),
        #     "UserNote": update.get_user_note(),
        #     "Position": update.get_position(),
        #     "UserID": update.UserID
        # }
    
def update_update(db: Session, update_id: int,document_id:int, paragraphs: list, entities: dict, relation: dict, event: dict, position: dict, userNote: dict):
    update_to_update = db.query(Update).filter_by(id=update_id).first()
    if update_to_update:
        update_to_update.set_paragraphs(paragraphs)
        update_to_update.set_entities(entities)
        update_to_update.set_relations(relation)
        update_to_update.set_events(event)
        update_to_update.set_positions(position)
        update_to_update.set_user_notes(userNote)
        db.commit()
        db.refresh(update_to_update)
        return update_to_update

def modify_update_as_object(db: Session,update_id: int,modified_update: Update):
    update_to_update = db.query(Update).filter_by(id=update_id).first()
    if update_to_update:
        update_to_update.set_paragraphs(modified_update.get_paragraphs())
        update_to_update.set_entities(modified_update.get_entities())
        update_to_update.set_relations(modified_update.get_relations())
        update_to_update.set_events(modified_update.get_events())
        update_to_update.set_positions(modified_update.get_positions())
        update_to_update.set_user_notes(modified_update.get_user_notes())
        db.commit()
        db.refresh(update_to_update)
        return update_to_update
    
def delete_update(db: Session, update_id: int):
    update_to_delete = db.query(Update).filter_by(id=update_id).first()
    if update_to_delete:
        db.delete(update_to_delete)
        db.commit()

def get_user_document(db:Session,user_id: int):
    print("get documents of {}".format(user_id))
    doc = db.query(Document).filter(Document.UserID==user_id).all()
    return doc

def get_last_update(session: Session, document_id: int,user_id: int):
    """
    Fetches the last Update instance for a given DocumentID.
    
    Parameters:
        session (Session): The SQLAlchemy session to use for the query.
        document_id (int): The DocumentID to filter the Update instances.
    
    Returns:
        Update: The last Update instance for the specified DocumentID or None if not found.
    """
    document = get_document(session,document_id)
    last_update = session.query(Update).filter(Update.DocumentID == document_id).order_by(Update.id.desc()).first()
    if last_update:
        return last_update
    else:
        # count the number of paragraphs base on text (old way), cause bug because of number of paragraphs change after preparation of re_model
        num_para = len(document.get_paragraphs())
        # -> solution : count number pf para base on relations or entities.
        # num_para = len(document.get_paragraphs())
        init_content = []
        for i in range(num_para):
            init_content.append({
                "entities":[],
                "relations":[]
            })
        init_user_note = [{
            "action":"update",
            "target":"edit_status",
            "content":init_content
        }]
        new_update = create_update(session, user_id,document_id,[],document.get_entities(),[],[],[],init_user_note)
        
        return new_update

def generate_unique_id(session, model, id_field="id"):
    """
    Generate a unique 10-digit ID for a given SQLAlchemy model.
    
    :param session: The SQLAlchemy session.
    :param model: The SQLAlchemy model to check uniqueness against.
    :param id_field: The name of the ID field in the model.
    :return: A unique 10-digit integer ID.
    """
    while True:
        # Generate a random 10-digit number
        unique_id = random.randint(1000000000, 9999999999)
        
        # Check if the ID already exists in the database
        existing = session.query(model).filter(getattr(model, id_field) == unique_id).first()
        if not existing:
            return unique_id