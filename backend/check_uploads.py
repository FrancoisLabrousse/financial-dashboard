from models import db, Upload
from app import create_app

app = create_app()

with app.app_context():
    uploads = Upload.query.all()
    print(f"Total Uploads: {len(uploads)}")
    for u in uploads:
        print(f"ID: {u.id} | File: {u.filename} | Status: {u.status} | Date: {u.upload_date}")
