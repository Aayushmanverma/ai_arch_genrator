from sqlalchemy import create_engine, Column, Integer, String, Text, ForeignKey, Boolean
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, relationship

DATABASE_URL = "sqlite:///./ai_arch_saas.db"

engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

# 1. User Table (Google Auth)
class User(Base):
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True, autoincrement=True) # Fixed syntax here
    email = Column(String, unique=True, index=True, nullable=False)
    full_name = Column(String, nullable=True)
    google_id = Column(String, unique=True, nullable=True)
    is_active = Column(Boolean, default=True)
    
    reports = relationship("ArchitectureReport", back_populates="owner")

# 2. History Table 
class ArchitectureReport(Base):
    __tablename__ = "architecture_reports"
    
    id = Column(Integer, primary_key=True, index=True, autoincrement=True) # Fixed syntax here
    project_title = Column(String, index=True, nullable=False)
    user_requirement = Column(Text, nullable=False)
    generated_blueprint = Column(Text, nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"))
    
    owner = relationship("User", back_populates="reports")

def init_db():
    Base.metadata.create_all(bind=engine)