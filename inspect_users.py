import sqlite3
import os

# Path to the database file
DB_PATH = os.path.join(os.getcwd(), 'backend', 'instance', 'financial_dashboard.db')

def inspect_users():
    if not os.path.exists(DB_PATH):
        print(f"Database not found at: {DB_PATH}")
        # Try looking in root if not in instance
        alt_path = 'financial_dashboard.db'
        if os.path.exists(alt_path):
            print(f"Found database at root: {alt_path}")
            return connect_and_query(alt_path)
        return

    connect_and_query(DB_PATH)

def connect_and_query(db_path):
    try:
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()
        
        print(f"\n--- Connected to {db_path} ---")
        print("\n[ Users Table ]")
        
        cursor.execute("SELECT id, username, email, is_admin, created_at FROM users")
        users = cursor.fetchall()
        
        if not users:
            print("No users found.")
        else:
            print(f"{'ID':<5} {'Username':<20} {'Email':<30} {'Admin':<10} {'Created At'}")
            print("-" * 80)
            for user in users:
                # user is a tuple: (id, username, email, is_admin, created_at)
                is_admin = "YES" if user[3] else "NO"
                print(f"{user[0]:<5} {user[1]:<20} {user[2]:<30} {is_admin:<10} {user[4]}")
                
        conn.close()
        
    except sqlite3.Error as e:
        print(f"SQLite error: {e}")

if __name__ == "__main__":
    inspect_users()
