import axios from 'axios';

const API = axios.create({ baseURL: 'http://localhost:4000/api/employees' });

export const getEmployees = () => API.get('/');
export const getEmployee = (id) => API.get(`/${id}`);
export const createEmployee = (employee) => API.post('/', employee);
export const updateEmployee = (id, employee) => API.put(`/${id}`, employee);
export const deleteEmployee = (id) => API.delete(`/${id}`);
