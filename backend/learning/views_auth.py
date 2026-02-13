from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from rest_framework_simplejwt.views import TokenObtainPairView
from rest_framework.permissions import AllowAny
from django.contrib.auth.models import User
from .models import UserProfile, Employee
from .permissions import IsAdmin, IsAdminOrEmployee


class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    """
    Custom serializer to include role and employee_id in JWT token payload.
    """
    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)
        
        # Add custom claims
        try:
            profile = UserProfile.objects.get(user=user)
            token['role'] = profile.role
            token['employee_id'] = profile.employee.id if profile.employee else None
        except UserProfile.DoesNotExist:
            token['role'] = None
            token['employee_id'] = None
        
        return token

class CustomTokenObtainPairView(TokenObtainPairView):
    """
    Custom token view that uses the CustomTokenObtainPairSerializer.
    """
    serializer_class = CustomTokenObtainPairSerializer


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def current_user(request):
    """
    Returns the current authenticated user's profile information.
    """
    try:
        profile = UserProfile.objects.select_related(
            "employee"
        ).get(user=request.user)
    except UserProfile.DoesNotExist:
        return Response(
            {"error": "User profile not found"},
            status=status.HTTP_404_NOT_FOUND
        )

    return Response({
        "id": request.user.id,
        "username": request.user.username,
        "email": request.user.email,
        "role": profile.role,
        "employee_id": profile.employee.id if profile.employee else None,
        "employee_name": profile.employee.name if profile.employee else None,
    })


@api_view(["POST"])
@permission_classes([])
def register_user(request):
    """
    Register a new user with admin or employee role.
    Requires: username, password, email, role (ADMIN or EMPLOYEE), employee_id (optional)
    """
    username = request.data.get("username")
    password = request.data.get("password")
    email = request.data.get("email")
    role = request.data.get("role", "EMPLOYEE")  # Default to EMPLOYEE if not provided
    employee_id = request.data.get("employee_id")

    # Validation
    if not all([username, password, email]):
        return Response(
            {"error": "username, password, and email are required"},
            status=status.HTTP_400_BAD_REQUEST
        )

    if role not in ["ADMIN", "EMPLOYEE"]:
        return Response(
            {"error": "role must be ADMIN or EMPLOYEE"},
            status=status.HTTP_400_BAD_REQUEST
        )

    # Check if username already exists
    existing_user = User.objects.filter(username=username).first()
    if existing_user:
        # Check if UserProfile exists
        try:
            profile = UserProfile.objects.get(user=existing_user)
            return Response(
                {"error": "Username already registered"},
                status=status.HTTP_400_BAD_REQUEST
            )
        except UserProfile.DoesNotExist:
            # User exists but no profile - delete and recreate
            existing_user.delete()

    # Check if email already exists
    if User.objects.filter(email=email).exists():
        return Response(
            {"error": "Email already exists"},
            status=status.HTTP_400_BAD_REQUEST
        )

    try:
        # Create user
        user = User.objects.create_user(
            username=username,
            email=email,
            password=password
        )

        # Get or create employee reference
        employee = None
        if employee_id:
            try:
                employee = Employee.objects.get(id=employee_id)
            except Employee.DoesNotExist:
                user.delete()
                return Response(
                    {"error": f"Employee with id {employee_id} not found"},
                    status=status.HTTP_400_BAD_REQUEST
                )

        # Create or update user profile with correct role
        profile, created = UserProfile.objects.update_or_create(
            user=user,
            defaults={"role": role, "employee": employee}
        )

        return Response({
            "message": "User registered successfully",
            "user_id": user.id,
            "username": user.username,
            "email": user.email,
            "role": profile.role
        }, status=status.HTTP_201_CREATED)

    except Exception as e:
        print(f"Registration error: {e}")
        # Cleanup on error
        try:
            User.objects.filter(username=username).delete()
        except:
            pass
        return Response(
            {"error": f"Registration failed: {str(e)}"},
            status=status.HTTP_400_BAD_REQUEST
        )
