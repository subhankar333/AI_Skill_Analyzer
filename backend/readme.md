# Personalized Learning & Skill Gap Analysis – Backend

This project is a **Django-based backend** for a Personalized Learning & Skill-Gap Analysis platform inspired by an enterprise learning use case (Hexaware-style TSR-based learning).

The system evaluates an employee’s current skills against expected TSR skills, conducts AI-driven assessments, identifies skill gaps, and generates a personalized learning path with progress tracking.

---

## 🚀 Tech Stack

* **Backend Framework:** Django 5.x
* **Database:** SQLite (can be replaced with Postgres/MySQL)
* **AI Integration:** Google Gemini (via `google-genai` SDK)
* **Architecture:** API-driven, agent-based design
* **Auth:** Skipped intentionally (focus on core logic)

---

## 🧠 Core Concepts

### Learner Workflow

1. Profile Loaded (Employee + TSR mapping)
2. Assessment Started (AI-generated MCQs)
3. Assessment Submitted & Scored
4. Learning Path Generated
5. Learning In Progress (content tracking)
6. Learning Completed

The backend is the **single source of truth**. Frontend only consumes APIs.

---

## 🧩 Agent-Based Design

### ProfileAgent

* Compares employee skills vs TSR expectations
* Outputs strengths, weaknesses, and a summary

### RecommenderAgent

* Assists in prioritizing missing skills
* Generates explanations for recommendations
* Learning path mapping itself is data-driven (DB + assessment results)

### TrackerAgent

* Records learning-related events (assessment started, content opened, completed, etc.)
* Designed as a passive event logger (future analytics-ready)

---

## 📦 Key Models

* **Employee** – learner profile
* **TSRSkillProfile** – expected skills per TSR role
* **Skill** – normalized skill entity
* **AssessmentSession** – assessment lifecycle
* **AssessmentQuestion** – AI-generated MCQs
* **AssessmentResult** – skill-wise scores
* **LearningContent** – videos/courses/articles (with thumbnail & URL)
* **LearningPath** – snapshot of generated learning plan
* **LearningProgress** – NOT_STARTED / IN_PROGRESS / DONE
* **LearningEvent** – tracking events

---

## 🔌 API Endpoints

### Learner Dashboard

```
GET /api/learner/<employee_id>/dashboard/
```

Returns employee info, profile summary, learning path (if any), and workflow status.

---

### Assessment Flow

#### Start Assessment

```
POST /api/learner/<employee_id>/assessment/start/
```

#### Generate Assessment Questions (MCQs)

```
POST /api/learner/<employee_id>/assessment/questions/
```

#### Submit Assessment Answers

```
POST /api/learner/<employee_id>/assessment/submit/
```

Request body:

```json
{
  "answers": {
    "12": "A",
    "13": "C",
    "14": "B"
  }
}
```

---

### Learning Path

#### Generate Learning Path (after completed assessment)

```
POST /api/learner/<employee_id>/learning-path/generate/
```

#### Get Learning Path

```
GET /api/learner/<employee_id>/learning-path/
```

---

### Learning Content Progress

#### Start Learning Content

```
POST /api/learner/<employee_id>/learning/<content_id>/start/
```

#### Open Learning Content (marks IN_PROGRESS and returns URL)

```
POST /api/learner/<employee_id>/learning/<content_id>/open/
```

#### Complete Learning Content

```
POST /api/learner/<employee_id>/learning/<content_id>/complete/
```

---

### Workflow Progress Bar

```
GET /api/learner/<employee_id>/progress-bar/
```

Returns step-by-step workflow completion and percentage, used directly by frontend progress bar.

---

## 📊 Progress Bar Logic

Steps:

1. Profile Loaded
2. Assessment Completed
3. Recommendations Generated
4. Learning In Progress

Backend computes progress percentage and current step dynamically.

---

## 🔐 Environment Variables

Create a `.env` file (or configure in hosting platform):

```
GEMINI_API_KEY=your_api_key_here
```

A `.env.example` file is recommended for sharing.

---

## 🧪 Running Locally

```bash
python -m venv venv
source venv/bin/activate  # Windows: venv\\Scripts\\activate
pip install -r requirements.txt
python manage.py migrate
python manage.py runserver
```

Admin panel:

```
http://127.0.0.1:8000/admin/
```

---

## 🎯 Design Decisions

* Auth skipped to focus on learning workflow
* AI used where reasoning adds value (assessment, explanations)
* Learning path generation is **data-driven**, not AI-only
* APIs are frontend-friendly and stable

---

## 🚧 Future Enhancements (Out of Scope for Now)

* Authentication & roles
* Time-based stagnation detection
* Background jobs / schedulers
* Analytics dashboards
* Deployment & Docker

---

## 🏁 Status

✅ Backend feature-complete
✅ Frontend-ready APIs
✅ Suitable for portfolio & learning

This backend is intentionally designed to be consumed by a modern React frontend (Vite / Tailwind / etc.).
