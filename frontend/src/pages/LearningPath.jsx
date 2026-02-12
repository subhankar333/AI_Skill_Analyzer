import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import LearningCard from "../components/LearningCard";
import "../styles/learning.css";

const API = import.meta.env.VITE_API_URL;

export default function LearningPath() {
  const { employeeId } = useParams();
  const [items, setItems] = useState([]);
  const navigate = useNavigate();
  const token = useSelector((state) => state.auth.token);
  const [progress, setProgress] = useState(null);
  const [loading, setLoading] = useState(true);

  // Check if assessment is completed
  useEffect(() => {
    if (!token || !employeeId) return;

    fetch(
      `${API}/api/learner/${employeeId}/progress-bar/`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    )
      .then((res) => res.json())
      .then((data) => {
        setProgress(data);
        if (data.current_step === "ASSESSMENT_COMPLETED") {
          fetchLearningPath();
        }
        setLoading(false);
      })
      .catch(() => {
        setLoading(false);
      });
  }, [employeeId, token]);

  const fetchLearningPath = () => {
  fetch(
    `${API}/api/learner/${employeeId}/learning-path/`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  )
    .then((res) => res.json())
    .then((data) => {
      console.log("Learning Path:", data);
      // Map items and ensure content_url is set from url or extracted from thumbnail
      const itemsWithUrl = (data.items || []).map(item => ({
        ...item,
        content_url: item.url || (item.thumbnail ? item.thumbnail.replace('https://img.youtube.com/vi/', '').split('/')[0] : '')
      }));
      setItems(itemsWithUrl);
    });
};

  useEffect(() => {
    if (token) {
      fetchLearningPath();
    }
  }, [employeeId, token]);

  const startLearning = (id) => {
    // 1️⃣ Optimistically update UI
    setItems((prev) =>
      prev.map((item) =>
        item.id === id
          ? { ...item, status: "IN_PROGRESS" }
          : item
      )
    );

    // 2️⃣ Call backend
    fetch(
      `${API}/api/learner/${employeeId}/learning/${id}/start/`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    ).catch(() => {
      // rollback if API fails
      setItems((prev) =>
        prev.map((item) =>
          item.id === id
            ? { ...item, status: "NOT_STARTED" }
            : item
        )
      );
    });
  };

  const completeLearning = async (id) => {
    await fetch(
      `${API}/api/learner/${employeeId}/learning/${id}/complete/`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );
    fetchLearningPath();
  };

  return (
    <div className="container">
      <h2>Your Learning Path</h2>

      {loading && <div>Loading...</div>}


      {!loading && items.length > 0 && (
        <div className="learning-grid">
          {items.map((item) => (
            <LearningCard
              key={item.id}
              item={item}
              onStart={() => startLearning(item.id)}
              onComplete={() => completeLearning(item.id)}
            />
          ))}
        </div>
      )}

      <button
        className="secondary big"
        onClick={() => navigate(`/dashboard/${employeeId}`)}
      >
        Back to Dashboard
      </button>
    </div>
  );
}
