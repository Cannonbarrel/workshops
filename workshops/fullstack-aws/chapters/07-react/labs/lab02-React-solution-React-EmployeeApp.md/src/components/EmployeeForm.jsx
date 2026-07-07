import { useState, useEffect } from 'react';

function EmployeeForm({ initialValues = { name: '', role: '', email: '' }, onSubmit, submitLabel }) {
  const [formState, setFormState] = useState(initialValues);

  useEffect(() => {
    setFormState(initialValues);
  }, [initialValues]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormState((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formState);
  };

  return (
    <form onSubmit={handleSubmit} className="employee-form">
      <label>
        Name
        <input name="name" value={formState.name} onChange={handleChange} required />
      </label>
      <label>
        Role
        <input name="role" value={formState.role} onChange={handleChange} required />
      </label>
      <label>
        Email
        <input name="email" value={formState.email} onChange={handleChange} required />
      </label>
      <button type="submit">{submitLabel}</button>
    </form>
  );
}

export default EmployeeForm;
