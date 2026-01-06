"""Turso/libsql database utilities for Relay API."""

import os
import json
from typing import Optional
import libsql_experimental as libsql

# Database connection singleton
_connection = None


def get_connection():
    """Get or create a database connection."""
    global _connection

    if _connection is None:
        turso_url = os.getenv("TURSO_DATABASE_URL")
        turso_token = os.getenv("TURSO_AUTH_TOKEN")

        if not turso_url:
            raise ValueError("TURSO_DATABASE_URL must be set")

        # Connect to Turso (remote) or local SQLite
        if turso_token:
            _connection = libsql.connect(turso_url, auth_token=turso_token)
        else:
            # Local SQLite for development
            _connection = libsql.connect(turso_url)

    return _connection


def init_database():
    """Initialize the database schema."""
    conn = get_connection()

    # Read and execute schema
    schema_path = os.path.join(os.path.dirname(__file__), "..", "models", "schema.sql")
    with open(schema_path, "r") as f:
        schema = f.read()

    # Split by semicolons and execute each statement
    statements = [s.strip() for s in schema.split(";") if s.strip()]
    for statement in statements:
        if statement:
            try:
                conn.execute(statement)
            except Exception as e:
                # Ignore "already exists" errors
                if "already exists" not in str(e).lower():
                    print(f"Schema error: {e}")

    conn.commit()


def get_user_by_id(user_id: str) -> Optional[dict]:
    """Get a user by their Google sub ID."""
    conn = get_connection()
    result = conn.execute(
        "SELECT user_id, email, name, avatar_url, role, created_at, updated_at FROM user_roles WHERE user_id = ?",
        [user_id]
    ).fetchone()

    if result:
        return {
            "user_id": result[0],
            "email": result[1],
            "name": result[2],
            "avatar_url": result[3],
            "role": result[4],
            "created_at": result[5],
            "updated_at": result[6],
        }
    return None


def create_user(user_id: str, email: str, name: str = None, avatar_url: str = None) -> dict:
    """Create a new user. First user gets admin role."""
    conn = get_connection()

    # Check if this is the first user
    count = conn.execute("SELECT COUNT(*) FROM user_roles").fetchone()[0]
    role = "admin" if count == 0 else "user"

    # Insert user
    conn.execute(
        """INSERT INTO user_roles (user_id, email, name, avatar_url, role)
           VALUES (?, ?, ?, ?, ?)""",
        [user_id, email, name, avatar_url, role]
    )

    # Insert default preferences
    conn.execute(
        """INSERT INTO user_preferences (user_id, email_notifications, discord_notifications, theme)
           VALUES (?, 1, 1, 'system')""",
        [user_id]
    )

    conn.commit()

    return get_user_by_id(user_id)


def get_or_create_user(user_id: str, email: str, name: str = None, avatar_url: str = None) -> dict:
    """Get existing user or create a new one."""
    user = get_user_by_id(user_id)
    if user:
        # Update user info if changed
        conn = get_connection()
        conn.execute(
            """UPDATE user_roles SET email = ?, name = ?, avatar_url = ? WHERE user_id = ?""",
            [email, name, avatar_url, user_id]
        )
        conn.commit()
        return get_user_by_id(user_id)
    return create_user(user_id, email, name, avatar_url)


def get_user_preferences(user_id: str) -> Optional[dict]:
    """Get user preferences."""
    conn = get_connection()
    result = conn.execute(
        """SELECT email_notifications, discord_notifications, theme FROM user_preferences WHERE user_id = ?""",
        [user_id]
    ).fetchone()

    if result:
        return {
            "email_notifications": bool(result[0]),
            "discord_notifications": bool(result[1]),
            "theme": result[2],
        }
    return None


def update_user_preferences(user_id: str, **kwargs) -> dict:
    """Update user preferences."""
    conn = get_connection()

    updates = []
    values = []

    if "email_notifications" in kwargs:
        updates.append("email_notifications = ?")
        values.append(1 if kwargs["email_notifications"] else 0)

    if "discord_notifications" in kwargs:
        updates.append("discord_notifications = ?")
        values.append(1 if kwargs["discord_notifications"] else 0)

    if "theme" in kwargs:
        updates.append("theme = ?")
        values.append(kwargs["theme"])

    if updates:
        values.append(user_id)
        conn.execute(
            f"UPDATE user_preferences SET {', '.join(updates)} WHERE user_id = ?",
            values
        )
        conn.commit()

    return get_user_preferences(user_id)


def update_user_role(user_id: str, role: str) -> Optional[dict]:
    """Update a user's role."""
    conn = get_connection()
    conn.execute(
        "UPDATE user_roles SET role = ? WHERE user_id = ?",
        [role, user_id]
    )
    conn.commit()
    return get_user_by_id(user_id)


def get_all_users() -> list:
    """Get all users (admin only)."""
    conn = get_connection()
    results = conn.execute(
        "SELECT user_id, email, name, avatar_url, role, created_at FROM user_roles ORDER BY created_at"
    ).fetchall()

    return [
        {
            "user_id": r[0],
            "email": r[1],
            "name": r[2],
            "avatar_url": r[3],
            "role": r[4],
            "created_at": r[5],
        }
        for r in results
    ]


def log_activity(user_id: str, action: str, jira_issue_key: str = None, metadata: dict = None):
    """Log user activity."""
    conn = get_connection()
    conn.execute(
        """INSERT INTO activity_log (user_id, action, jira_issue_key, metadata)
           VALUES (?, ?, ?, ?)""",
        [user_id, action, jira_issue_key, json.dumps(metadata or {})]
    )
    conn.commit()
