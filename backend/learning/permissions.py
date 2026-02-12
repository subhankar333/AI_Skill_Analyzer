from rest_framework.permissions import BasePermission, IsAuthenticated


class IsAdmin(BasePermission):
    """
    Permission class to check if user is an admin.
    """
    def has_permission(self, request, view):
        return bool(
            request.user and
            request.user.is_authenticated and
            hasattr(request.user, 'userprofile') and
            request.user.userprofile.role == 'ADMIN'
        )


class IsEmployee(BasePermission):
    """
    Permission class to check if user is an employee.
    """
    def has_permission(self, request, view):
        return bool(
            request.user and
            request.user.is_authenticated and
            hasattr(request.user, 'userprofile') and
            request.user.userprofile.role == 'EMPLOYEE'
        )


class IsAdminOrEmployee(BasePermission):
    """
    Permission class to check if user is either admin or employee.
    """
    def has_permission(self, request, view):
        return bool(
            request.user and
            request.user.is_authenticated and
            hasattr(request.user, 'userprofile')
        )
