from app.celery_app import celery_app

from app import tasks

if __name__ == "__main__":
    celery_app.start()
