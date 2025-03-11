from celery import Celery

app = Celery(
    "tasks",
    broker="redis://localhost:6379/0",  # Replace with your Redis URL
    backend="redis://localhost:6379/0"
)
