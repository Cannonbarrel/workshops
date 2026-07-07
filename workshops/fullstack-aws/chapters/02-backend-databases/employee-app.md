# Lab Goal

Take your existing FastAPI app and modify it so it works as an **Employee Database application** instead of a generic users app.

By the end of this lab, students should be able to:

* rename and reshape an existing API
* connect the app to employee-style data
* add a few useful features
* understand what changed and why



---

# Scenario

You already built a simple app with:

* `GET /`
* `POST /users`
* `GET /users`

Now your task is to turn it into a small **Employee Database API** for a company.

---

# Starting Point

Students should use their existing FastAPI app.

Expected current app:

* in-memory list
* `main.py`
* basic user create/list functionality

---

# New Employee Data Model

Each employee should have:

```json
{
  "id": 1,
  "name": "John Doe",
  "email": "john@test.com",
  "role": "Engineer",
  "department": "IT"
}
```

---

# Lab Tasks

## Part 1 — Rename the App Concepts

Update the app from **users** to **employees**.

### Change:

* `POST /users` → `POST /employees`
* `GET /users` → `GET /employees`

### Also update:

* variable names
* comments
* sample data
* messages in responses

---

## Part 2 — Update the Data Structure

Your old app probably had:

* `id`
* `name`
* `email`

Now add:

* `role`
* `department`

Each employee must contain:

* `id`
* `name`
* `email`
* `role`
* `department`

---

## Part 3 — Add New Features

### Feature 1: Get Employee by ID

Add:

```http
GET /employees/{id}
```

Expected behavior:

* return matching employee
* return error if not found

---

### Feature 2: Update Employee

Add:

```http
PUT /employees/{id}
```

Students should be able to update:

* name
* email
* role
* department

---

### Feature 3: Delete Employee

Add:

```http
DELETE /employees/{id}
```

Expected behavior:

* remove employee from list
* return success message
* return error if employee not found

---

## Part 4 — Add Basic Error Handling

Students should handle:

| Case               | Expected Response |
| ------------------ | ----------------- |
| Employee not found | 404               |
| Empty name         | 400               |
| Invalid email      | 400               |
| Duplicate email    | 400               |

---

## Part 5 — Add Simple Search / Filter Feature

Add at least **one** of these:

### Option A — Filter by department

```http
GET /employees?department=IT
```

### Option B — Filter by role

```http
GET /employees?role=Engineer
```

### Option C — Search by name

```http
GET /employees?name=John
```

---

# Deliverables

Students must submit:

1. Updated `main.py`
2. Updated `requirements.txt`
3. At least 5 sample employee records
4. Screenshots from:

   * browser or Swagger docs
   * Postman or curl
5. Short explanation of:

   * what they changed
   * what feature they added
   * what error handling they implemented

---

# Suggested Starter Sample Data

```python
employees = [
    {"id": 1, "name": "John Doe", "email": "john@test.com", "role": "Engineer", "department": "IT"},
    {"id": 2, "name": "Sarah Lee", "email": "sarah@test.com", "role": "Manager", "department": "HR"},
    {"id": 3, "name": "Mike Ross", "email": "mike@test.com", "role": "Analyst", "department": "Finance"}
]
```

---

# Suggested API List for Final App

| Method | Endpoint          | Purpose          |
| ------ | ----------------- | ---------------- |
| GET    | `/`               | Hello World      |
| POST   | `/employees`      | Create employee  |
| GET    | `/employees`      | List employees   |
| GET    | `/employees/{id}` | Get one employee |
| PUT    | `/employees/{id}` | Update employee  |
| DELETE | `/employees/{id}` | Delete employee  |

---

# Lab Rules

* Reuse your old app instead of starting from scratch
* You may use AI to help generate code
* You must understand every change you make
* Be ready to explain:

  * where data is stored
  * how employee is found by id
  * how validation works
  * how errors are returned

---


# Bonus Tasks


* add `department` filter
* add `role` filter
* add response messages
* add 2–3 validation rules
* move sample data into a separate file

