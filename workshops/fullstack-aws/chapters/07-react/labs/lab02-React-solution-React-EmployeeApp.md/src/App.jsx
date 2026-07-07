import { Routes, Route, Link } from 'react-router-dom';
import HomePage from './pages/HomePage';
import AddEmployeePage from './pages/AddEmployeePage';
import EditEmployeePage from './pages/EditEmployeePage';

function App() {
  return (
    <div className="app-shell">
      <nav>
        <Link to="/">Home</Link> | <Link to="/employees/new">Add Employee</Link>
      </nav>

      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/employees/new" element={<AddEmployeePage />} />
        <Route path="/employees/:id/edit" element={<EditEmployeePage />} />
      </Routes>
    </div>
  );
}

export default App;
