import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/register.css";

const API = import.meta.env.VITE_API_URL;

export default function Register() {
  const navigate = useNavigate();

  const [employees, setEmployees] = useState([]);
  const [form, setForm] = useState({
    username: "",
    email: "",
    password: "",
    employee_id: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    // Try to fetch employees from public endpoint
    fetch(`${API}/api/learner/employees/public/`)
      .then((res) => {
        console.log("Response status:", res.status);
        if (!res.ok) {
          return res.json().then(data => {
            console.error("Error response:", data);
            throw new Error(JSON.stringify(data));
          }).catch(e => {
            throw new Error("Failed to parse error response");
          });
        }
        return res.json();
      })
      .then(data => {
        console.log("Employees data:", data);
        setEmployees(Array.isArray(data) ? data : []);
      })
      .catch((error) => {
        console.error("Failed to fetch employees:", error.message);
        console.log("This might mean the endpoint doesn't exist. Check Django urls.py");
        // For now, use empty array - user will need to manually enter employee ID
        setEmployees([]);
      });
  }, []);


  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  };

 
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch(
        `${API}/api/auth/register/`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            ...form,
            role: "EMPLOYEE",
          }),
        }
      );

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Registration failed");
        setLoading(false);
        return;
      }

      alert("Registration successful. Please login.");
      navigate("/login");
    } catch (err) {
      setError("Server error. Try again.");
    } finally {
      setLoading(false);
    }
  };

  /* ------------------------------------
     UI
  ------------------------------------ */
  return (
    <div className="register-wrapper">
      <h2>Create Your Account</h2>

      {error && <p className="error">{error}</p>}

      <form onSubmit={handleSubmit}>
        <input
          name="username"
          placeholder="Username"
          required
          onChange={handleChange}
        />

        <input
          type="email"
          name="email"
          placeholder="Email"
          required
          onChange={handleChange}
        />

        <input
          type="password"
          name="password"
          placeholder="Password"
          required
          onChange={handleChange}
        />

        <select
          name="employee_id"
          required
          onChange={handleChange}
        >
          <option value="">Select Your Employee Profile</option>
          {employees.map((emp) => (
            <option key={emp.id} value={emp.id}>
              {emp.name} ({emp.tsr_role})
            </option>
          ))}
        </select>

        <button type="submit" disabled={loading}>
          {loading ? "Registering..." : "Register"}
        </button>
      </form>

      <p className="login-link">
        Already have an account?{" "}
        <span onClick={() => navigate("/login")}>Login</span>
      </p>
    </div>
  );
}
