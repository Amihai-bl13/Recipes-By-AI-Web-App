from flask import Flask, request, jsonify, session, make_response
from flask_cors import CORS
from google.oauth2 import id_token
from google.auth.transport import requests as google_requests
from dotenv import load_dotenv
import os
import requests
from datetime import datetime
import traceback

app = Flask(__name__)
app.secret_key = os.urandom(24)  # Used for session encryption
CORS(app, origins=["http://localhost:3000"], supports_credentials=True)

load_dotenv()

# Environment variables
GOOGLE_CLIENT_ID    = os.getenv("GOOGLE_CLIENT_ID")
OPENROUTER_API_KEY  = os.getenv("OPENROUTER_API_KEY")  # get yours at https://openrouter.ai

# In-memory stores
users = {}
histories = {}  # per-user conversation history

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

        userid = idinfo["sub"]
        if userid not in users:
            # New user
            users[userid] = {
                "email":   idinfo["email"],
                "name":    idinfo.get("name", ""),
                "picture": idinfo.get("picture", ""),
                "favorites": []  # Initialize favorites for new users
            }
        else:
            # Existing user - update info but preserve favorites
            existing_favorites = users[userid].get("favorites", [])
            users[userid]["email"] = idinfo["email"]
            users[userid]["name"] = idinfo.get("name", "")
            users[userid]["picture"] = idinfo.get("picture", "")
            users[userid]["favorites"] = existing_favorites
        # Initialize history for this user
        histories[userid] = [
            {
                "role": "system",
                "content": """You're a helpful chef who suggests great recipes. Please follow these rules:

                            FORMATTING RULES:
                            - Format your title as `<h3>Recipe Name</h3>`.
                            - Use `<h4>` for section headers (e.g. Ingredients, Instructions).
                            - Wrap ingredients in `<ul><li>…</li></ul>`.
                            - Wrap steps in `<ol><li>…</li></ol>`.
                            - Add a `<br><br>` after the instructions list and before any final comments or serving suggestions
                            - Avoid excessive `<br>`—only between logical sections.
                            - Center‐align content visually (CSS will handle it).
                            - Keep paragraphs tight with minimal blank lines.

                            CONTENT RULES:
                            - Start directly with the recipe title - no introductory text like "Here's a recipe" or "Great choice"
                            - End with the recipe instructions followed by any serving suggestions or tips
                            - Do not include any buttons or interactive elements in your response
                            - Do not add disclaimers about code optimization or mobile viewing
                            - Focus purely on the recipe content: title, ingredients, cooking instructions, and serving tips
                            - Keep the response clean and recipe-focused only

                            Respond with clean, compact HTML so it displays neatly in our app.
                            """,
            }
        ]

        # Save user in session
        session["user_id"] = userid

        return jsonify({"message": "Login successful", "user": users[userid]})
    except Exception as e:
        print("Google login error:")
        traceback.print_exc()
        return jsonify({"error": "Invalid token", "details": str(e)}), 401

@app.route("/logout", methods=["POST"])
def logout():
    uid = session.pop("user_id", None)
    if uid and uid in histories:
        histories.pop(uid, None)
    return jsonify({"message": "Logged out successfully"})

@app.route("/me", methods=["GET"])
def me():
    uid = session.get("user_id")
    if not uid or uid not in users:
        return jsonify({"error": "Not logged in"}), 401
    return jsonify(users[uid])

@app.route("/suggest_recipe", methods=["POST", "OPTIONS"])
def suggest_recipe():
    # Preflight CORS
    if request.method == "OPTIONS":
        return make_response(("", 200))

    uid = session.get("user_id")
    if not uid or uid not in users:
        return jsonify({"error": "Not logged in"}), 401

    data    = request.get_json() or {}
    message = data.get("message", "")

    # Append user message to history
    histories.setdefault(uid, [{"role": "system", "content": "You're a helpful chef who suggests great recipes."}])
    histories[uid].append({"role": "user", "content": message})

    # Call OpenRouter API with full conversation history
    try:
        headers = {
            "Authorization": f"Bearer {OPENROUTER_API_KEY}",
            "Content-Type":  "application/json",
            "Referer":       "http://localhost:3000"
        }
        payload = {
            "model":    "mistralai/mistral-7b-instruct",
            "messages": histories[uid]
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

        # Append assistant reply to history
        histories[uid].append({"role": "assistant", "content": reply})

        return jsonify({"recipe": reply})

    except Exception as e:
        print("Error calling OpenRouter:")
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500

@app.route("/favorites", methods=["GET", "POST", "DELETE"])
def manage_favorites():
    uid = session.get("user_id")
    if not uid or uid not in users:
        return jsonify({"error": "Not logged in"}), 401
    
    if request.method == "GET":
        # Return user's favorite recipes
        user_favorites = users[uid].get("favorites", [])
        return jsonify({"favorites": user_favorites})
    
    elif request.method == "POST":
        # Add a recipe to favorites
        data = request.get_json() or {}
        recipe_content = data.get("recipe", "")
        recipe_title = data.get("title", "Untitled Recipe")
        
        if not recipe_content:
            return jsonify({"error": "No recipe content provided"}), 400
        
        # Initialize favorites if not exists
        if "favorites" not in users[uid]:
            users[uid]["favorites"] = []

        # Check for duplicate content
        for existing_recipe in users[uid]["favorites"]:
            if existing_recipe["content"] == recipe_content:
                return jsonify({"error": "This recipe is already in your favorites!"}), 409
        
        favorite_recipe = {
            "id": len(users[uid]["favorites"]) + 1,
            "title": recipe_title,
            "content": recipe_content,
            "date_added": datetime.now().isoformat(),
            "starred": True
        }
        
        users[uid]["favorites"].append(favorite_recipe)
        return jsonify({"message": "Recipe starred successfully", "recipe": favorite_recipe})
    
    elif request.method == "DELETE":
        # Remove a recipe from favorites
        data = request.get_json() or {}
        recipe_id = data.get("recipe_id")
        
        if "favorites" in users[uid]:
            users[uid]["favorites"] = [r for r in users[uid]["favorites"] if r["id"] != recipe_id]
        
        return jsonify({"message": "Recipe removed from favorites"})

@app.route("/", methods=["GET"])
def index():
    return "Backend is running with conversational OpenRouter!"

if __name__ == "__main__":
    app.run(debug=True)
