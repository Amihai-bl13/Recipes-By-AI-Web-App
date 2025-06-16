from flask import Flask, request, jsonify, session, make_response
from flask_cors import CORS
from google.oauth2 import id_token
from google.auth.transport import requests as google_requests
from dotenv import load_dotenv
import os
import requests
from datetime import datetime
import traceback
import sys
import jwt
from functools import wraps

# Add the parent directory to the path to import database module
parent_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, parent_dir)
from database.models import DatabaseManager

app = Flask(__name__)
app.secret_key = os.urandom(24)  # Used for session encryption
JWT_SECRET_KEY = os.getenv("JWT_SECRET_KEY")

if not JWT_SECRET_KEY:
    raise ValueError("JWT_SECRET_KEY is not set in environment variables")

# Run Locally:
# CORS(app, origins=["http://localhost:3000"], supports_credentials=True)


# allow the session cookie to be sent in cross-site requests
app.config.update({
    "SESSION_COOKIE_SAMESITE": "None",
    "SESSION_COOKIE_SECURE": True,
    "SESSION_COOKIE_HTTPONLY": False,  # Allow JavaScript access if needed
    "SESSION_COOKIE_DOMAIN": None,     # Let browser handle domain
    "PERMANENT_SESSION_LIFETIME": 86400  # 24 hours
})
#Run on Render:
CORS(app, origins=["https://recipes-by-ai-web-app-front.onrender.com"], supports_credentials=True)

load_dotenv()

# Environment variables
GOOGLE_CLIENT_ID    = os.getenv("GOOGLE_CLIENT_ID")
OPENROUTER_API_KEY  = os.getenv("OPENROUTER_API_KEY")  # get yours at https://openrouter.ai

# Initialize database with new path (recipe-app/database instead of recipe-app/backend/database)
# For local development:
# db = DatabaseManager("../database/recipe_app.db")
# for production:
db = DatabaseManager("/tmp/recipe_app.db")

def generate_token(user_data):
    payload = {
        "user_id": user_data["id"],
        "google_id": user_data.get("google_id", ""),
        "email": user_data["email"],
        "exp": datetime.utcnow() + timedelta(days=7)  # Token expires in 7 days
    }
    return jwt.encode(payload, JWT_SECRET_KEY, algorithm="HS256")

def verify_token(token):
    try:
        payload = jwt.decode(token, JWT_SECRET_KEY, algorithms=["HS256"])
        return payload
    except jwt.ExpiredSignatureError:
        return None
    except jwt.InvalidTokenError:
        return None

def require_auth(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        token = request.headers.get('Authorization')
        if not token:
            return jsonify({"error": "No token provided"}), 401
        
        if token.startswith('Bearer '):
            token = token[7:]
        
        payload = verify_token(token)
        if not payload:
            return jsonify({"error": "Invalid or expired token"}), 401
        
        # Add user info to request context
        request.current_user = payload
        return f(*args, **kwargs)
    
    return decorated_function


@app.after_request
def after_request(response):
    # More permissive CORS for mobile browsers
    origin = request.headers.get('Origin')
    if origin == 'https://recipes-by-ai-web-app-front.onrender.com':
        response.headers['Access-Control-Allow-Origin'] = origin
        response.headers['Access-Control-Allow-Credentials'] = 'true'
        response.headers['Access-Control-Allow-Methods'] = 'GET,PUT,POST,DELETE,OPTIONS'
        response.headers['Access-Control-Allow-Headers'] = 'Content-Type,Authorization,X-Requested-With'
    # Remove problematic COOP
    response.headers.pop("Cross-Origin-Opener-Policy", None)
    return response

@app.route("/login/google", methods=["POST"])
def login_with_google():
    data = request.json or {}
    token = data.get("token")

    try:
        idinfo = id_token.verify_oauth2_token(
            token,
            google_requests.Request(),
            GOOGLE_CLIENT_ID
        )

        google_id = idinfo["sub"]
        email = idinfo["email"]
        name = idinfo.get("name", "")
        picture = idinfo.get("picture", "")

        # Create or update user in database
        user = db.create_or_update_user(google_id, email, name, picture)
        
        # Generate JWT token instead of session
        jwt_token = generate_token(user)
        
        # Check if user needs to accept terms
        needs_terms = user.get("is_new_user", False) or not user.get("terms_accepted", False)

        return jsonify({
            "message": "Login successful",
            "token": jwt_token,  # Send JWT token to frontend
            "user": {
                "email": user["email"],
                "name": user["name"],
                "picture": user["picture"]
            },
            "isNewUser": needs_terms
        })
    except Exception as e:
        print("Google login error:")
        traceback.print_exc()
        return jsonify({"error": "Invalid token", "details": str(e)}), 401

@app.route("/logout", methods=["POST"])
def logout():
    # With JWT, logout is handled client-side by removing the token
    return jsonify({"message": "Logged out successfully"})

@app.route("/me", methods=["GET"])
@require_auth
def me():
    user_id = request.current_user["user_id"]
    google_id = request.current_user["google_id"]
    
    user = db.get_user_by_google_id(google_id)
    if not user:
        return jsonify({"error": "User not found"}), 404

    if not user.get("terms_accepted", False):
        return jsonify({"error": "Terms not accepted"}), 403
    
    return jsonify({
        "email": user["email"],
        "name": user["name"],
        "picture": user["picture"]
    })

@app.route("/accept-terms", methods=["POST"])
@require_auth
def accept_terms():
    user_id = request.current_user["user_id"]
    try:
        success = db.accept_terms(user_id)
        if success:
            return jsonify({"message": "Terms accepted successfully"})
        else:
            return jsonify({"error": "Failed to accept terms"}), 500
    except Exception as e:
        print("Terms acceptance error:")
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500

@app.route("/suggest_recipe", methods=["POST", "OPTIONS"])
@require_auth
def suggest_recipe():
    # Preflight CORS
    if request.method == "OPTIONS":
        return make_response(("", 200))

    user_id = session.get("user_id")
    if not user_id:
        return jsonify({"error": "Not logged in"}), 401

    data = request.get_json() or {}
    message = data.get("message", "")

    # Get conversation history from database
    conversation_history = db.get_conversation_history(user_id)
    
    # Add user message to local history
    conversation_history.append({"role": "user", "content": message})

    # Call OpenRouter API with conversation history
    try:
        headers = {
            "Authorization": f"Bearer {OPENROUTER_API_KEY}",
            "Content-Type":  "application/json",
            "Referer":       "http://localhost:3000"
        }
        payload = {
            "model":    "mistralai/mistral-7b-instruct",
            "messages": conversation_history
        }

        resp = requests.post(
            "https://openrouter.ai/api/v1/chat/completions",
            headers=headers,
            json=payload,
            timeout=15
        )
        resp.raise_for_status()
        jr = resp.json()
        reply = jr.get("choices", [])[0].get("message", {}).get("content", "").strip()

        # Check if the AI is refusing to help with non-cooking topics
        non_cooking_indicators = [
            "I can only help with cooking",
            "I'm a cooking assistant",
            "Please ask me about ingredients",
            "cooking and recipe suggestions"
        ]
        
        is_non_cooking_response = any(indicator in reply for indicator in non_cooking_indicators)
        
        if is_non_cooking_response:
            # Extract just the first sentence (up to first period or newline)
            # This ensures we drop any recipe text that follows.
            # Find the earliest break (newline or period)
            first_line = reply.split("\n")[0]
            if "." in first_line:
                # Keep everything through the first period.
                refusal_msg = first_line.split(".", 1)[0].strip() + "."
            else:
                refusal_msg = first_line.strip()

            # Remove user message from local history
            if conversation_history and conversation_history[-1]["role"] == "user":
                conversation_history.pop()

            return jsonify({"error": refusal_msg, "is_cooking_error": True}), 400

        # Add user message to db history
        db.add_conversation_message(user_id, "user", message)

        # Add assistant reply to database
        db.add_conversation_message(user_id, "assistant", reply)

        return jsonify({"recipe": reply})

    except Exception as e:
        print("Error calling OpenRouter:")
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500

@app.route("/favorites", methods=["GET", "POST", "DELETE"])
@require_auth
def manage_favorites():
    user_id = session.get("user_id")
    if not user_id:
        return jsonify({"error": "Not logged in"}), 401
    
    if request.method == "GET":
        # Return user's favorite recipes from database
        try:
            favorites = db.get_user_favorites(user_id)
            return jsonify({"favorites": favorites})
        except Exception as e:
            print("Error getting favorites:")
            traceback.print_exc()
            return jsonify({"error": str(e)}), 500
    
    elif request.method == "POST":
        # Add a recipe to favorites
        data = request.get_json() or {}
        recipe_content = data.get("recipe", "")
        recipe_title = data.get("title", "Untitled Recipe")
        
        if not recipe_content:
            return jsonify({"error": "No recipe content provided"}), 400
        
        try:
            favorite_recipe = db.add_favorite_recipe(user_id, recipe_title, recipe_content)
            return jsonify({"message": "Recipe starred successfully", "recipe": favorite_recipe})
        except ValueError as e:
            return jsonify({"error": str(e)}), 409
        except Exception as e:
            print("Error adding favorite:")
            traceback.print_exc()
            return jsonify({"error": str(e)}), 500
    
    elif request.method == "DELETE":
        # Remove a recipe from favorites
        data = request.get_json() or {}
        recipe_id = data.get("recipe_id")
        
        if not recipe_id:
            return jsonify({"error": "Recipe ID is required"}), 400
        
        try:
            success = db.remove_favorite_recipe(user_id, recipe_id)
            if success:
                return jsonify({"message": "Recipe removed from favorites"})
            else:
                return jsonify({"error": "Recipe not found or not owned by user"}), 404
        except Exception as e:
            print("Error removing favorite:")
            traceback.print_exc()
            return jsonify({"error": str(e)}), 500

@app.route("/clear_history", methods=["POST"])
@require_auth
def clear_conversation_history():
    """Clear conversation history for the current user (except system messages)"""
    user_id = session.get("user_id")
    if not user_id:
        return jsonify({"error": "Not logged in"}), 401
    
    try:
        db.clear_conversation_history(user_id)
        return jsonify({"message": "Conversation history cleared successfully"})
    except Exception as e:
        print("Error clearing history:")
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500

@app.route("/", methods=["GET"])
def index():
    return "Backend is running with SQLite database and conversational OpenRouter!"

if __name__ == "__main__":
    app.run(debug=True)
