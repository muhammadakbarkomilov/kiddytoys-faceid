// Centralized API configuration for dev/prod environments
export const API_BASE_URL = 
  process.env.NEXT_PUBLIC_API_URL || 
  (process.env.NODE_ENV === 'production' 
    ? 'https://api.xodimlar.uz' // Production API base URL
    : 'http://localhost:8000'); // Development API base URL

export const ENDPOINTS = {
  auth: {
    login: `${API_BASE_URL}/auth/login`,
  },
  admins: {
    base: `${API_BASE_URL}/admins`,
    me: `${API_BASE_URL}/user/me`,
    detail: (id: number) => `${API_BASE_URL}/admins/${id}`,
  },
  positions: {
    base: `${API_BASE_URL}/positions`,
    detail: (id: number) => `${API_BASE_URL}/positions/${id}`,
  },
  employees: {
    base: `${API_BASE_URL}/employees`,
    detail: (id: number) => `${API_BASE_URL}/employees/${id}`,
  },
  attendance: {
    overview: `${API_BASE_URL}/attendance/overview`,
  }

};
