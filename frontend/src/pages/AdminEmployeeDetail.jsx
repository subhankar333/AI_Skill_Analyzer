import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import "../styles/adminEmployeeDetail.css";

const API = import.meta.env.VITE_API_URL;

export default function AdminEmployeeDetail() {
  const { employeeId } = useParams();
  const navigate = useNavigate();
  const token = useSelector((state) => state.auth.token);

  const [employee, setEmployee] = useState(null);

  useEffect(() => {
    fetch(
      `${API}/api/learner/employees/${employeeId}/`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    )
      .then((res) => res.json())
      .then(setEmployee);
  }, [employeeId, token]);

  if (!employee) return <div>Loading...</div>;

  return (
    <div className="admin-employee-detail">
      <button onClick={() => navigate("/admin")}>
        ← Back
      </button>

      <h2>{employee.name}</h2>

      <p><strong>Role:</strong> {employee.tsr_role}</p>
      <p><strong>Department:</strong> {employee.department}</p>
      <p><strong>Experience:</strong> {employee.experience_years} yrs</p>

      <h4>Skills</h4>
      <div className="skill-tags">
        {employee.current_skills.map((s) => (
          <span key={s}>{s}</span>
        ))}
      </div>
    </div>
  );
}
