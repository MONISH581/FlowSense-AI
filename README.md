# FlowSense AI – Intelligent Process Mining & Bottleneck Detection System

> **Discover Bottlenecks. Predict Delays. Optimize Processes.**

**FlowSense AI** is an enterprise-grade business process intelligence and predictive analytics platform. It bridges academic Data Science and Machine Learning with commercial SaaS usability to discover real workflow pathways, pinpoint operational bottlenecks, identify circular rework waste, detect anomalies, predict SLA breaches in ongoing tasks, and model operational optimizations via interactive simulations.

---

## 🌟 Key Modules & Capabilities

### 1. Executive Analytics Dashboard
- **8 Core KPI Scorecards:** Total Processes Analyzed, Completed On Time, Delayed Processes, Average Completion Time, Average Queue Waiting Time, Overall Operational Efficiency Score (%), Bottlenecks Detected, and High-Risk Ongoing Cases.
- **7 Dynamic Chart Visualizations (Recharts):**
  - Process Completion vs Delayed Cases (Donut Breakdown).
  - Monthly SLA Delay Rate Trends (Area Horizon Chart).
  - Department Performance vs Queue Friction (Composed Bar & Line Chart).
  - Active Processing Time vs Idle Queue Buffer by Activity (Bar Chart).
  - Bottleneck Severity Distribution (Critical, High, Medium, Low).
  - Rolling Efficiency Index Trends (Line Velocity Chart).
  - Machine Learning Delay Risk Stratification.
- **Audit Table:** Real-time case trajectories with filtering, search, duration metrics, priority tags, and ML risk categories.

### 2. Dataset Ingestion & Data Quality Engine
- Supports **CSV**, **XLSX**, and **XLS** event log formats.
- **Validation Pipeline:** Automated duplicate elimination, timestamp chronological parsing, missing-value imputation, and dataset health scoring.
- **Instant Demo Dataset:** 1-click generation of a synthetic e-commerce fulfillment dataset featuring **2,200+ cases and ~14,600+ events** across Sales, Finance, Warehouse, Quality Assurance, and Logistics.
- **Sample Template Download:** Downloadable `flowsense_sample_process_log.csv` for offline testing.

### 3. Process Mining via PM4Py
- **Directly-Follows Graph (DFG):** Discovers actual activity routing, sequence frequencies, and hand-off probabilities.
- **Interactive Visual Canvas:** Node-edge workflow graph with real-time severity glow, execution timing, and queue wait metrics.
- **Activity Inspector Modal:** Click any activity to drill into volume throughput, execution duration, and friction analysis.
- **Variant Analysis:** Identifies standard happy paths vs exception flows with case counts, percentages, and SLA breach rates.
- **Rework Loop Identification:** Quantifies repeated verification and repack cycles, measuring cumulative wasted queue time.

### 4. Multi-Factor Bottleneck Detection Engine
- Calculates:
  - Average, median, maximum, and minimum processing time.
  - Average idle queue waiting time preceding each stage.
  - Case volume throughput and delay correlation percentage.
  - SLA breach frequency.
- **Context-Aware Scoring:** Blends queue waiting time (friction), processing duration, and delay correlation into a composite index (0 - 100).
- **Root Cause & Remediation Guidance:** Explains *why* the delay occurs (e.g. batch queue backlogs, manual approval friction) and suggests concrete corrective measures.

### 5. Supervised Machine Learning: Delay Prediction
- **Model:** `RandomForestClassifier` (100 estimators, balanced class weights).
- **No Data Leakage:** Trains on mid-process milestone snapshots using strictly available features (current stage, elapsed duration, previous stage duration, accumulated queue wait, rework count so far, priority level, target SLA commitment, historical department delay frequency).
- **Interactive Workbench:** Users can adjust parameters for in-flight orders or test cases to compute:
  - Delay Probability (0.0 - 1.0).
  - Risk Classification: **Low Risk** (0 - 30%), **Medium Risk** (31 - 65%), **High Risk** (66 - 100%).
  - Predicted Status: *On Track* vs *Likely Delayed*.
  - Explainable contributing factors with impact weights.
- **Model Evaluation:** True holdout test split reporting **Accuracy (~88%)**, **Precision (~84%)**, **Recall (~82%)**, **F1-Score (~83%)**, **ROC-AUC**, a complete 2x2 **Confusion Matrix**, and a **Feature Importance** chart.

### 6. Unsupervised Machine Learning: Anomaly Detection
- **Model:** `IsolationForest` (contamination rate configurable from 1% to 15%).
- **Multi-Variate Analysis:** Evaluates deviations across execution duration, waiting queue time, sequence position, and cost.
- **Severity Stratification:** Classifies anomalies into *Severe*, *High*, and *Moderate* with plain-language diagnostic explanations.

### 7. Process Clustering & Cohort Analysis
- **Model:** `K-Means Clustering` with `StandardScaler` feature normalization.
- **Behavioral Cohorts:** Automatically labels clusters based on centroid characteristics (e.g. *Fast-Track Express*, *Standard Operational Flow*, *Queue-Delayed Bottleneck*, *Rework-Heavy & Non-Compliant*).
- **2D PCA Projection:** Interactive scatter plot projecting multi-dimensional case vectors onto principal variance axes.
- **Cohort Scorecards:** Case volume, average duration, waiting hours, rework frequency, and SLA breach rates per cluster.

### 8. AI Insights & Action Plan
- Rule-based expert recommendation engine converting metrics into executive action items.
- Categorized into:
  - **Critical Bottleneck Alerts**
  - **Circular Rework Elimination**
  - **Inter-Department Workload Imbalances**
  - **High-Priority SLA Safeguards**
  - **Robotic Process Automation (RPA) Opportunities**

### 9. What-If Operational Simulation
- **Interactive Levers:**
  - Additional staff allocation percentage (0% - 100%).
  - Automation duration reduction percentage (0% - 50%).
  - Queue buffer triage reduction percentage (0% - 60%).
- **Impact Projections:** Side-by-side comparison of baseline vs simulated duration, waiting time, SLA breach rate, efficiency index, and estimated financial recovery ($).
- **Transparency:** Clearly labeled as empirical elasticity estimates.

### 10. Automated Reports & Data Exports
- **Executive PDF Briefing:** Multi-page report generated using **ReportLab** with scorecards, bottleneck tables, ML evaluation metrics, and strategic recommendations.
- **Case-Level CSV Export:** Downloadable dataset containing all analyzed cases with computed durations, delays, and cluster labels.

---

## 🛠️ Technology Stack

| Layer | Technologies |
| :--- | :--- |
| **Frontend** | React 19, Vite, Tailwind CSS v4, Recharts, Lucide React, React Router |
| **Backend** | Python 3.13, FastAPI, Uvicorn, SQLAlchemy ORM, SQLite (PostgreSQL compatible) |
| **Data Science & ML** | Pandas, NumPy, Scikit-learn (Random Forest, Isolation Forest, K-Means), PM4Py |
| **Reporting & Export** | ReportLab, OpenPyXL, CSV Streaming |

---

## 🚀 Getting Started

### 1. Prerequisites
- Python 3.10+ (tested on Python 3.13)
- Node.js v18+ and npm

### 2. Backend Setup
1. Open a terminal in the root directory:
   ```bash
   cd "backend"
   ```
2. Activate your virtual environment:
   ```powershell
   # Windows PowerShell
   ..\venv\Scripts\Activate.ps1
   ```
3. Install backend dependencies (if not already installed):
   ```bash
   pip install -r requirements.txt
   ```
4. Start the FastAPI backend server:
   ```bash
   python -m uvicorn app.main:app --host 127.0.0.1 --port 8000
   ```
   *The backend will automatically initialize on `http://127.0.0.1:8000` with the demo dataset.*
   *Interactive Swagger documentation is available at `http://127.0.0.1:8000/docs`.*

### 3. Frontend Setup
1. Open a new terminal in the `frontend` directory:
   ```bash
   cd "frontend"
   ```
2. Install frontend dependencies (if not already installed):
   ```bash
   npm install
   ```
3. Start the Vite React development server:
   ```bash
   npm run dev -- --host 127.0.0.1 --port 3000
   ```
4. Open your browser and navigate to:
   ```
   http://127.0.0.1:3000/
   ```

---

## 📊 Dataset Schema Format

When uploading custom CSV or Excel files, the following schema is expected:

| Column Name | Type | Required | Description |
| :--- | :--- | :--- | :--- |
| `Case_ID` | String | **Yes** | Unique identifier for a process instance / order |
| `Activity` | String | **Yes** | Stage or task executed (e.g. `Payment Verification`) |
| `Timestamp` | DateTime | **Yes** | Occurrence timestamp (`YYYY-MM-DD HH:MM:SS`) |
| `Department` | String | Optional | Department responsible (default: `Operations`) |
| `Employee` | String | Optional | Assigned employee or system agent |
| `Status` | String | Optional | Stage status (e.g. `Completed`, `Delayed`) |
| `Priority` | String | Optional | `High`, `Medium`, `Low` |
| `Process_Type` | String | Optional | E.g. `Express Order`, `Standard Fulfillment` |
| `SLA_Hours` | Float | Optional | Target completion duration in hours |
| `Cost` | Float | Optional | Operational cost incurred for stage |

---

## 🧠 Machine Learning Methodology

1. **Feature Engineering Without Leakage:**
   - In business workflows, predicting delays after an order has already finished is trivial and unhelpful. FlowSense AI captures mid-stage snapshots (e.g. stage 2 or 3 of 6) to model real-world in-flight decisions.
   - Features represent only what is known at inference time: current stage, elapsed stage duration, previous stage duration, accumulated queue wait, rework count so far, and historical department delay rates.

2. **Multi-Factor Bottleneck Formulation:**
   `Score = 0.40 * norm_wait + 0.20 * norm_proc + 0.25 * delay_rate + 0.15 * sla_rate`
   Where:
   - `norm_wait` is normalized queue waiting time.
   - `norm_proc` is normalized active processing time.
   - `delay_rate` is the case delay correlation percentage.
   - `sla_rate` is the proportion of cases violating commitment limits.

3. **Transparent Operational Simulation:**
   - Evaluates workforce and automation elasticity by replaying historical event logs with calibrated reduction factors and computing adjusted case completion spans against original SLA targets.

---

## 📄 License & Attribution
Developed as an academic final-year Data Science & Machine Learning project and commercial Business Process Intelligence prototype.
- **PM4Py** Process Mining Library
- **Scikit-Learn** Machine Learning
- **ReportLab** PDF Generation
