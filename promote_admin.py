import sqlite3
import os
import sys

# Path to the database file
DB_PATH = os.path.join(os.getcwd(), 'backend', 'instance', 'financial_dashboard.db')

def promote_user(username):
    if not os.path.exists(DB_PATH):
        print(f"Database not found at: {DB_PATH}")
        return

    try:
        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()
        
        # Check if user exists
        cursor.execute("SELECT id, is_admin FROM users WHERE username = ?", (username,))
        user = cursor.fetchone()
        
        if not user:
            print(f"User '{username}' not found.")
            return

        if user[1]:
            print(f"User '{username}' is already an admin.")
            return

        # Update user
        cursor.execute("UPDATE users SET is_admin = 1 WHERE username = ?", (username,))
        conn.commit()
        
        if cursor.rowcount > 0:
            print(f"SUCCESS: User '{username}' has been promoted to ADMIN.")
        else:
            print("Error: Could not update user.")
            
        conn.close()
        
    except sqlite3.Error as e:
        print(f"SQLite error: {e}")

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python promote_admin.py <username>")
        # Default to 'Utilisateur' for convenience if no arg provided
        print("Attempting to promote default user 'Utilisateur'...")
        promote_user('Utilisateur')
    else:
        promote_user(sys.argv[1])
