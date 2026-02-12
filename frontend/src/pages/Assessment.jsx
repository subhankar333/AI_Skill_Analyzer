import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import QuestionCard from "../components/QuestionCard";
import "../styles/assessment.css";

const API = import.meta.env.VITE_API_URL;

export default function Assessment() {
  const { employeeId } = useParams();
  const navigate = useNavigate();
  const token = useSelector((state) => state.auth.token);

  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState({});
  const [loading, setLoading] = useState(true);

useEffect(() => {
  if (!token) return;

  // Step 1 — Start assessment session
  fetch(
    `${API}/api/learner/${employeeId}/assessment/start/`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  ).then(() => {
    // Step 2 — Generate questions
    fetch(
      `${API}/api/learner/${employeeId}/assessment/generate/`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    )
      .then((res) => res.json())
      .then((data) => {
        setQuestions(data.questions || []);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Failed to generate questions:", err);
        setLoading(false);
      });
  });
}, [employeeId, token]);


  const submitAssessment = async () => {
  const res = await fetch(
    `${API}/api/learner/${employeeId}/assessment/submit/`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ answers })
    }
  );

  const data = await res.json();

  navigate(`/learner/${employeeId}/result`, {
    state: { results: data.results }
  });
};


  if (loading) {
    return <div className="container">Loading...</div>;
  }

  return (
    <div className="container">
      <h2>Skill Assessment</h2>

      {questions.map((q) => (
        <QuestionCard
          key={q.id}
          question={q}
          selected={answers[q.id]}
          onSelect={(value) =>
            setAnswers({ ...answers, [q.id]: value })
          }
        />
      ))}

      <button
        className="primary submit-btn"
        onClick={submitAssessment}
      >
        Submit Assessment
      </button>
    </div>
  );
}
