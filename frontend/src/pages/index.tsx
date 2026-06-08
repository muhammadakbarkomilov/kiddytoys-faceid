import React from 'react';
import { useDashboard } from '../hooks/useDashboard';
import { formatUnixDateTime } from '../utils/date';
import DashboardLayout from '../components/DashboardLayout';

export default function DashboardOverviewPage() {
  const { attendanceOverview, loadingOverview, token, fetchAttendanceOverview } = useDashboard();

  React.useEffect(() => {
    if (token) {
      fetchAttendanceOverview();
    }
  }, [token, fetchAttendanceOverview]);

  // Combined Loading or Uninitialized State Skeleton Loader
  if (loadingOverview || !attendanceOverview) {
    return (
      <DashboardLayout>
        <div className="space-y-6 select-none font-sans">
          {/* Title Header */}
          <div className="border-b border-zinc-800/80 pb-4">
            <div className="h-7 w-48 bg-zinc-800 rounded animate-pulse" />
            <div className="h-3 w-64 bg-zinc-800/50 rounded animate-pulse mt-2" />
          </div>

          {/* Info Boxes Skeleton (2 cards) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[1, 2].map((i) => (
              <div key={i} className="cf-card p-5 space-y-4 animate-pulse">
                <div className="h-3 w-28 bg-zinc-800/60 rounded" />
                <div className="h-8 w-12 bg-zinc-800 rounded mt-1.5" />
                <div className="w-full bg-zinc-900/80 h-1.5 rounded-full overflow-hidden mt-4">
                  <div className="bg-zinc-800/40 h-full w-1/3 rounded-full" />
                </div>
              </div>
            ))}
          </div>

          {/* Logs Table Skeleton */}
          <div className="cf-card p-5 space-y-4 animate-pulse">
            <div className="h-4 w-36 bg-zinc-800/60 rounded" />
            <div className="space-y-3 mt-4">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="flex justify-between items-center py-3.5 border-b border-zinc-800/40">
                  <div className="h-4 w-40 bg-zinc-800/50 rounded" />
                  <div className="h-4 w-16 bg-zinc-800/40 rounded" />
                  <div className="h-4 w-28 bg-zinc-800/40 rounded" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  const { total_employees, checked_in_today, latest_logs } = attendanceOverview;
  
  // Calculate attendance presence rate
  const presenceRate = total_employees > 0 ? (checked_in_today / total_employees) * 100 : 0;

  return (
    <DashboardLayout>
      <div className="space-y-6 animate-fadeIn font-sans select-none">
        
        {/* Title Header */}
        <div className="border-b border-zinc-800/80 pb-4">
          <h1 className="text-xl font-extrabold text-zinc-100 tracking-tight">Umumiy Tizim Statistikasi</h1>
          <p className="text-xs text-zinc-500 mt-1">Xodimlar roʻyxati va bugungi davomat koʻrsatkichlari.</p>
        </div>

        {/* Info Boxes (2 Columns) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* Card 1: Jami Xodimlar */}
          <div className="cf-card p-6">
            <span className="text-[10px] font-mono font-bold text-zinc-500 uppercase tracking-widest block">JAMI XODIMLAR</span>
            <h3 className="text-3xl font-extrabold font-sans mt-1.5 text-zinc-100">
              {total_employees}
            </h3>
            <div className="w-full bg-white/[0.04] h-1.5 rounded-full overflow-hidden mt-4">
              <div className="h-full transition-all duration-500" style={{ width: `${Math.min((total_employees / 50) * 100, 100)}%`, backgroundColor: 'var(--brand-blue)' }} />
            </div>
          </div>

          {/* Card 2: Bugun Kelganlar */}
          <div className="cf-card p-6">
            <span className="text-[10px] font-mono font-bold text-zinc-500 uppercase tracking-widest block">BUGUN KELGANLAR</span>
            <div className="flex items-baseline gap-2">
              <h3 className="text-3xl font-extrabold font-sans mt-1.5 text-zinc-100">
                {checked_in_today}
              </h3>
              <span className="text-xs font-mono font-semibold text-emerald-450">
                ({presenceRate.toFixed(0)}%)
              </span>
            </div>
            <div className="w-full bg-white/[0.04] h-1.5 rounded-full overflow-hidden mt-4">
              <div className="h-full transition-all duration-500" style={{ width: `${presenceRate}%`, backgroundColor: 'var(--brand-blue)' }} />
            </div>
          </div>
        </div>

        {/* Latest Attendance Logs (Last 5 Entries) */}
        <div className="cf-card p-5">
          <h2 className="text-xs font-bold text-zinc-350 font-mono uppercase tracking-wider mb-4 border-b border-zinc-800/60 pb-3">
            Oxirgi harakatlar
          </h2>

          {latest_logs.length === 0 ? (
            <div className="text-center py-8 text-zinc-500 font-mono text-[11px] uppercase tracking-wider">
              Bugun uchun davomat loglari mavjud emas
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="cf-table-header text-[10px] font-mono font-bold uppercase tracking-wider text-zinc-500 select-none">
                    <th className="py-2 px-3">Xodim</th>
                    <th className="py-2 px-3 text-center w-36">Holat</th>
                    <th className="py-2 px-3 text-right w-48">Vaqt</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800/60">
                  {latest_logs.map((log) => (
                    <tr key={log.id} className="cf-table-row hover:bg-zinc-800/20 transition-colors">
                      <td className="py-3 px-3 font-bold text-zinc-200 text-sm whitespace-nowrap">
                        {log.employee_name}
                      </td>
                      <td className="py-3 px-3 text-center">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider ${
                          log.status === 'checkIn'
                            ? 'bg-emerald-500/10 text-emerald-450 border border-emerald-500/20'
                            : 'bg-rose-500/10 text-rose-450 border border-rose-500/20'
                        }`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${
                            log.status === 'checkIn' ? 'bg-emerald-400' : 'bg-rose-400'
                          }`} />
                          {log.status === 'checkIn' ? 'Kirish' : 'Chiqish'}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-right font-mono text-xs text-zinc-500">
                        {formatUnixDateTime(log.timestamp)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

      </div>
    </DashboardLayout>
  );
}
