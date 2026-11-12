import pytest
import re
from app.utils.ids import generate_complaint_reference


def test_complaint_reference_format():
    ref = generate_complaint_reference()
    # Format: RW-YYYY-XXXXXX where YYYY is year, XXXXXX is 6 digits
    assert re.match(r"^RW-\d{4}-\d{6}$", ref) is not None


def test_complaint_reference_uniqueness():
    refs = {generate_complaint_reference() for _ in range(100)}
    assert len(refs) == 100

