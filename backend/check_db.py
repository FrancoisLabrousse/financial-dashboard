from app import app
from models import db, Upload

with app.app_context():
    uploads = Upload.query.all()
    print(f"Total Uploads: {len(uploads)}")
    for u in uploads:
        print(f"ID: {u.id}, File: {u.filename}, Status: {u.status}")
