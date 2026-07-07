# React Frontend Practice Lab 03

This lab guides students to build a simple todo dashboard in React. The goal is to practice component structure, state management, event handling, props, controlled inputs, list rendering, and conditional UI.

## Student Goal

Build a small React frontend that lets users:
- add tasks with a short description,
- mark tasks as complete or incomplete,
- remove tasks,
- filter tasks by all/active/completed.

The app should be interactive, use React state to manage the task list, and render task items dynamically.

## Plan / Steps / Hints

1. Start a fresh React app or use an existing React setup.
   - Hint: Use Vite or Create React App.

2. Create a top-level component called `TodoApp`.
   - Hint: This component will own the todo list state and pass props to child components.

3. Add local component state for tasks using `useState`.
   - Hint: Each task object should include `id`, `text`, and `completed`.

4. Build a controlled form to add new todos.
   - Hint: Use an input field with `value` and `onChange` to manage form input.
   - Hint: Prevent default form submission and reset the input after adding a task.

5. Render the list of todos using `map()`.
   - Hint: Use `key={task.id}` for each rendered item.

6. Add buttons or checkboxes to toggle task completion and delete tasks.
   - Hint: Use callbacks passed from `TodoApp` to child components.

7. Implement task filtering for "All", "Active", and "Completed" views.
   - Hint: Store the active filter in state and derive visible tasks from it.

8. Display simple counts for total tasks and completed tasks.
   - Hint: Use `filter()` and `length` to compute counts.

9. Keep components small and reusable.
   - Hint: Create `TodoForm`, `TodoList`, and `TodoItem` as separate components.

10. Style the app lightly using simple CSS or inline styles.
   - Hint: Focus on clarity rather than fancy design.

## Step-by-step Solution

### 1) `src/App.jsx`

```jsx
import TodoApp from './TodoApp';

function App() {
  return (
    <div className="app-shell">
      <h1>Todo Dashboard</h1>
      <TodoApp />
    </div>
  );
}

export default App;
```

### 2) `src/TodoApp.jsx`

```jsx
import { useState } from 'react';
import TodoForm from './TodoForm';
import TodoList from './TodoList';

const FILTERS = {
  all: 'All',
  active: 'Active',
  completed: 'Completed',
};

function TodoApp() {
  const [todos, setTodos] = useState([]);
  const [filter, setFilter] = useState('all');

  const addTodo = (text) => {
    if (!text.trim()) return;

    const newTodo = {
      id: Date.now(),
      text: text.trim(),
      completed: false,
    };

    setTodos((prev) => [newTodo, ...prev]);
  };

  const toggleTodo = (id) => {
    setTodos((prev) =>
      prev.map((todo) =>
        todo.id === id ? { ...todo, completed: !todo.completed } : todo
      )
    );
  };

  const removeTodo = (id) => {
    setTodos((prev) => prev.filter((todo) => todo.id !== id));
  };

  const getVisibleTodos = () => {
    if (filter === 'active') return todos.filter((todo) => !todo.completed);
    if (filter === 'completed') return todos.filter((todo) => todo.completed);
    return todos;
  };

  const visibleTodos = getVisibleTodos();

  return (
    <section className="todo-app">
      <TodoForm onAdd={addTodo} />

      <div className="todo-summary">
        <p>Total tasks: {todos.length}</p>
        <p>Completed: {todos.filter((todo) => todo.completed).length}</p>
      </div>

      <div className="todo-filter">
        {Object.entries(FILTERS).map(([key, label]) => (
          <button
            key={key}
            type="button"
            className={filter === key ? 'active' : ''}
            onClick={() => setFilter(key)}
          >
            {label}
          </button>
        ))}
      </div>

      <TodoList todos={visibleTodos} onToggle={toggleTodo} onRemove={removeTodo} />
    </section>
  );
}

export default TodoApp;
```

### 3) `src/TodoForm.jsx`

```jsx
import { useState } from 'react';

function TodoForm({ onAdd }) {
  const [value, setValue] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    onAdd(value);
    setValue('');
  };

  return (
    <form onSubmit={handleSubmit} className="todo-form">
      <input
        type="text"
        placeholder="Enter new task"
        value={value}
        onChange={(e) => setValue(e.target.value)}
      />
      <button type="submit">Add Task</button>
    </form>
  );
}

export default TodoForm;
```

### 4) `src/TodoList.jsx`

```jsx
import TodoItem from './TodoItem';

function TodoList({ todos, onToggle, onRemove }) {
  if (todos.length === 0) {
    return <p>No tasks match this filter.</p>;
  }

  return (
    <ul className="todo-list">
      {todos.map((todo) => (
        <TodoItem key={todo.id} todo={todo} onToggle={onToggle} onRemove={onRemove} />
      ))}
    </ul>
  );
}

export default TodoList;
```

### 5) `src/TodoItem.jsx`

```jsx
function TodoItem({ todo, onToggle, onRemove }) {
  return (
    <li className={`todo-item ${todo.completed ? 'completed' : ''}`}>
      <label>
        <input
          type="checkbox"
          checked={todo.completed}
          onChange={() => onToggle(todo.id)}
        />
        <span>{todo.text}</span>
      </label>
      <button type="button" onClick={() => onRemove(todo.id)}>
        Delete
      </button>
    </li>
  );
}

export default TodoItem;
```

### 6) Optional CSS

Add simple styling in `src/index.css` or `src/App.css`:

```css
.app-shell {
  max-width: 600px;
  margin: 2rem auto;
  padding: 1rem;
  font-family: Arial, sans-serif;
}

.todo-form {
  display: flex;
  gap: 0.5rem;
  margin-bottom: 1rem;
}

.todo-form input {
  flex: 1;
  padding: 0.5rem;
}

.todo-list {
  list-style: none;
  padding: 0;
}

.todo-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.75rem;
  border: 1px solid #ddd;
  margin-bottom: 0.5rem;
}

.todo-item.completed span {
  text-decoration: line-through;
  color: #666;
}

.todo-filter button {
  margin-right: 0.5rem;
}

.todo-filter .active {
  font-weight: bold;
}
```

## Notes

- This lab emphasizes core frontend React practices without requiring backend integration.
- Students should focus on state flow, component reuse, and controlled inputs.
- For extra challenge, add a task editing feature or local storage persistence.
