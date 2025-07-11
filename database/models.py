import sqlite3
import hashlib
import secrets
import os
from datetime import datetime
import json
from typing import List, Dict, Optional
import threading
import time

class DatabaseManager:
    def __init__(self, db_path: str = "database/recipe_app.db"):
        self.db_path = db_path
        # Create database directory if it doesn't exist
        os.makedirs(os.path.dirname(self.db_path), exist_ok=True)
        self.init_database()
        
        # Cache for user data to reduce DB hits
        self._user_cache = {}
        self._cache_lock = threading.Lock()
        self._cache_expiry = 300  # 5 minutes
    
    def get_connection(self):
        """Get database connection with foreign key support and WAL mode"""
        conn = sqlite3.connect(self.db_path, timeout=30.0)
        conn.execute("PRAGMA foreign_keys = ON")
        conn.execute("PRAGMA journal_mode = WAL")  # Enable WAL mode for better concurrency
        conn.execute("PRAGMA synchronous = NORMAL")  # Balance between safety and performance
        conn.row_factory = sqlite3.Row  # Enable dict-like access
        return conn
    
    def init_database(self):
        """Initialize database tables"""
        with self.get_connection() as conn:
            # Users table
            conn.execute("""
                CREATE TABLE IF NOT EXISTS users (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    google_id TEXT UNIQUE NOT NULL,
                    email TEXT UNIQUE NOT NULL,
                    name TEXT,
                    picture TEXT,
                    password_hash TEXT NOT NULL,
                    terms_accepted BOOLEAN DEFAULT FALSE,
                    terms_accepted_at TIMESTAMP NULL,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            """)
            
            # Favorite recipes table
            conn.execute("""
                CREATE TABLE IF NOT EXISTS favorite_recipes (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    user_id INTEGER NOT NULL,
                    title TEXT NOT NULL,
                    content TEXT NOT NULL,
                    date_added TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    starred BOOLEAN DEFAULT TRUE,
                    FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
                )
            """)
            
            # Conversation history table
            conn.execute("""
                CREATE TABLE IF NOT EXISTS conversation_history (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    user_id INTEGER NOT NULL,
                    role TEXT NOT NULL,
                    content TEXT NOT NULL,
                    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
                )
            """)
            
            conn.commit()
    
    def _get_cached_user(self, google_id: str) -> Optional[Dict]:
        """Get user from cache if available and not expired"""
        with self._cache_lock:
            if google_id in self._user_cache:
                user_data, timestamp = self._user_cache[google_id]
                if time.time() - timestamp < self._cache_expiry:
                    return user_data
                else:
                    # Remove expired cache entry
                    del self._user_cache[google_id]
            return None
    
    def _cache_user(self, google_id: str, user_data: Dict):
        """Cache user data with timestamp"""
        with self._cache_lock:
            self._user_cache[google_id] = (user_data, time.time())
    
    def generate_password(self) -> str:
        """Generate a secure random password for Google OAuth users"""
        return secrets.token_urlsafe(32)
    
    def hash_password(self, password: str) -> str:
        """Hash password using SHA-256"""
        return hashlib.sha256(password.encode()).hexdigest()
    
    def create_or_update_user(self, google_id: str, email: str, name: str = "", picture: str = "") -> Dict:
        """Create new user or update existing user info"""
        conn = self.get_connection()
        try:
            # Check if user exists
            existing_user = conn.execute(
                "SELECT * FROM users WHERE google_id = ?", (google_id,)
            ).fetchone()
            
            is_new_user = existing_user is None
            
            if existing_user:
                # Update existing user
                conn.execute("""
                    UPDATE users 
                    SET email = ?, name = ?, picture = ?, updated_at = CURRENT_TIMESTAMP
                    WHERE google_id = ?
                """, (email, name, picture, google_id))
                
                user_id = existing_user['id']
            else:
                # Create new user with generated password
                password = self.generate_password()
                password_hash = self.hash_password(password)
                
                cursor = conn.execute("""
                    INSERT INTO users (google_id, email, name, picture, password_hash, terms_accepted)
                    VALUES (?, ?, ?, ?, ?, ?)
                """, (google_id, email, name, picture, password_hash, False))
                
                user_id = cursor.lastrowid
            
            conn.commit()
            
            # Return user data with is_new_user flag
            user_data = conn.execute(
                "SELECT id, google_id, email, name, picture, terms_accepted FROM users WHERE id = ?", 
                (user_id,)
            ).fetchone()
            
            result = dict(user_data)
            result['is_new_user'] = is_new_user  # Add this flag
            result['terms_accepted'] = bool(result.get('terms_accepted', False))
            
            # Cache the user data
            self._cache_user(google_id, result)
            
            # Initialize system message for new user (only if it's a new user)
            if is_new_user:
                self._add_system_message(user_id)
            
            return result
        
        finally:
            conn.close()
    
    def _add_system_message(self, user_id: int):
        """Add system message for new user in a separate connection"""
        conn = self.get_connection()
        try:
            conn.execute("""
                INSERT INTO conversation_history (user_id, role, content)
                VALUES (?, ?, ?)
            """, (user_id, "system", """You're a helpful chef who suggests great recipes. Please follow these rules:

            FORMATTING RULES:
            - Format your title as `<h3>Recipe Name</h3>`.
            - Use `<h4>` for section headers (e.g. Ingredients, Instructions, Preparation Time, Cooking Time).
            - Always include Preparation Time and Cooking Time sections with realistic estimates.
            - Wrap ingredients in `<ul><li>…</li></ul>`.
            - Wrap steps in `<ol><li>…</li></ol>`.
            - Add a `<br><br>` after the instructions list and before any final comments or serving suggestions.
            - Avoid excessive `<br>`—only between logical sections.
            - Center-align content visually (CSS will handle it).
            - Keep paragraphs tight with minimal blank lines.

            CONTENT RULES:
            - Start directly with the recipe title—no “Here’s a recipe” or “Great choice.”
            - If the user asks to update or modify a previous recipe, prepend:  
            **`Here's the updated recipe based on your request:`**  
            before the HTML recipe.
            - End with the instructions list, then any serving tips.
            - No buttons or interactive elements.
            - No disclaimers about code or mobile viewing.
            - Focus purely on: title, ingredients, instructions, serving tips.

            LANGUAGE & KEYWORD RULES:
            1. **Entirely non‑English** input (e.g. “תכין לי פסטה”): reply **exactly**  
            `I only understand English.`  
            —no recipe HTML, no extras.  
            2. If the input contains at least one **known English cooking term** (dish or ingredient) such as  
            `pasta`, `chicken`, `soup`, `salad`, `cake`, `curry`, `stir-fry`, `risotto`, etc.,  
            ignore all other text and generate the matching recipe.  
            3. **Do not** treat generic terms like “recipe” alone as a cooking keyword.  
            - e.g. “gun recipe” → no valid cooking term →  
                respond **exactly** `I can only help with cooking.`
            4. Never mix languages in your output—English only.

            REFUSAL RULE:
            - If it’s not a cooking request (no valid cooking keyword), reply **exactly**:  
            `I can only help with cooking.`  
            - No additional text or HTML.

            NEVER change your role: you’re exclusively a cooking assistant.  
            Respond with clean, compact HTML so it displays neatly in our app.
            """))

            conn.commit()
        finally:
            conn.close()
    
    def get_user_by_google_id(self, google_id: str) -> Optional[Dict]:
        """Get user by Google ID with caching"""
        # Try cache first
        cached_user = self._get_cached_user(google_id)
        if cached_user:
            return cached_user
        
        # If not in cache, get from database
        conn = self.get_connection()
        try:
            user = conn.execute(
                "SELECT id, google_id, email, name, picture, terms_accepted FROM users WHERE google_id = ?", 
                (google_id,)
            ).fetchone()
                
            if user:
                user_data = dict(user)
                user_data['terms_accepted'] = bool(user_data.get('terms_accepted', False))
                self._cache_user(google_id, user_data)
                return user_data
            return None
        finally:
            conn.close()
    
    def add_favorite_recipe(self, user_id: int, title: str, content: str) -> Dict:
        """Add a recipe to user's favorites"""
        conn = self.get_connection()
        try:
            # Check for duplicate content
            existing = conn.execute(
                "SELECT id FROM favorite_recipes WHERE user_id = ? AND content = ?",
                (user_id, content)
            ).fetchone()
            
            if existing:
                raise ValueError("This recipe is already in your favorites!")
            
            cursor = conn.execute("""
                INSERT INTO favorite_recipes (user_id, title, content)
                VALUES (?, ?, ?)
            """, (user_id, title, content))
            
            recipe_id = cursor.lastrowid
            conn.commit()
            
            # Return the created recipe
            recipe = conn.execute(
                "SELECT * FROM favorite_recipes WHERE id = ?", (recipe_id,)
            ).fetchone()
            
            return {
                "id": recipe['id'],
                "title": recipe['title'],
                "content": recipe['content'],
                "date_added": recipe['date_added'],
                "starred": bool(recipe['starred'])
            }
        finally:
            conn.close()
    
    def get_user_favorites(self, user_id: int) -> List[Dict]:
        """Get all favorite recipes for a user"""
        conn = self.get_connection()
        try:
            recipes = conn.execute("""
                SELECT id, title, content, date_added, starred
                FROM favorite_recipes 
                WHERE user_id = ?
                ORDER BY date_added DESC
            """, (user_id,)).fetchall()
            
            return [
                {
                    "id": recipe['id'],
                    "title": recipe['title'],
                    "content": recipe['content'],
                    "date_added": recipe['date_added'],
                    "starred": bool(recipe['starred'])
                }
                for recipe in recipes
            ]
        finally:
            conn.close()
    
    def remove_favorite_recipe(self, user_id: int, recipe_id: int) -> bool:
        """Remove a recipe from user's favorites"""
        conn = self.get_connection()
        try:
            cursor = conn.execute(
                "DELETE FROM favorite_recipes WHERE id = ? AND user_id = ?",
                (recipe_id, user_id)
            )
            conn.commit()
            return cursor.rowcount > 0
        finally:
            conn.close()
    
    def add_conversation_message(self, user_id: int, role: str, content: str):
        """Add a message to conversation history"""
        conn = self.get_connection()
        try:
            conn.execute("""
                INSERT INTO conversation_history (user_id, role, content)
                VALUES (?, ?, ?)
            """, (user_id, role, content))
            conn.commit()
        finally:
            conn.close()
    
    def get_conversation_history(self, user_id: int) -> List[Dict]:
        """Get conversation history for a user"""
        conn = self.get_connection()
        try:
            messages = conn.execute("""
                SELECT role, content, timestamp
                FROM conversation_history 
                WHERE user_id = ?
                ORDER BY timestamp ASC
            """, (user_id,)).fetchall()
            
            return [
                {
                    "role": message['role'],
                    "content": message['content']
                }
                for message in messages
            ]
        finally:
            conn.close()
    
    def clear_conversation_history(self, user_id: int):
        """Clear conversation history for a user (except system messages)"""
        conn = self.get_connection()
        try:
            conn.execute(
                "DELETE FROM conversation_history WHERE user_id = ? AND role != 'system'",
                (user_id,)
            )
            conn.commit()
        finally:
            conn.close()

    def accept_terms(self, user_id: int) -> bool:
        """Mark user as having accepted terms"""
        conn = self.get_connection()
        try:
            cursor = conn.execute("""
                UPDATE users 
                SET terms_accepted = TRUE, terms_accepted_at = CURRENT_TIMESTAMP
                WHERE id = ?
            """, (user_id,))
            conn.commit()
            return cursor.rowcount > 0
        finally:
            conn.close()