import {API_BASE} from '../utils/constant'

const API = import.meta.env.VITE_API_URL;

export const fetchEmployees = async (token) => {
    const res = await fetch(`${API}/api/learner/employees`, {
        headers: {
            Authorization: `Bearer ${token}`
        }
    });
    return res.json();
}

export const createEmployee = async (data, token) => {
    const res = await fetch(`${API}/api/learner/employees/create`, {
        method: 'POST',
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(data)
    });

    return res.json();
}

export const getEmployee = async (id, token) => {
    const res = await fetch(`${API}/api/learner/employees/${id}`, {
        headers: {
            Authorization: `Bearer ${token}`
        }
    });
    return res.json();
}