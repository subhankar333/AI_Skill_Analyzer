import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import "../styles/adminDashboard.css";

const API = import.meta.env.VITE_API_URL;

export default function AdminDashboard() {
  const navigate = useNavigate();
  const token = useSelector((state) => state.auth.token);
  const [employees, setEmployees] = useState([]);

  useEffect(() => {
    fetch(`${API}/api/learner/employees/`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
      .then((res) => res.json())
      .then(setEmployees);
  }, [token]);

  return (
    <div className="container">
      <h2>Admin Dashboard</h2>
      <button className="back-btn" onClick={() => navigate('/admin')}>← Back</button>

      <button
        className="primary create-btn"
        onClick={() => navigate("/admin/create-employee")}
      >
        ➕ Create Employee
      </button>


      <div className="admin-employee-list">
        {employees.map((emp) => (
          <div
            key={emp.id}
            className="employee-card"
            onClick={() => navigate(`/admin/employee/${emp.id}`)}
          >
            <h4>{emp.name}</h4>
            <p>{emp.tsr_role}</p>
            <span>{emp.department}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
