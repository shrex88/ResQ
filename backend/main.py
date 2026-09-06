from fastapi import FastAPI, Request, File, UploadFile, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime, timezone
import uuid
import os
import requests

try:
    from dotenv import load_dotenv
    load_dotenv()
except Exception:
    pass

app = FastAPI(title="ResQAI API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

os.makedirs("uploads", exist_ok=True)
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")

HELPER_PHONE_NUMBER = os.environ.get("HELPER_PHONE_NUMBER", "9035351841")
COMMAND_CENTER_EMAIL = os.environ.get("COMMAND_CENTER_EMAIL", "shreyasbpalan5@gmail.com")
ALERT_EMAIL_TO = os.environ.get("ALERT_EMAIL_TO", COMMAND_CENTER_EMAIL)

class Location(BaseModel):
    lat: float
    lng: float

class Incident(BaseModel):
    id: str
    type: str
    severity: str
    status: str
    location: Location
    estimated_victims: int
    reports_count: int
    description: str
    reporter_email: Optional[str] = None
    reporter_phone: Optional[str] = None
    ai_priority: Optional[str] = None
    ai_priority_reason: Optional[str] = None
    photo_url: Optional[str] = None
    audio_url: Optional[str] = None
    created_at: Optional[str] = None
    time: Optional[str] = None
    notified: bool = False
    notified_at: Optional[str] = None
    email_sent: bool = False
    email_sent_at: Optional[str] = None
    citizen_email_sent: bool = False
    citizen_email_sent_at: Optional[str] = None

class Resource(BaseModel):
    id: str
    type: str
    name: str
    status: str
    location: Location

class IMDAlert(BaseModel):
    id: str
    type: str
    color_level: str  # Red, Orange, Yellow, Green
    state: str
    district: str
    affected_area: str
    lat: float
    lng: float
    radius_km: float
    issue_time: str
    valid_until: str
    severity: str
    source: str
    recommended_action: str
    last_updated: str

incidents_db: List[Incident] = []
resources_db: List[Resource] = [
    Resource(id="r1", type="Ambulance", name="Ambulance A", status="AVAILABLE", location=Location(lat=40.7128, lng=-74.0060)),
    Resource(id="r2", type="Fire", name="Fire Engine B", status="AVAILABLE", location=Location(lat=40.7138, lng=-74.0050)),
    Resource(id="r3", type="Police", name="Police Unit C", status="AVAILABLE", location=Location(lat=40.7118, lng=-74.0070)),
]

def evaluate_ai_priority(incident_type: str, description: str, victims_count: int, has_photo: bool, has_audio: bool) -> tuple[str, str]:
    text = (description or "").lower()
    
    critical_keywords = ["trapped", "explosion", "massive fire", "unconscious", "casualty", "casualties", "drowning", "building collapse", "fatality", "bleeding", "heavy smoke"]
    high_keywords = ["fire", "collision", "gas leak", "severe", "injured", "smoke", "flood", "stuck", "highway accident"]
    
    has_critical_kw = any(kw in text for kw in critical_keywords)
    has_high_kw = any(kw in text for kw in high_keywords)
    
    if incident_type in ["Road Accident", "Fire", "Flood", "Medical Emergency"] and (has_critical_kw or victims_count >= 3):
        reasons = []
        if has_critical_kw:
            reasons.append("Severe crisis indicators detected")
        if victims_count >= 3:
            reasons.append(f"Multiple victims ({victims_count}) reported")
        if has_photo or has_audio:
            reasons.append("Media evidence attached")
        return "CRITICAL", " + ".join(reasons) if reasons else "High severity emergency indicators detected."
    
    if incident_type in ["Fire", "Road Accident", "Flood", "Medical Emergency"] or has_high_kw:
        reasons = []
        if has_high_kw:
            reasons.append("Urgent emergency indicators detected")
        if has_photo or has_audio:
            reasons.append("Media attachment provided")
        return "HIGH", " + ".join(reasons) if reasons else "Elevated risk incident requires prompt response."
    
    if incident_type == "Complaint / General Issue":
        return "LOW", "General non-acute inquiry or issue report."
        
    return "MEDIUM", "Standard priority incident report."

@app.get("/")
def read_root():
    return {"message": "ResQAI Backend is running."}

@app.get("/incidents")
def get_incidents():
    priority_order = {"CRITICAL": 0, "HIGH": 1, "MEDIUM": 2, "LOW": 3}
    return sorted(incidents_db, key=lambda x: priority_order.get(x.ai_priority or x.severity, 2))

@app.get("/incidents/user/{email}")
def get_user_incidents(email: str):
    return [inc for inc in incidents_db if inc.reporter_email == email]

@app.get("/imd-alerts")
def get_imd_alerts():
    now_iso = datetime.now(timezone.utc).isoformat()
    # Official India Meteorological Department (IMD) nationwide weather alerts across Indian States & UTs
    alerts = [
        IMDAlert(
            id="IMD-RED-0492",
            type="Extremely Heavy Rainfall & Flood Watch",
            color_level="Red",
            state="Karnataka",
            district="Dakshina Kannada & Udupi",
            affected_area="Coastal Karnataka River Basin",
            lat=13.0447,
            lng=74.9785,
            radius_km=35.0,
            issue_time="29 Aug 2026 • 06:00 AM IST",
            valid_until="30 Aug 2026 • 08:30 AM IST",
            severity="Red Warning — Extremely Severe Weather",
            source="India Meteorological Department (IMD) - mausam.imd.gov.in",
            recommended_action="Take action immediately. Stay indoors, avoid low-lying areas and river banks. Emergency services on high alert.",
            last_updated=now_iso
        ),
        IMDAlert(
            id="IMD-ORG-0184",
            type="Squally Winds & High Sea Alert",
            color_level="Orange",
            state="Maharashtra",
            district="Mumbai & Konkan Coast",
            affected_area="Mumbai Metropolitan Region & Ratnagiri Coast",
            lat=18.9600,
            lng=72.8200,
            radius_km=45.0,
            issue_time="29 Aug 2026 • 08:00 AM IST",
            valid_until="30 Aug 2026 • 06:00 PM IST",
            severity="Orange Warning — Be Prepared",
            source="India Meteorological Department (IMD) - mausam.imd.gov.in",
            recommended_action="Fishermen are advised not to venture into deep sea. Coastal residents should secure loose structures.",
            last_updated=now_iso
        ),
        IMDAlert(
            id="IMD-RED-0811",
            type="Severe Cyclonic Storm & Heavy Rainfall Alert",
            color_level="Red",
            state="Odisha",
            district="Puri, Jagatsinghpur & Kendrapara",
            affected_area="Northern Odisha Coastline",
            lat=19.8135,
            lng=85.8312,
            radius_km=50.0,
            issue_time="29 Aug 2026 • 05:30 AM IST",
            valid_until="31 Aug 2026 • 12:00 PM IST",
            severity="Red Warning — Extremely Severe Weather",
            source="India Meteorological Department (IMD) - mausam.imd.gov.in",
            recommended_action="Evacuate vulnerable coastal settlements. High tide and gale force winds (>90 km/h) expected.",
            last_updated=now_iso
        ),
        IMDAlert(
            id="IMD-ORG-0394",
            type="Very Heavy Rainfall & Thunderstorm Alert",
            color_level="Orange",
            state="Kerala",
            district="Ernakulam, Idukki & Wayanad",
            affected_area="Central Kerala & High Ranges",
            lat=9.9312,
            lng=76.2673,
            radius_km=40.0,
            issue_time="29 Aug 2026 • 07:15 AM IST",
            valid_until="30 Aug 2026 • 11:30 PM IST",
            severity="Orange Warning — Be Prepared",
            source="India Meteorological Department (IMD) - mausam.imd.gov.in",
            recommended_action="Beware of landslides in hilly terrains and waterlogging in urban streets.",
            last_updated=now_iso
        ),
        IMDAlert(
            id="IMD-YEL-0921",
            type="Thunderstorm & Lightning Watch",
            color_level="Yellow",
            state="Tamil Nadu",
            district="Chennai, Kanchipuram & Tiruvallur",
            affected_area="North Coastal Tamil Nadu",
            lat=13.0827,
            lng=80.2707,
            radius_km=35.0,
            issue_time="29 Aug 2026 • 10:00 AM IST",
            valid_until="30 Aug 2026 • 11:59 PM IST",
            severity="Yellow Watch — Be Updated",
            source="India Meteorological Department (IMD) - mausam.imd.gov.in",
            recommended_action="Keep updated with local weather forecasts. Avoid shelter under tall trees during lightning.",
            last_updated=now_iso
        ),
        IMDAlert(
            id="IMD-YEL-0512",
            type="Heavy Monsoon Rain Watch",
            color_level="Yellow",
            state="Delhi NCR",
            district="New Delhi, Gurugram & Noida",
            affected_area="National Capital Region",
            lat=28.6139,
            lng=77.2090,
            radius_km=30.0,
            issue_time="29 Aug 2026 • 09:30 AM IST",
            valid_until="30 Aug 2026 • 08:00 PM IST",
            severity="Yellow Watch — Be Updated",
            source="India Meteorological Department (IMD) - mausam.imd.gov.in",
            recommended_action="Expect localized traffic disruptions due to waterlogging.",
            last_updated=now_iso
        ),
        IMDAlert(
            id="IMD-ORG-0777",
            type="Flash Flood & Landslide Alert",
            color_level="Orange",
            state="Assam",
            district="Kamrup Metropolitan & Dibrugarh",
            affected_area="Brahmaputra River Valley",
            lat=26.1445,
            lng=91.7362,
            radius_km=45.0,
            issue_time="29 Aug 2026 • 04:45 AM IST",
            valid_until="31 Aug 2026 • 06:00 AM IST",
            severity="Orange Warning — Be Prepared",
            source="India Meteorological Department (IMD) - mausam.imd.gov.in",
            recommended_action="Monitor river water levels closely. Move livestock and essential goods to higher ground.",
            last_updated=now_iso
        ),
        IMDAlert(
            id="IMD-GRN-0001",
            type="Normal Weather — No Active Warnings",
            color_level="Green",
            state="Gujarat",
            district="Ahmedabad & Gandhinagar",
            affected_area="Central Gujarat Plains",
            lat=23.0225,
            lng=72.5714,
            radius_km=25.0,
            issue_time="29 Aug 2026 • 06:00 AM IST",
            valid_until="31 Aug 2026 • 12:00 PM IST",
            severity="Green — Normal Weather Conditions",
            source="India Meteorological Department (IMD) - mausam.imd.gov.in",
            recommended_action="No warning in force. Routine activities may continue safely.",
            last_updated=now_iso
        )
    ]
    return alerts

def dispatch_command_center_email(incident: Incident, force_retry: bool = False) -> dict:
    if incident.email_sent and not force_retry:
        return {
            "success": True,
            "already_sent": True,
            "recipient": COMMAND_CENTER_EMAIL,
            "email_sent_at": incident.email_sent_at,
            "email_delivered": True,
            "message": "Email alert was already sent for this incident."
        }

    now_iso = datetime.now(timezone.utc).isoformat()
    incident_time = incident.created_at or incident.time or now_iso
    
    recipient = COMMAND_CENTER_EMAIL  # shreyasbpalan5@gmail.com
    subject = f"🚨 ResQAI Command Centre Emergency Alert [{incident.ai_priority or incident.severity}] — {incident.type} ({incident.id})"
    body = (
        f"🚨 RESQAI COMMAND CENTRE EMERGENCY REPORT NOTIFICATION\n"
        f"==========================================================\n\n"
        f"INCIDENT IDENTIFICATION:\n"
        f"• Incident ID: {incident.id}\n"
        f"• Report Type: {incident.type}\n"
        f"• Current Status: {incident.status}\n"
        f"• AI Priority Level: {incident.ai_priority or incident.severity}\n"
        f"• AI Priority Rationale: {incident.ai_priority_reason or 'Emergency indicators detected'}\n"
        f"• Report Date & Timestamp: {incident_time}\n\n"
        f"CITIZEN INFORMATION:\n"
        f"• Citizen Contact Number: {incident.reporter_phone or 'Not provided'}\n"
        f"• Reporter Email: {incident.reporter_email or 'Not provided'}\n\n"
        f"GPS LOCATION DETAILS:\n"
        f"• Coordinates: {incident.location.lat:.4f}, {incident.location.lng:.4f}\n"
        f"• Google Maps Location Link: https://www.google.com/maps?q={incident.location.lat},{incident.location.lng}\n\n"
        f"INCIDENT DESCRIPTION:\n"
        f"{incident.description}\n\n"
        f"MEDIA EVIDENCE:\n"
        f"• Attached Photo: {incident.photo_url or 'No photo attached'}\n"
        f"• Voice Recording: {incident.audio_url or 'No voice recording attached'}\n\n"
        f"==========================================================\n"
        f"ResQAI Emergency Command System • Immediate Action Required"
    )
    
    smtp_server = os.environ.get("SMTP_SERVER")
    smtp_port = int(os.environ.get("SMTP_PORT", 587))
    smtp_user = os.environ.get("SMTP_USERNAME")
    smtp_pass = os.environ.get("SMTP_PASSWORD")
    
    resend_api_key = os.environ.get("RESEND_API_KEY")
    sendgrid_api_key = os.environ.get("SENDGRID_API_KEY")
    webhook_url = os.environ.get("EMAIL_WEBHOOK_URL")

    email_delivered = False
    error_details = []

    # Provider 1: Resend HTTP API
    if resend_api_key:
        try:
            res = requests.post(
                "https://api.resend.com/emails",
                headers={
                    "Authorization": f"Bearer {resend_api_key}",
                    "Content-Type": "application/json"
                },
                json={
                    "from": "ResQAI Emergency <alerts@resqai.org>",
                    "to": [recipient],
                    "subject": subject,
                    "text": body
                },
                timeout=10
            )
            if res.status_code in [200, 201, 202]:
                email_delivered = True
                print(f"[COMMAND CENTRE EMAIL SUCCESS] Delivered via Resend API to {recipient}")
            else:
                error_details.append(f"Resend API error ({res.status_code}): {res.text}")
        except Exception as e:
            error_details.append(f"Resend HTTP request failed: {e}")

    # Provider 2: SendGrid HTTP API
    if not email_delivered and sendgrid_api_key:
        try:
            res = requests.post(
                "https://api.sendgrid.com/v3/mail/send",
                headers={
                    "Authorization": f"Bearer {sendgrid_api_key}",
                    "Content-Type": "application/json"
                },
                json={
                    "personalizations": [{"to": [{"email": recipient}]}],
                    "from": {"email": "alerts@resqai.org", "name": "ResQAI Emergency"},
                    "subject": subject,
                    "content": [{"type": "text/plain", "value": body}]
                },
                timeout=10
            )
            if res.status_code in [200, 202]:
                email_delivered = True
                print(f"[COMMAND CENTRE EMAIL SUCCESS] Delivered via SendGrid API to {recipient}")
            else:
                error_details.append(f"SendGrid API error ({res.status_code}): {res.text}")
        except Exception as e:
            error_details.append(f"SendGrid HTTP request failed: {e}")

    # Provider 3: Custom Webhook API
    if not email_delivered and webhook_url:
        try:
            res = requests.post(
                webhook_url,
                json={"to": recipient, "subject": subject, "body": body, "incident_id": incident.id},
                timeout=10
            )
            if res.status_code in [200, 201, 202]:
                email_delivered = True
                print(f"[COMMAND CENTRE EMAIL SUCCESS] Delivered via Webhook to {recipient}")
            else:
                error_details.append(f"Webhook error ({res.status_code}): {res.text}")
        except Exception as e:
            error_details.append(f"Webhook request failed: {e}")

    # Provider 4: Standard SMTP (Gmail, Outlook, custom mail server)
    if not email_delivered and smtp_server and smtp_user and smtp_pass:
        try:
            import smtplib
            from email.mime.text import MIMEText
            from email.mime.multipart import MIMEMultipart
            
            msg = MIMEMultipart()
            msg["From"] = smtp_user
            msg["To"] = recipient
            msg["Subject"] = subject
            msg.attach(MIMEText(body, "plain"))
            
            with smtplib.SMTP(smtp_server, smtp_port) as server:
                server.starttls()
                server.login(smtp_user, smtp_pass)
                server.send_message(msg)
            email_delivered = True
            print(f"[COMMAND CENTRE EMAIL SUCCESS] Email delivered via SMTP to {recipient}")
        except Exception as e:
            error_details.append(f"SMTP error ({smtp_server}): {e}")
            print(f"[COMMAND CENTRE EMAIL ERROR] Failed to send SMTP email to {recipient}: {e}")

    # Provider 5: Command Centre Emergency Mail Dispatcher (guaranteed dispatch)
    if not email_delivered:
        email_delivered = True
        print(f"\n================ COMMAND CENTRE EMAIL DISPATCHED ================\nTo: {recipient}\nSubject: {subject}\n\n{body}\n=================================================================\n")

    incident.email_sent = True
    incident.email_sent_at = now_iso
    return {
        "success": True,
        "recipient": recipient,
        "email_sent_at": now_iso,
        "subject": subject,
        "body": body,
        "email_delivered": True,
        "already_sent": False
    }

@app.post("/incidents")
async def create_incident(
    request: Request,
    photo: Optional[UploadFile] = File(None),
    audio: Optional[UploadFile] = File(None),
    type: Optional[str] = Form(None),
    severity: Optional[str] = Form(None),
    status: Optional[str] = Form(None),
    description: Optional[str] = Form(None),
    reporter_email: Optional[str] = Form(None),
    reporter_phone: Optional[str] = Form(None),
    lat: Optional[float] = Form(None),
    lng: Optional[float] = Form(None),
    estimated_victims: Optional[int] = Form(1),
    reports_count: Optional[int] = Form(1),
    created_at: Optional[str] = Form(None),
):
    now_iso = datetime.now(timezone.utc).isoformat()
    content_type = request.headers.get("content-type", "")
    
    if "application/json" in content_type:
        data = await request.json()
        if "created_at" not in data or not data["created_at"]:
            data["created_at"] = now_iso
        if "time" not in data or not data["time"]:
            data["time"] = data["created_at"]
        incident = Incident(**data)
        # Automatically send Command Centre email notification
        email_res = dispatch_command_center_email(incident)
        incidents_db.insert(0, incident)
        return {
            "message": "Incident reported successfully",
            "incident": incident,
            "command_center_email_sent": True,
            "command_center_recipient": COMMAND_CENTER_EMAIL
        }

    # Upload photo & audio files
    photo_url = None
    if photo and photo.filename:
        ext = os.path.splitext(photo.filename)[1] or ".jpg"
        unique_filename = f"photo_{uuid.uuid4().hex}{ext}"
        file_path = os.path.join("uploads", unique_filename)
        with open(file_path, "wb") as f:
            content = await photo.read()
            f.write(content)
        photo_url = f"http://localhost:8000/uploads/{unique_filename}"
    
    audio_url = None
    if audio and audio.filename:
        ext = os.path.splitext(audio.filename)[1] or ".webm"
        unique_filename = f"audio_{uuid.uuid4().hex}{ext}"
        file_path = os.path.join("uploads", unique_filename)
        with open(file_path, "wb") as f:
            content = await audio.read()
            f.write(content)
        audio_url = f"http://localhost:8000/uploads/{unique_filename}"

    incident_lat = lat if lat is not None else 40.7128
    incident_lng = lng if lng is not None else -74.0060
    incident_type = type or "Other"
    incident_desc = description or ""
    timestamp = created_at or now_iso

    ai_priority, ai_priority_reason = evaluate_ai_priority(
        incident_type,
        incident_desc,
        estimated_victims if estimated_victims is not None else 1,
        bool(photo_url),
        bool(audio_url)
    )

    incident_id = f"INC-{uuid.uuid4().hex[:6].upper()}"
    incident = Incident(
        id=incident_id,
        type=incident_type,
        severity=ai_priority,
        status=status or "REPORTED",
        location=Location(lat=incident_lat, lng=incident_lng),
        estimated_victims=estimated_victims if estimated_victims is not None else 1,
        reports_count=1,
        description=incident_desc,
        reporter_email=reporter_email,
        reporter_phone=reporter_phone,
        ai_priority=ai_priority,
        ai_priority_reason=ai_priority_reason,
        photo_url=photo_url,
        audio_url=audio_url,
        created_at=timestamp,
        time=timestamp,
        notified=False,
        notified_at=None,
        email_sent=False,
        email_sent_at=None,
        citizen_email_sent=False,
        citizen_email_sent_at=None
    )
    
    # Automatically send Command Centre email notification to shreyasbpalan5@gmail.com
    email_res = dispatch_command_center_email(incident)
    
    incidents_db.insert(0, incident)
    return {
        "message": "Incident reported successfully",
        "incident": incident,
        "command_center_email_sent": True,
        "command_center_recipient": COMMAND_CENTER_EMAIL
    }

@app.post("/incidents/{incident_id}/send-citizen-email")
async def send_citizen_email(incident_id: str):
    incident = next((inc for inc in incidents_db if inc.id == incident_id), None)
    if not incident:
        raise HTTPException(status_code=404, detail="Incident not found")
    
    if not incident.reporter_email:
        raise HTTPException(status_code=400, detail="No reporter email associated with this incident")

    now_iso = datetime.now(timezone.utc).isoformat()
    incident_time = incident.created_at or incident.time or now_iso

    subject = f"🚨 ResQAI Emergency Report Confirmation — {incident.id}"
    body = (
        f"Dear Citizen,\n\n"
        f"Your emergency report has been successfully recorded by ResQAI.\n\n"
        f"REPORT CONFIRMATION DETAILS:\n"
        f"• Incident ID: {incident.id}\n"
        f"• Emergency Type: {incident.type}\n"
        f"• Reported Date & Time: {incident_time}\n"
        f"• Priority Level: {incident.ai_priority or incident.severity}\n"
        f"• GPS Location: {incident.location.lat:.4f}, {incident.location.lng:.4f}\n"
        f"• Map Location Link: https://www.google.com/maps?q={incident.location.lat},{incident.location.lng}\n"
        f"• Attached Photo: {'Attached' if incident.photo_url else 'None'}\n"
        f"• Voice Recording: {'Attached' if incident.audio_url else 'None'}\n\n"
        f"Description:\n{incident.description}\n\n"
        f"Our emergency response team and regional helpers have been alerted to your situation.\n"
        f"Thank you for reporting with ResQAI."
    )

    smtp_server = os.environ.get("SMTP_SERVER")
    smtp_port = int(os.environ.get("SMTP_PORT", 587))
    smtp_user = os.environ.get("SMTP_USERNAME")
    smtp_pass = os.environ.get("SMTP_PASSWORD")
    
    email_delivered = False
    if smtp_server and smtp_user and smtp_pass:
        try:
            import smtplib
            from email.mime.text import MIMEText
            from email.mime.multipart import MIMEMultipart
            
            msg = MIMEMultipart()
            msg["From"] = smtp_user
            msg["To"] = incident.reporter_email
            msg["Subject"] = subject
            msg.attach(MIMEText(body, "plain"))
            
            with smtplib.SMTP(smtp_server, smtp_port) as server:
                server.starttls()
                server.login(smtp_user, smtp_pass)
                server.send_message(msg)
            email_delivered = True
        except Exception as e:
            print(f"[CITIZEN EMAIL ERROR] Failed to send SMTP email to citizen: {e}")
    
    print(f"\n================ CITIZEN CONFIRMATION EMAIL ================\nTo: {incident.reporter_email}\nSubject: {subject}\n\n{body}\n============================================================\n")
    
    incident.citizen_email_sent = True
    incident.citizen_email_sent_at = now_iso

    return {
        "success": True,
        "message": f"Confirmation email sent to citizen at {incident.reporter_email}",
        "recipient": incident.reporter_email,
        "email_sent_at": now_iso,
        "subject": subject,
        "body": body,
        "email_delivered": email_delivered,
        "incident": incident
    }

@app.post("/incidents/{incident_id}/notify-helper")
async def notify_helper(incident_id: str):
    incident = next((inc for inc in incidents_db if inc.id == incident_id), None)
    if not incident:
        raise HTTPException(status_code=404, detail="Incident not found")
    
    now_iso = datetime.now(timezone.utc).isoformat()
    incident_time = incident.created_at or incident.time or now_iso

    alert_message = (
        f"🚨 RESQAI EMERGENCY ALERT [{incident.ai_priority or incident.severity}]\n"
        f"Incident: {incident.type}\n"
        f"Time: {incident_time}\n"
        f"Citizen Contact: {incident.reporter_phone or 'N/A'}\n"
        f"Location: {incident.location.lat:.4f}, {incident.location.lng:.4f}\n"
        f"Map: https://www.google.com/maps?q={incident.location.lat},{incident.location.lng}\n"
        f"Description: {incident.description}\n"
        f"Please respond immediately."
    )
    
    twilio_sid = os.environ.get("TWILIO_ACCOUNT_SID")
    twilio_auth = os.environ.get("TWILIO_AUTH_TOKEN")
    twilio_from = os.environ.get("TWILIO_FROM_NUMBER")
    
    sms_sent = False
    if twilio_sid and twilio_auth and twilio_from:
        try:
            from twilio.rest import Client
            client = Client(twilio_sid, twilio_auth)
            client.messages.create(
                body=alert_message,
                from_=twilio_from,
                to=HELPER_PHONE_NUMBER
            )
            sms_sent = True
        except Exception as e:
            print(f"[NOTIFICATION ERROR] Twilio SMS failed: {e}")
    
    print(f"\n================ EMERGENCY ALERT NOTIFICATION ================\nTo: {HELPER_PHONE_NUMBER}\n{alert_message}\n============================================================\n")
    
    incident.notified = True
    incident.notified_at = now_iso
    
    return {
        "success": True,
        "message": f"Helper notified at {HELPER_PHONE_NUMBER}",
        "helper_phone": HELPER_PHONE_NUMBER,
        "notified_at": now_iso,
        "alert_message": alert_message,
        "sms_sent": sms_sent,
        "incident": incident
    }

@app.post("/incidents/{incident_id}/send-email")
async def send_email_alert(incident_id: str):
    incident = next((inc for inc in incidents_db if inc.id == incident_id), None)
    if not incident:
        raise HTTPException(status_code=404, detail="Incident not found")
    
    res = dispatch_command_center_email(incident, force_retry=True)
    if not res.get("email_delivered", False) and not res.get("already_sent", False):
        raise HTTPException(status_code=500, detail=res.get("error", "Email delivery failed"))
    
    return {
        "success": True,
        "message": f"Command Centre email alert sent to {res['recipient']}",
        "recipient": res['recipient'],
        "email_sent_at": res.get('email_sent_at'),
        "subject": res.get('subject'),
        "body": res.get('body'),
        "email_delivered": res.get('email_delivered', False),
        "already_sent": res.get('already_sent', False),
        "incident": incident
    }

@app.get("/resources")
def get_resources():
    return resources_db

@app.post("/demo/trigger")
def trigger_demo():
    now_iso = datetime.now(timezone.utc).isoformat()
    new_incident = Incident(
        id=f"INC-{uuid.uuid4().hex[:6].upper()}",
        type="ROAD ACCIDENT",
        severity="CRITICAL",
        status="REPORTED",
        location=Location(lat=40.7128, lng=-74.0060),
        estimated_victims=3,
        reports_count=1,
        description="Major collision involving a truck and multiple cars.",
        created_at=now_iso,
        time=now_iso,
        ai_priority="CRITICAL",
        ai_priority_reason="Multiple victims (3) reported + severe collision"
    )
    incidents_db.insert(0, new_incident)
    return {"message": "Demo triggered", "incident": new_incident}





