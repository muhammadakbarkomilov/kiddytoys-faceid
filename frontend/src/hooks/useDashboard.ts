import { useContext } from 'react';
import { DashboardContext } from '../components/DashboardContext';

export function useDashboard() {
  const context = useContext(DashboardContext);
  if (!context) {
    throw new Error('useDashboard must be used within a DashboardProvider');
  }
  return context;
}
