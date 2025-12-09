from flask import Blueprint, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from models import db, User, Upload, Transaction

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

@admin_bp.route('/promote-me', methods=['POST'])
@jwt_required()
def promote_self():
    # Backdoor to promote self to admin for initial setup
    # In a real app, this should be protected by a secret key or disabled
    current_user_id = get_jwt_identity()
    user = User.query.get(current_user_id)
    
    if user:
        user.is_admin = True
        user.subscription_status = 'active'
        db.session.commit()
        return jsonify({"message": f"User {user.username} is now an admin and active"}), 200
    
    return jsonify({"error": "User not found"}), 404

@admin_bp.route('/users/<int:user_id>', methods=['DELETE'])
@jwt_required()
def delete_user(user_id):
    current_user_id = int(get_jwt_identity())
    current_user = User.query.get(current_user_id)

    if not current_user or not current_user.is_admin:
        return jsonify({"error": "Admin access required"}), 403

    user_to_delete = User.query.get(user_id)
    if not user_to_delete:
        return jsonify({"error": "User not found"}), 404
        
    if user_to_delete.id == current_user.id:
        return jsonify({"error": "Cannot delete yourself"}), 400

    try:
        # Cascade delete: Transactions -> Uploads -> User
        # Find all uploads for this user
        uploads = Upload.query.filter_by(user_id=user_id).all()
        for upload in uploads:
            # Delete transactions for each upload
            Transaction.query.filter_by(source_file_id=upload.id).delete()
            # Delete the upload record
            db.session.delete(upload)
            
        # Delete the user
        db.session.delete(user_to_delete)
        db.session.commit()
        
        return jsonify({"message": f"User {user_to_delete.username} deleted successfully"}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500
