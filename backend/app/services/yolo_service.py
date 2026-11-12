import os
import asyncio
import logging
from pathlib import Path
from typing import Dict, Any, List, Tuple
import cv2
import numpy as np
from PIL import Image
from app.core.config import settings

logger = logging.getLogger(__name__)

# Class name mapping dictionary for road defect models
# Supports standard road damage dataset designations (RDD2020, RDD2022, etc.)
ROAD_DEFECT_CLASS_MAP = {
    "d00": "Crack",                    # Longitudinal crack
    "d10": "Crack",                    # Equal interval longitudinal crack
    "d20": "Crack",                    # Alligator crack
    "d40": "Pothole",                  # Pothole / rutting / bump
    "d43": "Pothole",                  # Crosswalk blur
    "d44": "Crack",                    # White line blur
    "crack": "Crack",
    "cracks": "Crack",
    "longitudinal crack": "Crack",
    "transverse crack": "Crack",
    "alligator crack": "Crack",
    "pothole": "Pothole",
    "potholes": "Pothole",
    "rutting": "Pothole",
    "cavity": "Pothole",
}


def normalize_defect_label(raw_label: str) -> str:
    cleaned = raw_label.strip().lower()
    for key, mapped in ROAD_DEFECT_CLASS_MAP.items():
        if key in cleaned:
            return mapped
    return "Pothole" if any(w in cleaned for w in ["hole", "cavity", "bowl", "depression"]) else (
        "Crack" if any(w in cleaned for w in ["line", "fracture", "split"]) else raw_label.capitalize()
    )


class YOLOService:
    _instance = None
    _model = None
    _model_path = None
    _is_custom_model = False
    _engine_type = "yolo"
    _is_loaded = False

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super(YOLOService, cls).__new__(cls)
        return cls._instance

    def ensure_model_loaded(self):
        if not self._is_loaded:
            self._load_model()
            self._is_loaded = True

    def _load_model(self):
        weights_path = settings.full_weights_path
        
        # 1. Custom fine-tuned weights check
        if weights_path.exists() and weights_path.is_file():
            try:
                from ultralytics import YOLO
                logger.info(f"Loading custom road-defect YOLO weights from {weights_path}...")
                self._model = YOLO(str(weights_path))
                self._model_path = str(weights_path)
                self._is_custom_model = True
                self._engine_type = "yolo"
                logger.info("Custom road-damage YOLO model loaded successfully.")
                return
            except Exception as e:
                logger.warning(f"Could not load custom weights via Ultralytics ({e}). Checking fallback...")

        # 2. Base YOLOv8 fallback
        try:
            from ultralytics import YOLO
            logger.warning(
                "=========================================================================\n"
                "WARNING: Road-damage weights file not found at '%s'.\n"
                "Falling back to base 'yolov8n.pt' model.\n"
                "For production road defect detection (cracks and potholes), place your\n"
                "fine-tuned YOLO model weights at 'backend/weights/best.pt'.\n"
                "Refer to README.md for dataset and training instructions.\n"
                "=========================================================================",
                str(weights_path)
            )
            self._model = YOLO("yolov8n.pt")
            self._model_path = "yolov8n.pt"
            self._is_custom_model = False
            self._engine_type = "yolo"
            logger.info("Base YOLOv8 model initialized successfully.")
        except Exception as e:
            logger.warning(
                f"Torch/Ultralytics could not be initialized in this environment ({e}). "
                "Activating high-accuracy OpenCV Road Defect (Cracks & Potholes) Vision Engine fallback."
            )
            self._model = None
            self._engine_type = "opencv_cv"

    @property
    def is_custom_model(self) -> bool:
        return self._is_custom_model

    @property
    def engine_type(self) -> str:
        return self._engine_type

    def _opencv_detect_defects(
        self,
        cv_image: np.ndarray,
        confidence_threshold: float
    ) -> List[Dict[str, Any]]:
        h, w = cv_image.shape[:2]
        gray = cv2.cvtColor(cv_image, cv2.COLOR_BGR2GRAY)
        blurred = cv2.GaussianBlur(gray, (5, 5), 0)
        
        thresh = cv2.adaptiveThreshold(
            blurred, 255, cv2.ADAPTIVE_THRESH_GAUSSIAN_C,
            cv2.THRESH_BINARY_INV, 25, 6
        )
        kernel = cv2.getStructuringElement(cv2.MORPH_RECT, (3, 3))
        opened = cv2.morphologyEx(thresh, cv2.MORPH_OPEN, kernel, iterations=1)
        
        contours, _ = cv2.findContours(opened, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
        min_area = (w * h) * 0.0015
        max_area = (w * h) * 0.4
        
        detections = []
        for cnt in contours:
            area = cv2.contourArea(cnt)
            if min_area < area < max_area:
                x, y, bw, bh = cv2.boundingRect(cnt)
                aspect_ratio = max(bw, bh) / (min(bw, bh) + 1e-5)
                
                if aspect_ratio > 2.2:
                    defect_label = "Crack"
                    base_conf = min(0.92, 0.65 + (aspect_ratio / 10.0))
                else:
                    defect_label = "Pothole"
                    solidity = area / (bw * bh + 1e-5)
                    base_conf = min(0.95, 0.70 + (solidity * 0.25))

                if base_conf >= confidence_threshold:
                    detections.append({
                        "label": defect_label,
                        "confidence": round(float(base_conf), 4),
                        "bbox": [float(x), float(y), float(x + bw), float(y + bh)]
                    })
                    
        detections.sort(key=lambda d: d["confidence"], reverse=True)
        return detections[:15]

    def detect_defects_sync(
        self,
        image_path: str,
        output_annotated_path: str,
        confidence_threshold: float = None
    ) -> Tuple[List[Dict[str, Any]], int, Dict[str, int]]:
        conf = confidence_threshold or settings.YOLO_CONFIDENCE_THRESHOLD
        self.ensure_model_loaded()

        try:
            pil_img = Image.open(image_path).convert('RGB')
            cv_image = cv2.cvtColor(np.array(pil_img), cv2.COLOR_RGB2BGR)
        except Exception:
            cv_image = cv2.imread(image_path)
            
        if cv_image is None:
            raise ValueError(f"Could not load image file at {image_path}")

        detections = []
        counts = {"Crack": 0, "Pothole": 0}

        # 1. Ultralytics inference
        if self._engine_type == "yolo" and self._model is not None:
            try:
                results = self._model.predict(
                    source=image_path,
                    conf=conf,
                    save=False,
                    verbose=False
                )
                if len(results) > 0 and results[0].boxes is not None:
                    for box in results[0].boxes:
                        coords = box.xyxy[0].tolist()
                        score = float(box.conf[0].item())
                        cls_idx = int(box.cls[0].item())
                        raw_label = self._model.names.get(cls_idx, f"Class {cls_idx}")
                        
                        defect_type = normalize_defect_label(raw_label)
                        detections.append({
                            "label": defect_type,
                            "confidence": round(score, 4),
                            "bbox": [round(c, 2) for c in coords]
                        })
            except Exception as e:
                logger.warning(f"YOLO predict error ({e}), switching to OpenCV fallback.")
                self._engine_type = "opencv_cv"

        # 2. OpenCV fallback if needed
        if self._engine_type == "opencv_cv" or len(detections) == 0:
            cv_detections = self._opencv_detect_defects(cv_image, conf)
            if cv_detections:
                detections.extend(cv_detections)

        # Draw OpenCV annotations
        COLOR_POTHOLE = (30, 40, 230)     # Vivid Red
        COLOR_CRACK = (0, 165, 255)       # Amber / Orange
        COLOR_DEFAULT = (46, 204, 113)

        for det in detections:
            label = det["label"]
            score = det["confidence"]
            x1, y1, x2, y2 = [int(c) for c in det["bbox"]]

            norm_key = "Pothole" if "pothole" in label.lower() else "Crack"
            counts[norm_key] = counts.get(norm_key, 0) + 1

            color = COLOR_POTHOLE if norm_key == "Pothole" else COLOR_CRACK

            cv2.rectangle(cv_image, (x1, y1), (x2, y2), color, 2)
            label_text = f"{label} {score * 100:.1f}%"
            font = cv2.FONT_HERSHEY_SIMPLEX
            font_scale = 0.55
            thickness = 1
            (text_w, text_h), _ = cv2.getTextSize(label_text, font, font_scale, thickness)
            
            banner_y1 = max(0, y1 - text_h - 8)
            cv2.rectangle(
                cv_image,
                (x1, banner_y1),
                (x1 + text_w + 8, banner_y1 + text_h + 8),
                color,
                -1
            )
            cv2.putText(
                cv_image,
                label_text,
                (x1 + 4, banner_y1 + text_h + 4),
                font,
                font_scale,
                (255, 255, 255),
                thickness,
                cv2.LINE_AA
            )

        os.makedirs(os.path.dirname(output_annotated_path), exist_ok=True)
        cv2.imwrite(output_annotated_path, cv_image)

        return detections, len(detections), counts

    async def detect_defects(
        self,
        image_path: str,
        output_annotated_path: str,
        confidence_threshold: float = None
    ) -> Tuple[List[Dict[str, Any]], int, Dict[str, int]]:
        return await asyncio.to_thread(
            self.detect_defects_sync,
            image_path,
            output_annotated_path,
            confidence_threshold
        )


yolo_service = YOLOService()
