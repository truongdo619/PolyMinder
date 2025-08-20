import os, sys
BASE_DIR = os.getenv("ANNOTATOR_BASE", "/default/path/to/repo")
if BASE_DIR not in sys.path:
    sys.path.append(BASE_DIR)

from ..annotators.polymer.annotator import PolymerAnnotator

import importlib

def load_annotator(module_name: str, class_name: str):
    """
    Dynamically import an annotator by module and class name.
    """
    module = importlib.import_module(module_name)
    return getattr(module, class_name)

AnnotatorClass = load_annotator(
    module_name="annotators.polymer.annotator",
    class_name="PolymerAnnotator"
)
annotator = AnnotatorClass()