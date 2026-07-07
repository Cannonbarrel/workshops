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

  const visibleTodos = todos.filter((todo) => {
    if (filter === 'active') return !todo.completed;
    if (filter === 'completed') return todo.completed;
    return true;
  });

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
