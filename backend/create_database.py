from database import Base, engine
from models.user import User

# Create the SQLite database tables
Base.metadata.create_all(bind=engine)