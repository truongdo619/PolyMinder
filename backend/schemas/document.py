from pydantic import BaseModel, field_serializer
from typing import List
from typing import Optional
import re

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
    user_comment: Optional[str]=""

class Relation(BaseModel):
    type: str
    arg_type: str
    arg_id: str
    arg_text: str
    id: Optional[str]=None

    @property
    def para_id(self):
        return int(self.id.split("_")[0].split("para")[1])

    @property
    def relation_id(self):
        return self.id.split("_")[1]
    
    @staticmethod
    def parse_id(id):
        return int(id.split("_")[0].split("para")[1]), id.split("_")[1]

    @staticmethod
    def valid_id(id):
        return re.match(r"para(\d+)_(R\d+)", id)

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
    comment: Optional[str]=""
    user_comment: Optional[str]=""
    @property
    def para_id(self):
        return int(self.id.split("_")[0].split("para")[1])

    @property
    def entity_id(self):
        return self.id.split("_")[1]
    
    @staticmethod
    def parse_id(id):
        return int(id.split("_")[0].split("para")[1]), id.split("_")[1]
    
    @staticmethod
    def valid_id(id):
        return re.match(r"para(\d+)_(T\d+)", id)

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
    @field_serializer('sub_type', when_used='always')
    def rank_serialize(sub_type : List[str] ):
        result = 'sub_type : ' + " ".join(sub_type) 
        return result

class DownloadFiltering(BaseModel):
    document_id: int
    update_id:int
    filtering_entity_types: List[Filtering]
    filtering_relation_types: List[Filtering]

class DownloadParaEntity(BaseModel):
    document_id: int
    update_id: int
    para_id: int
    
class DownloadJSONSchema(BaseModel):
    document_id: int
    update_id: int
    mode: str
    para_id: Optional[int] = None
    filtering_entity_types: Optional[List[Filtering]] = None
    filtering_relation_types: Optional[List[Filtering]] = None
    type: Optional[str] = None

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

class VisibleList(BaseModel):
    document_id: int
    update_id: int
    visible_list: List[bool]

class DownloadDocumentSchema(BaseModel):
    document_id: int
    update_id: int
    mode: str
    para_id: Optional[int] = None
    filtering_entity_types: Optional[List[Filtering]] = None
    filtering_relation_types: Optional[List[Filtering]] = None
    type: Optional[str] = None

    @field_serializer('filtering_entity_types', when_used='always')
    def rank_serialize(filtering_entity_types : List[Filtering] ):
        final_result = ""
        for filter in filtering_entity_types:
            result = "entity type :"+  filter.type
            result += "relation sub type: [{}]".format(" ".join(filter.sub_type))
            final_result+=f"{result}\n"
        return final_result
    @field_serializer('filtering_relation_types', when_used='always')
    def rank_serialize(filtering_entity_types : List[Filtering] ):
        final_result = ""
        for filter in filtering_entity_types:
            result = "relation type :"+  filter.type
            result += "entity sub type: [{}]".format(" ".join(filter.sub_type))
            final_result+=f"{result}\n"
        return final_result
    
def custom_serializer(obj):
    if isinstance(obj, Filtering):
        return {"name": obj.type, "value": "[{}]".format(" ".join(obj.sub_type))}
    raise TypeError(f"Object of type {obj.__class__.__name__} is not JSON serializable")