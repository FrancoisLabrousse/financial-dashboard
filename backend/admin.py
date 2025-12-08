from flask import Blueprint, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from models import db, User, Upload

admin_bp = Blueprint('admin', __name__)

@admin_bp.route('/users', methods=['GET'])
@jwt_required()
def get_users():
    current_user_id = get_jwt_identity()
    current_user = User.query.get(current_user_id)

    if not current_user or not current_user.is_admin:
        return jsonify({"error": "Admin access required"}), 403

    # Fetch all users with their upload count
    users = User.query.all()
    user_data = []
    
    for user in users:
        upload_count = Upload.query.filter_by(user_id=user.id).count()
        user_data.append({
            "id": user.id,
            "username": user.username,
            "email": user.email,
            "is_admin": user.is_admin,
            "created_at": user.created_at.strftime('%Y-%m-%d %H:%M'),
            "upload_count": upload_count
        })

    return jsonify(user_data), 200
