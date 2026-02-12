import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import Header from "../components/Header";
import ProgressBar from "../components/ProgressBar";
import "../styles/dashboard.css";

const API = import.meta.env.VITE_API_URL;

export default function Dashboard() {
  const { employeeId } = useParams();
  const navigate = useNavigate();
  const token = useSelector((state) => state.auth.token);

  const [employee, setEmployee] = useState(null);
  const [progress, setProgress] = useState(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);


  useEffect(() => {
    const fetchData = async () => {
      try {
        const empRes = await fetch(
          `${API}/api/learner/employees/${employeeId}/`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
        const empData = await empRes.json();
        setEmployee(empData);

        const progRes = await fetch(
          `${API}/api/learner/${employeeId}/progress-bar/`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
        const progData = await progRes.json();
        setProgress(progData);
      } catch (e) {
        console.error("Dashboard load failed", e);
      } finally {
        setLoading(false);
      }
    };

    if (token) {
      fetchData();
    }
  }, [employeeId, token]);

  if (loading || !employee || !progress) {
    return <div className="container">Loading...</div>;
  }



  const generateLearningPath = async () => {
    try {
      setGenerating(true);

      const res = await fetch(
        `${API}/api/learner/${employeeId}/generate_learning_path/`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!res.ok) {
        const err = await res.json();
        alert(err.error || "Failed to generate learning path");
        setGenerating(false);
        return;
      }

      // ✅ Always go to Learning Path after generation
      navigate(`/learning-path/${employeeId}`);
    } catch (e) {
      console.error(e);
      alert("Server error while generating learning path");
    } finally {
      setGenerating(false);
    }
  };

  /* ---------------- UI ---------------- */

  return (
    <div className="container dashboard">
      {/* TOP ACTIONS */}
      <div className="dashboard-header-actions">
        <button onClick={() => navigate("/home")}>← Back</button>

        <button
          className="secondary edit-profile-btn"
          onClick={() => navigate(`/learner/${employeeId}/profile`)}
        >
          Edit Profile
        </button>
      </div>

      {/* TOP CARD */}
      <div className="dashboard-top">
        <Header name={employee.name} role={employee.tsr_role} />

        <h3 className="section-title">Your Learning Journey</h3>

        <ProgressBar
          steps={progress.steps}
          progress={progress.progress_percent}
        />

        <p className="workflow-status">
          Next step:{" "}
          <strong>
            {progress?.current_step
              ?.replaceAll("_", " ")
              .toLowerCase() || "Unknown"}
          </strong>
        </p>

        <div className="dashboard-actions">
          {/* Start Assessment */}
          {progress.current_step === "ASSESSMENT_COMPLETED" && (
            <button
              className="primary"
              onClick={() =>
                navigate(`/assessment/${employeeId}`)
              }
            >
              Start Assessment
            </button>
          )}

          {/* Generate Learning Path */}
          {progress.current_step === "RECOMMENDATIONS_GENERATED" && (
            <button
              className="secondary gen-learning-btn"
              disabled={generating}
              onClick={generateLearningPath}
            >
              {generating
                ? "Generating..."
                : "Generate Learning Path"}
            </button>
          )}

          {/* View Learning Path */}
          {progress.current_step === "LEARNING_IN_PROGRESS" && (
            <button
              className="secondary"
              onClick={() =>
                navigate(`/learning-path/${employeeId}`)
              }
            >
              View Learning Path
            </button>
          )}
        </div>
      </div>

      {/* VISUAL PLACEHOLDERS (optional polish) */}
      <div className="dashboard-grid">
        <div className="placeholder-card" />
        <div className="placeholder-card" />
        <div className="placeholder-card" />
      </div>
    </div>
  );
}
