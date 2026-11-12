import pytest
from app.services.progress_service import calculate_progress_from_milestones, validate_milestone_weights


def test_core_formula_specification_example():
    """
    Test the exact specification example from the prompt:
      Land Preparation 20% weight, 100% done -> 20.0
      Base Layer       30% weight, 100% done -> 30.0
      Asphalt Laying   40% weight, 50% done  -> 20.0
      Finishing Work   10% weight, 0% done   -> 0.0
      Calculated progress must yield exactly 70.0
    """
    milestones = [
        {"name": "Land Preparation", "weight": 20.0, "completion": 100.0},
        {"name": "Base Layer", "weight": 30.0, "completion": 100.0},
        {"name": "Asphalt Laying", "weight": 40.0, "completion": 50.0},
        {"name": "Finishing Work", "weight": 10.0, "completion": 0.0},
    ]

    result = calculate_progress_from_milestones(milestones)
    assert result == 70.0, f"Expected 70.0, got {result}"


def test_empty_milestones():
    assert calculate_progress_from_milestones([]) == 0.0


def test_all_completed_milestones():
    milestones = [
        {"name": "Phase 1", "weight": 50.0, "completion": 100.0},
        {"name": "Phase 2", "weight": 50.0, "completion": 100.0},
    ]
    assert calculate_progress_from_milestones(milestones) == 100.0


def test_fractional_milestones():
    milestones = [
        {"name": "Phase 1", "weight": 33.33, "completion": 33.33},
        {"name": "Phase 2", "weight": 66.67, "completion": 50.0},
    ]
    # 33.33 * 33.33 / 100 = 11.108889
    # 66.67 * 50.0 / 100 = 33.335
    # Total = 44.443889 -> rounded to 44.44
    assert calculate_progress_from_milestones(milestones) == 44.44


def test_validate_milestone_weights_within_limit():
    existing = [
        {"_id": "1", "weight": 40.0},
        {"_id": "2", "weight": 30.0},
    ]
    is_valid, projected, msg = validate_milestone_weights(existing, 30.0)
    assert is_valid is True
    assert projected == 100.0
    assert msg == ""


def test_validate_milestone_weights_exceeds_100():
    existing = [
        {"_id": "1", "weight": 60.0},
        {"_id": "2", "weight": 30.0},
    ]
    # 60 + 30 + 15 = 105 (> 100)
    is_valid, projected, msg = validate_milestone_weights(existing, 15.0)
    assert is_valid is False
    assert projected == 105.0
    assert "cannot exceed 100%" in msg


def test_validate_milestone_weights_updating_existing():
    existing = [
        {"_id": "m1", "weight": 40.0},
        {"_id": "m2", "weight": 30.0},
    ]
    # Updating m2 from 30.0 to 40.0: total becomes 40 + 40 = 80 (<= 100)
    is_valid, projected, msg = validate_milestone_weights(existing, 40.0, updating_milestone_id="m2")
    assert is_valid is True
    assert projected == 80.0

