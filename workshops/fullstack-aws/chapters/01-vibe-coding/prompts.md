You are a senior Python developer. Generate a very simple, beginner-friendly FastAPI app.

Goal:
Build a minimal "Hello World + Users API" app for teaching purposes.

Requirements:
1. Use Python + FastAPI
2. Do NOT use a real database (use in-memory list for simplicity)
3. Keep everything in a single file (main.py)

Features:
1. GET / → returns "Hello World"
2. POST /users → create a user
3. GET /users → list all users

User object:
- id (auto-increment)
- name
- email

Constraints:
- Keep code extremely simple and readable
- Add comments explaining each part
- No authentication, no hashing, no environment variables
- No complex structure, no multiple files

Also include:
1. requirements.txt

2. Step-by-step setup instructions:
   - Create project folder
   - Create virtual environment (python -m venv venv)
   - Activate virtual environment (Mac/Linux + Windows)
   - Install dependencies (pip install -r requirements.txt)

3. Instructions to run the app:
   - Command to start FastAPI (uvicorn main:app --reload)
   - How to access in browser (http://127.0.0.1:8000)
   - How to access Swagger UI (/docs)

4. Sample curl commands:
   - create user (POST /users)
   - list users (GET /users)

5. Example request JSON
6. Example response JSON

At the end, explain in simple terms:
- how POST /users works
- where the data is stored
- why this is not production-ready (no database, no persistence)