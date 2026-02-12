import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import "../styles/profile.css";

const API = import.meta.env.VITE_API_URL;

export default function Profile() {
  const { employeeId } = useParams();
  const navigate = useNavigate();
  const token = useSelector((state) => state.auth.token);
  const [form, setForm] = useState(null);

  useEffect(() => {
    if (!token) return;

    fetch(`${API}/api/learner/employees/${employeeId}/`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
      .then(res => res.json())
      .then(setForm);
  }, [employeeId, token]);

  if (!form) return <div className="container">Loading...</div>;

  const update = async () => {
    await fetch(
      `${API}/api/learner/employees/${employeeId}/update/`,
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          ...form,
        })
      }
    );

    navigate(`/dashboard/${employeeId}`);
  };

  return (
    <div className="profile-wrapper">
      <button onClick={() => navigate('/home')}>← Back</button>

      <h2>My Profile</h2>
      <input
        value={form.name}
        onChange={e => setForm({ ...form, name: e.target.value })}
        placeholder="Full Name"
      />

      <input
        value={form.email}
        onChange={e => setForm({ ...form, email: e.target.value })}
        placeholder="Email"
      />

      <input
        value={form.tsr_role}
        onChange={e => setForm({ ...form, tsr_role: e.target.value })}
        placeholder="TSR Role"
      />

      <input
        value={form.department}
        onChange={e => setForm({ ...form, department: e.target.value })}
        placeholder="Department"
      />

      <input
        type="number"
        value={form.experience_years}
        onChange={e =>
          setForm({ ...form, experience_years: e.target.value })
        }
        placeholder="Experience (years)"
      />

      <input
        value={form.current_skills.join(", ")}
        onChange={e =>
          setForm({
            ...form,
            current_skills: e.target.value.split(",").map(s => s.trim())
          })
        }
        placeholder="Skills (React, Django, SQL...)"
      />

      <button className="primary" onClick={update}>
        Save Changes
      </button>
    </div>
  );
}
