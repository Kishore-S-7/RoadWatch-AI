import pytest
from app.services.alert_service import verify_project_progress


def test_alert_difference_logic():
    reported = 80.0
    calculated = 70.0
    threshold = 10.0
    diff = round(abs(reported - calculated), 2)
    
    assert diff == 10.0
    # Boundary: if threshold is 10.0, diff > threshold is False when diff == 10.0
    assert (diff > threshold) is False
    
    # If reported is 81.0, diff = 11.0 > 10.0 -> Alert triggered
    reported_higher = 81.0
    diff_higher = round(abs(reported_higher - calculated), 2)
    assert diff_higher == 11.0
    assert (diff_higher > threshold) is True


def test_alert_lower_reported_discrepancy():
    # If admin under-reports or misreports by > threshold
    reported = 40.0
    calculated = 70.0
    threshold = 10.0
    diff = round(abs(reported - calculated), 2)
    assert diff == 30.0
    assert (diff > threshold) is True

