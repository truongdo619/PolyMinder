from sqlalchemy.orm import Session
import unittest
import copy

import sys
sys.path.append("/home/antrieu/RIKEN/")


# from schemas import document as document_schemas
from schemas.document import DownloadDocumentSchema, Filtering
from database import get_dev_db as get_db
from models.psql import user as user_model
from crud.psql import document as document_crud
from crud.psql import user as user_crud
from utils.utils import get_cur_relations_entities, compose_update_event_content
from utils import utils
from ner_re_processing import convert_to_output_v2

class Test_convert_output_to_full_pdf_creating_function_with_entity_type_setting(unittest.TestCase):
    def testcase1(self):
        db = next(get_db())
        

if __name__ == "__main__":
    unittest.main()
    