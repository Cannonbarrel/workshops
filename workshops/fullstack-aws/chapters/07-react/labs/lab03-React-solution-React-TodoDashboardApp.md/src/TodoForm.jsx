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
