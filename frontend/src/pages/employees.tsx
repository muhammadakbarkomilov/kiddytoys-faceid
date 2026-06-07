import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useDashboard } from '../hooks/useDashboard';
import { useToast } from '../components/ToastContext';
import DeleteConfirmModal from '../components/DeleteConfirmModal';
import CustomSelect from '../components/CustomSelect';
import CustomDatePicker from '../components/CustomDatePicker';
import { Employee } from '../components/DashboardContext';
import { ENDPOINTS } from '../utils/api';

import { parseDateString, formatTimestampForInput, formatUnixDate } from '../utils/date';
import DashboardLayout from '../components/DashboardLayout';

const formatPhoneString = (rawPhone: string) => {
  if (!rawPhone) return '+998 ';
  let digits = rawPhone.replace(/\D/g, '');
  if (digits.startsWith('998')) {
    digits = digits.substring(3);
  }
  digits = digits.slice(0, 9);
  let formatted = '+998 ';
  if (digits.length > 0) {
    formatted += digits.substring(0, 2);
  }
  if (digits.length > 2) {
    formatted += ' ' + digits.substring(2, 5);
  }
  if (digits.length > 5) {
    formatted += ' ' + digits.substring(5, 7);
  }
  if (digits.length > 7) {
    formatted += ' ' + digits.substring(7, 9);
  }
  return formatted;
};

export default function EmployeesPage() {
  const { employees, positions, token, loadingEmployees, loadingPositions, fetchEmployees, fetchPositions } = useDashboard();
  const { showToast } = useToast();
  const router = useRouter();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [activeDropdownId, setActiveDropdownId] = useState<number | null>(null);

  // Deletion modal state
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [deleting, setDeleting] = useState(false);
  
  // Modals & form state
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formError, setFormError] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  // Form fields
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [birthday, setBirthday] = useState(''); // DD.MM.YYYY format
  const [male, setMale] = useState(true);
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [positionId, setPositionId] = useState('');

  // Local mount fetch
  useEffect(() => {
    if (token) {
      fetchEmployees();
    }
  }, [token, fetchEmployees]);

  // Load search query from URL on mount
  useEffect(() => {
    if (router.isReady && router.query.search !== undefined) {
      setSearchQuery(router.query.search as string);
    }
  }, [router.isReady, router.query.search]);

  // Handle search text change and update URL params
  const handleSearchChange = (val: string) => {
    setSearchQuery(val);
    const query = { ...router.query };
    if (val) {
      query.search = val;
    } else {
      delete query.search;
    }
    query.page = '1';
    router.replace({
      pathname: router.pathname,
      query,
    }, undefined, { shallow: true });
  };

  // Auto-select first position for new employee when positions load
  useEffect(() => {
    if (!editingId && showModal && !positionId && positions.length > 0) {
      setPositionId(String(positions[0].id));
    }
  }, [positions, showModal, editingId, positionId]);

  // Search filtering
  const filteredEmployees = employees.filter((emp) => {
    const fullName = `${emp.first_name} ${emp.last_name}`.toLowerCase();
    const phoneNum = emp.phone.toLowerCase();
    const posName = (emp.position?.name || '').toLowerCase();
    const query = searchQuery.toLowerCase();
    return fullName.includes(query) || phoneNum.includes(query) || posName.includes(query);
  });

  // Pagination calculation
  const ITEMS_PER_PAGE = 10;
  const totalPages = Math.ceil(filteredEmployees.length / ITEMS_PER_PAGE);
  const currentPage = router.query.page ? parseInt(router.query.page as string) || 1 : 1;
  const activePage = Math.max(1, Math.min(currentPage, totalPages || 1));
  
  const startIndex = (activePage - 1) * ITEMS_PER_PAGE;
  const paginatedEmployees = filteredEmployees.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  const handlePageChange = (newPage: number) => {
    router.push({
      pathname: router.pathname,
      query: { ...router.query, page: newPage },
    });
  };

  const openNewEmployeeModal = async () => {
    setFirstName('');
    setLastName('');
    setBirthday('');
    setMale(true);
    setPhone('+998 ');
    setAddress('');
    setPositionId(positions[0] ? String(positions[0].id) : '');
    setEditingId(null);
    setFormError('');
    setErrors({});
    setShowModal(true);
    
    try {
      await fetchPositions();
    } catch (err) {
      console.error(err);
    }
  };

  const openEditEmployeeModal = async (emp: Employee) => {
    setFirstName(emp.first_name);
    setLastName(emp.last_name);
    setBirthday(formatTimestampForInput(emp.birthday));
    setMale(emp.gender === 'male');
    setPhone(formatPhoneString(emp.phone));
    setAddress(emp.adress || '');
    setPositionId(String(emp.position?.id || ''));
    setEditingId(emp.id);
    setFormError('');
    setErrors({});
    setShowModal(true);
    
    try {
      await fetchPositions();
    } catch (err) {
      console.error(err);
    }
  };

  const handleEmployeeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    setErrors({});
    
    const newErrors: Record<string, string> = {};
    if (!firstName.trim()) newErrors.firstName = 'Ism maydoni boʻsh boʻlmasligi kerak';
    if (!lastName.trim()) newErrors.lastName = 'Familiya maydoni boʻsh boʻlmasligi kerak';
    if (!phone.trim() || phone.trim() === '+998') {
      newErrors.phone = 'Telefon raqami boʻsh boʻlmasligi kerak';
    } else if (phone.length < 17) {
      newErrors.phone = 'Telefon raqami toʻliq kiritilmagan';
    }
    if (!positionId) newErrors.positionId = 'Lavozim tanlanishi shart';

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setSubmitting(true);

    // Convert date string input (DD.MM.YYYY) to Unix millisecond timestamp
    let birthdayTimestamp: number | null = null;
    if (birthday) {
      const parsedDate = parseDateString(birthday);
      if (parsedDate === null) {
        setErrors({ birthday: 'Tugʻilgan kun formati notoʻgʻri. Format: DD.MM.YYYY (Masalan: 08.06.2026)' });
        setSubmitting(false);
        return;
      }
      birthdayTimestamp = parsedDate;
    }

    const payload = {
      first_name: firstName.trim(),
      last_name: lastName.trim(),
      birthday: birthdayTimestamp,
      gender: male ? 'male' : 'female',
      phone: phone.trim(),
      adress: address.trim() || null,
      position_id: parseInt(positionId),
    };

    const url = editingId ? ENDPOINTS.employees.detail(editingId) : ENDPOINTS.employees.base;
    const method = editingId ? 'PUT' : 'POST';

    try {
      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        setShowModal(false);
        showToast(editingId ? 'Xodim maʻlumotlari yangilandi' : 'Yangi xodim qoʻshildi', 'success');
        fetchEmployees();
      } else {
        const err = await res.json();
        setFormError(err.detail || 'Xatolik yuz berdi');
      }
    } catch (err) {
      setFormError('Serverga ulanish xatosi');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteEmployee = async () => {
    if (deleteId === null) return;
    setDeleting(true);
    try {
      const res = await fetch(ENDPOINTS.employees.detail(deleteId), {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      setDeleteId(null);
      if (res.ok) {
        showToast('Xodim tizimdan oʻchirildi', 'success');
        fetchEmployees();
      } else {
        const err = await res.json();
        showToast(err.detail || 'Xatolik yuz berdi', 'error');
      }
    } catch (err) {
      setDeleteId(null);
      showToast('Serverga ulanish xatosi', 'error');
    } finally {
      setDeleting(false);
    }
  };

  const clearError = (field: string) => {
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: '' }));
    }
  };

  return (
    <DashboardLayout>
      <div className="h-[calc(100vh-7.5rem)] flex flex-col space-y-5 animate-fadeIn font-sans select-none">
      
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-800/80 pb-4 shrink-0">
        <div>
          <h1 className="text-xl font-extrabold text-zinc-100 tracking-tight">Xodimlar Roʻyxati</h1>
          <p className="text-xs text-zinc-500 mt-1">Tizimdagi barcha xodimlar va ularning maʻlumotlari.</p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={openNewEmployeeModal}
            className="cf-btn-primary px-4 py-2 text-xs font-semibold flex items-center gap-2 cursor-pointer shadow-sm"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            <span>Xodim qoʻshish</span>
          </button>
        </div>
      </div>

      {/* Filter Row */}
      <div className="flex items-center gap-4 shrink-0">
        <div className="relative w-full max-w-md">
          <input
            type="text"
            placeholder="Ism, telefon yoki lavozim boʻyicha qidirish..."
            value={searchQuery}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="w-full cf-input px-3.5 py-2.5 pl-9 focus:outline-none placeholder-zinc-700 text-sm"
          />
          <svg className="w-4 h-4 text-zinc-650 absolute left-3 top-2.5" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
        {searchQuery && (
          <button onClick={() => handleSearchChange('')} className="text-xs text-zinc-500 hover:text-zinc-350 cursor-pointer font-medium">
            Tozalash
          </button>
        )}
      </div>

      {/* Main Table view */}
      {/* Main Table view */}
      {loadingEmployees ? (
        <div className="cf-card flex-1 flex flex-col overflow-hidden">
          <div className="flex-1 overflow-x-auto overflow-y-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="cf-table-header select-none">
                  <th className="py-2 px-3.5 text-zinc-300 font-semibold text-[11px] uppercase tracking-wider w-12 text-center">ID</th>
                  <th className="py-2 px-3.5 text-zinc-300 font-semibold text-[11px] uppercase tracking-wider">Xodim</th>
                  <th className="py-2 px-3.5 text-zinc-300 font-semibold text-[11px] uppercase tracking-wider">Lavozimi</th>
                  <th className="py-2 px-3.5 text-zinc-300 font-semibold text-[11px] uppercase tracking-wider">Telefon / Manzil</th>
                  <th className="py-2 px-3.5 text-zinc-300 font-semibold text-[11px] uppercase tracking-wider">Jinsi</th>
                  <th className="py-2 px-3.5 text-zinc-300 font-semibold text-[11px] uppercase tracking-wider">Tugʻilgan kuni</th>
                  <th className="py-2 px-3.5 text-zinc-300 font-semibold text-[11px] uppercase tracking-wider">Qoʻshilgan vaqt</th>
                  <th className="py-2 text-right pr-6 text-zinc-300 font-semibold text-[11px] uppercase tracking-wider w-16">Amallar</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/60">
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((i) => (
                  <tr key={i} className="cf-table-row hover:bg-zinc-800/10">
                    <td className="py-2 px-3.5 text-center">
                      <div className="h-4 w-6 bg-zinc-800/50 rounded animate-pulse mx-auto" />
                    </td>
                    <td className="py-2 px-3.5">
                      <div className="h-4 w-28 bg-zinc-800/60 rounded animate-pulse" />
                    </td>
                    <td className="py-2 px-3.5">
                      <div className="h-4 w-20 bg-zinc-800/40 rounded animate-pulse" />
                    </td>
                     <td className="py-2 px-3.5 space-y-1">
                      <div className="h-4 w-24 bg-zinc-800/50 rounded animate-pulse" />
                      <div className="h-3 w-36 bg-zinc-800/30 rounded animate-pulse" />
                    </td>
                    <td className="py-2 px-3.5">
                      <div className="h-4 w-12 bg-zinc-800/50 rounded-full animate-pulse" />
                    </td>
                    <td className="py-2 px-3.5">
                      <div className="h-3.5 w-16 bg-zinc-800/40 rounded animate-pulse" />
                    </td>
                    <td className="py-2 px-3.5">
                      <div className="h-3.5 w-16 bg-zinc-800/40 rounded animate-pulse" />
                    </td>
                    <td className="py-2 text-right pr-6">
                      <div className="inline-block h-5 w-5 bg-zinc-800/40 rounded-full animate-pulse" />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="bg-[#16161a]/60 border-t border-zinc-800/80 px-4 py-3 select-none shrink-0">
            <div className="h-4 w-48 bg-zinc-800/30 rounded animate-pulse" />
          </div>
        </div>
      ) : paginatedEmployees.length === 0 ? (
        <div className="cf-card flex-1 flex items-center justify-center text-xs text-zinc-500 font-mono border-dashed">
          {searchQuery ? 'QIDIRUV NATIJASI BOʻSH' : 'XODIMLAR ROʻYXATI BOʻSH'}
        </div>
      ) : (
        <div className="cf-card flex-1 flex flex-col overflow-hidden">
          <div className="flex-1 overflow-x-auto overflow-y-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="cf-table-header select-none">
                  <th className="py-2 px-3.5 text-zinc-300 font-semibold text-[11px] uppercase tracking-wider w-12 text-center">ID</th>
                  <th className="py-2 px-3.5 text-zinc-300 font-semibold text-[11px] uppercase tracking-wider">Xodim</th>
                  <th className="py-2 px-3.5 text-zinc-300 font-semibold text-[11px] uppercase tracking-wider">Lavozimi</th>
                  <th className="py-2 px-3.5 text-zinc-300 font-semibold text-[11px] uppercase tracking-wider">Telefon / Manzil</th>
                  <th className="py-2 px-3.5 text-zinc-300 font-semibold text-[11px] uppercase tracking-wider">Jinsi</th>
                  <th className="py-2 px-3.5 text-zinc-300 font-semibold text-[11px] uppercase tracking-wider">Tugʻilgan kuni</th>
                  <th className="py-2 px-3.5 text-zinc-300 font-semibold text-[11px] uppercase tracking-wider">Qoʻshilgan vaqt</th>
                  <th className="py-2 text-right pr-6 text-zinc-300 font-semibold text-[11px] uppercase tracking-wider w-16">Amallar</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/60">
                {paginatedEmployees.map((emp) => (
                  <tr key={emp.id} className="cf-table-row hover:bg-zinc-800/20 transition-colors">
                    <td className="py-2 px-3.5 font-mono text-[11px] text-zinc-500 text-center font-bold">
                      #{emp.id}
                    </td>
                    <td className="py-2 px-3.5 font-bold text-zinc-200 text-sm whitespace-nowrap">
                      {emp.first_name} {emp.last_name}
                    </td>
                    <td className="py-2 px-3.5 font-mono text-xs text-zinc-400">
                      {emp.position?.name || 'Kiritilmagan'}
                    </td>
                     <td className="py-2 px-3.5 text-zinc-400 text-sm">
                      <span className="font-mono text-xs block text-zinc-300">{formatPhoneString(emp.phone)}</span>
                      {emp.adress && (
                        <span className="text-[11px] text-zinc-500 block mt-0.5">{emp.adress}</span>
                      )}
                    </td>
                    <td className="py-2 px-3.5">
                      <span className={`text-xs font-semibold ${
                        emp.gender === 'male' ? 'text-blue-400' : 'text-pink-400'
                      }`}>
                        {emp.gender === 'male' ? 'Erkak' : 'Ayol'}
                      </span>
                    </td>
                    <td className="py-2 px-3.5 font-mono text-xs text-zinc-500">
                      {formatUnixDate(emp.birthday)}
                    </td>
                    <td className="py-2 px-3.5 font-mono text-xs text-zinc-500">
                      {formatUnixDate(emp.created_at)}
                    </td>
                    <td className="py-2 text-right pr-6 text-xs relative">
                      <div className="inline-block text-left">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setActiveDropdownId(activeDropdownId === emp.id ? null : emp.id);
                          }}
                          className="p-1 rounded-md hover:bg-zinc-800/50 text-zinc-400 hover:text-zinc-200 transition-colors cursor-pointer focus:outline-none"
                        >
                          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
                          </svg>
                        </button>
                        {activeDropdownId === emp.id && (
                          <>
                            <div className="fixed inset-0 z-10" onClick={() => setActiveDropdownId(null)} />
                            <div className="absolute right-0 mt-1.5 w-40 rounded-xl bg-zinc-900 border border-zinc-800 shadow-xl z-20 py-1.5 animate-fadeIn text-left">
                              <button
                                onClick={() => {
                                  setActiveDropdownId(null);
                                  openEditEmployeeModal(emp);
                                }}
                                className="w-full text-left px-3 py-2 text-xs font-semibold text-zinc-300 hover:bg-zinc-800/60 hover:text-zinc-150 flex items-center gap-2 cursor-pointer transition-colors"
                              >
                                <svg className="w-3.5 h-3.5 text-zinc-450" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
                                </svg>
                                Tahrirlash
                              </button>
                              <button
                                onClick={() => {
                                  setActiveDropdownId(null);
                                  setDeleteId(emp.id);
                                }}
                                className="w-full text-left px-3 py-2 text-xs font-semibold text-rose-500 hover:bg-zinc-800/60 hover:text-rose-455 flex items-center gap-2 cursor-pointer transition-colors border-t border-zinc-800/50"
                              >
                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                                Oʻchirish
                              </button>
                            </div>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination Footer */}
          {totalPages > 1 && (
            <div className="flex items-center justify-end border-t border-zinc-800/80 bg-[#16161a]/60 px-4 py-3 select-none shrink-0">
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => handlePageChange(activePage - 1)}
                  disabled={activePage === 1}
                  className="px-2.5 py-1.5 rounded-lg border border-zinc-800 bg-zinc-900/60 hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                >
                  Oldingi
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                  <button
                    key={p}
                    onClick={() => handlePageChange(p)}
                    className={`w-7.5 h-7.5 rounded-lg border flex items-center justify-center transition-all cursor-pointer font-bold ${
                      p === activePage
                        ? 'border-[var(--brand-blue)] text-[var(--brand-blue)] bg-[var(--brand-blue)]/5'
                        : 'border-zinc-800 bg-zinc-900/40 text-zinc-400 hover:bg-zinc-850 hover:text-zinc-200'
                    }`}
                  >
                    {p}
                  </button>
                ))}
                <button
                  onClick={() => handlePageChange(activePage + 1)}
                  disabled={activePage === totalPages}
                  className="px-2.5 py-1.5 rounded-lg border border-zinc-800 bg-zinc-900/60 hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                >
                  Keyingi
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* CRUD MODAL */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 font-sans select-none animate-fadeIn">
          <div className="w-full max-w-lg bg-zinc-900 border border-zinc-800 rounded-xl p-6 shadow-2xl relative">
            
            <h3 className="text-sm font-bold text-zinc-200 font-mono border-b border-zinc-800 pb-3 mb-5 uppercase tracking-wider">
              {editingId ? 'Xodim maʻlumotlarini tahrirlash' : 'Yangi xodim qoʻshish'}
            </h3>

            {formError && (
              <div className="bg-rose-500/10 border border-rose-500/25 text-rose-450 text-xs px-3 py-2.5 rounded-lg mb-4 text-center font-medium">
                {formError}
              </div>
            )}

            <form onSubmit={handleEmployeeSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-zinc-450 mb-1.5 font-mono uppercase tracking-wider">Ismi</label>
                  <input
                    type="text"
                    value={firstName}
                    onChange={(e) => {
                      setFirstName(e.target.value);
                      clearError('firstName');
                    }}
                    className={`w-full cf-input px-3.5 py-2.5 ${
                      errors.firstName ? 'border-rose-500/50 focus:border-rose-500 focus:shadow-[0_0_0_2px_rgba(244,63,94,0.15)]' : ''
                    }`}
                  />
                  {errors.firstName && (
                    <span className="text-[10px] text-rose-455 mt-1.5 block font-mono uppercase font-semibold tracking-wider animate-fadeIn">
                      {errors.firstName}
                    </span>
                  )}
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-zinc-450 mb-1.5 font-mono uppercase tracking-wider">Familiyasi</label>
                  <input
                    type="text"
                    value={lastName}
                    onChange={(e) => {
                      setLastName(e.target.value);
                      clearError('lastName');
                    }}
                    className={`w-full cf-input px-3.5 py-2.5 ${
                      errors.lastName ? 'border-rose-500/50 focus:border-rose-500 focus:shadow-[0_0_0_2px_rgba(244,63,94,0.15)]' : ''
                    }`}
                  />
                  {errors.lastName && (
                    <span className="text-[10px] text-rose-455 mt-1.5 block font-mono uppercase font-semibold tracking-wider animate-fadeIn">
                      {errors.lastName}
                    </span>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-zinc-450 mb-1.5 font-mono uppercase tracking-wider">Tugʻilgan kuni</label>
                  <CustomDatePicker
                    value={birthday}
                    onChange={(val) => {
                      setBirthday(val);
                      clearError('birthday');
                    }}
                    error={errors.birthday}
                  />
                  {errors.birthday && (
                    <span className="text-[10px] text-rose-455 mt-1.5 block font-mono uppercase font-semibold tracking-wider animate-fadeIn">
                      {errors.birthday}
                    </span>
                  )}
                </div>
                 <div>
                  <label className="block text-[10px] font-bold text-zinc-450 mb-1.5 font-mono uppercase tracking-wider">Jinsi</label>
                  <CustomSelect
                    value={male ? 'true' : 'false'}
                    onChange={(val) => setMale(val === 'true')}
                    options={[
                      { value: 'true', label: 'Erkak' },
                      { value: 'false', label: 'Ayol' }
                    ]}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-zinc-450 mb-1.5 font-mono uppercase tracking-wider">Telefon raqami</label>
                  <input
                    type="text"
                    placeholder="+998"
                    value={phone}
                    onChange={(e) => {
                      let raw = e.target.value;
                      if (!raw.startsWith('+998')) {
                        setPhone('+998 ');
                        return;
                      }
                      let inputPart = raw.substring(5);
                      let digits = inputPart.replace(/\D/g, '');
                      digits = digits.slice(0, 9);
                      
                      let formatted = '+998 ';
                      if (digits.length > 0) {
                        formatted += digits.substring(0, 2);
                      }
                      if (digits.length > 2) {
                        formatted += ' ' + digits.substring(2, 5);
                      }
                      if (digits.length > 5) {
                        formatted += ' ' + digits.substring(5, 7);
                      }
                      if (digits.length > 7) {
                        formatted += ' ' + digits.substring(7, 9);
                      }
                      
                      setPhone(formatted);
                      clearError('phone');
                    }}
                    maxLength={17}
                    className={`w-full cf-input px-3.5 py-2.5 ${
                      errors.phone ? 'border-rose-500/50 focus:border-rose-500 focus:shadow-[0_0_0_2px_rgba(244,63,94,0.15)]' : ''
                    }`}
                  />
                  {errors.phone && (
                    <span className="text-[10px] text-rose-455 mt-1.5 block font-mono uppercase font-semibold tracking-wider animate-fadeIn">
                      {errors.phone}
                    </span>
                  )}
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-zinc-450 mb-1.5 font-mono uppercase tracking-wider">Lavozimi</label>
                  <CustomSelect
                    value={positionId}
                    onChange={(val) => {
                      setPositionId(val);
                      clearError('positionId');
                    }}
                    options={positions.map((p) => ({
                      value: String(p.id),
                      label: p.name
                    }))}
                    placeholder={loadingPositions ? 'Yuklanmoqda...' : 'Lavozim tanlang...'}
                    error={errors.positionId}
                  />
                  {errors.positionId && (
                    <span className="text-[10px] text-rose-455 mt-1.5 block font-mono uppercase font-semibold tracking-wider animate-fadeIn">
                      {errors.positionId}
                    </span>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-zinc-450 mb-1.5 font-mono uppercase tracking-wider">Yashash manzili</label>
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Masalan: Toshkent shahri, Yunusobod tumani"
                  className="w-full cf-input px-3.5 py-2.5"
                />
              </div>

              <div className="flex justify-end gap-3 border-t border-zinc-800/80 pt-4 mt-6">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="cf-btn-secondary px-4 py-2 text-xs font-bold cursor-pointer"
                >
                  Bekor qilish
                </button>
                <button
                  type="submit"
                  disabled={submitting || loadingPositions || positions.length === 0}
                  className="cf-btn-primary px-4 py-2 text-xs font-bold cursor-pointer disabled:opacity-50"
                >
                  {submitting ? 'SAQLANMOQDA...' : 'Saqlash'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION MODAL */}
      <DeleteConfirmModal
        isOpen={deleteId !== null}
        title="Xodimni oʻchirish"
        message="Ushbu xodimni oʻchirmoqchimisiz? Ushbu amal ortga qaytarilmaydi."
        onConfirm={handleDeleteEmployee}
        onClose={() => setDeleteId(null)}
        isSubmitting={deleting}
      />
    </div>
    </DashboardLayout>
  );
}
