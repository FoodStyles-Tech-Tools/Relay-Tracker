import os
from flask import Flask, jsonify
from flask_cors import CORS
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Initialize Flask app
app = Flask(__name__)

# Configure CORS
ALLOWED_ORIGINS = [
    "http://localhost:5173",  # Vite dev server
    "http://localhost:3000",
    "https://relay-tracker.vercel.app",
]

# Add any custom origin from environment
custom_origin = os.getenv("FRONTEND_URL")
if custom_origin:
    ALLOWED_ORIGINS.append(custom_origin)

CORS(app, origins=ALLOWED_ORIGINS, supports_credentials=True)

# Register blueprints
from api.routes.auth import auth_bp  # noqa: E402
from api.routes.issues import issues_bp  # noqa: E402
app.register_blueprint(auth_bp)
app.register_blueprint(issues_bp)


@app.route("/api/health", methods=["GET"])
def health_check():
    """Health check endpoint to verify the API is running."""
    return jsonify({"status": "ok", "message": "Relay API is running"})


@app.route("/", methods=["GET"])
def root():
    """Root endpoint."""
    return jsonify({
        "name": "Relay API",
        "version": "1.0.0",
        "description": "Fast track from report to resolution",
        "endpoints": {
            "health": "/api/health",
            "auth": {
                "me": "/api/auth/me",
                "verify": "/api/auth/verify",
                "logout": "/api/auth/logout",
                "preferences": "/api/auth/preferences",
                "users": "/api/auth/users",
            },
            "issues": {
                "list": "GET /api/issues",
                "get": "GET /api/issues/{key}",
                "create": "POST /api/issues",
                "update": "PUT /api/issues/{key}",
                "delete": "DELETE /api/issues/{key}",
                "comments": "POST /api/issues/{key}/comments",
                "attachments": "POST /api/issues/{key}/attachments",
                "updates": "GET /api/issues/updates",
            },
        }
    })


# Error handlers
@app.errorhandler(404)
def not_found(error):
    return jsonify({"error": "Not found", "message": str(error)}), 404


@app.errorhandler(500)
def internal_error(error):
    return jsonify({"error": "Internal server error", "message": str(error)}), 500


# For local development
if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5001, debug=True)
