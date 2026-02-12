from django.contrib import admin
from .models import Employee, TSRSkillProfile, LearningEvent, LearningPath, Skill, LearningContent, LearningProgress, AssessmentQuestion, AssessmentSession, AssessmentResult, UserProfile

# Register your models here.
admin.site.register(Employee)
admin.site.register(TSRSkillProfile)
admin.site.register(LearningEvent)
admin.site.register(LearningPath)
admin.site.register(Skill)
admin.site.register(LearningContent)
admin.site.register(LearningProgress)
admin.site.register(AssessmentSession)
admin.site.register(AssessmentQuestion)
admin.site.register(AssessmentResult)
admin.site.register(UserProfile)


