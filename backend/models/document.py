from database import Base,engine
from sqlalchemy import Column, Integer, String, ForeignKey, DateTime, Text
from sqlalchemy.orm import relationship
from .user import User 
import json

class Document(Base):
    __tablename__ = "documents"

    id = Column(Integer, primary_key=True, index=True)
    Paragraphs = Column(Text)  # This is specific to PostgreSQL
    FilePath = Column(String, nullable=False)
    FileName = Column(String, nullable=False)
    Entities = Column(Text)  # Use Text to store large strings
    Relation = Column(Text)
    Event = Column(Text)
    Position = Column(Text)
    UserID = Column(Integer, ForeignKey('users.id'), nullable=False)
    
    update = relationship("Update",back_populates="document")
    # Define the relationship to the User model
    user = relationship("User", back_populates="document")
    def get_paragraphs(self):
        return json.loads(self.Paragraphs)

    def set_paragraphs(self, paragraphs):
        self.Paragraphs = json.dumps(paragraphs)
        
    def get_entities(self):
        return json.loads(self.Entities)

    def set_entities(self, entities):
        self.Entities = json.dumps(entities)

    def get_relations(self):
        return json.loads(self.Relation)

    def set_relations(self, relation):
        self.Relation = json.dumps(relation)

    def get_events(self):
        return json.loads(self.Event)

    def set_events(self, event):
        self.Event = json.dumps(event)

    def get_positions(self):
        return json.loads(self.Position)

    def set_positions(self, position):
        self.Position = json.dumps(position)
        
class Update(Base):
    __tablename__ = "updates"

    id = Column(Integer, primary_key=True, index=True)
    Paragraphs = Column(Text) 
    Entities = Column(Text)  # Use Text to store large strings
    Relation = Column(Text)
    Event = Column(Text)
    Position = Column(Text)
    UserNote = Column(Text)
    UserID = Column(Integer, ForeignKey('users.id'), nullable=False)
    DocumentID = Column(Integer, ForeignKey('documents.id'), nullable=False)
    document = relationship("Document",back_populates="update")
    # Define the relationship to the User model
    user = relationship("User", back_populates="update")
    def get_paragraphs(self):
        para = json.loads(self.Paragraphs)
        return para

    def set_paragraphs(self, paragraphs):
        self.Paragraphs = json.dumps(paragraphs)
    def get_entities(self):
        return json.loads(self.Entities)

    def set_entities(self, entities):
        self.Entities = json.dumps(entities)

    def get_relations(self):
        relation = json.loads(self.Relation)
        return relation

    def set_relations(self, relation):
        self.Relation = json.dumps(relation)

    def get_events(self):
        event = json.loads(self.Event)
        return event

    def set_events(self, event):
        self.Event = json.dumps(event)

    def get_positions(self):
        pos = json.loads(self.Position)
        return pos

    def set_positions(self, position):
        self.Position = json.dumps(position)

    def get_user_notes(self):

        return json.loads(self.UserNote)

    def set_user_notes(self, userNote):
        self.UserNote = json.dumps(userNote)
        
# Add this to your User model to establish a bidirectional relationship
User.document = relationship("Document", back_populates="user")
User.update = relationship("Update", back_populates="user")
# Base.metadata.create_all(engine)