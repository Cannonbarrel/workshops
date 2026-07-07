
## **Objective**

Students will extend their existing **Employee Management API** by using the **TDD cycle**:

1. Write a test
2. Run the test
3. See it fail
4. Write the code
5. Run the test again
6. Refactor if needed

---

## **Starting Point**

Students already have:

* `GET /employees`
* `POST /employees`
* `GET /employees/{id}`
* `PUT /employees/{id}`
* `DELETE /employees/{id}`

They also have a simple in-memory or MongoDB-backed employee app.

---

## **TDD Rule for This Lab**

For every new feature:

* **Step 1:** Write test first
* **Step 2:** Run test and confirm failure
* **Step 3:** Implement feature
* **Step 4:** Run tests again
* **Step 5:** Clean up code if needed

---

# **Features to Add**

## **Feature 1: Filter Employees by Department**

### API

```http
GET /employees?department=IT
```

### Expected Behavior

* Return only employees from the given department
* If no employees match, return an empty list

### Test Ideas

* department exists
* department does not exist
* multiple employees in same department

---

## **Feature 2: Search Employees by Name**

### API

```http
GET /employees?name=John
```

### Expected Behavior

* Return matching employees
* Partial match is a bonus
* Case-insensitive match is a bonus

### Test Ideas

* exact name match
* no match found
* optional: partial name match

---

## **Feature 3: Prevent Duplicate Email**

### Rule

Two employees cannot have the same email.

### Expected Behavior

* If duplicate email is submitted, return error
* Suggested status code: `400`

### Test Ideas

* create first employee with email
* create second employee with same email
* verify second request fails

---

## **Feature 4: Validate Required Fields**

### Rule

Employee must have:

* name
* email
* role
* department

### Expected Behavior

* Missing field returns `400` or validation error

### Test Ideas

* missing name
* missing email
* missing role
* missing department

---

## **Feature 5: Employee Summary Endpoint**

### API

```http
GET /employees/summary
```

### Expected Response Example

```json
{
  "total_employees": 5,
  "departments": ["IT", "HR", "Finance"]
}
```

### Test Ideas

* returns correct total count
* returns unique department list

---

# **Minimum Required Work**

Each student or team must complete at least:

* 3 new features
* test cases for each feature
* proof that tests failed before code was added
* proof that tests passed after implementation

---

# **Suggested Test File**

```text
test_main.py
```

---

# **Recommended Tools**

* `pytest`
* `fastapi.testclient.TestClient`

---

# **Example TDD Workflow**

## Example: Duplicate Email Check

### Step 1 — Write Test

```python
def test_create_employee_duplicate_email():
    ...
```

### Step 2 — Run Test

* test fails

### Step 3 — Add Logic

* check whether email already exists

### Step 4 — Run Test Again

* test passes

---

# **Deliverables**

Students must submit:

1. Updated application code
2. `test_main.py`
3. Screenshot or terminal output showing:

   * failing tests first
   * passing tests later
4. Short note answering:

   * Which features did you add?
   * Which test did you write first?
   * What bug or failure did the test catch?

---

# **Student Instructions**

Use AI, but follow this rule:

> Do not ask AI to only write the feature. Ask AI to write the test first.

### Example Prompt

```text
Write pytest test cases first for my FastAPI employee app.

I want to add:
1. filter by department
2. duplicate email validation
3. employee summary endpoint

Keep tests beginner-friendly.
Explain what each test is checking.
Do not write the feature code yet.
```

Then after tests fail:

```text
Now implement only the code needed to make these tests pass.
Keep the code simple and readable.
Explain what changed.
```

