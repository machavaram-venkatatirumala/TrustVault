import sqlite3
import os

db_path = os.path.join(os.path.dirname(__file__), 'instance', 'trustvault.db')
if os.path.exists(db_path):
    con = sqlite3.connect(db_path)
    cur = con.cursor()
    
    user_cols = [r[1] for r in cur.execute('PRAGMA table_info(users)').fetchall()]
    if 'theme_preference' not in user_cols:
        cur.execute("ALTER TABLE users ADD COLUMN theme_preference VARCHAR(20) DEFAULT 'system'")
        print("Added users.theme_preference")
    if 'terms_version' not in user_cols:
        cur.execute("ALTER TABLE users ADD COLUMN terms_version VARCHAR(20)")
        print("Added users.terms_version")
    if 'terms_accepted_at' not in user_cols:
        cur.execute("ALTER TABLE users ADD COLUMN terms_accepted_at DATETIME")
        print("Added users.terms_accepted_at")

    org_cols = [r[1] for r in cur.execute('PRAGMA table_info(organizations)').fetchall()]
    if 'workspace_type' not in org_cols:
        cur.execute("ALTER TABLE organizations ADD COLUMN workspace_type VARCHAR(20) DEFAULT 'personal'")
        print("Added organizations.workspace_type")

    con.commit()
    con.close()
    print("Database migration complete.")
else:
    print("Database file does not exist yet; will be created fresh by db.create_all()")
