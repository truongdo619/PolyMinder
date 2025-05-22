from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
import os
from routes import router
from config import UPLOAD_DIR
from database import Base,dev_engine

Base.metadata.create_all(bind=dev_engine)
# Base.metadata.create_all(bind=engine)
# Define the FastAPI app
app = FastAPI()

# CORS settings
origins = ["*"]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount static files directory
app.mount("/statics", StaticFiles(directory="uploads"), name="static")

# Create uploads directory if it doesn't exist
if not os.path.exists(UPLOAD_DIR):
    os.makedirs(UPLOAD_DIR)

# Include routes
app.include_router(router)



if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
