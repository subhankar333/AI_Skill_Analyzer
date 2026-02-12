import { useNavigate } from "react-router-dom";
import "../styles/adminHome.css";

export default function AdminHome() {
  const navigate = useNavigate();

  return (
    <div className="container admin-home">
      <h2>Admin Dashboard</h2>
      <p>Manage employees & track organization learning</p>

      <div className="admin-home-grid">
        <button onClick={() => navigate("/admin/employees")}>
          👥 Manage Employees
        </button>

        <button onClick={() => navigate("/admin/analytics")}>
          📊 View Analytics
        </button>

        <button onClick={() => navigate("create-employee")}>
          ➕ Create Employee
        </button>
      </div>
    </div>
  );
}
