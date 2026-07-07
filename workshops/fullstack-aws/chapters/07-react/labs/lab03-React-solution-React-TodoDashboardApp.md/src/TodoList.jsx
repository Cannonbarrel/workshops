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
