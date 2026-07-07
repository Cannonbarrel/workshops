# Employee Management Application - React Frontend Guide

This guide covers creating a new React app frontend for an Employee Management Application with CRUD operations, component nesting, props, hooks, and routing.

## Student Goal

Build an Employee Dashboard frontend in React that allows users to:
- view a list of employees,
- add new employee records,
- edit existing employee details,
- delete employees,
- navigate between pages using routing.

The app should demonstrate state management, reusable components, API interaction, and navigation.

## Plan / Steps / Hints

1. Create a React app using Vite or Create React App.
   - Hint: `npx create-react-app employee-management-frontend`.
2. Define a project folder structure for pages, components, and services.
   - Hint: keep API logic separate in `src/services/api.js`.
3. Install React Router for navigation and Axios for API requests.
   - Hint: `npm install react-router-dom@6 axios`.
4. Build the API service layer first with methods for list, get, create, update, and delete.
   - Hint: use `axios.create({ baseURL: ... })`.
5. Configure routing in `src/App.jsx` for home, add, and edit pages.
   - Hint: use `Routes` and `Route` from React Router DOM.
6. Create the home page with `useEffect` to fetch employees and render them with a list component.
7. Build reusable form and list components to keep the UI modular.
8. Use callback props to let child components notify parents about delete actions.
9. Use `useNavigate` to return to the home page after create or update operations.
10. Test the workflow by creating, editing, and deleting employee records.

## Step-by-step Solution

### 1) Setup: Create the project

1. Open PowerShell in the workspace folder.
2. Run:
   - `npx create-react-app employee-management-frontend`
   - `cd employee-management-frontend`
3. Start the dev server:
   - `npm start`

### 2) Project structure (recommended)

- `src/components/`
  - `EmployeeList.jsx`
  - `EmployeeForm.jsx`
  - `EmployeeCard.jsx`
  - `EmployeeDetails.jsx`
- `src/pages/`
  - `HomePage.jsx`
  - `AddEmployeePage.jsx`
  - `EditEmployeePage.jsx`
- `src/services/`
  - `api.js`
- `src/App.jsx`
- `src/index.js`

### 3) Add dependencies

- React Router DOM for routing:
  - `npm install react-router-dom@6`
- Optional UI library:
  - `npm install axios` (for API calls)

### 4) Create simple data API service

`src/services/api.js`:

```js
import axios from 'axios';
const API = axios.create({ baseURL: 'http://localhost:4000/api/employees' });
export const getEmployees = () => API.get('/');
export const getEmployee = (id) => API.get(`/${id}`);
export const createEmployee = (employee) => API.post('/', employee);
export const updateEmployee = (id, employee) => API.put(`/${id}`, employee);
export const deleteEmployee = (id) => API.delete(`/${id}`);
```

### 5) Configure routing in `src/App.jsx`

```js
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import HomePage from './pages/HomePage';
import AddEmployeePage from './pages/AddEmployeePage';
import EditEmployeePage from './pages/EditEmployeePage';

function App() {
  return (
    <Router>
      <nav>
        <Link to="/">Home</Link> | <Link to="/employees/new">Add Employee</Link>
      </nav>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/employees/new" element={<AddEmployeePage />} />
        <Route path="/employees/:id/edit" element={<EditEmployeePage />} />
      </Routes>
    </Router>
  );
}
export default App;
```

### 6) HomePage and CRUD components

#### HomePage (state + useEffect + API fetch)

`src/pages/HomePage.jsx`:

```js
import { useState, useEffect } from 'react';
import { getEmployees, deleteEmployee } from '../services/api';
import EmployeeList from '../components/EmployeeList';

function HomePage() {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadEmployees = async () => {
    try {
      const response = await getEmployees();
      setEmployees(response.data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadEmployees(); }, []);

  const onDelete = async (id) => {
    await deleteEmployee(id);
    setEmployees((prev) => prev.filter((emp) => emp.id !== id));
  };

  return (
    <section>
      <h1>Employee Directory</h1>
      {loading ? <p>Loading...</p> : <EmployeeList employees={employees} onDelete={onDelete} />}
    </section>
  );
}

export default HomePage;
```

#### EmployeeList (component nesting + props)

`src/components/EmployeeList.jsx`:

```js
import EmployeeCard from './EmployeeCard';

function EmployeeList({ employees, onDelete }) {
  return (
    <ul>
      {employees.map((employee) => (
        <EmployeeCard key={employee.id} employee={employee} onDelete={onDelete} />
      ))}
    </ul>
  );
}

export default EmployeeList;
```

#### EmployeeCard (props, callbacks)

`src/components/EmployeeCard.jsx`:

```js
import { Link } from 'react-router-dom';

function EmployeeCard({ employee, onDelete }) {
  return (
    <li>
      <h3>{employee.name}</h3>
      <p>Role: {employee.role}</p>
      <p>Email: {employee.email}</p>
      <Link to={`/employees/${employee.id}/edit`}>Edit</Link>
      <button onClick={() => onDelete(employee.id)}>Delete</button>
    </li>
  );
}

export default EmployeeCard;
```

### 7) Add/Edit employee forms

#### EmployeeForm reusable

`src/components/EmployeeForm.jsx`:

```js
import { useState, useEffect } from 'react';

function EmployeeForm({ initialValues = { name: '', role: '', email: '' }, onSubmit, submitLabel }) {
  const [formState, setFormState] = useState(initialValues);

  useEffect(() => { setFormState(initialValues); }, [initialValues]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormState((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formState);
  };

  return (
    <form onSubmit={handleSubmit}>
      <label>Name <input name="name" value={formState.name} onChange={handleChange} required /></label>
      <label>Role <input name="role" value={formState.role} onChange={handleChange} required /></label>
      <label>Email <input name="email" value={formState.email} onChange={handleChange} required /></label>
      <button type="submit">{submitLabel}</button>
    </form>
  );
}

export default EmployeeForm;
```

#### AddEmployeePage

`src/pages/AddEmployeePage.jsx`:

```js
import { useNavigate } from 'react-router-dom';
import { createEmployee } from '../services/api';
import EmployeeForm from '../components/EmployeeForm';

function AddEmployeePage() {
  const navigate = useNavigate();

  const handleCreate = async (employeeData) => {
    await createEmployee(employeeData);
    navigate('/');
  };

  return (
    <div>
      <h2>Add New Employee</h2>
      <EmployeeForm onSubmit={handleCreate} submitLabel="Create" />
    </div>
  );
}

export default AddEmployeePage;
```

#### EditEmployeePage

`src/pages/EditEmployeePage.jsx`:

```js
import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getEmployee, updateEmployee } from '../services/api';
import EmployeeForm from '../components/EmployeeForm';

function EditEmployeePage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [employee, setEmployee] = useState(null);

  useEffect(() => {
    async function fetch() {
      const response = await getEmployee(id);
      setEmployee(response.data);
    }
    fetch();
  }, [id]);

  const handleUpdate = async (updated) => {
    await updateEmployee(id, updated);
    navigate('/');
  };

  return (
    <div>
      <h2>Edit Employee</h2>
      {employee ? <EmployeeForm initialValues={employee} onSubmit={handleUpdate} submitLabel="Update" /> : <p>Loading...</p>}
    </div>
  );
}

export default EditEmployeePage;
```

## 8) Parent-to-child and child-to-parent props pattern

- `HomePage` (parent) passes `employees` and `onDelete` to `EmployeeList` (child).
- `EmployeeList` passes each record to `EmployeeCard`.
- `EmployeeCard` triggers `onDelete(id)` callback in child-into-parent direction.

## 9) Fundamental React concepts in app

- CRUD operations: create, read, update, delete.
- Hooks: `useState`, `useEffect`.
- Component composition and nesting.
- Props and event callbacks.
- Routing with `react-router-dom`.
- Layout and state updates after API calls.

## 10) Tips

1. Keep components small and single-responsibility.
2. Future enhancement: add search, sort, and validation with `useMemo` and custom hooks.
3. Add context with `React.createContext()` for global state (auth or theme).
4. Replace placeholder API with real backend or JSON server.

## 11) Run and test

- `npm start`
- Add employee, edit employee, delete employee.
- Verify routing and state updates.

---

Congratulations! You now have a complete React frontend architecture for an Employee Management Application with all required fundamentals.
