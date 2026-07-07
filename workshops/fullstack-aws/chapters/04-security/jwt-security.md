I have a beginner FastAPI Employee Management app and I want to upgrade it with JWT authentication for teaching purposes.

Please modify the app so students can learn:
1. login
2. password verification
3. JWT creation
4. token validation
5. role-based access control

Requirements:
- FastAPI app
- one-file implementation preferred
- hardcoded users only for now
- admin and user role
- JWT Bearer token auth
- protect employee routes
- beginner-friendly code and explanations

Hardcoded users:
- admin / admin123 / role=admin
- user / user123 / role=user

JWT requirements:
- include username and role in token
- include expiration
- validate signature and expiration
- return 401 for bad token/login
- return 403 for insufficient role

Route access:
- GET /employees → admin or user
- POST /employees → admin only
- PUT /employees/{id} → admin only
- DELETE /employees/{id} → admin only

Output required:
- pip install commands
- full code
- run instructions
- sample login curl
- sample protected route curl
- simple explanation of the JWT authentication flow

Keep it simple enough for fresh graduate students to understand and maintain.