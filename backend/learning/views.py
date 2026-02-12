from django.shortcuts import render
import json
from django.http import JsonResponse
from django.shortcuts import get_object_or_404
from django.views.decorators.csrf import csrf_exempt
from rest_framework.response import Response
from django.db.models import Count
from .models import LearningPath, Employee, AssessmentSession, LearningProgress, AssessmentResult, Skill, AssessmentQuestion, LearningContent
from .agents.profile_agent import ProfileAgent
from .agents.recommender_agent import RecommenderAgent
from django.utils import timezone
from rest_framework.permissions import IsAuthenticated, AllowAny


import os
from google import genai

from rest_framework.permissions import IsAuthenticated
from rest_framework.decorators import api_view, permission_classes
from .permissions import IsAdmin, IsEmployee, IsAdminOrEmployee

client = genai.Client(api_key=os.getenv("GEMINI_API_KEY"))
# Create your views here.


def ensure_employee_access(request, employee_id):
    profile = request.user.userprofile

    if profile.role == "EMPLOYEE" and profile.employee_id != employee_id:
        return False
    return True


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def learner_dashboard(request,employee_id):
    if not ensure_employee_access(request, employee_id):
        return JsonResponse({"error": "Forbidden"}, status=403)
    
    # print(employee_id)
    emp = get_object_or_404(Employee, id=employee_id)
    lp =  LearningPath.objects.filter(employee=emp).order_by('-created_at').first()

    profile = ProfileAgent.build(emp)
    return JsonResponse({
        "employee": {
        "name": emp.name,
        "tsr_role": emp.tsr_role,
        "department": emp.department,
        "skills": emp.get_current_skills(),
        },
        "profile_summary": profile,
        "learning_path": lp.get_items() if lp else None,
        "workflow_status": "RECOMMENDATIONS_GENERATED" if lp else "PROFILE_LOADED"
    })

@api_view(["POST"])
@permission_classes([IsAuthenticated])
def generate_learning_path(request, employee_id):
    if not ensure_employee_access(request, employee_id):
        return JsonResponse({"error": "Forbidden"}, status=403)

    employee = get_object_or_404(Employee, id=employee_id)

    # --------------------------------------------------
    # 1️⃣ Get latest completed assessment
    # --------------------------------------------------
    session = AssessmentSession.objects.filter(
        employee=employee,
        status="COMPLETED"
    ).order_by("-completed_at").first()

    if not session:
        return JsonResponse(
            {"error": "No completed assessment found"},
            status=400
        )

    results = AssessmentResult.objects.filter(session=session)

    missing_skills = []
    matched_skills = []

    for r in results:
        if r.score < 70:
            missing_skills.append(r.skill)
        else:
            matched_skills.append(r.skill)

    # --------------------------------------------------
    # 2️⃣ Build / refresh learning progress
    # --------------------------------------------------
    learning_items = []

    for skill in missing_skills:
        contents = LearningContent.objects.filter(
            skill__name__iexact=skill.name
        )

        for content in contents:
            progress, _ = LearningProgress.objects.get_or_create(
                employee=employee,
                content=content,
                defaults={"status": "NOT_STARTED"}
            )

            learning_items.append({
                "content_id": content.id,
                "title": content.title,
                "skill": skill.name,
                "content_url": content.content_url,
                "thumbnail": content.thumbnail_url,
                "duration": content.duration_minutes,
                "status": progress.status
            })

    # --------------------------------------------------
    # 3️⃣ Refresh LearningPath snapshot (idempotent)
    # --------------------------------------------------
    LearningPath.objects.filter(employee=employee).delete()

    lp = LearningPath.objects.create(
        employee=employee,
        status="NOT_STARTED",
        items=json.dumps(learning_items),
        matched_skills=json.dumps([s.name for s in matched_skills]),
        missing_skills=json.dumps([s.name for s in missing_skills])
    )

    return JsonResponse({
        "message": "Learning path generated",
        "learning_path_id": lp.id,
        "matched_skills": [s.name for s in matched_skills],
        "missing_skills": [s.name for s in missing_skills],
        "learning_items": learning_items
    })


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def get_learning_path(request, employee_id):
    if not ensure_employee_access(request, employee_id):
        return JsonResponse({"error": "Forbidden"}, status=403)
    
    employee = get_object_or_404(Employee, id=employee_id)

    progresses = LearningProgress.objects.filter(employee=employee).select_related("content")

    items = []

    for p in progresses:
        content = p.content
        items.append({
            "id": content.id,
            "title": content.title,
            "skill": content.skill.name,
            "thumbnail": content.thumbnail_url,
            "url": content.content_url,
            "estimated_hours": content.duration_minutes,
            "status": p.status,
        })

    return JsonResponse({
        "items": items
    })


@csrf_exempt
def learner_workflow_status(request, employee_id):
    employee = get_object_or_404(Employee, id=employee_id)

    # profile is always loaded if employee exists
    profile_loaded = True

    # Assessment checks
    assessment_sessions = AssessmentSession.objects.filter(employee=employee)
    assessment_started = assessment_sessions.exists()
    assessment_completed = assessment_sessions.filter(status="COMPLETED").exists()

    # Recommendation check
    recommendations_generated = LearningPath.objects.filter(employee=employee).exists()

    # Learning progress check
    learning_in_progress = LearningProgress.objects.filter(
        employee=employee,
        status__in = ["IN_PROGRESS", "DONE"]
    ).exists()

    return JsonResponse({
        "profile_loaded" : profile_loaded,
        "assessment_pending": not assessment_started,
        "assessment_completed": assessment_completed,
        "reommendations_generated": recommendations_generated,
        "learning_in_progress": learning_in_progress,
    })
    

@api_view(["POST"])
@permission_classes([IsAuthenticated])
def start_assessment(request, employee_id):
    if not ensure_employee_access(request, employee_id):
        return JsonResponse({"error": "Forbidden"}, status=403)
    
    employee = get_object_or_404(Employee, id=employee_id)

    # Prevent duplicate assessment sessions
    active_session = AssessmentSession.objects.filter(
        employee=employee,
        status="STARTED"
    ).first()

    if active_session:
        return JsonResponse({
            "message": "Assessment already in progress",
            "session_id": active_session.id
        })
    
    session = AssessmentSession.objects.create(
        employee=employee,
        status="STARTED"
    )

    return JsonResponse({
        "message": "Assessment started",
        "session_id": session.id
    })


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def generate_assessment_questions(request, employee_id):
    if not ensure_employee_access(request, employee_id):
        return JsonResponse({"error": "Forbidden"}, status=403)
    
    employee = get_object_or_404(Employee, id=employee_id)

    session = AssessmentSession.objects.filter(
        employee=employee,
        status="STARTED"
    ).first()

    # If already generated, return cached questions
    existing = AssessmentQuestion.objects.filter(session=session)

    if existing.exists():
        return JsonResponse({
            "questions": [
                {
                    "id": q.id,
                    "skill": q.skill.name,
                    "question": q.question_text,
                    "options": q.options
                }
                for q in existing
            ]
        })


    if not session:
        return JsonResponse({"error": "No active assessment"}, status=400)

    questions = []

    try:
        for skill_name in employee.get_current_skills():
            skill, _ = Skill.objects.get_or_create(name=skill_name)

            prompt = f"""
        Generate exactly 5 multiple choice questions for skill {skill_name}.
        Return ONLY a valid JSON array with no additional text.
        Each question must have this exact structure:
        {{
          "question": "question text here",
          "options": {{
            "A": "option A",
            "B": "option B",
            "C": "option C",
            "D": "option D"
          }},
          "correct_option": "A"
        }}
        Return as a JSON array of 5 questions.
        """

            resp = client.models.generate_content(
                model="gemini-2.5-flash",
                contents=prompt,
            )

            # Handle Gemini response properly
            if hasattr(resp, 'candidates') and resp.candidates:
                response_text = resp.candidates[0].content.parts[0].text
            elif hasattr(resp, 'text'):
                response_text = resp.text
            else:
                response_text = str(resp)

            # Clean up markdown code blocks if present
            cleaned_text = response_text.strip()
            if cleaned_text.startswith("```"):
                cleaned_text = cleaned_text.split("```")[1]
                if cleaned_text.startswith("json"):
                    cleaned_text = cleaned_text[4:]
            cleaned_text = cleaned_text.strip()

            try:
                data = json.loads(cleaned_text)
            except json.JSONDecodeError as e:
                print(f"JSONDecodeError: {e}")
                print(f"Response text: {repr(response_text)}")
                # Try to fix common JSON errors
                try:
                    import re
                    # Fix common issues like "key}," instead of "key"},"
                    fixed_text = re.sub(r'(\w+)\}(?=,|\s*})', r'"\1"}', cleaned_text)
                    data = json.loads(fixed_text)
                except:
                    raise ValueError(f"Failed to parse Gemini response: {e}")

            # Handle if response is a list
            if isinstance(data, list):
                print(f"Response is a list with {len(data)} items")
                questions_list = data
            else:
                questions_list = [data]

            print(f"Processing {len(questions_list)} questions")

            for q_data in questions_list:
                if not all(key in q_data for key in ["question", "options", "correct_option"]):
                    print(f"Skipping invalid question: {q_data}")
                    continue
                    
                q = AssessmentQuestion.objects.create(
                    session=session,
                    skill=skill,
                    question_text=q_data["question"],
                    options=q_data["options"],
                    correct_option=q_data["correct_option"],
                    difficulty="Medium" 
                )


                questions.append({
                    "id": q.id,
                    "skill": skill.name,
                    "question": q.question_text,
                    "options": q.options
                })

    except Exception as e:
        # Check if it's a quota/rate limit error (429)
        error_str = str(e).lower()
        if "resource_exhausted" in error_str or "quota" in error_str or "rate" in error_str:
            print(f"Gemini API quota exceeded: {e}")
            return JsonResponse({
                "error": "API quota exceeded",
                "message": "You've reached the daily limit for this API. Please try again tomorrow or upgrade your plan.",
                "details": str(e)
            }, status=429)
    except Exception as e:
        print(f"Error generating questions: {e}")
        return JsonResponse({
            "error": "Failed to generate questions",
            "message": str(e)
        }, status=500)

    return JsonResponse({
        "message": "MCQ questions generated",
        "questions": questions
    })

@api_view(["GET"])
@permission_classes([IsAuthenticated])
def get_assessment_questions(request, employee_id):
    if not ensure_employee_access(request, employee_id):
        return JsonResponse({"error": "Forbidden"}, status=403)
    
    questions = AssessmentQuestion.objects.all()

    return JsonResponse({
        "questions": [
            {
                "id": q.id,
                "skill": q.skill.name,
                "question": q.question_text,
                "options": q.options
            }
            for q in questions
        ]
    })


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def submit_assessment(request, employee_id):
    if not ensure_employee_access(request, employee_id):
        return JsonResponse({"error": "Forbidden"}, status=403)

    employee = get_object_or_404(Employee, id=employee_id)

    # Parse request body
    try:
        body = json.loads(request.body.decode("utf-8") or "{}")
    except json.JSONDecodeError:
        return JsonResponse(    
            {"error": "Invalid JSON payload"},
            status=400
        )

    answers = body.get("answers", {})

    if not answers:
        return JsonResponse(
            {"error": "No answers submitted"},
            status=400
        )

    # Get active assessment session
    session = AssessmentSession.objects.filter(
        employee=employee,
        status="STARTED"
    ).first()

    if not session:
        return JsonResponse(
            {"error": "No active assessment session"},
            status=400
        )

    # Aggregate scores per skill
    skill_scores = {}

    for question_id, selected_option in answers.items():
        question = get_object_or_404(
            AssessmentQuestion,
            id=question_id
        )

        skill = question.skill

        if skill not in skill_scores:
            skill_scores[skill] = {
                "correct": 0,
                "total": 0
            }

        skill_scores[skill]["total"] += 1

        if selected_option == question.correct_option:
            skill_scores[skill]["correct"] += 1

    # Save final score per skill
    for skill, stats in skill_scores.items():
        score = int((stats["correct"] / stats["total"]) * 100)

        AssessmentResult.objects.create(
            session=session,
            skill=skill,
            score=score
        )

    # Mark assessment completed
    session.status = "COMPLETED"
    session.completed_at = timezone.now()
    session.save()

    return JsonResponse({
        "message": "Assessment completed successfully",
        "assessment_id": session.id,
        "results": {
            skill.name: int((stats["correct"] / stats["total"]) * 100)
            for skill, stats in skill_scores.items()
        }
    })


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def start_learning_content(request, employee_id, content_id):
    if not ensure_employee_access(request, employee_id):
        return JsonResponse({"error": "Forbidden"}, status=403)
    
    employee = get_object_or_404(Employee, id=employee_id)
    content = get_object_or_404(LearningContent, id=content_id)

    progress, _ = LearningProgress.objects.get_or_create(
        employee=employee,
        content=content
    )

    # ❗ Do NOT allow reverting DONE → IN_PROGRESS
    if progress.status != "DONE":
        progress.status = "IN_PROGRESS"
        progress.save()

    return JsonResponse({
        "message": "Learning started",
        "content_id": content.id,
        "status": progress.status
    })


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def complete_learning_content(request, employee_id, content_id):
    if not ensure_employee_access(request, employee_id):
        return JsonResponse({"error": "Forbidden"}, status=403)
    
    employee = get_object_or_404(Employee, id=employee_id)
    content = get_object_or_404(LearningContent, id=content_id)

    progress = get_object_or_404(
        LearningProgress,
        employee=employee,
        content=content
    )

    progress.status = "DONE"
    progress.save()

    return JsonResponse({
        "message": "Learning completed",
        "content_id": content.id,
        "status": progress.status
    })



@api_view(["GET"])
@permission_classes([IsAuthenticated])
def learner_progress_bar(request, employee_id):
    if not ensure_employee_access(request, employee_id):
        return JsonResponse({"error": "Forbidden"}, status=403)
    
    employee = get_object_or_404(Employee, id=employee_id)

    # Step 1: Profile
    profile_loaded = True

    # Step 2: Assessment
    assessment_completed = AssessmentSession.objects.filter(
        employee=employee,
        status="COMPLETED"
    ).exists()

    # Step 3: Recommendation
    recommendations_generated = LearningPath.objects.filter(
        employee=employee
    ).exists()

    # Step 4: Learning
    learning_started = LearningProgress.objects.filter(
        employee=employee,
        status__in=["IN_PROGRESS", "DONE"]
    ).exists()

    steps = [
        {
            "key": "PROFILE_LOADED",
            "label": "Profile Loaded",
            "completed": profile_loaded,
        },
        {
            "key": "ASSESSMENT_COMPLETED",
            "label": "Assessment Completed",
            "completed": assessment_completed,
        },
        {
            "key": "RECOMMENDATIONS_GENERATED",
            "label": "Recommendations Generated",
            "completed": recommendations_generated,
        },
        {
            "key": "LEARNING_IN_PROGRESS",
            "label": "Learning In Progress",
            "completed": learning_started,
        },
    ]

    completed_steps = sum(1 for s in steps if s["completed"])
    progress_percent = int((completed_steps / len(steps)) * 100)

    current_step = next(
        (s["key"] for s in steps if not s["completed"]),
        steps[-1]["key"]
    )

    return JsonResponse({
        "steps": steps,
        "progress_percent": progress_percent,
        "current_step": current_step
    })

@api_view(["GET"])
@permission_classes([IsAdmin])
def list_employees(request):
    """Admin only: List all employees"""
    employees = Employee.objects.all().values(
        "id", "name", "tsr_role", "department", "experience_years"
    )
    return JsonResponse(list(employees), safe=False)


@api_view(["GET"])
@permission_classes([AllowAny])
def list_employees_public(request):
    employees = Employee.objects.all().values("id", "name", "tsr_role")
    return JsonResponse(list(employees), safe=False)


@api_view(["POST"])
@permission_classes([IsAdmin])
def create_employee(request):
    """Admin only: Create a new employee"""
    data = request.data

    employee = Employee.objects.create(
        name=data.get("name"),
        email=data.get("email", ""),
        tsr_role=data.get("tsr_role"),
        department=data.get("department", ""),
        experience_years=data.get("experience_years", 0),
        current_skills=json.dumps(data.get("current_skills", []))
    )

    return JsonResponse({
        "id": employee.id,
        "name": employee.name,
        "tsr_role": employee.tsr_role
    }, status=201)


@api_view(["GET"])
@permission_classes([IsAdminOrEmployee])
def get_employee(request, employee_id):
    """Admin or Employee: Get employee details"""
    emp = get_object_or_404(Employee, id=employee_id)
    
    # Employees can only view their own profile
    if hasattr(request.user, 'userprofile'):
        if request.user.userprofile.role == 'EMPLOYEE' and request.user.userprofile.employee_id != employee_id:
            return JsonResponse({"error": "Permission denied"}, status=403)
    
    return JsonResponse({
        "id": emp.id,
        "name": emp.name,
        "email": emp.email, 
        "tsr_role": emp.tsr_role,
        "department": emp.department,
        "experience_years": emp.experience_years,
        "current_skills": emp.get_current_skills(),
    })

@api_view(["PUT", "PATCH"])
@permission_classes([IsAdminOrEmployee])
def update_employee(request, employee_id):
    """Admin or Employee: Update employee profile"""
    employee = get_object_or_404(Employee, id=employee_id)

    # Employees can only update their own profile
    if hasattr(request.user, 'userprofile'):
        if request.user.userprofile.role == 'EMPLOYEE' and request.user.userprofile.employee_id != employee_id:
            return JsonResponse({"error": "Permission denied"}, status=403)

    try:
        data = request.data
    except Exception as e:
        return JsonResponse({"error": "Invalid data"}, status=400)

    # Editable fields only
    employee.name = data.get("name", employee.name)
    employee.email = data.get("email", employee.email)
    employee.department = data.get("department", employee.department)
    employee.experience_years = data.get(
        "experience_years",
        employee.experience_years
    )

    if "current_skills" in data:
        employee.current_skills = json.dumps(data["current_skills"])

    employee.save()

    return JsonResponse({
        "message": "Profile updated successfully"
    })


@api_view(["GET"])
@permission_classes([IsAuthenticated, IsAdmin])
def admin_analytics(request):
    # 1️⃣ Total employees
    total_employees = Employee.objects.count()

    # 2️⃣ Assessments completed
    assessments_completed = AssessmentSession.objects.filter(
        status="COMPLETED"
    ).count()

    # 3️⃣ Learning progress breakdown
    learning_status_qs = LearningProgress.objects.values(
        "status"
    ).annotate(count=Count("id"))

    learning_status = {
        row["status"]: row["count"]
        for row in learning_status_qs
    }

    # Ensure keys always exist
    learning_status.setdefault("NOT_STARTED", 0)
    learning_status.setdefault("IN_PROGRESS", 0)
    learning_status.setdefault("DONE", 0)

    # 4️⃣ Top skill gaps (score < 70)
    skill_gap_qs = (
        AssessmentResult.objects
        .filter(score__lt=70)
        .values("skill__name")
        .annotate(count=Count("id"))
        .order_by("-count")[:5]
    )

    top_skill_gaps = [
        {
            "skill": row["skill__name"],
            "count": row["count"]
        }
        for row in skill_gap_qs
    ]

    return JsonResponse({
        "total_employees": total_employees,
        "assessments_completed": assessments_completed,
        "learning_status": learning_status,
        "top_skill_gaps": top_skill_gaps
    })