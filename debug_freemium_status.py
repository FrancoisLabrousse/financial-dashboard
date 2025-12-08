from app import create_app
from models import db, User, Upload

app = create_app()

with app.app_context():
    # Find the test user
    user = User.query.filter_by(username='freemium_test_user').first()
    if user:
        print(f"User: {user.username}")
        print(f"ID: {user.id}")
        print(f"Subscription Status: {user.subscription_status}")
        
        uploads = Upload.query.filter_by(user_id=user.id).all()
        print(f"Upload Count: {len(uploads)}")
        for u in uploads:
            print(f" - Upload ID: {u.id}, Filename: {u.filename}, Status: {u.status}")
            
        # Check if limit logic would trigger
        if user.subscription_status != 'active':
            if len(uploads) >= 2:
                print("LIMIT SHOULD TRIGGER")
            else:
                print("Limit NOT reached yet")
    else:
        print("User 'freemium_test_user' not found.")
