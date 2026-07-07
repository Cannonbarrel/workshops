I have a beginner-friendly FastAPI employee app with endpoints:
GET /employees
POST /employees
GET /employees/{id}
PUT /employees/{id}
DELETE /employees/{id}

Help me add HTTP Basic Authentication step by step.

Requirements:
1. Use FastAPI built-in HTTPBasic
2. Hardcode two users:
   - admin / admin123 / role=admin
   - user / user123 / role=user
3. Protect GET /employees so authenticated users can access it
4. Protect POST, PUT, DELETE so only admin can access them
5. Keep the code simple and beginner-friendly
6. Explain every change
7. Do not use database authentication yet
8. Show the full updated code
9. Show how to test in Swagger UI and Postman