import type { AppProps } from 'next/app';
import { DashboardProvider } from '../components/DashboardContext';
import { ToastProvider } from '../components/ToastContext';
import SystemGuard from '../components/SystemGuard';
import '../styles/globals.css';

export default function App({ Component, pageProps }: AppProps) {
  return (
    <DashboardProvider>
      <ToastProvider>
        <SystemGuard />
        <Component {...pageProps} />
      </ToastProvider>
    </DashboardProvider>
  );
}
