import { useLocation, useNavigate, useParams } from "react-router-dom";
import { useSelector } from "react-redux";
import "../styles/assessment.css";

const API = import.meta.env.VITE_API_URL;

export default function AssessmentResult() {
  const { employeeId } = useParams();
  const { state } = useLocation();
  const navigate = useNavigate();
  const token = useSelector((state) => state.auth.token);

  const results = state?.results || {};

  const generateLearningPath = async () => {
    await fetch(
      `${API}/api/learner/${employeeId}/generate_learning_path/`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    navigate(`/learning-path/${employeeId}`);
  };

  return (
    <div className="container">
      <h2>Assessment Results</h2>

      <div className="results-grid">
        {Object.entries(results).map(([skill, score]) => (
          <div key={skill} className="result-card">
            <h4>{skill}</h4>
            <div className="bar">
              <div
                className={`fill ${score < 70 ? "weak" : "strong"}`}
                style={{ width: `${score}%` }}
              />
            </div>
            <span>{score}%</span>
          </div>
        ))}
      </div>

      <div className="result-actions">
        <button className="primary big" onClick={generateLearningPath}>
          Generate My Learning Path
        </button>

        <button
          className="secondary big"
          onClick={() => navigate(`/dashboard/${employeeId}`)}
        >
          Back to Dashboard
        </button>
      </div>
    </div>
  );
}
