
// src/config/api.ts

// For local development: http://localhost:5000/api
// For production (Render): https://inprogress-4l7v.onrender.com/api
const API_BASE =
  process.env.REACT_APP_API_URL || "http://localhost:5000";

// Export the FULL URL with /api already included
// This way in your components you just do: fetch(`${API_URL}/signup`)
export const API_URL = `${API_BASE}/api`;