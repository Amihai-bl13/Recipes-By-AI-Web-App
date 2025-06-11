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

# Add the parent directory to the path to import database module
parent_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, parent_dir)
from database.models import DatabaseManager

app = Flask(__name__)
app.secret_key = os.urandom(24)  # Used for session encryption

# Run Locally:
#CORS(app, origins=["http://localhost:3000"], supports_credentials=True)

#Run on Render:
CORS(app, origins=["https://recipes-by-ai-web-app.onrender.com/"], supports_credentials=True)

load_dotenv()

# Environment variables
GOOGLE_CLIENT_ID    = os.getenv("GOOGLE_CLIENT_ID")
OPENROUTER_API_KEY  = os.getenv("OPENROUTER_API_KEY")  # get yours at https://openrouter.ai

# Initialize database with new path (recipe-app/database instead of recipe-app/backend/database)
db = DatabaseManager("../database/recipe_app.db")

@app.route("/login/google", methods=["POST"])
def login_with_google():
    data  = request.json or {}
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

        # Save user in session
        session["user_id"] = user["id"]
        session["google_id"] = google_id

        # Check if user needs to accept terms (new user OR existing user who hasn't accepted)
        needs_terms = user.get("is_new_user", False) or not user.get("terms_accepted", False)

        return jsonify({
            "message": "Login successful", 
            "user": {
                "email": user["email"],
                "name": user["name"],
                "picture": user["picture"]
            },
            "isNewUser": needs_terms  # This will be true for new users OR users who haven't accepted terms
        })
    except Exception as e:
        print("Google login error:")
        traceback.print_exc()
        return jsonify({"error": "Invalid token", "details": str(e)}), 401

@app.route("/logout", methods=["POST"])
def logout():
    session.pop("user_id", None)
    session.pop("google_id", None)
    return jsonify({"message": "Logged out successfully"})

@app.route("/me", methods=["GET"])
def me():
    user_id = session.get("user_id")
    google_id = session.get("google_id")
    
    if not user_id or not google_id:
        return jsonify({"error": "Not logged in"}), 401
    
    user = db.get_user_by_google_id(google_id)
    if not user:
        return jsonify({"error": "User not found"}), 404

    # Check if user has accepted terms
    if not user.get("terms_accepted", False):
        return jsonify({"error": "Terms not accepted"}), 403
    
    return jsonify({
        "email": user["email"],
        "name": user["name"],
        "picture": user["picture"]
    })

@app.route("/accept-terms", methods=["POST"])
def accept_terms():
    user_id = session.get("user_id")
    if not user_id:
        return jsonify({"error": "Not logged in"}), 401
    
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