import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { useEffect, useState } from "react";
import "../styles/home.css";

const API = import.meta.env.VITE_API_URL;

export default function Home() {
  const navigate = useNavigate();
  const employeeId = useSelector(
    (state) => state.auth.employeeId
  );
  const token = useSelector((state) => state.auth.token);

  const [progress, setProgress] = useState(null);
  const [employee, setEmployee] = useState(null);

  useEffect(() => {
    if (!employeeId || !token) return;

    const fetchData = async () => {
      try {
        // Fetch employee data
        const empRes = await fetch(
          `${API}/api/learner/employees/${employeeId}/`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
        const empData = await empRes.json();
        console.log("Employee data:", empData);
        setEmployee(empData);

        // Fetch progress data
        const progRes = await fetch(
          `${API}/api/learner/${employeeId}/progress-bar/`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
        console.log("Progress response status:", progRes.status);
        const progData = await progRes.json();
        console.log("Progress data:", progData);
        
        // If progress is empty or null, set a default
        if (!progData || Object.keys(progData).length === 0) {
          console.log("Progress data is empty, setting default");
          setProgress({
            current_step: "ASSESSMENT_NOT_STARTED",
            learning_path_generated: false
          });
        } else {
          setProgress(progData);
        }
      } catch (error) {
        console.error("Failed to load home data:", error);
        setProgress({
          current_step: "ASSESSMENT_NOT_STARTED",
          learning_path_generated: false
        });
        setEmployee(null);
      }
    };

    fetchData();
  }, [employeeId, token]);

  if (!progress || !employee || Object.keys(progress).length === 0) {
    return <div className="container">Loading...</div>;
  }

  const canStartAssessment =
    progress.current_step === "ASSESSMENT_COMPLETED";

  const isAssessmentCompleted =
    progress.current_step === "RECOMMENDATIONS_GENERATED";

  const canGenerateLearningPath = progress.current_step === "RECOMMENDATIONS_GENERATED";

  const canViewLearningPath = progress.current_step === "LEARNING_IN_PROGRESS";

  return (
    <div className="container home">
      <h2>Welcome {employee.name} 👋</h2>
      <p>What would you like to do today?</p>

      <div className="home-grid">
        {/* Dashboard */}
        <button onClick={() => navigate(`/dashboard/${employeeId}`)}>
          📊 Dashboard
        </button>

        {/* Assessment */}
        {canStartAssessment && (
          <button onClick={() => navigate(`/assessment/${employeeId}`)}>
            🧠 Take Assessment
          </button>
        )}

        {isAssessmentCompleted && (
          <button disabled title="Assessment completed">
            ✅ Assessment Completed
          </button>
        )}

        {/* Learning Path logic */}
        {canGenerateLearningPath && (
          <button
            onClick={() =>
              navigate(`/dashboard/${employeeId}`)
            }
          >
            ⚙️ Generate Learning Path
          </button>
        )}

        {canViewLearningPath && (
          <button
            onClick={() =>
              navigate(`/learning-path/${employeeId}`)
            }
          >
            📚 View Learning Path
          </button>
        )}

        {!canGenerateLearningPath && !canViewLearningPath && isAssessmentCompleted && (
          <button disabled title="Generating learning path...">
            🔄 Learning Path (Processing)
          </button>
        )}

        {!isAssessmentCompleted && (
          <button disabled title="Complete assessment first">
            🔒 Learning Path (locked)
          </button>
        )}

        {/* Profile */}
        <button
          onClick={() =>
            navigate(`/learner/${employeeId}/profile`)
          }
        >
          👤 Profile
        </button>
      </div>
    </div>
  );
}
