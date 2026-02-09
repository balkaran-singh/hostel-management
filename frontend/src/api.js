import axios from 'axios';

// CHANGED: Removed the full URL. Now it just looks for local /api
const API = axios.create({ baseURL: '/api' }); 

export const registerStudent = (data) => API.post('/auth/student/register', data);
export const loginStudent = (data) => API.post('/auth/student/login', data);
export const registerAdmin = (data) => API.post('/auth/admin/register', data);
export const loginAdmin = (data) => API.post('/auth/admin/login', data);
// ... add others as needed
export default API;
