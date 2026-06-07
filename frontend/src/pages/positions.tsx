import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useDashboard } from '../hooks/useDashboard';
import { useToast } from '../components/ToastContext';
import DeleteConfirmModal from '../components/DeleteConfirmModal';
import { Position } from '../components/DashboardContext';
import { ENDPOINTS } from '../utils/api';
import { formatUnixDate } from '../utils/date';
import DashboardLayout from '../components/DashboardLayout';

export default function PositionsPage() {
  const { positions, token, loadingPositions, fetchPositions } = useDashboard();
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
  const [name, setName] = useState('');

  // Local mount fetch
  useEffect(() => {
    if (token) {
      fetchPositions();
    }
  }, [token, fetchPositions]);

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

  // Pagination calculation
  const ITEMS_PER_PAGE = 10;
  const filteredPositions = positions.filter((pos) =>
    pos.name.toLowerCase().includes(searchQuery.toLowerCase())
  );
  
  const totalPages = Math.ceil(filteredPositions.length / ITEMS_PER_PAGE);
  const currentPage = router.query.page ? parseInt(router.query.page as string) || 1 : 1;
  const activePage = Math.max(1, Math.min(currentPage, totalPages || 1));
  
  const startIndex = (activePage - 1) * ITEMS_PER_PAGE;
  const paginatedPositions = filteredPositions.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  const handlePageChange = (newPage: number) => {
    router.push({
      pathname: router.pathname,
      query: { ...router.query, page: newPage },
    });
  };

  const openNewPositionModal = () => {
    setName('');
    setEditingId(null);
    setFormError('');
    setErrors({});
    setShowModal(true);
  };

  const openEditPositionModal = (pos: Position) => {
    setName(pos.name);
    setEditingId(pos.id);
    setFormError('');
    setErrors({});
    setShowModal(true);
  };

  const handlePositionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    setErrors({});
    
    if (!name.trim()) {
      setErrors({ name: 'Nom maydoni boʻsh boʻlmasligi kerak' });
      return;
    }

    setSubmitting(true);
    const url = editingId ? ENDPOINTS.positions.detail(editingId) : ENDPOINTS.positions.base;
    const method = editingId ? 'PUT' : 'POST';

    try {
      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ name: name.trim() }),
      });

      if (res.ok) {
        setShowModal(false);
        showToast(editingId ? 'Lavozim nomi oʻzgartirildi' : 'Yangi lavozim qoʻshildi', 'success');
        fetchPositions();
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

  const handleDeletePosition = async () => {
    if (deleteId === null) return;
    setDeleting(true);
    try {
      const res = await fetch(ENDPOINTS.positions.detail(deleteId), {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      setDeleteId(null);
      if (res.ok) {
        showToast('Lavozim muvaffaqiyatli oʻchirildi', 'success');
        fetchPositions();
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

  return (
    <DashboardLayout>
      <div className="h-[calc(100vh-7.5rem)] flex flex-col space-y-5 animate-fadeIn font-sans select-none">
      
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-800/80 pb-4 shrink-0">
        <div>
          <h1 className="text-xl font-extrabold text-zinc-100 tracking-tight">Lavozimlar Roʻyxati</h1>
          <p className="text-xs text-zinc-500 mt-1">Xodimlarga biriktiriladigan rasmiy lavozimlar jadvali.</p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={openNewPositionModal}
            className="cf-btn-primary px-4 py-2 text-xs font-semibold flex items-center gap-2 cursor-pointer shadow-sm"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            <span>Lavozim qoʻshish</span>
          </button>
        </div>
      </div>

      {/* Filter Row */}
      <div className="flex items-center gap-4 shrink-0">
        <div className="relative w-full max-w-md">
          <input
            type="text"
            placeholder="Lavozim nomini qidirish..."
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
      {loadingPositions ? (
        <div className="cf-card flex-1 flex flex-col overflow-hidden">
          <div className="flex-1 overflow-x-auto overflow-y-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="cf-table-header select-none">
                  <th className="py-2 px-3.5 text-zinc-300 font-semibold text-[11px] uppercase tracking-wider w-12 text-center">ID</th>
                  <th className="py-2 px-3.5 text-zinc-300 font-semibold text-[11px] uppercase tracking-wider">Lavozim Nomi</th>
                  <th className="py-2 px-3.5 text-zinc-300 font-semibold text-[11px] uppercase tracking-wider text-center">Xodimlar Soni</th>
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
                      <div className="h-4 w-32 bg-zinc-800/50 rounded animate-pulse" />
                    </td>
                    <td className="py-2 px-3.5">
                      <div className="h-4 w-8 bg-zinc-800/40 rounded animate-pulse mx-auto" />
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
      ) : paginatedPositions.length === 0 ? (
        <div className="cf-card flex-1 flex items-center justify-center text-xs text-zinc-500 font-mono border-dashed">
          {searchQuery ? 'MATN BOʻYICHA LAVOZIM TOPILMADI' : 'LAVOZIMLAR ROʻYXATI BOʻSH'}
        </div>
      ) : (
        <div className="cf-card flex-1 flex flex-col overflow-hidden">
          <div className="flex-1 overflow-x-auto overflow-y-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="cf-table-header select-none">
                  <th className="py-2 px-3.5 text-zinc-300 font-semibold text-[11px] uppercase tracking-wider w-12 text-center">ID</th>
                  <th className="py-2 px-3.5 text-zinc-300 font-semibold text-[11px] uppercase tracking-wider">Lavozim Nomi</th>
                  <th className="py-2 px-3.5 text-zinc-300 font-semibold text-[11px] uppercase tracking-wider text-center">Xodimlar Soni</th>
                  <th className="py-2 px-3.5 text-zinc-300 font-semibold text-[11px] uppercase tracking-wider">Qoʻshilgan vaqt</th>
                  <th className="py-2 text-right pr-6 text-zinc-300 font-semibold text-[11px] uppercase tracking-wider w-16">Amallar</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/60">
                {paginatedPositions.map((pos) => (
                  <tr key={pos.id} className="cf-table-row hover:bg-zinc-800/20 transition-colors">
                    <td className="py-2 px-3.5 font-mono text-[11px] text-zinc-500 text-center font-bold">
                      #{pos.id}
                    </td>
                    <td className="py-2 px-3.5 font-bold text-zinc-200 text-sm whitespace-nowrap">
                      {pos.name}
                    </td>
                    <td className="py-2 px-3.5 text-center">
                      <span className="inline-flex items-center justify-center font-mono text-xs font-bold text-zinc-300 bg-zinc-800/40 border border-zinc-800/60 px-2 py-0.5 rounded-md min-w-8">
                        {pos.employee_count ?? 0}
                      </span>
                    </td>
                    <td className="py-2 px-3.5 font-mono text-xs text-zinc-500">
                      {formatUnixDate(pos.created_at)}
                    </td>
                    <td className="py-2 text-right pr-6 text-xs relative">
                      <div className="inline-block text-left">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setActiveDropdownId(activeDropdownId === pos.id ? null : pos.id);
                          }}
                          className="p-1 rounded-md hover:bg-zinc-800/50 text-zinc-400 hover:text-zinc-200 transition-colors cursor-pointer focus:outline-none"
                        >
                          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
                          </svg>
                        </button>
                        {activeDropdownId === pos.id && (
                          <>
                            <div className="fixed inset-0 z-10" onClick={() => setActiveDropdownId(null)} />
                            <div className="absolute right-0 mt-1.5 w-40 rounded-xl bg-zinc-900 border border-zinc-800 shadow-xl z-20 py-1.5 animate-fadeIn text-left">
                              <button
                                onClick={() => {
                                  setActiveDropdownId(null);
                                  openEditPositionModal(pos);
                                }}
                                className="w-full text-left px-3 py-2 text-xs font-semibold text-zinc-300 hover:bg-zinc-800/60 hover:text-zinc-150 flex items-center gap-2 cursor-pointer transition-colors"
                              >
                                <svg className="w-3.5 h-3.5 text-zinc-455" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
                                </svg>
                                Nomini oʻzgartirish
                              </button>
                              <button
                                onClick={() => {
                                  setActiveDropdownId(null);
                                  setDeleteId(pos.id);
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

      {/* POSITION MODAL */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 font-sans select-none animate-fadeIn">
          <div className="w-full max-w-sm bg-zinc-900 border border-zinc-800 rounded-xl p-6 shadow-2xl relative">
            
            <h3 className="text-sm font-bold text-zinc-200 font-mono border-b border-zinc-800 pb-3 mb-5 uppercase tracking-wider">
              {editingId ? 'Lavozim nomini oʻzgartirish' : 'Yangi lavozim yaratish'}
            </h3>

            {formError && (
              <div className="bg-rose-500/10 border border-rose-500/25 text-rose-450 text-xs px-3 py-2.5 rounded-lg mb-4 text-center font-medium">
                {formError}
              </div>
            )}

            <form onSubmit={handlePositionSubmit} className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-zinc-450 mb-1.5 font-mono uppercase tracking-wider">Lavozim Nomi</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value);
                    if (errors.name) {
                      setErrors((prev) => ({ ...prev, name: '' }));
                    }
                  }}
                  placeholder="Masalan: Sotuvchi"
                  className={`w-full cf-input px-3.5 py-2 ${
                    errors.name ? 'border-rose-500/50 focus:border-rose-500 focus:shadow-[0_0_0_2px_rgba(244,63,94,0.15)] animate-shake' : ''
                  }`}
                />
                {errors.name && (
                  <span className="text-[10px] text-rose-450 mt-1.5 block font-mono uppercase tracking-wider font-semibold animate-fadeIn">
                    {errors.name}
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

      {/* DELETE CONFIRMATION MODAL */}
      <DeleteConfirmModal
        isOpen={deleteId !== null}
        title="Lavozimni oʻchirish"
        message="Ushbu lavozimni oʻchirmoqchimisiz? Ushbu lavozim oʻchirilgach, unga biriktirilgan xodimlarga taʻsir qilishi mumkin."
        onConfirm={handleDeletePosition}
        onClose={() => setDeleteId(null)}
        isSubmitting={deleting}
      />
    </div>
    </DashboardLayout>
  );
}
