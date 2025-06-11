# 🍳 Recipes by AI

An AI-powered web app that helps you cook with whatever you have in your kitchen! Just log in with Google, describe your ingredients or cravings, and get delicious recipes generated instantly by a smart AI model.
Accessible here: https://recipes-by-ai-web-app-front.onrender.com/

---

## 📸 Demo

![image](https://github.com/user-attachments/assets/3e8b6801-7ade-4f20-b71b-9fbb2609ffaf)

---

## 📋 Features

- **Google OAuth Login**: Sign in quickly and securely.
- **Terms Acceptance**: First-time users accept terms & conditions.
- **AI‑Powered Recipe Generation**: Describe your ingredients or cravings, and our Mistral‑7B‑Instruct model does the rest.
- **Favorites**: Star, view, and delete your favorite recipes.
- **Conversation Memory**: Keeps context to chat naturally with the assistant.
- **Dark/Light Themes**: Toggle for comfort anytime.
- **Timer**: Built-in kitchen timer for perfect cooking rhythm.

---

## 🛠 Tech Stack

**Frontend**:
- React
- JavaScript
- HTML/CSS

**Backend**:
- Python (Flask)
- Flask-Login
- OpenRouter API (for Mistral-7B-Instruct model)
- Google OAuth

**Database**:
- SQLite (via SQLAlchemy)

---

## 🚀 Getting Started - Run Locally

### 1. Clone the Repository

```bash
git clone https://github.com/Amihai-bl13/Recipes-By-AI-Web-App.git
cd Recipes-By-AI-Web-App
```

### 2. Set Up the Backend

Create and activate a Python virtual environment:

```bash
python -m venv venv
source venv/bin/activate  # On Windows use: venv\Scripts\activate
```

Install requirements:

```bash
pip install -r requirements.txt
```

Create a `.env` file in the backend directory with your credentials:

```env
GOOGLE_CLIENT_ID=your_google_client_id
OPENROUTER_API_KEY=your_openrouter_key
```

Update the App.py (backend folder), App.js (root folder) and UserDashboard.js (components folder) to include the commented: API_URL (for the js files) and the commented "CORS(...)" in the py file. Comment the currently used API_URL and "CORS(...)" lines, as they serve for the deployed website.

Run the Flask server:

```bash
cd recipe-app\backend
python app.py
```

### 3. Set Up the Frontend

Go to the frontend folder and install dependencies:

```bash
cd recipe-app
npm install
```

Start the development server:

```bash
npm start
```

Make sure the frontend connects to your Flask server (usually at `http://localhost:5000`).

---

## 📁 Project Structure

```
Recipes-By-AI-Web-App/
├── backend/
│   ├── app.py
│   ├── auth.py
│   ├── models.py
│   └── templates/
├── frontend/
│   ├── public/
│   ├── src/
│   └── package.json
├── requirements.txt
└── README.md
```

---

## ⚠️ Limitations

- Currently **not optimized for mobile screens**.
- Basic error handling (may be improved).
- Only supports Google login (no email/password option).

---

## 📌 Future Improvements

- Bugs fixing.
- Responsive design for mobile and tablets.
- Multiple AI model options.

---

## 🙌 Credits

Built by [Amihai](https://github.com/Amihai-bl13) using:
- [OpenRouter](https://openrouter.ai/)
- [React](https://react.dev/)
- [Flask](https://flask.palletsprojects.com/)
- [Google OAuth](https://developers.google.com/identity)

---

## 📄 License

This project is licensed under the MIT License.
