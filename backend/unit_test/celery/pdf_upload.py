from sqlalchemy.orm import Session
import unittest
import copy

import sys
sys.path.append("/home/antrieu/RIKEN/")
import re

# from schemas import document as document_schemas
from schemas.document import DownloadDocumentSchema, Filtering
from database import get_dev_db as get_db
from models.psql import user as user_model
from crud.psql import document as document_crud
from crud.psql import user as user_crud
from utils.utils import get_cur_relations_entities, compose_update_event_content
from utils import utils
from ner_re_processing import convert_to_output_v2


def add_char_positions(event_obj: dict, relation_obj: dict) -> dict:
    """
    For each trigger/argument in event_obj["events"], find its character span in relation_obj["text"]
    using a resilient whitespace‐and‐subword matching strategy, then update:
      - trigger["char_start"], trigger["char_end"]
      - trigger["text"] to the exact substring in relation_obj["text"]
      - same for each argument
    """
    text = relation_obj["text"]
    out = copy.deepcopy(event_obj)

    # Precompute whitespace‐stripped text + index map
    nospace, idx_map = [], []
    for i, ch in enumerate(text):
        if not ch.isspace():
            nospace.append(ch)
            idx_map.append(i)
    nospace = "".join(nospace)

    def find_span(phrase: str) -> tuple[int,int]:
        norm = phrase.strip()
        # 1) Flexible whitespace regex
        esc = re.escape(norm)
        pattern = esc.replace(r"\ ", r"\s+")
        m = re.search(pattern, text)
        if m:
            return m.start(), m.end()
        # 2) Collapsed‐spaces fallback
        collapsed = re.sub(r"\s+", "", norm)
        idx2 = nospace.find(collapsed)
        if idx2 != -1:
            start = idx_map[idx2]
            end   = idx_map[idx2 + len(collapsed) - 1] + 1
            return start, end
        # 3) Token‐by‐token
        tokens = re.split(r"\s+", norm)
        search_pos = 0
        for tok in tokens:
            i = text.find(tok, search_pos)
            if i < 0:
                raise ValueError(f"Cannot find subtoken {tok!r} of {phrase!r}")
            if tok is tokens[0]:
                start = i
            search_pos = i + len(tok)
        end = search_pos
        return start, end

    for ev in out["events"]:
        # Trigger
        s, e = find_span(ev["trigger"]["text"])
        ev["trigger"]["char_start"] = s
        ev["trigger"]["char_end"]   = e
        # Update trigger text to exact substring
        ev["trigger"]["text"] = text[s:e]

        # Arguments
        for arg in ev.get("arguments", []):
            s, e = find_span(arg["text"])
            arg["char_start"] = s
            arg["char_end"]   = e
            # Update argument text too
            arg["text"] = text[s:e]

    return out

class TestFindPos(unittest.TestCase):
    def test1(self):
        a = 'μ'
        b = 'smaller  than  100  μ m'

if __name__ == "__main__":
    unittest.main()
    
