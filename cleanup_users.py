import sqlite3
import os

# Path to the database file
DB_PATH = os.path.join(os.getcwd(), 'backend', 'instance', 'financial_dashboard.db')

def cleanup_users():
    if not os.path.exists(DB_PATH):
        print(f"Database not found at: {DB_PATH}")
        return

    try:
        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()
        
        print(f"--- Cleaning up users in {DB_PATH} ---")
        
        # 1. Identify users to delete (everyone except francois.labrousse75@sfr.fr)
        target_email = 'francois.labrousse75@sfr.fr'
        cursor.execute("SELECT id, username FROM users WHERE email != ?", (target_email,))
        users_to_delete = cursor.fetchall()
        
        if not users_to_delete:
            print("No other users found to delete.")
            conn.close()
            return

        print(f"Found {len(users_to_delete)} users to delete:")
        for u in users_to_delete:
            print(f" - ID: {u[0]}, Username: {u[1]}")

        user_ids = [u[0] for u in users_to_delete]
        user_ids_placeholder = ','.join('?' * len(user_ids))

        # 2. Find uploads belonging to these users
        cursor.execute(f"SELECT id FROM uploads WHERE user_id IN ({user_ids_placeholder})", user_ids)
        uploads_to_delete = cursor.fetchall()
        upload_ids = [u[0] for u in uploads_to_delete]
        
        print(f"Found {len(upload_ids)} uploads associated with these users.")

        # 3. Delete Transactions associated with these uploads
        if upload_ids:
            upload_ids_placeholder = ','.join('?' * len(upload_ids))
            cursor.execute(f"DELETE FROM transactions WHERE source_file_id IN ({upload_ids_placeholder})", upload_ids)
            print(f"Deleted {cursor.rowcount} transactions.")

        # 4. Delete Uploads
        if user_ids:
            cursor.execute(f"DELETE FROM uploads WHERE user_id IN ({user_ids_placeholder})", user_ids)
            print(f"Deleted {cursor.rowcount} uploads.")

        # 5. Delete Users
        cursor.execute(f"DELETE FROM users WHERE id IN ({user_ids_placeholder})", user_ids)
        print(f"Deleted {cursor.rowcount} users.")

        conn.commit()
        print("Cleanup completed successfully.")
        conn.close()
        
    except sqlite3.Error as e:
        print(f"SQLite error: {e}")

if __name__ == "__main__":
    cleanup_users()
