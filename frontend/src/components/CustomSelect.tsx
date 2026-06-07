import React, { useState, useRef, useEffect } from 'react';

interface Option {
  value: string;
  label: string;
}

interface CustomSelectProps {
  value: string;
  onChange: (value: string) => void;
  options: Option[];
  placeholder?: string;
  error?: string;
}

export default function CustomSelect({
  value,
  onChange,
  options,
  placeholder = 'Tanlang...',
  error,
}: CustomSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const selectedOption = options.find((opt) => opt.value === value);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative w-full font-sans select-none" ref={containerRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full flex items-center justify-between px-3.5 py-2.5 bg-zinc-950/60 border rounded-lg text-sm text-zinc-150 transition-all text-left cursor-pointer focus:outline-none ${
          error
            ? 'border-rose-500/50 focus:border-rose-500 focus:shadow-[0_0_0_2px_rgba(244,63,94,0.15)]'
            : isOpen
            ? 'border-[var(--brand-blue)] focus:shadow-[0_0_0_2px_rgba(59,130,246,0.15)]'
            : 'border-zinc-700/80 hover:border-zinc-600 focus:border-[var(--brand-blue)]'
        }`}
      >
        <span className={selectedOption ? 'text-zinc-200' : 'text-zinc-600 font-medium'}>
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <svg
          className={`w-4 h-4 text-zinc-500 transition-transform duration-200 shrink-0 ${
            isOpen ? 'transform rotate-180 text-zinc-400' : ''
          }`}
          fill="none"
          stroke="currentColor"
          strokeWidth="2.2"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute left-0 mt-1.5 w-full bg-zinc-900/95 backdrop-blur-md border border-zinc-800 rounded-xl shadow-xl z-50 py-1.5 max-h-56 overflow-y-auto animate-fadeIn">
          {options.length === 0 ? (
            <div className="px-3.5 py-2 text-xs text-zinc-650 italic text-center">Variantlar mavjud emas</div>
          ) : (
            options.map((opt) => {
              const isSelected = opt.value === value;
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => {
                    onChange(opt.value);
                    setIsOpen(false);
                  }}
                  className={`w-full text-left px-3.5 py-2.5 text-xs font-semibold flex items-center justify-between cursor-pointer transition-all border-l-2 ${
                    isSelected
                      ? 'bg-[var(--brand-blue)]/10 text-[var(--brand-blue)] border-[var(--brand-blue)] pl-[14px]'
                      : 'text-zinc-300 hover:bg-zinc-800/60 hover:text-zinc-100 border-transparent hover:border-zinc-750 hover:pl-[18px]'
                  }`}
                >
                  <span>{opt.label}</span>
                  {isSelected && (
                    <svg className="w-4 h-4 text-[var(--brand-blue)] shrink-0" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </button>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}
