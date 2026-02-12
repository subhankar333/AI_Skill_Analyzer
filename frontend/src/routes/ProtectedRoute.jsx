import { useSelector } from "react-redux";
import { Navigate } from "react-router-dom";

export default function ProtectedRoute({ children, allowedRoles }) {
  const reduxAuth = useSelector((state) => state.auth);
  
  // Fallback to localStorage if Redux doesn't have the token
  const token = reduxAuth.token || localStorage.getItem("token");
  const role = reduxAuth.role || localStorage.getItem("role");

  console.log("ProtectedRoute - token:", !!token, "role:", role, "allowedRoles:", allowedRoles);

  if (!token) {
    console.log("No token, redirecting to login");
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(role)) {
    console.log("Role not allowed, redirecting to login");
    return <Navigate to="/login" replace />;
  }

  return children;
}
