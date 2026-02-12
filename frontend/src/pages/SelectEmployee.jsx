import { useState, useEffect } from "react";
import {useNavigate} from 'react-router-dom';
import { useSelector } from "react-redux";
import { fetchEmployees } from "../api/employeeAPI";
import '../styles/employee.css';


export default function SelectEmployee(){
    const [employees, setEmployees] = useState([]);
    const [loading, setLoading] = useState(true);
    const token = useSelector((state) => state.auth.token);

    const navigate = useNavigate();

    useEffect (() => {
        if (!token) return;
        
        fetchEmployees(token)
            .then((data) => setEmployees(Array.isArray(data) ? data : []))
            .catch((err) => {
                console.error("Failed to fetch employees:", err);
                setEmployees([]);
            })
            .finally(() => setLoading(false));
    },[token])

    return (
        <div className="container">
            <h2>Select Employee</h2>

            <div className="employee-list">
                {loading && <div>Loading employees...</div>}
                {!loading && employees.length === 0 && (
                    <h4>No employees found.</h4>
                )}

                {employees.map((emp) => (
                    <div
                       key={emp.id}
                       className="employee-card"
                       onClick={() => navigate(`/dashboard/${emp.id}`)}
                    >
                        <h4>{emp.name}</h4>
                        <p>{emp.tsr_role}</p>
                        <span>{emp.department}</span>
                    </div>
                ))}
                
                        </div>
                    <button
                        className="primary"
                        onClick={() => navigate("/create-employee")}
                        >
                        + Add Employee
                    </button>
        </div>
    )
}