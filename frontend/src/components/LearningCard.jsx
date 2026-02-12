import { useState } from "react";
import "../styles/learning.css";
import VideoPlayer from "./VideoPlayer";
import ProgressRing from "./ProgressRing";

export default function LearningCard({ item, onStart, onComplete }) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);

    const handleStart = () => {
      if (item.status === "NOT_STARTED") {
        onStart();
      }
      setIsPlaying(true);
    };

  const handleClose = () => {
    setIsPlaying(false);
  };

  return (
    <div className="learning-card">

      {/* MEDIA AREA */}
      <div className="learning-media" onClick={!isPlaying ? handleStart : undefined}>
        {isPlaying ? (
          <>
            <button
              className="video-close"
              onClick={(e) => {
                e.stopPropagation();
                handleClose();
              }}
            >
              ✕
            </button>

            <VideoPlayer
              videoUrl={item.content_url}
              onComplete={onComplete}
              onProgress={setProgress}
              onPlay={onStart}
            />
          </>
        ) : (
          <img
            src={item.thumbnail}
            alt={item.title}
            className="learning-thumb clickable"
          />
        )}
        {progress > 0 && (
          <div className="progress-ring">
            <ProgressRing percent={progress} />
          </div>
        )}
      </div>

      {/* BODY */}
      <div className="learning-body">
        <h4>{item.title}</h4>
        <p className="learning-skill">{item.skill}</p>
        <span className="learning-duration">
          {item.estimated_hours} mins
        </span>

        <div className="learning-footer">
            <span className={`status ${item.status.toLowerCase()}`}>
              {item.status.replace("_", " ")}
            </span>

            {item.status === "NOT_STARTED" && (
              <button onClick={handleStart} className="primary">
                Start
              </button>
            )}

            {item.status === "IN_PROGRESS" && (
              <>
                {/* <button onClick={handleStart} className="primary">
                  Resume
                </button> */}
                <button onClick={onComplete} className="secondary">
                  Mark Done
                </button>
              </>
            )}

            {item.status === "DONE" && (
              <button onClick={handleStart} className="secondary">
                Rewatch
              </button>
            )}
      </div>

      </div>
    </div>
  );
}
