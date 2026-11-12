# RoadWatch AI: Government Road Work Transparency and Verification System

![RoadWatch AI Security Shield](https://img.shields.io/badge/Security-Government%20Audit%20Level-amber.svg)
![Python](https://img.shields.io/badge/Python-3.11+-blue.svg)
![FastAPI](https://img.shields.io/badge/FastAPI-0.110+-009688.svg)
![React](https://img.shields.io/badge/Frontend-React%2018%20%2B%20Vite-61dafb.svg)
![YOLO](https://img.shields.io/badge/AI%20Vision-Ultralytics%20YOLOv8-orange.svg)
![MongoDB](https://img.shields.io/badge/Database-MongoDB%20%2F%20Motor-green.svg)
![Tests](https://img.shields.io/badge/Tests-12%2F12%20Passed-brightgreen.svg)

---

## 1. Project Concept & Architecture

**RoadWatch AI** is a multi-interface web platform designed for government road construction monitoring, automated progress verification, and citizen grievance transparency. It addresses discrepancies between contractor claims and physical ground reality by combining:

1. **Mathematical Milestone Engine**: Calculates physical progress strictly from weighted milestone completion:
   $$\text{Calculated Progress} = \sum \left( \frac{\text{Weight}_i \times \text{Completion}_i}{100} \right)$$
   *(Milestone weights are governed exclusively by government administrators and must sum to exactly 100%).*
2. **Automated Discrepancy Auditing**: Compares the contractor's claimed progress against the mathematical milestone progress:
   $$\text{Discrepancy Gap} = |\text{Reported Progress} - \text{Calculated Progress}|$$
   If this difference exceeds the project's tolerance threshold (default: 10%), an administrative verification alert is raised.
3. **YOLO Computer Vision Defect Scanning**: Processes road surface imagery using YOLOv8 to automatically detect and delineate potholes and cracks with bounding boxes and confidence scores.
4. **Three Dedicated User Interfaces**:
   - **Public / Citizen Portal (No Login)**: Search road projects, review verification status, report road damage with photo uploads, and track complaints via unique reference numbers.
   - **Admin Portal (Role: `admin`)**: Project lifecycle management, contractor registration & assignment, milestone weight configuration, AI defect inspection, physical inspection logging, and consolidated CSV audit reports.
   - **Contractor Portal (Role: `contractor`)**: Strict isolation to assigned road works, milestone progress reporting, road photo upload with live YOLO defect feedback, and formal clarification submission.

> [!NOTE]
> **Neutral Tone Standard**: System alerts indicate a mathematical or visual discrepancy requiring administrative verification. The platform adheres strictly to neutral language (e.g. *"Verification Required"* rather than punitive terms).

---

## 2. Default Accounts & Credentials

The database seed script initializes the following credentials:

| Role | Name / Company | Email | Password | Access Rights |
| :--- | :--- | :--- | :--- | :--- |
| **Admin** | Super Administrator | `admin@roadwatch.com` | `Admin@123` | Full Administrative & Verification Privileges |
| **Contractor** | ABC Infrastructure Ltd | `abc@roadwatch.com` | `Contractor@123` | Assigned to Tambaram - Mudichur Road |
| **Contractor** | XYZ Road Builders Pvt | `xyz@roadwatch.com` | `Contractor@123` | Assigned to Grand Southern Trunk (GST) Road |
| **Contractor** | PQR Highways Corp | `pqr@roadwatch.com` | `Contractor@123` | Assigned to Anna Nagar 2nd Avenue Widening |
| **Public** | Citizen (Anonymous) | *No Login Required* | *None* | Read-only public registry & grievance portal |

---

## 3. Prerequisites

Ensure the following runtimes and tools are installed:
- **Python**: version `3.11` or higher (`python --version`)
- **Node.js**: version `18.0.0` or higher (`node --version`) and npm (`npm --version`)
- **MongoDB**: version `6.0` or higher (Local Community Server or MongoDB Atlas cloud cluster).
  *(Note: RoadWatch AI includes an automatic in-memory fallback driver via `mongomock-motor` for immediate offline demonstration if no local MongoDB service is currently running).*

---

## 4. MongoDB Database Setup

### Option A: Local MongoDB Community Server
1. Download and install MongoDB Community Server from [mongodb.com](https://www.mongodb.com/try/download/community).
2. Start the MongoDB service:
   - **Windows**: Started automatically as a Windows Service (`net start MongoDB`).
   - **Linux / macOS**: `sudo systemctl start mongod` or `brew services start mongodb-community`.
3. Set your backend `.env` configuration:
   ```env
   MONGODB_URL=mongodb://localhost:27017
   DATABASE_NAME=roadwatch
   ```

### Option B: MongoDB Atlas (Cloud)
1. Create a free cluster on [MongoDB Atlas](https://www.mongodb.com/cloud/atlas).
2. In **Database Access**, create a database user with password.
3. In **Network Access**, whitelist your IP address (or `0.0.0.0/0` for development).
4. Copy the connection string into `backend/.env`:
   ```env
   MONGODB_URL=mongodb+srv://<username>:<password>@cluster0.mongodb.net/?retryWrites=true&w=majority
   DATABASE_NAME=roadwatch
   ```

---

## 5. Backend Setup & Installation

### Step 1: Navigate to Backend Directory
```bash
cd roadwatch-ai/backend
```

### Step 2: Create and Activate Virtual Environment
- **Windows (PowerShell)**:
  ```powershell
  python -m venv venv
  .\venv\Scripts\Activate.ps1
  ```
- **Windows (Command Prompt / CMD)**:
  ```cmd
  python -m venv venv
  venv\Scripts\activate.bat
  ```
- **Linux / macOS (Bash / Zsh)**:
  ```bash
  python3 -m venv venv
  source venv/bin/activate
  ```

### Step 3: Install Python Dependencies
```bash
pip install --upgrade pip
pip install -r requirements.txt
```

### Step 4: Configure Environment Variables
Copy `.env.example` to `.env`:
```bash
# Windows
copy .env.example .env

# Linux / macOS
cp .env.example .env
```

Ensure `backend/.env` contains:
```env
PROJECT_NAME="RoadWatch AI"
MONGODB_URL=mongodb://localhost:27017
DATABASE_NAME=roadwatch
JWT_SECRET=roadwatch-super-secret-audit-key-2026-production
JWT_ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=1440
ALERT_THRESHOLD=10.0
YOLO_MODEL_PATH=weights/best.pt
UPLOAD_DIR=uploads
```

### Step 5: Seed the Database
Populate the database with default admin, 3 contractors, sample projects across districts, milestones, and sample citizen complaints:
```bash
python -m app.seed --reset
```
*Sample records created by the seed script:*
- Default Admin: `admin@roadwatch.com`
- 3 Registered Contractors: ABC Infrastructure, XYZ Road Builders, PQR Highways
- **Tambaram - Mudichur Road**: Reported 80%, Calculated 65% (Discrepancy 15% > Threshold 10% -> triggers open alert `"Verification Required"`).
- **Grand Southern Trunk (GST) Road**: Reported 50%, Calculated 50% (Difference 0% -> status `"Matching"`).
- **Anna Nagar 2nd Avenue Widening**: Reported 100%, Calculated 100% (Status `"Completed"`).
- 2 Initial Citizen Complaints: `RW-2026-000101` (*Pending*) and `RW-2026-000102` (*Under Review*).

---

## 6. Frontend Setup & Installation

### Step 1: Navigate to Frontend Directory
```bash
cd ../frontend
```

### Step 2: Install NPM Dependencies
```bash
npm install
```

### Step 3: Configure Frontend Environment Variables
Copy `.env.example` to `.env`:
```bash
# Windows
copy .env.example .env

# Linux / macOS
cp .env.example .env
```

Ensure `frontend/.env` contains:
```env
VITE_API_BASE_URL=http://localhost:8000/api
```

### Step 4: Build or Run Development Server
```bash
# Run local dev server with Hot Module Replacement
npm run dev

# Or build production static assets
npm run build
```

---

## 7. Starting the Platform

### Option A: One-Click Windows Batch Scripts (Root Directory)
- **`run_all.bat`**: Launches both Backend and Frontend in separate windows and opens your browser at `http://localhost:5173`.
- **`run_backend.bat`**: Starts FastAPI server on `http://localhost:8000`.
- **`run_frontend.bat`**: Starts Vite dev server on `http://localhost:5173`.
- **`run_seed.bat`**: Resets and reseeds sample projects, contractors, and grievances.
- **`run_tests.bat`**: Runs backend pytest test suite.

### Option B: Manual Command Line
- **Backend Terminal**:
  ```bash
  cd roadwatch-ai/backend
  # Activate venv, then:
  uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
  ```
- **Frontend Terminal**:
  ```bash
  cd roadwatch-ai/frontend
  npm run dev
  ```

---

## 8. YOLO Defect Detection Model Setup

RoadWatch AI uses Ultralytics YOLOv8 for detecting road surface defects (cracks and potholes).

### Default Model Fallback
- If custom weights are not provided, RoadWatch AI automatically loads the pre-trained `yolov8n.pt` base model.
- Additionally, an OpenCV computer vision contour detection engine is embedded as an immediate fallback to guarantee visual defect annotations under all conditions.

### Adding Custom Road Defect Weights
1. Train a custom YOLOv8 model on a road damage dataset (e.g., [Roboflow Road Damage Dataset](https://universe.roboflow.com/)).
2. Save your trained weights file as `best.pt`.
3. Place it in the backend weights directory:
   ```text
   roadwatch-ai/backend/weights/best.pt
   ```
4. Restart the backend. The `YoloService` singleton will automatically detect and load your custom weights.

### Training & Exporting Custom Weights (Reference Command)
```bash
# Train YOLOv8 on your dataset YAML
yolo detect train data=road_defects.yaml model=yolov8n.pt epochs=50 imgsz=640 batch=16

# Copy best weights to RoadWatch AI
cp runs/detect/train/weights/best.pt roadwatch-ai/backend/weights/best.pt
```

---

## 9. Comprehensive Demo Walkthrough (3 Interfaces)

### Interface 1: Public / Citizen Portal (No Login)
1. Open `http://localhost:5173`.
2. **Explore Projects**: Browse live public road projects. Use search filters by District (e.g. *Chennai*), road location, or status (*Ongoing, Planned, Completed*).
3. **Inspect Progress**: Click on **Tambaram - Mudichur Road**. View the comparative progress bar showing Contractor Claimed (80%) vs Milestone Calculated (65%) and the neutral verdict: *"Verification Required"*.
4. **File a Grievance**: Click **"Report Issue"**. Enter your name, phone, select district, describe road damage (e.g. *"Pothole near bus stop"*), and upload a photo.
5. **Get Reference Number**: Receive a generated tracking code (e.g., `RW-2026-000103`) with a one-click copy button.
6. **Track Status**: Click **"Track Grievance"**, enter the reference number, and inspect the real-time review progress.

### Interface 2: Contractor Portal
1. Navigate to **Portal Login** -> switch tab to **"Contractor Portal"**.
2. Click the quick pre-fill button for **Contractor ABC** (`abc@roadwatch.com` / `Contractor@123`) and log in.
3. **Assigned Projects Isolation**: Notice that Contractor ABC only sees *Tambaram - Mudichur Road*. Attempting to access XYZ's or PQR's projects returns HTTP 403 Forbidden.
4. **Update Milestones**: Click **"Update Milestones"**. Notice that milestone weights (e.g., 20%, 30%) are locked and read-only. Enter updated completion percentages and click **Save Milestones**.
5. **Upload Road Surface Imagery**: Navigate to **"Upload Road Photos"**. Choose the project, enter the stage name, and upload an asphalt photo. The YOLO engine scans the image, returning bounding boxes, pothole counts, crack counts, and confidence scores.
6. **Submit Progress Report**: Navigate to **"Submit Progress"**. Enter reported progress (e.g. 75%). The system calculates the discrepancy gap and triggers automatic verification.
7. **Submit Clarification**: If a discrepancy alert exists, enter an engineering explanation and submit it for administrative review.

### Interface 3: Admin Portal
1. Navigate to **Portal Login** -> switch tab to **"Administrator Portal"**.
2. Log in as `admin@roadwatch.com` / `Admin@123`.
3. **Executive Dashboard**: Review the 6 KPI cards, Recharts comparative progress bar chart, recent alerts, and live grievances.
4. **Milestone Configuration**: In **Projects** -> click **Dossier** -> **Milestones**. Add or edit milestones. Note that the live weight meter requires weights to sum to exactly 100% before saving.
5. **Review AI Detections**: Inspect uploaded asphalt photos with side-by-side original and annotated YOLO bounding boxes and coordinate tables.
6. **Trigger Verification & Review Alerts**: Navigate to **"Verification Alerts"**. View the discrepancy on Tambaram Road (80% vs 65%). Request clarification from the contractor, record a physical site inspection with inspector notes, and mark the alert resolved.
7. **Grievance Triage**: Go to **"Citizen Complaints"**. Open complaint `RW-2026-000101`, inspect the uploaded photo, and update status to *In Progress* or *Resolved* (note: rejecting requires a mandatory explanation).
8. **Export Audit Reports**: Go to **"Audit Reports"** and click **Export Audit CSV** to download the official government audit spreadsheet.

---

## 10. Automated Testing

RoadWatch AI includes a comprehensive pytest test suite validating:
- Exact weighted progress calculations (including the mandatory 70.0% spec test case).
- Weight sum <= 100% validation.
- Discrepancy detection and alert thresholds.
- Single open alert deduplication.
- Public data sanitization (zero password/inspector notes/contractor phone leakage).
- Complaint reference format (`RW-YYYY-XXXXXX`) and mandatory rejection reason validation.
- Role-based isolation (contractors denied access to unassigned projects with 403).

To run the test suite:
```bash
# Windows (PowerShell)
cd roadwatch-ai/backend
python -m pytest -v

# Windows (Command Prompt)
cd roadwatch-ai\backend
run_tests.bat
```

---

## 11. Postman API Collection

A fully configured Postman v2.1.0 collection is provided at:
```text
roadwatch-ai/postman/RoadWatch.postman_collection.json
```
It covers all 10 endpoint sections specified in the design document:
1. `Authentication` (`/api/auth/login`, `/me`, `/forgot-password`, `/reset-password`)
2. `Admin - Projects` (CRUD, assignment, dossier, monitoring table, image upload)
3. `Admin - Contractors` (Directory, registration, active/inactive status toggle, contractor projects)
4. `Admin - Milestones` (CRUD, weight sum validation, progress recalculation)
5. `Admin - Detection` (Project defect inspections)
6. `Admin - Verification & Alerts` (Run verification, alerts triage, request clarification, record inspection, resolve)
7. `Admin - Complaints` (Review grievances, update status with rejection reason enforcement)
8. `Admin - Dashboard & Reports` (KPI metrics, progress comparison chart, CSV audit export)
9. `Contractor Portal` (Dashboard, assigned projects, milestones update, YOLO upload, detections, progress report, verification status, clarification)
10. `Public / Citizen Portal` (Sanitized project catalog, detail dossier, progress tracking, public stats, submit complaint, track reference)

Import `postman/RoadWatch.postman_collection.json` into Postman and execute the collection with the preconfigured `baseUrl: http://localhost:8000/api`.
