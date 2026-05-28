from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from sqlalchemy.orm import Session
from database import init_db, SessionLocal, User, ArchitectureReport
from graph import run_architecture_flow
import requests

app = FastAPI()

# Tables initialize ho rahi hain
init_db()

# CORS Middleware (React connectivity ke liye)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

class GoogleLoginRequest(BaseModel):
    access_token: str

class GenerateRequest(BaseModel):
    user_id: int
    project_title: str
    user_input: str

# ==========================================
# 🔑 FIXED GOOGLE AUTH ENDPOINT
# ==========================================
@app.post("/api/auth/google")
def google_login(req: GoogleLoginRequest, db: Session = Depends(get_db)):
    # Sahi endpoint jo JWT id_token ko validate karega
    google_url = f"https://oauth2.googleapis.com/tokeninfo?id_token={req.access_token}"
    response = requests.get(google_url)
    
    if response.status_code != 200:
        print("❌ Google Token Verification Failed:", response.text)
        raise HTTPException(status_code=400, detail="Invalid Google Token")
        
    user_info = response.json()
    email = user_info.get("email")
    name = user_info.get("name", email.split("@")[0] if email else "User")
    google_id = user_info.get("sub")
    
    if not email:
        raise HTTPException(status_code=400, detail="Email field missing from Google Auth")
    
    # DB Sync logic
    user = db.query(User).filter(User.email == email).first()
    if not user:
        user = User(email=email, full_name=name, google_id=google_id)
        db.add(user)
        db.commit()
        db.refresh(user)
        print(f"🎉 New User Registered: {email}")
    else:
        print(f"👋 Welcome Back User: {email}")
        
    return {"user_id": user.id, "email": user.email, "full_name": user.full_name}

# ==========================================
# 🚀 GENERATE BLUEPRINT ENDPOINT
# ==========================================
@app.post("/api/generate")
def generate_architecture(req: GenerateRequest, db: Session = Depends(get_db)):
    graph_result = run_architecture_flow(req.user_input)
    
    if graph_result.get("is_valid_tech") == "NO":
        return {"status": "rejected", "reason": graph_result.get("rejection_reason")}
        
    blueprint_content = graph_result.get("architecture_blueprint")
    
    new_report = ArchitectureReport(
        project_title=req.project_title,
        user_requirement=req.user_input,
        generated_blueprint=blueprint_content,
        user_id=req.user_id
    )
    db.add(new_report)
    db.commit()
    db.refresh(new_report)
    
    return {"status": "success", "report": new_report}

# ==========================================
# 📜 HISTORY FETCH ENDPOINT
# ==========================================
@app.get("/api/history/{user_id}")
def get_user_history(user_id: int, db: Session = Depends(get_db)):
    reports = db.query(ArchitectureReport).filter(ArchitectureReport.user_id == user_id).all()
    return reports

# ==========================================
# 🔗 PUBLIC SHARE FETCH ENDPOINT (No Auth Needed)
# ==========================================
@app.get("/api/public/blueprint/{report_id}")
def get_public_blueprint(report_id: int, db: Session = Depends(get_db)):
    report = db.query(ArchitectureReport).filter(ArchitectureReport.id == report_id).first()
    if not report:
        raise HTTPException(status_code=404, detail="Architecture blueprint not found or deleted")
    return {
        "project_title": report.project_title,
        "generated_blueprint": report.generated_blueprint,
        "user_requirement": report.user_requirement
    }