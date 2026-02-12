import { Outlet, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { logout } from "../store/AuthSlice";
import Header from "../components/Header";
import "../styles/header.css";

export default function AppLayout() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const auth = useSelector((state) => state.auth);

  const handleLogout = () => {
    dispatch(logout());
    navigate("/login");
  };

  return (
    <div className="app-layout">
      {/* Global Header with Logout */}
      <Header
        name={auth.username || "User"}
        role={auth.role}
        onLogout={handleLogout}
      />

      {/* Page Content */}
      <main className="layout-content">
        <Outlet />
      </main>
    </div>
  );
}
