from sqlalchemy.orm import Session
from models.document import Document,Update
from sqlalchemy import and_

def create_document(db: Session, user_id: int, paragraphs: list, file_path: str, file_name: str, entities: dict, relation: dict, event: dict, position: dict):
    document = Document(
        UserID=user_id,
        FilePath=file_path,
        FileName=file_name
    )
    document.set_paragraphs(paragraphs)
    document.set_entities(entities)
    document.set_relations(relation)
    document.set_events(event)
    document.set_positions(position)
    
    db.add(document)
    db.commit()
    db.refresh(document)
    return document


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

