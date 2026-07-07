import { Link } from 'react-router-dom';

function EmployeeCard({ employee, onDelete }) {
  return (
    <li className="employee-card">
      <h3>{employee.name}</h3>
      <p>Role: {employee.role}</p>
      <p>Email: {employee.email}</p>
      <div className="employee-actions">
        <Link to={`/employees/${employee.id}/edit`}>Edit</Link>
        <button type="button" onClick={() => onDelete(employee.id)}>
          Delete
        </button>
      </div>
    </li>
  );
}

export default EmployeeCard;
