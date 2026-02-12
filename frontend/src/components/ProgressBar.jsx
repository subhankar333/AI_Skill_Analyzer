import "../styles/progressbar.css";

export default function ProgressBar({ steps, progress }) {
  return (
    <div>
      <div className="progress-track">
        <div
          className="progress-fill"
          style={{ width: `${progress}%` }}
        />
      </div>

      <div className="progress-steps">
        {steps.map((s) => (
          <span key={s.key} className={s.completed ? "done" : ""}>
            {s.label}
          </span>
        ))}
      </div>
    </div>
  );
}
