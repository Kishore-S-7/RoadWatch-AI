import random
import string
from typing import Any, Dict
from datetime import datetime
from bson import ObjectId


def fix_mongo_id(doc: Dict[str, Any]) -> Dict[str, Any]:
    if not doc:
        return doc
    doc_copy = dict(doc)
    if "_id" in doc_copy:
        doc_copy["id"] = str(doc_copy.pop("_id"))
    return doc_copy


def is_valid_object_id(val: str) -> bool:
    if not val:
        return False
    return ObjectId.is_valid(val)


def generate_complaint_reference() -> str:
    year = datetime.utcnow().year
    digits = "".join(random.choices(string.digits, k=6))
    return f"RW-{year}-{digits}"

