# JWT Authentication Implementation Summary

## ✅ What's Been Implemented

### 1. **Custom JWT Token Serializer** (`views_auth.py`)
   - Extends SimpleJWT's `TokenObtainPairSerializer`
   - Automatically includes `role` and `employee_id` in token payload
   - No need for separate API call to determine user role

### 2. **Role-Based Permission Classes** (`permissions.py`)
   - `IsAdmin` - Only admin users
   - `IsEmployee` - Only employee users  
   - `IsAdminOrEmployee` - Either admin or employee with data ownership checks

### 3. **Authentication Endpoints** (`views_auth.py`)
   ```
   POST   /api/auth/login/        → Get access & refresh tokens (includes role data)
   POST   /api/auth/refresh/      → Refresh expired access token
   GET    /api/auth/me/           → Get current user info & role
   POST   /api/auth/register/     → Register new admin or employee user
   ```

### 4. **Protected Admin Endpoints** (`views.py`)
   ```
   GET    /api/learner/employees/                 → Admin only
   POST   /api/learner/employees/create/          → Admin only
   GET    /api/learner/employees/<id>/            → Admin or self
   PUT    /api/learner/employees/<id>/update/     → Admin or self
   ```

### 5. **JWT Configuration** (`settings.py`)
   - Access tokens valid for 60 minutes
   - Refresh tokens valid for 1 day
   - Bearer authentication scheme

---

## 📋 How to Use

### Setup (First Time Only)

1. **Install dependencies:**
   ```bash
   pip install djangorestframework-simplejwt
   ```

2. **Create superuser (admin):**
   ```bash
   python manage.py createsuperuser
   ```

3. **Create UserProfile for admin:**
   ```bash
   python manage.py shell
   ```
   ```python
   from django.contrib.auth.models import User
   from learning.models import UserProfile
   
   admin_user = User.objects.get(username='admin')
   UserProfile.objects.create(user=admin_user, role='ADMIN')
   exit()
   ```

### Basic Authentication Flow

#### 1. **Register New User**
```bash
curl -X POST http://localhost:8000/api/auth/register/ \
  -H "Content-Type: application/json" \
  -d '{
    "username": "john_doe",
    "password": "SecurePass123",
    "email": "john@example.com",
    "role": "EMPLOYEE",
    "employee_id": 1
  }'
```

#### 2. **Login & Get Tokens**
```bash
curl -X POST http://localhost:8000/api/auth/login/ \
  -H "Content-Type: application/json" \
  -d '{
    "username": "john_doe",
    "password": "SecurePass123"
  }'
```

Response:
```json
{
  "access": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...",
  "refresh": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9..."
}
```

#### 3. **Use Token to Access Protected Endpoints**
```bash
curl -X GET http://localhost:8000/api/auth/me/ \
  -H "Authorization: Bearer eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9..."
```

Response:
```json
{
  "id": 1,
  "username": "john_doe",
  "email": "john@example.com",
  "role": "EMPLOYEE",
  "employee_id": 1,
  "employee_name": "John Doe"
}
```

#### 4. **Refresh Expired Token**
```bash
curl -X POST http://localhost:8000/api/auth/refresh/ \
  -H "Content-Type: application/json" \
  -d '{
    "refresh": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9..."
  }'
```

---

## 🔐 Permission Rules

### Admin User
- ✅ Register/create employees
- ✅ List all employees
- ✅ View any employee profile
- ✅ Update any employee profile

### Employee User
- ✅ View own profile only
- ✅ Update own profile only
- ❌ Cannot view other employees
- ❌ Cannot create/manage employees

---

## 🧪 Testing

Run the automated test script:
```bash
python test_auth.py
```

This will test:
1. Admin registration
2. Employee registration
3. Login flow
4. Token refresh
5. Role-based access control
6. Permission enforcement

---

## 📁 Files Modified/Created

### New Files
- `learning/permissions.py` - Role-based permission classes
- `JWT_AUTHENTICATION.md` - Detailed API documentation
- `test_auth.py` - Automated test suite

### Modified Files
- `learning/views_auth.py` - Added custom JWT serializer and register endpoint
- `learning/views.py` - Added @permission_classes decorators to endpoints
- `learning/urls.py` - Updated to use CustomTokenObtainPairView
- `backend/settings.py` - Added rest_framework_simplejwt to INSTALLED_APPS

---

## 🚀 Next Steps

1. **Test the authentication** by running `python test_auth.py`
2. **Update frontend** to:
   - Call `/api/auth/register/` to create new users
   - Call `/api/auth/login/` to login
   - Store access token in localStorage
   - Include token in Authorization header for all requests
   - Decode token to show user role in UI
   - Use refresh token to get new access token when expired

3. **Production checklist**:
   - Reduce token lifetimes (access: 15-30 min, refresh: 7 days)
   - Use HTTPS for all token transmission
   - Move SECRET_KEY to environment variable
   - Update CORS_ALLOWED_ORIGINS to production domain
   - Implement token blacklist for logout (optional)

---

## 📚 Key Concepts

### JWT Token Structure
```
Header.Payload.Signature

Payload includes:
{
  "user_id": 1,
  "username": "john_doe",
  "role": "EMPLOYEE",              ← Custom claim
  "employee_id": 1,                ← Custom claim
  "exp": 1234567890,               ← Expiration time
  "iat": 1234567890                ← Issued at time
}
```

### Token Locations
- **Access Token**: Include in `Authorization: Bearer <token>` header
- **Refresh Token**: Store securely (httpOnly cookie preferred over localStorage)

### Token Expiration & Refresh
1. Access token expires after 60 minutes
2. Use refresh token to get new access token
3. Refresh token expires after 1 day
4. User must login again if both tokens expire

---

## ❓ Troubleshooting

| Issue | Solution |
|-------|----------|
| 401 Unauthorized | Token missing or invalid - include Authorization header |
| 403 Forbidden | User role doesn't match endpoint requirements |
| Token has no role | UserProfile missing - ensure it exists for the user |
| CORS error | Update CORS_ALLOWED_ORIGINS in settings.py |

---

For detailed API documentation, see `JWT_AUTHENTICATION.md`
