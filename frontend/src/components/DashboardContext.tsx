import React, { createContext, useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/router';
import { ENDPOINTS, API_BASE_URL } from '../utils/api';

export interface Position {
  id: number;
  name: string;
  created_at: number;
  employee_count?: number;
}

export interface Admin {
  id: number;
  first_name: string;
  last_name: string;
  username: string;
  phone?: string;
  created_at: number;
  role?: string;
}

export interface Employee {
  id: number;
  first_name: string;
  last_name: string;
  birthday?: number | null; // Unix timestamp in milliseconds
  gender: string;
  phone: string;
  adress?: string;
  position_id?: number;
  created_at: number;
  position?: {
    id: number;
    name: string;
  };
}

export interface AttendanceLog {
  id: number;
  employee_id: number;
  employee_name: string;
  status: string;
  timestamp: number;
}

export interface AttendanceOverview {
  total_employees: number;
  checked_in_today: number;
  latest_logs: AttendanceLog[];
}

interface DashboardContextType {
  token: string | null;
  currentAdmin: Admin | null;
  employees: Employee[];
  positions: Position[];
  admins: Admin[];
  attendanceOverview: AttendanceOverview | null;
  loading: boolean;
  loadingEmployees: boolean;
  loadingPositions: boolean;
  loadingAdmins: boolean;
  loadingOverview: boolean;
  initialized: boolean;
  fetchEmployees: () => Promise<void>;
  fetchPositions: () => Promise<void>;
  fetchAdmins: () => Promise<void>;
  fetchAttendanceOverview: () => Promise<void>;
  refreshData: () => Promise<void>;
  logout: () => void;
  loginSuccess: (token: string, admin: Admin, expiry: string) => void;
}


export const DashboardContext = createContext<DashboardContextType | undefined>(undefined);

export function DashboardProvider({ children }: { children: React.ReactNode }) {
  const [token, setToken] = useState<string | null>(null);
  const [currentAdmin, setCurrentAdmin] = useState<Admin | null>(null);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [positions, setPositions] = useState<Position[]>([]);
  const [admins, setAdmins] = useState<Admin[]>([]);
  const [attendanceOverview, setAttendanceOverview] = useState<AttendanceOverview | null>(null);
  const [loadingEmployees, setLoadingEmployees] = useState(false);
  const [loadingPositions, setLoadingPositions] = useState(false);
  const [loadingAdmins, setLoadingAdmins] = useState(false);
  const [loadingOverview, setLoadingOverview] = useState(false);
  const [initialized, setInitialized] = useState(false);
  const router = useRouter();

  const logout = useCallback(() => {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('auth_admin');
    localStorage.removeItem('auth_token_expiry');
    setToken(null);
    setCurrentAdmin(null);
    setEmployees([]);
    setPositions([]);
    setAdmins([]);
    setAttendanceOverview(null);
    router.replace('/login');
  }, [router]);


  const refreshAuthToken = useCallback(async (currentToken: string) => {
    try {
      const res = await fetch(`${API_BASE_URL}/auth/refresh`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${currentToken}`
        }
      });
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          localStorage.setItem('auth_token', data.data.access_token);
          localStorage.setItem('auth_admin', JSON.stringify(data.data.admin));
          localStorage.setItem('auth_token_expiry', String(data.data.expiry_date));
          setToken(data.data.access_token);
          setCurrentAdmin(data.data.admin);
          return data.data.access_token;
        }
      }
    } catch (err) {
      console.error("Token refresh failed:", err);
    }
    return null;
  }, []);

  // Load session from localStorage on mount and verify profile via /user/me
  useEffect(() => {
    const verifySession = async () => {
      const savedToken = localStorage.getItem('auth_token');
      const savedExpiry = localStorage.getItem('auth_token_expiry');
      
      if (savedToken) {
        try {
          // Check if token is expired or close to expiring (within 3 days)
          const now = Date.now();
          const expiryTime = savedExpiry ? parseInt(savedExpiry, 10) : 0;
          
          let activeToken = savedToken;
          
          if (expiryTime && expiryTime - now < 3 * 24 * 60 * 60 * 1000) {
            // Token is close to expiring (or already expired according to stored timestamp)
            // Attempt to refresh it
            const refreshedToken = await refreshAuthToken(savedToken);
            if (refreshedToken) {
              activeToken = refreshedToken;
            }
          }
          
          // Verify session profile using active token
          const res = await fetch(ENDPOINTS.admins.me, {
            headers: {
              Authorization: `Bearer ${activeToken}`
            }
          });
          if (res.ok) {
            const data = await res.json();
            if (data.success) {
              setToken(activeToken);
              setCurrentAdmin(data.data);
              localStorage.setItem('auth_admin', JSON.stringify(data.data));
              setInitialized(true);
              return;
            }
          }
        } catch (err) {
          console.error("Session verification failed:", err);
        }
        
        // If fetch fails or response is not ok (e.g. 401), log out
        localStorage.removeItem('auth_token');
        localStorage.removeItem('auth_admin');
        localStorage.removeItem('auth_token_expiry');
        setToken(null);
        setCurrentAdmin(null);
      }
      setInitialized(true);
    };

    verifySession();
  }, [refreshAuthToken]);

  const fetchPositions = useCallback(async () => {
    if (!token) return;
    setLoadingPositions(true);
    try {
      const headers = { Authorization: `Bearer ${token}` };
      const posRes = await fetch(ENDPOINTS.positions.base, { headers });
      if (posRes.ok) {
        const res = await posRes.json();
        if (res.success) {
          setPositions(res.data);
        }
      } else if (posRes.status === 401) {
        logout();
      }
    } catch (err) {
      console.error('Failed to fetch positions:', err);
    } finally {
      setLoadingPositions(false);
    }
  }, [token, logout]);

  const fetchEmployees = useCallback(async () => {
    if (!token) return;
    setLoadingEmployees(true);
    try {
      const headers = { Authorization: `Bearer ${token}` };
      const empRes = await fetch(ENDPOINTS.employees.base, { headers });
      if (empRes.ok) {
        const res = await empRes.json();
        if (res.success) {
          setEmployees(res.data);
        }
      } else if (empRes.status === 401) {
        logout();
      }
    } catch (err) {
      console.error('Failed to fetch employees:', err);
    } finally {
      setLoadingEmployees(false);
    }
  }, [token, logout]);

  const fetchAdmins = useCallback(async () => {
    if (!token) return;
    setLoadingAdmins(true);
    try {
      const headers = { Authorization: `Bearer ${token}` };
      const admRes = await fetch(ENDPOINTS.admins.base, { headers });
      if (admRes.ok) {
        const res = await admRes.json();
        if (res.success) {
          setAdmins(res.data);
        }
      } else if (admRes.status === 401) {
        logout();
      }
    } catch (err) {
      console.error('Failed to fetch admins:', err);
    } finally {
      setLoadingAdmins(false);
    }
  }, [token, logout]);

  const fetchAttendanceOverview = useCallback(async () => {
    if (!token) return;
    setLoadingOverview(true);
    try {
      const headers = { Authorization: `Bearer ${token}` };
      const res = await fetch(ENDPOINTS.attendance.overview, { headers });
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          setAttendanceOverview(data.data);
        }
      } else if (res.status === 401) {
        logout();
      }
    } catch (err) {
      console.error('Failed to fetch attendance overview:', err);
    } finally {
      setLoadingOverview(false);
    }
  }, [token, logout]);

  const refreshData = useCallback(async () => {
    if (!token) return;
    await Promise.all([
      fetchPositions(),
      fetchEmployees(),
      fetchAdmins(),
      fetchAttendanceOverview()
    ]);
  }, [token, fetchPositions, fetchEmployees, fetchAdmins, fetchAttendanceOverview]);

  // Combined loading state
  const loading = loadingEmployees || loadingPositions || loadingAdmins || loadingOverview;

  const loginSuccess = useCallback((accessToken: string, adminData: Admin, expiry: string) => {
    localStorage.setItem('auth_token', accessToken);
    localStorage.setItem('auth_admin', JSON.stringify(adminData));
    localStorage.setItem('auth_token_expiry', expiry);
    setToken(accessToken);
    setCurrentAdmin(adminData);
    setInitialized(true);
  }, []);

  return (
    <DashboardContext.Provider
      value={{
        token,
        currentAdmin,
        employees,
        positions,
        admins,
        attendanceOverview,
        loading,
        loadingEmployees,
        loadingPositions,
        loadingAdmins,
        loadingOverview,
        initialized,
        fetchEmployees,
        fetchPositions,
        fetchAdmins,
        fetchAttendanceOverview,
        refreshData,
        logout,
        loginSuccess,
      }}
    >
      {children}
    </DashboardContext.Provider>
  );
}

