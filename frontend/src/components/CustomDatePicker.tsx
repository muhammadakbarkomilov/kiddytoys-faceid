import React, { useState, useRef, useEffect } from 'react';

interface CustomDatePickerProps {
  value: string; // Format: DD.MM.YYYY
  onChange: (value: string) => void;
  placeholder?: string;
  error?: string;
}

const MONTHS_UZ = [
  'Yanvar', 'Fevral', 'Mart', 'Aprel', 'May', 'Iyun',
  'Iyul', 'Avgust', 'Sentyabr', 'Oktyabr', 'Noyabr', 'Dekabr'
];

const WEEKDAYS_UZ = ['Du', 'Se', 'Cho', 'Pa', 'Ju', 'Sha', 'Ya'];

export default function CustomDatePicker({
  value,
  onChange,
  placeholder = 'DD.MM.YYYY',
  error,
}: CustomDatePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [viewMode, setViewMode] = useState<'days' | 'months' | 'years'>('days');
  const containerRef = useRef<HTMLDivElement>(null);
  const yearsContainerRef = useRef<HTMLDivElement>(null);

  // Parse initial date or default to current date
  let initialMonth = new Date().getMonth();
  let initialYear = new Date().getFullYear();

  if (value) {
    const parts = value.split('.');
    if (parts.length === 3) {
      const m = parseInt(parts[1]) - 1;
      const y = parseInt(parts[2]);
      if (!isNaN(m) && !isNaN(y)) {
        initialMonth = m;
        initialYear = y;
      }
    }
  }

  const [currentMonth, setCurrentMonth] = useState(initialMonth);
  const [currentYear, setCurrentYear] = useState(initialYear);

  // Close calendar popover on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setViewMode('days'); // Reset view mode on close
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Update calendar view when value changes
  useEffect(() => {
    if (value) {
      const parts = value.split('.');
      if (parts.length === 3) {
        const m = parseInt(parts[1]) - 1;
        const y = parseInt(parts[2]);
        if (!isNaN(m) && m >= 0 && m <= 11) {
          setCurrentMonth(m);
        }
        if (!isNaN(y) && y >= 1940 && y <= new Date().getFullYear()) {
          setCurrentYear(y);
        }
      }
    }
  }, [value]);

  // Scroll current year into view when year selector is opened
  useEffect(() => {
    if (viewMode === 'years' && yearsContainerRef.current) {
      const activeBtn = yearsContainerRef.current.querySelector('[data-active="true"]');
      if (activeBtn) {
        activeBtn.scrollIntoView({ block: 'center', behavior: 'auto' });
      }
    }
  }, [viewMode]);

  // Generate years list (e.g. from current year back to 1940 for birthdays)
  const currentYearLimit = new Date().getFullYear();
  const years: number[] = [];
  for (let y = currentYearLimit; y >= 1940; y--) {
    years.push(y);
  }

  // Days in month calculation
  const getDaysInMonth = (month: number, year: number) => {
    return new Date(year, month + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (month: number, year: number) => {
    // 0 = Sunday, 1 = Monday. Adjust so 0 = Monday, 6 = Sunday.
    const day = new Date(year, month, 1).getDay();
    return day === 0 ? 6 : day - 1;
  };

  const daysInMonth = getDaysInMonth(currentMonth, currentYear);
  const firstDay = getFirstDayOfMonth(currentMonth, currentYear);

  const daysArray: (number | null)[] = [];
  // Fill empty spaces for alignment
  for (let i = 0; i < firstDay; i++) {
    daysArray.push(null);
  }
  // Fill actual month days
  for (let day = 1; day <= daysInMonth; day++) {
    daysArray.push(day);
  }

  const handleSelectDay = (day: number) => {
    const formattedDay = day < 10 ? `0${day}` : `${day}`;
    const formattedMonth = currentMonth + 1 < 10 ? `0${currentMonth + 1}` : `${currentMonth + 1}`;
    onChange(`${formattedDay}.${formattedMonth}.${currentYear}`);
    setIsOpen(false);
  };

  const handlePrevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear((y) => y - 1);
    } else {
      setCurrentMonth((m) => m - 1);
    }
  };

  const handleNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear((y) => y + 1);
    } else {
      setCurrentMonth((m) => m + 1);
    }
  };

  const [prevVal, setPrevVal] = useState(value || '');

  // Sync prevVal with external value changes
  useEffect(() => {
    setPrevVal(value || '');
  }, [value]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let raw = e.target.value;
    
    // Check if the user is deleting
    const isDeleting = raw.length < prevVal.length;
    
    // Clean input
    raw = raw.replace(/[^0-9.]/g, '');
    const digits = raw.replace(/\./g, '');
    
    let formatted = '';
    
    if (isDeleting) {
      // If deleting, preserve the structure without forcing new dots
      if (digits.length > 0) {
        formatted += digits.substring(0, 2);
      }
      if (digits.length > 2) {
        formatted += '.' + digits.substring(2, 4);
      }
      if (digits.length > 4) {
        formatted += '.' + digits.substring(4, 8);
      }
      // Keep trailing dot if typed
      if (raw.endsWith('.') && !formatted.endsWith('.') && formatted.split('.').length < 3) {
        formatted += '.';
      }
    } else {
      // If adding characters
      if (digits.length > 0) {
        formatted += digits.substring(0, 2);
      }
      // If exactly 2 digits, auto-append dot
      if (digits.length === 2) {
        formatted += '.';
      } else if (digits.length > 2) {
        formatted += '.' + digits.substring(2, 4);
        // If exactly 4 digits, auto-append dot
        if (digits.length === 4) {
          formatted += '.';
        } else if (digits.length > 4) {
          formatted += '.' + digits.substring(4, 8);
        }
      }
    }
    
    setPrevVal(formatted);
    onChange(formatted);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      setIsOpen(false);
      setViewMode('days');
      (e.target as HTMLInputElement).blur();
    }
  };

  // Check if a day is the currently selected date
  const isSelected = (day: number) => {
    if (!value) return false;
    const parts = value.split('.');
    if (parts.length === 3) {
      const d = parseInt(parts[0]);
      const m = parseInt(parts[1]) - 1;
      const y = parseInt(parts[2]);
      return d === day && m === currentMonth && y === currentYear;
    }
    return false;
  };

  return (
    <div className="relative w-full font-sans select-none" ref={containerRef}>
      {/* Input trigger */}
      <div className="relative">
        <input
          type="text"
          onClick={() => setIsOpen(true)}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          value={value}
          maxLength={10}
          className={`w-full cf-input px-3.5 py-2.5 text-left focus:outline-none ${
            error
              ? 'border-rose-500/50 focus:border-rose-500 focus:shadow-[0_0_0_2px_rgba(244,63,94,0.15)]'
              : isOpen
              ? 'border-[var(--brand-blue)] focus:shadow-[0_0_0_2px_rgba(59,130,246,0.15)]'
              : 'border-zinc-700/80 hover:border-zinc-600'
          }`}
        />
      </div>

      {isOpen && (
        <div className="absolute left-0 mt-1.5 w-64 bg-zinc-900/95 backdrop-blur-md border border-zinc-800 rounded-xl shadow-2xl z-50 p-4 animate-fadeIn">
          
          {/* VIEW MODE: DAYS */}
          {viewMode === 'days' && (
            <>
              {/* Header */}
              <div className="flex items-center justify-between gap-1 mb-3.5">
                <button
                  type="button"
                  onClick={handlePrevMonth}
                  className="p-1.5 rounded-md hover:bg-zinc-850 text-zinc-400 hover:text-zinc-200 transition-colors cursor-pointer focus:outline-none"
                >
                  <svg className="w-4.5 h-4.5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                <div className="flex items-center gap-1.5 font-bold text-xs select-none">
                  <button
                    type="button"
                    onClick={() => setViewMode('months')}
                    className="hover:text-[var(--brand-blue)] text-zinc-250 transition-colors cursor-pointer px-2 py-0.5 rounded hover:bg-zinc-850 focus:outline-none font-semibold uppercase tracking-wider font-mono"
                  >
                    {MONTHS_UZ[currentMonth]}
                  </button>
                  <button
                    type="button"
                    onClick={() => setViewMode('years')}
                    className="hover:text-[var(--brand-blue)] text-zinc-250 transition-colors cursor-pointer px-2 py-0.5 rounded hover:bg-zinc-850 focus:outline-none font-bold font-mono"
                  >
                    {currentYear}
                  </button>
                </div>
                <button
                  type="button"
                  onClick={handleNextMonth}
                  className="p-1.5 rounded-md hover:bg-zinc-850 text-zinc-400 hover:text-zinc-200 transition-colors cursor-pointer focus:outline-none"
                >
                  <svg className="w-4.5 h-4.5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>

              {/* Weekday headers */}
              <div className="grid grid-cols-7 gap-1.5 text-center mb-2 text-[9px] font-bold font-mono text-zinc-555 uppercase tracking-wider">
                {WEEKDAYS_UZ.map((d, idx) => (
                  <div key={idx}>{d}</div>
                ))}
              </div>

              {/* Day grid */}
              <div className="grid grid-cols-7 gap-1.5 text-center font-mono">
                {daysArray.map((day, idx) => {
                  if (day === null) {
                    return <div key={idx} className="h-6" />;
                  }
                  const selected = isSelected(day);
                  return (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleSelectDay(day)}
                      className={`h-6.5 w-full rounded-md text-[10px] font-bold flex items-center justify-center cursor-pointer transition-all ${
                        selected
                          ? 'bg-[var(--brand-blue)] text-[var(--text-on-brand, #09090b)] font-extrabold shadow-[0_0_10px_rgba(59,130,246,0.25)] scale-[1.04]'
                          : 'text-zinc-300 hover:bg-zinc-800 hover:text-zinc-100 hover:scale-[1.02]'
                      }`}
                    >
                      {day}
                    </button>
                  );
                })}
              </div>
            </>
          )}

          {/* VIEW MODE: MONTHS */}
          {viewMode === 'months' && (
            <div className="space-y-3">
              <div className="flex items-center gap-2 border-b border-zinc-800 pb-2 mb-2">
                <button
                  type="button"
                  onClick={() => setViewMode('days')}
                  className="p-1 rounded-md hover:bg-zinc-800 text-zinc-400 hover:text-zinc-250 transition-colors cursor-pointer focus:outline-none"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                <span className="text-[10px] font-bold text-zinc-450 font-mono uppercase tracking-wider">Oyni tanlang</span>
              </div>
              <div className="grid grid-cols-3 gap-2">
                {MONTHS_UZ.map((m, idx) => {
                  const isCurrent = idx === currentMonth;
                  return (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => {
                        setCurrentMonth(idx);
                        setViewMode('days');
                      }}
                      className={`py-2 text-[10px] font-bold rounded-lg border transition-all cursor-pointer ${
                        isCurrent
                          ? 'bg-[var(--brand-blue)] border-[var(--brand-blue)] text-[var(--text-on-brand)] font-extrabold shadow-[0_0_12px_rgba(59,130,246,0.25)] scale-[1.02]'
                          : 'bg-zinc-950/45 border-zinc-800/80 text-zinc-300 hover:bg-zinc-800/80 hover:border-zinc-700/80 hover:text-zinc-100 hover:scale-[1.01]'
                      }`}
                    >
                      {m}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* VIEW MODE: YEARS */}
          {viewMode === 'years' && (
            <div className="space-y-3">
              <div className="flex items-center gap-2 border-b border-zinc-800 pb-2 mb-2">
                <button
                  type="button"
                  onClick={() => setViewMode('days')}
                  className="p-1 rounded-md hover:bg-zinc-800 text-zinc-400 hover:text-zinc-250 transition-colors cursor-pointer focus:outline-none"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                <span className="text-[10px] font-bold text-zinc-450 font-mono uppercase tracking-wider">Yilni tanlang</span>
              </div>
              <div ref={yearsContainerRef} className="h-44 overflow-y-auto grid grid-cols-4 gap-1.5 pr-1 font-mono scroll-smooth">
                {years.map((y) => {
                  const isCurrent = y === currentYear;
                  return (
                    <button
                      key={y}
                      type="button"
                      data-active={isCurrent}
                      onClick={() => {
                        setCurrentYear(y);
                        setViewMode('days');
                      }}
                      className={`h-7.5 rounded-lg border text-[10px] font-bold flex items-center justify-center cursor-pointer transition-all ${
                        isCurrent
                          ? 'bg-[var(--brand-blue)] border-[var(--brand-blue)] text-[var(--text-on-brand)] font-extrabold shadow-[0_0_12px_rgba(59,130,246,0.25)] scale-[1.02]'
                          : 'bg-zinc-950/45 border-zinc-800/80 text-zinc-350 hover:bg-zinc-800/80 hover:border-zinc-700/80 hover:text-zinc-150 hover:scale-[1.01]'
                      }`}
                    >
                      {y}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

        </div>
      )}
    </div>
  );
}
