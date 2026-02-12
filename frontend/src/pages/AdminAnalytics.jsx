import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import "../styles/adminAnalytics.css";
import { useNavigate } from "react-router-dom";

const API = import.meta.env.VITE_API_URL;

export default function AdminAnalytics() {
  const token = useSelector((state) => state.auth.token);
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!token) {
      setLoading(false);
      setError("No authentication token");
      return;
    }

    fetch(`${API}/api/admin/analytics/`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
      .then((res) => {
        if (!res.ok) {
          return res.json().then((errorData) => {
            console.error("Server error response:", errorData);
            throw new Error(`HTTP ${res.status}: ${JSON.stringify(errorData)}`);
          }).catch(() => {
            throw new Error(`HTTP ${res.status}: ${res.statusText}`);
          });
        }
        return res.json();
      })
      .then((data) => {
        console.log("Analytics data received:", data);
        setData(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Failed to fetch analytics:", err);
        setError(err.message);
        setLoading(false);
      });
  }, [token]);

  if (loading) {
    return <div className="container">Loading analytics...</div>;
  }

  if (error) {
    return <div className="container"><p style={{color: 'red'}}>Error: {error}</p></div>;
  }

  if (!data) {
    return <div className="container"><p>No data available</p></div>;
  }

  return (
    <div className="container admin-analytics">
      <button className="back-btn" onClick={() => navigate('/admin')}>← Back</button>
      <h2>Admin Analytics</h2>

      {/* KPI Cards */}
      <div className="analytics-cards">
        <Card title="Total Employees" value={data.total_employees} />
        <Card title="Assessments Completed" value={data.assessments_completed} />
        <Card title="Learning In Progress" value={data.learning_status.IN_PROGRESS} />
        <Card title="Learning Completed" value={data.learning_status.DONE} />
      </div>

      {/* Skill Gaps */}
      <div className="analytics-section">
        <h3>Top Skill Gaps</h3>
        {data.top_skill_gaps.map((item) => (
          <div key={item.skill} className="skill-row">
            <span>{item.skill}</span>
            <span>{item.count} employees</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function Card({ title, value }) {
  return (
    <div className="analytics-card">
      <p>{title}</p>
      <h3>{value}</h3>
    </div>
  );
}
