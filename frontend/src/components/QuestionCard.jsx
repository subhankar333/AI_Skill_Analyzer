import "../styles/assessment.css";

export default function QuestionCard({
  question,
  selected,
  onSelect
}) {
  return (
    <div className="question-card">
      <h4>{question.question}</h4>

      <div className="options">
        {Object.entries(question.options).map(
          ([key, value]) => (
            <label
              key={key}
              className={`option ${
                selected === key ? "selected" : ""
              }`}
            >
              <input
                type="radio"
                name={question.id}
                value={key}
                checked={selected === key}
                onChange={() => onSelect(key)}
              />
              <span>{key}. {value}</span>
            </label>
          )
        )}
      </div>
    </div>
  );
}
