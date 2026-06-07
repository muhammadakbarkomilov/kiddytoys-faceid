import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useDashboard } from '../hooks/useDashboard';
import { useToast } from '../components/ToastContext';
import DeleteConfirmModal from '../components/DeleteConfirmModal';
import { Admin } from '../components/DashboardContext';
import { ENDPOINTS } from '../utils/api';
import { formatUnixDate } from '../utils/date';
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

export default function AdminsPage() {
  const { admins, currentAdmin, token, loadingAdmins, fetchAdmins } = useDashboard();
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
  const [username, setUsername] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');

  // Local mount fetch
  useEffect(() => {
    if (token) {
      fetchAdmins();
    }
  }, [token, fetchAdmins]);

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

  // Search filtering
  const filteredAdmins = admins.filter((adm) => {
    const fullName = `${adm.first_name} ${adm.last_name}`.toLowerCase();
    const admUsername = adm.username.toLowerCase();
    const admPhone = (adm.phone || '').toLowerCase();
    const query = searchQuery.toLowerCase();
    return fullName.includes(query) || admUsername.includes(query) || admPhone.includes(query);
  });

  // Pagination calculation
  const ITEMS_PER_PAGE = 10;
  const totalPages = Math.ceil(filteredAdmins.length / ITEMS_PER_PAGE);
  const currentPage = router.query.page ? parseInt(router.query.page as string) || 1 : 1;
  const activePage = Math.max(1, Math.min(currentPage, totalPages || 1));
  
  const startIndex = (activePage - 1) * ITEMS_PER_PAGE;
  const paginatedAdmins = filteredAdmins.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  const handlePageChange = (newPage: number) => {
    router.push({
      pathname: router.pathname,
      query: { ...router.query, page: newPage },
    });
  };

  const openNewAdminModal = () => {
    setFirstName('');
    setLastName('');
    setUsername('');
    setPhone('+998 ');
    setPassword('');
    setEditingId(null);
    setFormError('');
    setErrors({});
    setShowModal(true);
  };

  const openEditAdminModal = (adm: Admin) => {
    setFirstName(adm.first_name);
    setLastName(adm.last_name);
    setUsername(adm.username);
    setPhone(formatPhoneString(adm.phone || ''));
    setPassword('');
    setEditingId(adm.id);
    setFormError('');
    setErrors({});
    setShowModal(true);
  };

  const handleAdminSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    setErrors({});

    const newErrors: Record<string, string> = {};
    if (!firstName.trim()) newErrors.firstName = 'Ism maydoni boʻsh boʻlmasligi kerak';
    if (!lastName.trim()) newErrors.lastName = 'Familiya maydoni boʻsh boʻlmasligi kerak';
    if (!username.trim()) newErrors.username = 'Login maydoni boʻsh boʻlmasligi kerak';
    if (phone.trim() && phone.trim() !== '+998' && phone.trim().length < 17) {
      newErrors.phone = 'Telefon raqami toʻliq kiritilmagan';
    }
    if (!editingId && !password) newErrors.password = 'Parol kiritilishi shart';

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setSubmitting(true);
    const url = editingId ? ENDPOINTS.admins.detail(editingId) : ENDPOINTS.admins.base;
    const method = editingId ? 'PUT' : 'POST';

    const finalPhone = (phone.trim() && phone.trim() !== '+998') ? phone.trim() : null;
    const payload: any = {
      first_name: firstName.trim(),
      last_name: lastName.trim(),
      username: username.trim(),
      phone: finalPhone,
    };

    if (password) {
      payload.password = password;
    }

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
        showToast(editingId ? 'Administrator maʻlumotlari oʻzgartirildi' : 'Yangi admin roʻyxatdan oʻtkazildi', 'success');
        fetchAdmins();
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

  const handleDeleteAdmin = async () => {
    if (deleteId === null) return;
    if (deleteId === currentAdmin?.id) {
      showToast('Oʻz profilingizni oʻchira olmaysiz', 'error');
      setDeleteId(null);
      return;
    }
    setDeleting(true);

    try {
      const res = await fetch(ENDPOINTS.admins.detail(deleteId), {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      setDeleteId(null);
      if (res.ok) {
        showToast('Administrator oʻchirildi', 'success');
        fetchAdmins();
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
            <h1 className="text-xl font-extrabold text-zinc-100 tracking-tight">Adminlar Roʻyxati</h1>
            <p className="text-xs text-zinc-500 mt-1">Tizimni va xodimlarni boshqarish huquqiga ega foydalanuvchilar.</p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={openNewAdminModal}
              className="cf-btn-primary px-4 py-2 text-xs font-semibold flex items-center gap-2 cursor-pointer shadow-sm"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
              </svg>
              <span>Admin qoʻshish</span>
            </button>
          </div>
        </div>

        {/* Filter Row */}
        <div className="flex items-center gap-4 shrink-0">
          <div className="relative w-full max-w-md">
            <input
              type="text"
              placeholder="Admin nomi, pochtasi yoki telefoni boʻyicha qidirish..."
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
        {loadingAdmins ? (
          <div className="cf-card flex-1 flex flex-col overflow-hidden">
            <div className="flex-1 overflow-x-auto overflow-y-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="cf-table-header select-none">
                    <th className="py-2 px-3.5 text-zinc-300 font-semibold text-[11px] uppercase tracking-wider w-12 text-center">ID</th>
                    <th className="py-2 px-3.5 text-zinc-300 font-semibold text-[11px] uppercase tracking-wider">Administrator</th>
                    <th className="py-2 px-3.5 text-zinc-300 font-semibold text-[11px] uppercase tracking-wider">Elektron Pochta</th>
                    <th className="py-2 px-3.5 text-zinc-300 font-semibold text-[11px] uppercase tracking-wider">Telefon Raqami</th>
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
                        <div className="h-4 w-36 bg-zinc-800/40 rounded animate-pulse" />
                      </td>
                      <td className="py-2 px-3.5">
                        <div className="h-4 w-24 bg-zinc-800/50 rounded animate-pulse" />
                      </td>
                      <td className="py-2 px-3.5">
                        <div className="h-4 w-20 bg-zinc-800/40 rounded animate-pulse" />
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
        ) : paginatedAdmins.length === 0 ? (
          <div className="cf-card flex-1 flex items-center justify-center text-xs text-zinc-500 font-mono border-dashed">
            {searchQuery ? 'MATN BOʻYICHA ADMINISTRATOR TOPILMADI' : 'ADMINLAR ROʻYXATI BOʻSH'}
          </div>
        ) : (
          <div className="cf-card flex-1 flex flex-col overflow-hidden">
            <div className="flex-1 overflow-x-auto overflow-y-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="cf-table-header select-none">
                    <th className="py-2 px-3.5 text-zinc-300 font-semibold text-[11px] uppercase tracking-wider w-12 text-center">ID</th>
                    <th className="py-2 px-3.5 text-zinc-300 font-semibold text-[11px] uppercase tracking-wider">Administrator</th>
                    <th className="py-2 px-3.5 text-zinc-300 font-semibold text-[11px] uppercase tracking-wider">Elektron Pochta</th>
                    <th className="py-2 px-3.5 text-zinc-300 font-semibold text-[11px] uppercase tracking-wider">Telefon Raqami</th>
                    <th className="py-2 px-3.5 text-zinc-300 font-semibold text-[11px] uppercase tracking-wider">Qoʻshilgan vaqt</th>
                    <th className="py-2 text-right pr-6 text-zinc-300 font-semibold text-[11px] uppercase tracking-wider w-16">Amallar</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800/60">
                  {paginatedAdmins.map((adm) => (
                    <tr key={adm.id} className="cf-table-row hover:bg-zinc-800/20 transition-colors">
                      <td className="py-2 px-3.5 font-mono text-[11px] text-zinc-500 text-center font-bold">
                        #{adm.id}
                      </td>
                      <td className="py-2 px-3.5 font-bold text-zinc-200 text-sm whitespace-nowrap">
                        <span>{adm.first_name} {adm.last_name}</span>
                        {currentAdmin?.id === adm.id && (
                          <span className="bg-blue-500/10 border border-blue-500/25 text-blue-400 text-[9px] px-1.5 py-0.5 rounded-full font-mono font-bold uppercase tracking-wider ml-2 inline-flex items-center">
                            Siz
                          </span>
                        )}
                      </td>
                      <td className="py-2 px-3.5 font-mono text-[var(--brand-blue)] text-xs">
                        {adm.username}
                      </td>
                      <td className="py-2 px-3.5 font-mono text-zinc-400">
                        {adm.phone ? formatPhoneString(adm.phone) : '—'}
                      </td>
                      <td className="py-2 px-3.5 font-mono text-xs text-zinc-500">
                        {formatUnixDate(adm.created_at)}
                      </td>
                      <td className="py-2 text-right pr-6 text-xs relative">
                        <div className="inline-block text-left">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setActiveDropdownId(activeDropdownId === adm.id ? null : adm.id);
                            }}
                            className="p-1 rounded-md hover:bg-zinc-800/50 text-zinc-400 hover:text-zinc-200 transition-colors cursor-pointer focus:outline-none"
                          >
                            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                              <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
                            </svg>
                          </button>
                          {activeDropdownId === adm.id && (
                            <>
                              <div className="fixed inset-0 z-10" onClick={() => setActiveDropdownId(null)} />
                              <div className="absolute right-0 mt-1.5 w-40 rounded-xl bg-zinc-900 border border-zinc-800 shadow-xl z-20 py-1.5 animate-fadeIn text-left">
                                <button
                                  onClick={() => {
                                    setActiveDropdownId(null);
                                    openEditAdminModal(adm);
                                  }}
                                  className="w-full text-left px-3 py-2 text-xs font-semibold text-zinc-300 hover:bg-zinc-800/60 hover:text-zinc-150 flex items-center gap-2 cursor-pointer transition-colors"
                                >
                                  <svg className="w-3.5 h-3.5 text-zinc-450" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
                                  </svg>
                                  Tahrirlash
                                </button>
                                {currentAdmin?.id !== adm.id && (
                                  <button
                                    onClick={() => {
                                      setActiveDropdownId(null);
                                      setDeleteId(adm.id);
                                    }}
                                    className="w-full text-left px-3 py-2 text-xs font-semibold text-rose-500 hover:bg-zinc-800/60 hover:text-rose-455 flex items-center gap-2 cursor-pointer transition-colors border-t border-zinc-800/50"
                                  >
                                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                    </svg>
                                    Oʻchirish
                                  </button>
                                )}
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

        {/* ADMIN MODAL */}
        {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 font-sans select-none animate-fadeIn">
            <div className="w-full max-w-sm bg-zinc-900 border border-zinc-800 rounded-xl p-6 shadow-2xl relative">
              
              <h3 className="text-sm font-bold text-zinc-200 font-mono border-b border-zinc-800 pb-3 mb-5 uppercase tracking-wider">
                {editingId ? 'Admin maʻlumotlarini oʻzgartirish' : 'Yangi admin roʻyxatdan oʻtkazish'}
              </h3>

              {formError && (
                <div className="bg-rose-500/10 border border-rose-500/25 text-rose-450 text-xs px-3 py-2.5 rounded-lg mb-4 text-center font-medium">
                  {formError}
                </div>
              )}

              <form onSubmit={handleAdminSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
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
                      <span className="text-[10px] text-rose-455 mt-1 block font-mono uppercase font-semibold tracking-wider animate-fadeIn">
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
                      <span className="text-[10px] text-rose-455 mt-1 block font-mono uppercase font-semibold tracking-wider animate-fadeIn">
                        {errors.lastName}
                      </span>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-zinc-450 mb-1.5 font-mono uppercase tracking-wider">Login (Username)</label>
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => {
                      setUsername(e.target.value);
                      clearError('username');
                    }}
                    placeholder="admin"
                    className={`w-full cf-input px-3.5 py-2.5 ${
                      errors.username ? 'border-rose-500/50 focus:border-rose-500 focus:shadow-[0_0_0_2px_rgba(244,63,94,0.15)]' : ''
                    }`}
                  />
                  {errors.username && (
                    <span className="text-[10px] text-rose-455 mt-1 block font-mono uppercase font-semibold tracking-wider animate-fadeIn">
                      {errors.username}
                    </span>
                  )}
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-zinc-450 mb-1.5 font-mono uppercase tracking-wider">Telefon Raqami</label>
                  <input
                    type="text"
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
                    placeholder="+998"
                    className={`w-full cf-input px-3.5 py-2.5 ${
                      errors.phone ? 'border-rose-500/50 focus:border-rose-500 focus:shadow-[0_0_0_2px_rgba(244,63,94,0.15)]' : ''
                    }`}
                  />
                  {errors.phone && (
                    <span className="text-[10px] text-rose-455 mt-1 block font-mono uppercase font-semibold tracking-wider animate-fadeIn">
                      {errors.phone}
                    </span>
                  )}
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-zinc-450 mb-1.5 font-mono uppercase tracking-wider">
                    {editingId ? 'Parol (Oʻzgartirish uchun)' : 'Parol'}
                  </label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      clearError('password');
                    }}
                    placeholder="••••••••"
                    className={`w-full cf-input px-3.5 py-2.5 ${
                      errors.password ? 'border-rose-500/50 focus:border-rose-500 focus:shadow-[0_0_0_2px_rgba(244,63,94,0.15)]' : ''
                    }`}
                  />
                  {errors.password && (
                    <span className="text-[10px] text-rose-455 mt-1 block font-mono uppercase font-semibold tracking-wider animate-fadeIn">
                      {errors.password}
                    </span>
                  )}
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
                    disabled={submitting}
                    className="cf-btn-primary px-4 py-2 text-xs font-bold cursor-pointer"
                  >
                    {submitting ? 'SAQLANMOQDA...' : 'Saqlash'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>

      {/* DELETE CONFIRMATION MODAL */}
      <DeleteConfirmModal
        isOpen={deleteId !== null}
        title="Adminni oʻchirish"
        message="Ushbu administratorni oʻchirmoqchimisiz? Ushbu administrator tizimga kira olmaydi."
        onConfirm={handleDeleteAdmin}
        onClose={() => setDeleteId(null)}
        isSubmitting={deleting}
      />
    </DashboardLayout>
  );
}
