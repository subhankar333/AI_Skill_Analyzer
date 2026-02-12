import { createSlice } from "@reduxjs/toolkit";

// Helper function to decode JWT
const decodeToken = (token) => {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(atob(base64).split('').map((c) => {
      return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
    }).join(''));
    return JSON.parse(jsonPayload);
  } catch (error) {
    console.error("Error decoding token:", error);
    return null;
  }
};

const initialState = {
  token: localStorage.getItem("token"),
  role: localStorage.getItem("role"),
  employeeId: localStorage.getItem("employeeId"),
  isAuthenticated: !!localStorage.getItem("token"),
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    loginSuccess: (state, action) => {
      console.log("loginSuccess payload:", action.payload);
      
      const { access } = action.payload;

      // Decode the JWT to get role and employee_id
      const decoded = decodeToken(access);
      console.log("Decoded token:", decoded);

      const role = decoded?.role;
      const employee_id = decoded?.employee_id;

      console.log("Extracted values - access:", access, "role:", role, "employee_id:", employee_id);

      state.token = access;
      state.role = role;
      state.employeeId = employee_id;
      state.isAuthenticated = true;

      localStorage.setItem("token", access);
      localStorage.setItem("role", role);
      localStorage.setItem("employeeId", employee_id);
    },

    logout: (state) => {
      state.token = null;
      state.role = null;
      state.employeeId = null;
      state.isAuthenticated = false;

      localStorage.clear();
    },
  },
});

export const { loginSuccess, logout } = authSlice.actions;
export default authSlice.reducer;
