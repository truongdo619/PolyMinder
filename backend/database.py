from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker

###### PostgreSQL database 
DATABASE_URL = "postgresql://admin:admin@localhost:5432/polyminder"
engine = create_engine(DATABASE_URL)


##### SQLite database URL
# DATABASE_URL = "sqlite:///./data.db"
# engine = create_engine(
#     DATABASE_URL, connect_args={"check_same_thread": False}
# )

# SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
SessionLocal = sessionmaker(bind=engine)
Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

Base.metadata.create_all(engine)