# JWT Authentication Implementation

This document explains the JWT-based authentication system for Admin and Employee roles.

## Overview

The system uses Django REST Framework with SimpleJWT for token-based authentication. Two roles are supported:
- **ADMIN**: Full access to manage employees and system configuration
- **EMPLOYEE**: Access to their own learning path, assessments, and profile

## Architecture

### Key Components

1. **CustomTokenObtainPairSerializer** (`views_auth.py`)
   - Extends `TokenObtainPairSerializer` to include custom claims in JWT token
   - Adds `role` and `employee_id` to token payload
   - Allows frontend to know user role without additional API call

2. **Permission Classes** (`permissions.py`)
   - `IsAdmin`: Only admin users
   - `IsEmployee`: Only employee users
   - `IsAdminOrEmployee`: Either admin or employee

3. **Protected Endpoints**
   - Admin-only: List employees, create employee
   - Admin/Employee: Get employee (employee sees only own), update employee (employee updates only own)
   - Learner endpoints: Protected with `IsAuthenticated`

## API Endpoints

### Authentication

#### 1. Register User
```
POST /api/auth/register/
Content-Type: application/json

{
  "username": "john_doe",
  "password": "securepassword123",
  "email": "john@example.com",
  "role": "EMPLOYEE",              // "ADMIN" or "EMPLOYEE"
  "employee_id": 1                 // Optional, only for EMPLOYEE role
}

Response:
{
  "message": "User registered successfully",
  "user_id": 1,
  "username": "john_doe",
  "email": "john@example.com",
  "role": "EMPLOYEE"
}
```

#### 2. Login (Obtain Token)
```
POST /api/auth/login/
Content-Type: application/json

{
  "username": "john_doe",
  "password": "securepassword123"
}

Response:
{
  "access": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...",
  "refresh": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9..."
}
```

The `access` token includes:
- `user_id`
- `exp` (expiration time)
- `role`: "ADMIN" or "EMPLOYEE"
- `employee_id`: ID of associated employee (if applicable)

#### 3. Refresh Token
```
POST /api/auth/refresh/
Content-Type: application/json

{
  "refresh": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9..."
}

Response:
{
  "access": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9..."
}
```

#### 4. Get Current User Info
```
GET /api/auth/me/
Authorization: Bearer <access_token>

Response:
{
  "id": 1,
  "username": "john_doe",
  "email": "john@example.com",
  "role": "EMPLOYEE",
  "employee_id": 1,
  "employee_name": "John Doe"
}
```

### Employee Management (Admin Only)

#### 1. List All Employees
```
GET /api/learner/employees/
Authorization: Bearer <admin_access_token>

Response:
[
  {
    "id": 1,
    "name": "John Doe",
    "tsr_role": "TSR-Fullstack",
    "department": "Engineering",
    "experience_years": 2
  },
  ...
]
```

#### 2. Create Employee
```
POST /api/learner/employees/create/
Authorization: Bearer <admin_access_token>
Content-Type: application/json

{
  "name": "Jane Smith",
  "email": "jane@example.com",
  "tsr_role": "TSR-Backend",
  "department": "Engineering",
  "experience_years": 3,
  "current_skills": ["Python", "Django", "PostgreSQL"]
}

Response:
{
  "id": 2,
  "name": "Jane Smith",
  "tsr_role": "TSR-Backend"
}
```

#### 3. Get Employee (Admin or Self)
```
GET /api/learner/employees/<employee_id>/
Authorization: Bearer <access_token>

Response:
{
  "id": 1,
  "name": "John Doe",
  "email": "john@example.com",
  "tsr_role": "TSR-Fullstack",
  "department": "Engineering",
  "experience_years": 2,
  "current_skills": ["React", "JavaScript", "Django"]
}
```

#### 4. Update Employee (Admin or Self)
```
PUT /api/learner/employees/<employee_id>/update/
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "name": "John Doe",
  "email": "john.doe@example.com",
  "department": "Data Science",
  "experience_years": 3,
  "current_skills": ["React", "JavaScript", "Django", "FastAPI"]
}

Response:
{
  "message": "Profile updated successfully"
}
```

## Token Configuration

In `settings.py`:

```python
SIMPLE_JWT = {
    "ACCESS_TOKEN_LIFETIME": timedelta(minutes=60),      # Access token valid for 60 minutes
    "REFRESH_TOKEN_LIFETIME": timedelta(days=1),          # Refresh token valid for 1 day
    "AUTH_HEADER_TYPES": ("Bearer",),                     # Use "Bearer" in Authorization header
}
```

## Usage in Frontend

### 1. Login and Store Token
```javascript
const response = await fetch('http://localhost:8000/api/auth/login/', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    username: 'john_doe',
    password: 'securepassword123'
  })
});

const data = await response.json();
localStorage.setItem('access_token', data.access);
localStorage.setItem('refresh_token', data.refresh);
```

### 2. Include Token in API Requests
```javascript
const headers = {
  'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
  'Content-Type': 'application/json'
};

const response = await fetch('http://localhost:8000/api/auth/me/', {
  method: 'GET',
  headers: headers
});
```

### 3. Handle Token Expiration & Refresh
```javascript
async function refreshAccessToken() {
  const response = await fetch('http://localhost:8000/api/auth/refresh/', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      refresh: localStorage.getItem('refresh_token')
    })
  });

  const data = await response.json();
  localStorage.setItem('access_token', data.access);
}
```

### 4. Role-Based Access Control in Frontend
```javascript
async function checkPermission(requiredRole) {
  const response = await fetch('http://localhost:8000/api/auth/me/', {
    headers: { 'Authorization': `Bearer ${localStorage.getItem('access_token')}` }
  });
  
  const user = await response.json();
  
  if (requiredRole === 'ADMIN' && user.role !== 'ADMIN') {
    // Redirect or show permission denied
  }
}
```

## Database Setup

Ensure you have created the initial users. You can do this via Django admin or with:

```bash
python manage.py createsuperuser
```

Then create a UserProfile with ADMIN role:

```python
from django.contrib.auth.models import User
from learning.models import UserProfile

admin_user = User.objects.get(username='admin')
UserProfile.objects.create(user=admin_user, role='ADMIN')
```

## Dependencies

Make sure these packages are installed:

```bash
pip install djangorestframework
pip install djangorestframework-simplejwt
pip install django-cors-headers
```

Or use the requirements file:
```bash
pip install -r requirements.txt
```

## Security Notes

1. **Access Token Lifetime**: Set to 60 minutes in development. Reduce to 15-30 minutes in production.
2. **Refresh Token Lifetime**: Set to 1 day. Consider shorter in production.
3. **Secret Key**: Change `SECRET_KEY` in `settings.py` for production.
4. **HTTPS**: Always use HTTPS in production for token transmission.
5. **CORS**: Update `CORS_ALLOWED_ORIGINS` with your actual frontend domain.

## Troubleshooting

### "No credentials provided" (401)
- Missing or invalid `Authorization` header
- Token expired (use refresh endpoint)

### "Invalid token" (401)
- Token signature invalid (check SECRET_KEY)
- Token malformed

### "Permission denied" (403)
- User role doesn't match required permission
- Employee trying to access admin endpoints

### Token doesn't include role/employee_id
- Ensure `UserProfile` exists for the user
- Check `CustomTokenObtainPairView` is used (not default TokenObtainPairView)
