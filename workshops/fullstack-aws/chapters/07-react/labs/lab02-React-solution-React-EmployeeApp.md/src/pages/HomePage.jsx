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

  useEffect(() => {
    loadEmployees();
  }, []);

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
