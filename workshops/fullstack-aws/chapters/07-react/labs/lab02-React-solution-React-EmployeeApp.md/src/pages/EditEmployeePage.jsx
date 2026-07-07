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
