import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { loginSuccess } from "../store/AuthSlice";
import '../styles/login.css';

const API = import.meta.env.VITE_API_URL;

// Helper function to decode JWT
const decodeToken = (token) => {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(atob(base64).split('').map((c) => {
      return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
    }).join(''));
    return JSON.parse(jsonPayload);
  } catch (error) {
    console.error("Error decoding token:", error);
    return null;
  }
};

export default function Login() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { role, employeeId } = useSelector((state) => state.auth);

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch(
        `${API}/api/auth/login/`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ username, password }),
        }
      );

      if (!res.ok) {
        throw new Error("Invalid credentials");
        setLoading(false);
      }

      const data = await res.json();

      /**
       * data.access → JWT (contains role and employee_id)
       * data.refresh → Refresh token
       */
      dispatch(loginSuccess(data));

      // Decode token to get role and employee_id for redirect
      const decoded = decodeToken(data.access);
      console.log("Login successful, decoded token:", decoded);
      console.log("Role:", decoded?.role);
      console.log("Employee ID:", decoded?.employee_id);

      // Small delay to ensure Redux state is updated
      setTimeout(() => {
        // 🔥 ROLE-BASED REDIRECT
        if (decoded?.role === "ADMIN") {
          console.log("Redirecting to admin dashboard");
          navigate("/admin");
        } else if (decoded?.role === "EMPLOYEE") {
          console.log(`Redirecting to dashboard/${decoded.employee_id}`);
        //   navigate(`/dashboard/${decoded.employee_id}`);
             navigate("/home", { replace: true });
        } else {
          console.log("Unknown role:", decoded?.role);
        }
      }, 100);
    } catch (err) {
      console.error("Login error:", err);
      setError("Login failed. Check credentials.");
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-card">
        <h2>Welcome Back</h2>
        <p className="login-subtitle">
          Sign in to continue your learning journey
        </p>

        {error && <div className="login-error">{error}</div>}

        <form onSubmit={handleLogin}>
          <div className="form-group">
            <label>Username</label>
            <input
              type="text"
              placeholder="Enter your username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label>Password</label>
            <input
              type="password"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <button type="submit" className="login-btn">
            {loading ? "Login..." : "Login"}
          </button>
        </form>
        <p className="login-link">
            New here, Register to begin your journey !{" "}
            <span onClick={() => navigate("/register")}>Register</span>
        </p>
      </div>
    </div>
  );
}
