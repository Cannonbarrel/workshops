import EmployeeCard from './EmployeeCard';

function EmployeeList({ employees, onDelete }) {
  return (
    <ul className="employee-list">
      {employees.map((employee) => (
        <EmployeeCard key={employee.id} employee={employee} onDelete={onDelete} />
      ))}
    </ul>
  );
}

export default EmployeeList;
