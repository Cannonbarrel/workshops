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
