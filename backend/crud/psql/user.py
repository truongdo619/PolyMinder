from sqlalchemy.orm import Session
from models.psql.user import User
from schemas.user import UserCreate
from datetime import datetime
from models.psql.user import RefreshToken,Token
import random

def generate_unique_id(db: Session, model, id_field="id"):
    """
    Generate a unique 8-digit or longer ID for a given SQLAlchemy model.

    :param db: The SQLAlchemy session.
    :param model: The SQLAlchemy model to check uniqueness against.
    :param id_field: The name of the ID field in the model.
    :return: A unique numeric ID.
    """
    while True:
        # Generate a random 8-digit number or longer
        unique_id = random.randint(100, 9999)
        
        # Check if the ID already exists in the database
        existing = db.query(model).filter(getattr(model, id_field) == unique_id).first()
        if not existing:
            return unique_id
        
def get_user(db: Session, user_id: int):
    return db.query(User).filter(User.id == user_id).first()

def get_user_by_email(db: Session, email: str):
    return db.query(User).filter(User.email == email).first()

def get_user_by_username(db: Session, username: str):
    print(username)
    return db.query(User).filter(User.username == username).first()

def create_user(db: Session, user: UserCreate):
    db_user = User(username=user.username, email=user.email, hashed_password=user.password)
    user_id = generate_unique_id(db, User)
    db_user.id = user_id
   
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