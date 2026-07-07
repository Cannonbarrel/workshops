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
