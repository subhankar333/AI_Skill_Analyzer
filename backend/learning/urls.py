from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView
from .views_auth import CustomTokenObtainPairView, current_user, register_user
from .views import learner_dashboard, generate_learning_path, learner_workflow_status, start_assessment, submit_assessment, generate_assessment_questions, learner_progress_bar, start_learning_content, complete_learning_content,list_employees, create_employee, get_employee, get_learning_path,update_employee,list_employees_public,admin_analytics

urlpatterns = [
        path("learner/<int:employee_id>/dashboard/", learner_dashboard),
        path("learner/<int:employee_id>/generate_learning_path/", generate_learning_path),
        path("learner/<int:employee_id>/workflow/", learner_workflow_status), 
        path("learner/<int:employee_id>/assessment/generate/", generate_assessment_questions), 
        path("learner/<int:employee_id>/assessment/start/", start_assessment),  
        path("learner/<int:employee_id>/assessment/submit/", submit_assessment), 
        path("learner/<int:employee_id>/learning-path/", get_learning_path),
        path("learner/<int:employee_id>/learning/<int:content_id>/start/", start_learning_content),  
        path("learner/<int:employee_id>/learning/<int:content_id>/complete/", complete_learning_content),  
        path("learner/<int:employee_id>/progress-bar/", learner_progress_bar),  
        path("learner/employees/", list_employees),  
        path("learner/employees/public/", list_employees_public),  
        path("learner/employees/create/", create_employee),  
        path("learner/employees/<int:employee_id>/", get_employee),
        path("learner/employees/<int:employee_id>/update/", update_employee),
        path("admin/analytics/", admin_analytics),
] 

urlpatterns += [
    path("auth/login/", CustomTokenObtainPairView.as_view(), name="token_obtain_pair"),
    path("auth/refresh/", TokenRefreshView.as_view(), name="token_refresh"),
    path("auth/me/", current_user, name="current_user"),
    path("auth/register/", register_user, name="register"),
]