from django.db import models
import json
from django.utils import timezone
from django.contrib.auth.models import User

# Create your models here.
class Employee(models.Model):
    name = models.CharField(max_length=255)
    email = models.EmailField(blank=True)
    tsr_role = models.CharField(max_length=255)
    department = models.CharField(max_length=255, blank=True)
    experience_years = models.IntegerField(default=0)
    current_skills = models.TextField(blank=True)

    def get_current_skills(self):
        try:
            return json.loads(self.current_skills)
        except:
            return []

    def __str__(self):
        return f"{self.name}"


class TSRSkillProfile(models.Model):
    tsr_role = models.CharField(max_length=255, unique=True)
    expected_skills = models.TextField()

    def __str__(self):
        return f"{self.tsr_role}"


class LearningPath(models.Model):
    STATUS = [
        ("NOT_STARTED", "Not Started"),
        ("IN_PROGRESS", "In Progress"),
        ("DONE", "Done"),
    ]

    employee = models.ForeignKey(Employee, on_delete=models.CASCADE)
    status = models.CharField(max_length=25, choices=STATUS)
    items = models.TextField()
    matched_skills = models.TextField(blank=True)
    missing_skills = models.TextField(blank=True)
    created_at = models.DateTimeField(default=timezone.now)

    def get_items(self):
        try:
            return json.loads(self.items)
        except:
            return []

    def __str__(self):
        return f"{self.employee.name}"

class LearningPathItem(models.Model):
    learning_path = models.ForeignKey(LearningPath, on_delete=models.CASCADE)
    content_id = models.CharField(max_length=100)
    title = models.CharField(max_length=255)
    skill = models.CharField(max_length=100)
    url = models.TextField()
    thumbnail = models.TextField()
    estimated_hours = models.IntegerField(default=0)

    STATUS = [
        ("NOT_STARTED", "Not Started"),
        ("IN_PROGRESS", "In Progress"),
        ("DONE", "Done"),
    ]
    status = models.CharField(max_length=20, choices=STATUS, default="NOT_STARTED")

    def to_json(self):
        return {
            "id": self.id,
            "title": self.title,
            "skill": self.skill,
            "url": self.url,
            "thumbnail": self.thumbnail,
            "estimated_hours": self.estimated_hours,
            "status": self.status
        }


class LearningEvent(models.Model):
    Employee = models.ForeignKey(Employee,on_delete=models.CASCADE)
    event_type = models.CharField(max_length=50)
    metadata = models.TextField(blank=True)
    created_at = models.DateTimeField(default=timezone.now)

    def __str__(self):
        return f"{self.employee.name}"
    

class Skill(models.Model):
    CORE = "CORE"
    NICE_TO_HAVE = "NICE_TO_HAVE"

    CATEGORY_CHOICES = [
        (CORE, "Core"),
        (NICE_TO_HAVE, "Nice to Have"),
    ]

    name = models.CharField(max_length=100, unique=True)
    category = models.CharField(
        max_length=20,
        choices=CATEGORY_CHOICES,
        default=CORE
    )

    def __str__(self):
        return self.name


class LearningContent(models.Model):
    VIDEO = "VIDEO"
    ARTICLE = "ARTICLE"

    CONTENT_TYPE_CHOICES = [
        (VIDEO, "Video"),
        (ARTICLE, "Article"),
    ]

    title = models.CharField(max_length=255)
    skill = models.ForeignKey(
        Skill,
        on_delete=models.CASCADE,
        related_name="learning_contents"
    )
    content_type = models.CharField(
        max_length=20,
        choices=CONTENT_TYPE_CHOICES,
        default=VIDEO
    )
    thumbnail_url = models.URLField(blank=True)
    content_url = models.URLField()
    duration_minutes = models.IntegerField(default=0)
    difficulty = models.CharField(max_length=50, blank=True)
    source = models.CharField(max_length=100, blank=True)  # YouTube, Internal, Udemy, etc.

    def __str__(self):
        return self.title


class LearningProgress(models.Model):
    NOT_STARTED = "NOT_STARTED"
    IN_PROGRESS = "IN_PROGRESS"
    DONE = "DONE"

    STATUS_CHOICES = [
        (NOT_STARTED, "Not Started"),
        (IN_PROGRESS, "In Progress"),
        (DONE, "Done"),
    ]

    employee = models.ForeignKey(
        Employee,
        on_delete=models.CASCADE,
        related_name="learning_progress"
    )
    content = models.ForeignKey(
        LearningContent,
        on_delete=models.CASCADE,
        related_name="progress_records"
    )
    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default=NOT_STARTED
    )
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.employee.name} - {self.content.title} ({self.status})"
    

class AssessmentSession(models.Model):
    STARTED = "STARTED"
    COMPLETED = "COMPLETED"

    STATUS_CHOICES = [
        (STARTED, "Started"),
        (COMPLETED, "Completed"),
    ]

    employee = models.ForeignKey(
        Employee,
        on_delete=models.CASCADE,
        related_name="assessments"
    )
    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default=STARTED
    )
    started_at = models.DateTimeField(auto_now_add=True)
    completed_at = models.DateTimeField(null=True, blank=True)

    def __str__(self):
        return f"{self.employee.name} - {self.status}"


class AssessmentQuestion(models.Model):
    session = models.ForeignKey(AssessmentSession, on_delete=models.CASCADE)
    # session = models.ForeignKey(
    #     AssessmentSession,
    #     on_delete=models.CASCADE,
    #     null=True,
    #     blank=True
    # )
    skill = models.ForeignKey(
        Skill,
        on_delete=models.CASCADE,
        related_name="assessment_questions"
    )
    question_text = models.TextField()
    options = models.JSONField()
    correct_option = models.CharField(max_length=255)
    difficulty = models.CharField(max_length=50, blank=True)

    def __str__(self):
        return f"{self.skill.name} - {self.difficulty}"


class AssessmentResult(models.Model):
    session = models.ForeignKey(
        AssessmentSession,
        on_delete=models.CASCADE,
        related_name="results"
    )
    skill = models.ForeignKey(
        Skill,
        on_delete=models.CASCADE
    )
    score = models.IntegerField()  # 0–100

    def __str__(self):
        return f"{self.session.employee.name} - {self.skill.name}: {self.score}"




class UserProfile(models.Model):
    ROLE_CHOICES = (
        ("ADMIN", "Admin"),
        ("EMPLOYEE", "Employee"),
    )

    user = models.OneToOneField(User, on_delete=models.CASCADE)
    role = models.CharField(max_length=20, choices=ROLE_CHOICES)
    employee = models.OneToOneField(
        Employee,
        on_delete=models.CASCADE,
        null=True,
        blank=True
    )

    def __str__(self):
        return f"{self.user.username} ({self.role})"