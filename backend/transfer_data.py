from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
import json

from models.sqlite.document import Document as s_Document  # Assuming models are in models.py
from models.sqlite.document import Update as s_Update
from database import Base, engine
from sqlalchemy import Column, Integer, String, ForeignKey, DateTime, Text, Time, func, BigInteger
from sqlalchemy.orm import relationship
from sqlalchemy.dialects.postgresql import UUID, JSONB
import uuid
import json
from datetime import datetime


def datetime_serializer(obj):
    if isinstance(obj, datetime):
        return obj.isoformat()
    raise TypeError("Type not serializable")

class P_Document(Base):
    __tablename__ = "documents"
    __table_args__ = {'extend_existing': True} 
    # PostgreSQL version with UUID
    id = Column(BigInteger, primary_key=True, unique=True, index=True)
    Paragraphs = Column(JSONB)  # JSONB for structured data
    UploadTime = Column(DateTime(timezone=True), server_default=func.now())
    FilePath = Column(String, nullable=False)
    FileName = Column(String, nullable=False)
    Entities = Column(JSONB)  # JSONB for structured data
    Relation = Column(JSONB)
    Event = Column(JSONB)
    Position = Column(JSONB)
    UserID = Column(Integer, ForeignKey('users.id'), nullable=False)
    StatisticInfor = Column(JSONB)
    
    update = relationship("P_Update", back_populates="document")
    user = relationship("P_User", back_populates="document")

    def get_paragraphs(self):
        return self.Paragraphs

    def set_paragraphs(self, paragraphs):
        self.Paragraphs = paragraphs
        
    def get_entities(self):
        return self.Entities

    def set_entities(self, entities):
        self.Entities = entities

    def get_relations(self):
        return self.Relation

    def set_relations(self, relation):
        self.Relation = relation

    def get_events(self):
        return self.Event

    def set_events(self, event):
        self.Event = event

    def get_positions(self):
        return self.Position

    def set_positions(self, position):
        self.Position = position

    def get_infor(self):
        return self.StatisticInfor

    def set_infor(self, infor):
        self.StatisticInfor = infor

class P_Update(Base):
    __tablename__ = "updates"
    __table_args__ = {'extend_existing': True} 
    # PostgreSQL version with UUID
    id = Column(BigInteger, primary_key=True, unique=True, index=True)
    Paragraphs = Column(JSONB) 
    Entities = Column(JSONB)
    Relation = Column(JSONB)
    Event = Column(JSONB)
    Position = Column(JSONB)
    UserNote = Column(JSONB)
    StatisticInfor = Column(JSONB)
    UserID = Column(Integer, ForeignKey('users.id'), nullable=False)
    DocumentID = Column(BigInteger, ForeignKey('documents.id'), nullable=False)
    
    document = relationship("P_Document", back_populates="update")
    user = relationship("P_User", back_populates="update")
    
    def get_user_notes(self):
        return self.UserNote

    def set_user_notes(self, usernotes):
        self.UserNote = usernotes

    def get_paragraphs(self):
        return self.Paragraphs

    def set_paragraphs(self, paragraphs):
        self.Paragraphs = paragraphs

    def get_entities(self):
        return self.Entities

    def set_entities(self, entities):
        self.Entities = entities

    def get_relations(self):
        return self.Relation

    def set_relations(self, relation):
        self.Relation = relation

    def get_events(self):
        return self.Event

    def set_events(self, event):
        self.Event = event

    def get_positions(self):
        return self.Position

    def set_positions(self, position):
        self.Position = position

    def get_infor(self):
        return self.StatisticInfor

    def set_infor(self, infor):
        self.StatisticInfor = infor

# Add this to your User model to establish bidirectional relationships

class P_User(Base):
    __tablename__ = "users"
    __table_args__ = {'extend_existing': True} 
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, index=True)
    email = Column(String, unique=True, index=True)
    hashed_password = Column(String)
    token = relationship("P_Token", back_populates="owner")
    rtoken = relationship("P_RefreshToken", back_populates="owner")
    document = relationship("P_Document", back_populates="user")
    update = relationship("P_Update", back_populates="user")
    # documents = relationship("Documents", backref="user")
    # update = relationship("Updates", backref="user")
    def __repr__(self):
        return "<User(id='%s', username='%s', email='%s', hashed_password='%s')>" % (
            self.id,
            self.username,
            self.email,
            self.hashed_password
        )
    
class P_RefreshToken(Base):
    __table_args__ = {'extend_existing': True} 
    __tablename__ = "refresh_tokens"
    
    id = Column(Integer, primary_key=True, index=True)
    token = Column(String, unique=True, index=True)
    expires_at = Column(DateTime, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    owner = relationship("P_User", back_populates="rtoken")
# 
    def __repr__(self):
        return f"<Refresh_tokens(id='{self.id}', token='{self.token}', expires_at='{self.expires_at}', user_id='{self.user_id}')>" 

class P_Token(Base):
    __table_args__ = {'extend_existing': True} 
    __tablename__ = "tokens"

    id = Column(Integer, primary_key=True, index=True)
    token = Column(String, unique=True, index=True)
    expires_at = Column(DateTime, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    owner = relationship("P_User", back_populates="token")
# 
    def __repr__(self):
        return f"<Refresh_tokens(id='{self.id}', token='{self.token}', expires_at='{self.expires_at}', user_id='{self.user_id}')>" 






# Uncomment to create the tables in PostgreSQL
# Base.metadata.create_all(engine)


# Step 1: Connect to SQLite
# sqlite_engine = create_engine('sqlite:///path/to/your/sqlite.db')  # Replace with the actual path to your SQLite file

SQLITE_DATABASE_URL = "sqlite:///./data.db"
sqlite_engine = create_engine(
    SQLITE_DATABASE_URL
    # connect_args={"check_same_thread": False}
)
# SQLiteSession = sessionmaker(bind=sqlite_engine)
SQLiteSession = sessionmaker(autocommit=False, autoflush=False, bind=sqlite_engine)
sqlite_session = SQLiteSession()

# Step 2: Connect to PostgreSQL

PSQL_DATABASE_URL = "postgresql://admin:admin@localhost:5432/polyminder"
postgres_engine = create_engine(PSQL_DATABASE_URL)
# postgres_engine = create_engine('postgresql://username:password@localhost:5432/yourdatabase')  # Replace with your DB credentials
PostgresSession = sessionmaker(bind=postgres_engine)
postgres_session = PostgresSession()

# Step 3: Extract and Transform Data from SQLite

def migrate_documents():
    """Migrate documents from SQLite to PostgreSQL."""
    documents = sqlite_session.query(s_Document).all()  # Get all documents from SQLite
    for document in documents:
        new_document = P_Document(
            id=document.id,
            Paragraphs=document.get_paragraphs(),
            UploadTime=document.UploadTime,
            FilePath=document.FilePath,
            FileName=document.FileName,
            Entities=document.get_entities(),
            Relation=document.get_relations(),
            Event=document.get_events(),
            Position=document.get_positions(),
            UserID=document.UserID,
            StatisticInfor=document.get_infor(),
        )
        postgres_session.add(new_document)
    postgres_session.commit()
    print(f"{len(documents)} documents migrated successfully.")

def migrate_updates():
    """Migrate updates from SQLite to PostgreSQL."""
    updates = sqlite_session.query(s_Update).all()  # Get all updates from SQLite
    print("get through this")
    added = 0
    for update in updates:
        try:
            if update.StatisticInfor is None:
                tmp_infor = []
            new_update = P_Update(
                id=update.id,
                Paragraphs=update.get_paragraphs(),
                Entities=update.get_entities(),
                Relation=update.get_relations(),
                Event=update.get_events(),
                Position=update.get_positions(),
                UserNote=update.get_user_notes(),
                StatisticInfor=tmp_infor,
                UserID=update.UserID,
                DocumentID=update.DocumentID,
            )
            postgres_session.add(new_update)
            added+=1
        except:
            if update.Paragraphs is None:
                print("para none")
            if update.Entities is None:
                print("ent none")
            if update.Relation is None:
                print("rel none")
            if update.Event is None:
                print("event none")
            if update.Position is None:
                print("pos none")
            if update.UserNote is None:
                print("user note none")
            if update.StatisticInfor is None:
                print("infor none")
            
    postgres_session.commit()
    print(f"{added} updates migrated successfully.")

if __name__ == "__main__":
    try:
        print("Starting migration from SQLite to PostgreSQL...")
        # migrate_documents()
        migrate_updates()
    except Exception as e:
        print(f"An error occurred during migration: {e}")
    finally:
        # Close both sessions
        sqlite_session.close()
        postgres_session.close()
