# 🚨 ResQAI — AI-Powered Emergency Prioritization & Disaster Early-Warning Platform

> **HackForge 2026 | Team-08**  
> *Rapid Emergency Reporting, AI Incident Prioritization, Full-India IMD Disaster Alerts, Offline Synchronization, and Automated Command Centre Telemetry.*

---

## 📌 Executive Summary

**ResQAI** is a state-of-the-art, dark-themed emergency response and disaster early-warning ecosystem. Designed for both citizens in distress and Command Centre emergency operators, ResQAI combines **AI-powered incident severity prioritization**, **subcontinent-wide IMD weather alert feeds**, **GPS location tracking**, **photo/voice media evidence**, and **automated multi-provider email telemetry** to accelerate emergency response times and save lives during critical incidents.

---

## 🔥 Key Features & Technical Highlights

### 1. 🚨 AI-Based Incident Prioritization System
- **Automated Severity Classification**: Every incoming report is instantly analyzed by an AI engine and assigned a priority tier:
  - 🔴 **CRITICAL** — Highest Priority (Road Accidents, Major Explosions, Mass Casualty Events)
  - 🟠 **HIGH** — Urgent Risk (Fires, Floods, Acute Medical Emergencies)
  - 🟡 **MEDIUM** — Elevated Risk (Localized Disturbances, Standard Hazards)
  - 🟢 **LOW** — Non-Acute Issues (General Complaints, Minor Property Issues)
- **Dynamic Priority Queue**: Active incidents are dynamically ordered by AI priority, estimated victims, time, and severity indicators.

### 2. 🗺️ Full India Live Map & Nationwide IMD Weather Layer
- **Subcontinent-Wide Coverage**: Live interactive map centered on India (`[20.5937, 78.9629]`, zoom 5) featuring a **"📍 View Entire India"** fast-navigation button.
- **Official IMD Warning Feeds**: Real-time disaster alerts sourced from the **India Meteorological Department (IMD)** (`mausam.imd.gov.in`) across all Indian states and union territories.
- **4 Warning Tiers**:
  - 🔴 **Red Alert** — Extremely Severe Weather / Immediate Action Required
  - 🟠 **Orange Alert** — Be Prepared / Severe Weather Expected
  - 🟡 **Yellow Alert** — Watch / Moderate Weather Warning
  - 🟢 **Green Area** — No Warning / Safe Operations
- **Interactive State/District Popups**: Clickable map markers displaying state, district, affected area, issue time, valid until timestamp, and recommended public safety actions.

### 3. 📧 Automated Command Centre Email Telemetry (`shreyasbpalan5@gmail.com`)
- **Instant Emergency Alerts**: Every submitted report automatically dispatches a complete telemetry email to the Command Centre (`shreyasbpalan5@gmail.com`).
- **Telemetry Payload Includes**:
  - **Incident ID** (`INC-XXXXXX`) & **Report Type**
  - **Exact Timestamp** & **AI Priority Level with Rationale**
  - **Citizen Contact Phone** (`reporter_phone`) & **Reporter Email**
  - **GPS Coordinates** & **Google Maps Direct Location Link**
  - **Attached Photo & Voice Recording Links**
  - **Incident Status**
- **Multi-Provider Backend**: Supports **Resend HTTP API**, **SendGrid API**, **Webhooks**, **Gmail SMTP**, and fallback dispatchers.
- **Real-Time UI Badges**: Rendered delivery indicators (`✓ Email Sent`, `⚠ Email Pending`, `✕ Email Failed`) with interactive **[Retry Email]** controls.

### 4. 📱 Citizen Portal & Multi-Modal Incident Reporting
- **Dark Emergency UI**: High-contrast, accessibility-focused interface designed for high-stress scenarios.
- **One-Click GPS Detection**: Automatic browser geolocation retrieval (`navigator.geolocation`).
- **Photo Evidence Attachment**: Image file selection and instant live preview.
- **Voice Recording System**: Built-in audio recorder powered by HTML5 `MediaRecorder` API with WebM preview, playback, and server upload.
- **Citizen Email Confirmation**: Sends instant confirmation receipts to the citizen's email address.

### 5. ⚡ Offline-First Architecture & Auto-Sync Engine
- **IndexedDB Persistence** ([`offlineStore.ts`](file:///Users/shreyaspoojary/Downloads/ResQ-main/frontend/src/utils/offlineStore.ts)): Caches emergency reports and IMD alert layers locally when network connectivity is lost.
- **Background Sync Manager** ([`syncManager.ts`](file:///Users/shreyaspoojary/Downloads/ResQ-main/frontend/src/utils/syncManager.ts)): Automatically detects network recovery, syncs pending offline incidents to `/incidents`, and triggers Command Centre email dispatches seamlessly.

### 6. 🏢 Emergency Helper Dispatch
- Instant helper dispatch system linking emergency operators to response units (`Emergency Response Helper`: `9035351841`).

---

## 🛠️ Technology Stack

| Component | Technologies Used |
| :--- | :--- |
| **Frontend** | React 18, Vite, TypeScript, TailwindCSS, Lucide Icons, Leaflet, React-Leaflet, IndexedDB API |
| **Backend** | Python 3.13, FastAPI, Uvicorn, Pydantic, Requests, `python-dotenv`, `smtplib` |
| **Data Storage & Sync** | In-Memory FastAPI Store, Browser IndexedDB v2 |
| **External APIs** | India Meteorological Department (IMD) Feed (`mausam.imd.gov.in`), Google Maps API Links |
| **Email Services** | SMTP (Gmail), Resend API, SendGrid API, HTTP Webhook Relay |

---

## 🚀 Getting Started & Local Setup

### Prerequisites
- **Node.js**: v18.0.0 or higher
- **npm**: v9.0.0 or higher
- **Python**: v3.10 or higher

---

### 1. Clone the Repository
```bash
git clone https://github.com/hackforge-26/team-08.git
cd team-08
```

---

### 2. Backend Setup
```bash
# Navigate to backend directory
cd backend

# Create a virtual environment
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install fastapi uvicorn pydantic python-dotenv requests

# (Optional) Copy environment template for real SMTP email credentials
cp .env.example .env

# Start the FastAPI backend server
python -m uvicorn main:app --host 127.0.0.1 --port 8000
```
*Backend API will be running at:* `http://127.0.0.1:8000`

---

### 3. Frontend Setup
```bash
# Navigate to frontend directory (from root)
cd ../frontend

# Install dependencies
npm install

# Start Vite development server
npm run dev
```
*Frontend App will be running at:* `http://localhost:5173` (or `http://localhost:5174`)

---

## ⚙️ Environment Configuration (`.env`)

To configure real email sending to `shreyasbpalan5@gmail.com`, copy `backend/.env.example` to `backend/.env`:

```env
COMMAND_CENTER_EMAIL=shreyasbpalan5@gmail.com
HELPER_PHONE_NUMBER=9035351841

# Option 1: Gmail SMTP (Recommended)
SMTP_SERVER=smtp.gmail.com
SMTP_PORT=587
SMTP_USERNAME=your_gmail_address@gmail.com
SMTP_PASSWORD=your_16_character_app_password

# Option 2: Resend HTTP API
# RESEND_API_KEY=re_your_api_key_here
```

---

## 📡 Key API Endpoints

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `POST` | `/incidents` | Submit emergency report (supports JSON & `multipart/form-data`) |
| `GET` | `/incidents` | Fetch all incidents sorted by AI Priority |
| `GET` | `/imd-alerts` | Fetch nationwide India Meteorological Department weather warnings |
| `POST` | `/incidents/{id}/send-email` | Trigger/retry Command Centre email alert to `shreyasbpalan5@gmail.com` |
| `POST` | `/incidents/{id}/send-citizen-email` | Send confirmation receipt to reporting citizen |
| `POST` | `/incidents/{id}/notify-helper` | Dispatch notification to emergency helper (`9035351841`) |

---

## 👥 Team Information

- **Team Name**: `team-08`
- **Hackathon**: HackForge 2026
- **Repository**: [https://github.com/hackforge-26/team-08](https://github.com/hackforge-26/team-08)

---

### 📜 License
This project is licensed under the **MIT License**.
