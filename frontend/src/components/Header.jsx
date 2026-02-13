import { useDispatch, useSelector } from "react-redux";
import { logout } from "../store/authSlice";
import { useNavigate } from "react-router-dom";
import "../styles/header.css";

export default function Header({ name, role, onLogout }) {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const userRole = useSelector((state) => state.auth.role);
  const employeeId = useSelector((state) => state.auth.employeeId);

  const handleLogout = () => {
    if (onLogout) {
      onLogout();
    } else {
      dispatch(logout());
      navigate("/login");
    }
  };

  const handleLogoClick = () => {
    if (userRole === "EMPLOYEE") {
      navigate("/home");
    } else if (userRole === "ADMIN") {
      navigate("/admin");
    }
  };

  return (
    <div className="header">
      <div className="header-logo" onClick={handleLogoClick}>
        <span className="logo-text">🎯 AI SKILL ANALYZER</span>
      </div>

      <div className="header-actions">
        {/* {userRole && <span className="user-role">{userRole}</span>} */}

        <button className="logout-btn" onClick={handleLogout}>
          Logout
        </button>
      </div>
    </div>
  );
}
