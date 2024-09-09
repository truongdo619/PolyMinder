from pydantic import BaseModel
from typing import List
from typing import Optional
class ParaUpdate(BaseModel):
    document_id: int
    paragraphs: List[str]

class DeleteEntitySchema(BaseModel):
    document_id: int
    update_id: int
    ids: List[str]

class Rect(BaseModel):
    x1: float
    y1: float
    x2: float
    y2: float
    width: float
    height: float
    pageNumber: int

class Position(BaseModel):
    rects: List[Rect]
    boundingRect: Rect

class Relation(BaseModel):
    type: str
    arg_type: str
    arg_id: str
    arg_text: str
    id: Optional[str]=None

class Content(BaseModel):
    text: str

class Highlight(BaseModel):
    id: str
    comment: str
    content: Content
    position: Position
    relations: List[Relation]
    para_id: int
    head_pos: int
    tail_pos: int

class UpdateIDSchema(BaseModel):
    update_id: int

class DocIDSchema(BaseModel):
    doc_id: int

class UpdateEntitySchema(BaseModel):
    id: str
    document_id: int
    update_id: int
    head_pos: int
    tail_pos: int
    type: str
    # text: str

class CreateEntitySchema(BaseModel):
    comment: str
    para_id: int
    head_pos: int
    tail_pos: int
    document_id: int
    update_id: int

class DeleteRelationSchema(BaseModel):
    
    document_id: int
    update_id: int
    entity_id: str
    relation_id: int

# class Relation(BaseModel):
#     type: str
#     arg_type: str
#     arg_text: str 
#     arg_id: str
#     id: str

class UpdateRelationSchema(BaseModel):
    
    document_id: int
    update_id: int
    entity_id: str
    relations: List[Relation]