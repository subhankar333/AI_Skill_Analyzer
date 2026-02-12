import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import "../styles/createEmployee.css";

const API = import.meta.env.VITE_API_URL;

export default function CreateEmployee() {
  const navigate = useNavigate();
  const token = useSelector((state) => state.auth.token);
  const [form, setForm] = useState({
    name: "",
    email: "",
    tsr_role: "",
    department: "",
    experience_years: "",
    current_skills: ""
  });

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const submit = async () => {
    await fetch(`${API}/api/learner/employees/create/`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        ...form,
        experience_years: Number(form.experience_years),
        current_skills: form.current_skills.split(",").map(s => s.trim())
      })
    });
    alert("Employee created successfully!");
    navigate("/admin");
  };

  return (
    <div className="create-wrapper">
      <button onClick={() => navigate('/admin')}>← Back</button>
      <h2>Add New Employee</h2>

      <div className="form-grid">
        <input name="name" placeholder="Full Name" onChange={handleChange} />
        <input name="email" placeholder="Email" onChange={handleChange} />

        <input name="tsr_role" placeholder="TSR Role" onChange={handleChange} />
        <input name="department" placeholder="Department" onChange={handleChange} />

        <input
          name="experience_years"
          type="number"
          placeholder="Experience (years)"
          onChange={handleChange}
        />

        <input
          name="current_skills"
          className="full-width"
          placeholder="Skills (React, Django, SQL...)"
          onChange={handleChange}
        />
      </div>

      <button className="save-btn" onClick={submit}>
        Save Employee
      </button>
    </div>
  );
}
