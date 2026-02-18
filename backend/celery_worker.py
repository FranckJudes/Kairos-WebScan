from app.celery_app import celery_app

# Cet import est nécessaire pour que les tâches soient enregistrées
from app import tasks

if __name__ == "__main__":
    celery_app.start()
