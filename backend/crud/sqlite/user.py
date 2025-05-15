from sqlalchemy.orm import Session
from models.sqlite.user import User
from schemas.user import UserCreate
from datetime import datetime
from models.sqlite.user import RefreshToken,Token

def get_user(db: Session, user_id: int):
    return db.query(User).filter(User.id == user_id).first()

def get_user_by_email(db: Session, email: str):
    return db.query(User).filter(User.email == email).first()

def get_user_by_username(db: Session, username: str):
    print(username)
    return db.query(User).filter(User.username == username).first()

def create_user(db: Session, user: UserCreate):
    db_user = User(username=user.username, email=user.email, hashed_password=user.password)
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user

def create_token(db:Session,token:str,expires_at: datetime, user: User):
    db_token = Token(token=token, expires_at=expires_at, owner=user)
    db.add(db_token)
    db.commit()
    db.refresh(db_token)
    return db_token

def create_refresh_token(db: Session, token: str, expires_at: datetime, user: User):
    db_token = RefreshToken(token=token, expires_at=expires_at, owner=user)
    db.add(db_token)
    db.commit()
    db.refresh(db_token)
    return db_token

def get_refresh_token(db: Session, token: str):
    return db.query(RefreshToken).filter_by(token=token).first()