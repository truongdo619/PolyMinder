from pydantic import BaseModel
from typing import List
from typing import Optional
class ParaUpdate(BaseModel):
    document_id: Optional[int] = None
    update_id: Optional[int] = None
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


class CreateEntitySchema(BaseModel):
    comment: str
    para_id: int
    position: Position
    document_id: int
    update_id: Optional[int]
    scale_value: float

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
    update_id: Optional[int]

class DocIDSchema(BaseModel):
    doc_id: int

class UpdateEntitySchema(BaseModel):
    id: str
    document_id: int
    update_id: Optional[int]
    head_pos: int
    tail_pos: int
    type: str
    # text: str

class DeleteRelationSchema(BaseModel):
    
    document_id: int
    update_id: Optional[int]
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
    update_id: Optional[int]
    entity_id: str
    relations: List[Relation]

class TextUpload(BaseModel):
    text:str

class ChangeEditStatusSchema(BaseModel):
    document_id: int
    update_id: int
    id: str

class DownloadEntity(BaseModel):
    document_id: int
    update_id: int
    type: str

class Filtering(BaseModel):
    type: str
    sub_type: List[str]

class DownloadFiltering(BaseModel):
    document_id: int
    update_id:int
    filtering_entity_types: List[Filtering]
    filtering_relation_types: List[Filtering]

class DownloadParaEntity(BaseModel):
    document_id: int
    update_id: int
    para_id: int
    
class NewUpdateEntity(BaseModel):
    document_id: int
    update_id: int
    update_name: str
    
class LegacyCreateEntitySchema(BaseModel):
    comment: str
    para_id: int
    position: Optional[Position] = None
    document_id: int
    update_id: int
    head_pos: Optional[int]= None
    tail_pos: Optional[int]= None
    scale_value: Optional[float]= None

class ReorderPara(BaseModel):
    document_id: int
    update_id: Optional[int] =None
    old_para_id:Optional[int] = None
    paragraphs:List[int]