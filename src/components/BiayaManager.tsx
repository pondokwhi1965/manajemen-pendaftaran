import React, { useState } from 'react';
import { Plus, Edit2, Trash2, Lock, ShieldAlert, BadgeCent, Save, X, Settings2 } from 'lucide-react';
import { Biaya, Role, AppSettings, getTerminology } from '../types';

interface BiayaManagerProps {
  biayaList: Biaya[];
  activeRole: Role;
  onAddBiaya: (jenisBiaya: string, nominal: number, kategoriGender: 'Semua' | 'Laki-laki' | 'Perempuan') => void;
  onEditBiaya: (id: string, jenisBiaya: string, nominal: number, kategoriGender: 'Semua' | 'Laki-laki' | 'Perempuan') => void;
  onDeleteBiaya: (id: string) => void;
  appSettings?: AppSettings;
}

export function BiayaManager({
  biayaList,
  activeRole,
  onAddBiaya,
  onEditBiaya,
  onDeleteBiaya,
  appSettings,
}: BiayaManagerProps) {
  const isAuthorized = activeRole === 'Superadmin';
  const canModify = activeRole === 'Superadmin';

  // State Management
  const [showAddForm, setShowAddForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);

  const [newJenisBiaya, setNewJenisBiaya] = useState('');
  const [newNominal, setNewNominal] = useState<number | ''>('');
  const [newKategoriGender, setNewKategoriGender] = useState<'Semua' | 'Laki-laki' | 'Perempuan'>('Semua');

  const [editJenisBiaya, setEditJenisBiaya] = useState('');
  const [editNominal, setEditNominal] = useState<number | ''>('');
  const [editKategoriGender, setEditKategoriGender] = useState<'Semua' | 'Laki-laki' | 'Perempuan'>('Semua');

  const [formError, setFormError] = useState('');
  const [deleteConfirmTarget, setDeleteConfirmTarget] = useState<Biaya | null>(null);
  const [sortConfig, setSortConfig] = useState<{ key: keyof Biaya; direction: 'asc' | 'desc' }>({
    key: 'jenisBiaya',
    direction: 'asc'
  });

  // 1. Gated Access: All roles can view, but only Super Admin can modify
  // Removing the full page block to allow Admin to see the menu.

  // 2. Sorting & Filtering
  const requestSort = (key: keyof Biaya) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const sortedBiaya = [...biayaList].sort((a, b) => {
    const aVal = a[sortConfig.key] ?? '';
    const bVal = b[sortConfig.key] ?? '';

    if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
    if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
    return 0;
  });

  // Submit Add Fee
  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newJenisBiaya || newNominal === '') {
      setFormError('Semua kolom wajib diisi.');
      return;
    }
    if (newNominal <= 0) {
      setFormError('Nominal biaya harus lebih besar dari Rp 0.');
      return;
    }

    onAddBiaya(newJenisBiaya, Number(newNominal), newKategoriGender);
    setNewJenisBiaya('');
    setNewNominal('');
    setNewKategoriGender('Semua');
    setFormError('');
    setShowAddForm(false);
  };

  // Submit Edit Fee
  const handleStartEdit = (biaya: Biaya) => {
    setEditId(biaya.id);
    setEditJenisBiaya(biaya.jenisBiaya);
    setEditNominal(biaya.nominal);
    setEditKategoriGender(biaya.kategoriGender || 'Semua');
    setFormError('');
  };

  const handleEditSubmit = (id: string) => {
    if (!editJenisBiaya || editNominal === '') {
      setFormError('Semua kolom wajib diisi.');
      return;
    }
    if (editNominal <= 0) {
      setFormError('Nominal biaya harus lebih besar dari Rp 0.');
      return;
    }

    onEditBiaya(id, editJenisBiaya, Number(editNominal), editKategoriGender);
    setEditId(null);
    setFormError('');
  };

  // Delete Fee safety check
  const handleDeleteCheck = (id: string, name: string) => {
    const target = biayaList.find(b => b.id === id);
    if (target) {
      setDeleteConfirmTarget(target);
    }
  };

  // Aggregate stats
  const totalBiayaSemua = biayaList.filter(b => !b.kategoriGender || b.kategoriGender === 'Semua').reduce((acc, b) => acc + b.nominal, 0);
  const totalBiayaPutra = biayaList.filter(b => b.kategoriGender === 'Laki-laki').reduce((acc, b) => acc + b.nominal, 0) + totalBiayaSemua;
  const totalBiayaPutri = biayaList.filter(b => b.kategoriGender === 'Perempuan').reduce((acc, b) => acc + b.nominal, 0) + totalBiayaSemua;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Konfigurasi Master Biaya</h1>
          <p className="text-xs text-slate-500">
            Mengatur komponen biaya pendaftaran yang otomatis dibebankan ke {getTerminology(appSettings)} saat pendaftaran baru
          </p>
        </div>

        {canModify && !showAddForm ? (
          <button
            id="btn-add-fee-item"
            onClick={() => setShowAddForm(true)}
            className="bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold px-4 py-2 rounded-lg inline-flex items-center gap-1.5 transition-all shadow-sm cursor-pointer"
          >
            <Plus size={16} />
            Tambah Komponen Biaya
          </button>
        ) : (
          !canModify && (
            <div className="bg-amber-50 text-amber-700 text-xs px-3 py-2 rounded-xl font-semibold border border-amber-200">
              Hanya bisa diakses (diedit) oleh role super admin
            </div>
          )
        )}
      </div>

      {/* Overview Stat box */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
        {/* Putra package */}
        <div className="bg-gradient-to-br from-blue-900 to-slate-900 rounded-2xl p-4 sm:p-5 text-white flex justify-between items-center shadow-xs">
          <div className="flex items-center gap-3 sm:gap-3.5">
            <div className="bg-white/10 p-2 sm:p-2.5 rounded-xl text-blue-300">
              <BadgeCent size={20} sm:size={24} />
            </div>
            <div>
              <h3 className="text-[9px] sm:text-[10px] font-bold text-blue-200 uppercase tracking-wider">Paket Biaya Putra</h3>
              <p className="text-lg sm:text-xl font-extrabold text-white mt-0.5 sm:mt-1 font-mono">
                Rp {totalBiayaPutra.toLocaleString('id-ID')}
              </p>
            </div>
          </div>
          <span className="text-[9px] sm:text-[10px] font-bold bg-blue-500/20 text-blue-200 px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-md border border-blue-400/20">Putra</span>
        </div>

        {/* Putri package */}
        <div className="bg-gradient-to-br from-pink-950 to-slate-900 rounded-2xl p-4 sm:p-5 text-white flex justify-between items-center shadow-xs">
          <div className="flex items-center gap-3 sm:gap-3.5">
            <div className="bg-white/10 p-2 sm:p-2.5 rounded-xl text-pink-300">
              <BadgeCent size={20} sm:size={24} />
            </div>
            <div>
              <h3 className="text-[9px] sm:text-[10px] font-bold text-pink-200 uppercase tracking-wider">Paket Biaya Putri</h3>
              <p className="text-lg sm:text-xl font-extrabold text-white mt-0.5 sm:mt-1 font-mono">
                Rp {totalBiayaPutri.toLocaleString('id-ID')}
              </p>
            </div>
          </div>
          <span className="text-[9px] sm:text-[10px] font-bold bg-pink-500/20 text-pink-200 px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-md border border-pink-400/20">Putri</span>
        </div>
      </div>

      {/* Show form to add fee */}
      {showAddForm && canModify && (
        <div className="bg-white border border-emerald-100 rounded-xl p-4 space-y-3 shadow-xs">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <h3 className="text-xs font-bold text-emerald-800 uppercase tracking-wider flex items-center gap-1.5">
              <Settings2 size={14} />
              Form Tambah Komponen Biaya Baru
            </h3>
            <button
              onClick={() => {
                setShowAddForm(false);
                setFormError('');
              }}
              className="text-slate-400 hover:text-slate-600 cursor-pointer"
            >
              <X size={16} />
            </button>
          </div>

          <form onSubmit={handleAddSubmit} className="grid grid-cols-1 md:grid-cols-4 gap-3 items-end">
            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">Nama Jenis Biaya *</label>
              <input
                type="text"
                value={newJenisBiaya}
                onChange={(e) => setNewJenisBiaya(e.target.value)}
                placeholder="Contoh: Uang Gedung, Seragam, SPP"
                className="px-3 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-emerald-500 w-full"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">Nominal Biaya (Rupiah) *</label>
              <input
                type="number"
                value={newNominal}
                onChange={(e) => setNewNominal(e.target.value === '' ? '' : Number(e.target.value))}
                placeholder="Nominal angka saja"
                className="px-3 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-emerald-500 w-full font-mono"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">Kategori Jenis Kelamin *</label>
              <select
                value={newKategoriGender}
                onChange={(e) => setNewKategoriGender(e.target.value as any)}
                className="px-3 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-emerald-500 w-full bg-white font-medium"
              >
                <option value="Semua">Semua {getTerminology(appSettings, { capitalize: true })}</option>
                <option value="Laki-laki">Khusus Putra (Laki-laki)</option>
                <option value="Perempuan">Khusus Putri (Perempuan)</option>
              </select>
            </div>

            <div className="flex gap-2 justify-end">
              <button
                type="button"
                onClick={() => {
                  setShowAddForm(false);
                  setFormError('');
                }}
                className="px-3 py-1.5 border border-slate-200 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-50 cursor-pointer"
              >
                Batal
              </button>
              <button
                type="submit"
                className="px-3.5 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-xs font-semibold cursor-pointer shadow-sm whitespace-nowrap"
              >
                Simpan Biaya
              </button>
            </div>
          </form>

          {formError && <p className="text-[11px] font-medium text-red-600">{formError}</p>}
        </div>
      )}

      {/* Main configuration grid/table */}
      <div className="bg-white border border-slate-100 rounded-xl shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Komponen Rincian Biaya</span>
          {!canModify && (
            <span className="text-[10px] bg-amber-50 text-amber-800 border border-amber-200 px-2 py-0.5 rounded flex items-center gap-1 font-semibold">
              <Lock size={10} /> Mode Lihat Saja (Kepala)
            </span>
          )}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-100 text-xs font-bold text-slate-400 uppercase tracking-wider bg-slate-50/20">
                <th className="py-3 px-5 w-16">No</th>
                <th 
                  className="py-3 px-4 cursor-pointer hover:bg-slate-100/50 transition-colors"
                  onClick={() => requestSort('jenisBiaya')}
                >
                  <div className="flex items-center gap-1">
                    Nama Komponen Biaya
                    {sortConfig.key === 'jenisBiaya' && (
                      <span>{sortConfig.direction === 'asc' ? '↑' : '↓'}</span>
                    )}
                  </div>
                </th>
                <th 
                  className="py-3 px-4 cursor-pointer hover:bg-slate-100/50 transition-colors"
                  onClick={() => requestSort('kategoriGender')}
                >
                  <div className="flex items-center gap-1">
                    Kategori Gender
                    {sortConfig.key === 'kategoriGender' && (
                      <span>{sortConfig.direction === 'asc' ? '↑' : '↓'}</span>
                    )}
                  </div>
                </th>
                <th 
                  className="py-3 px-4 cursor-pointer hover:bg-slate-100/50 transition-colors text-right"
                  onClick={() => requestSort('nominal')}
                >
                  <div className="flex items-center justify-end gap-1">
                    Nominal Tagihan
                    {sortConfig.key === 'nominal' && (
                      <span>{sortConfig.direction === 'asc' ? '↑' : '↓'}</span>
                    )}
                  </div>
                </th>
                {canModify && <th className="py-3 px-5 text-center w-36">Aksi</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {sortedBiaya.map((biaya, index) => {
                const isEditingThis = editId === biaya.id;

                return (
                  <tr key={biaya.id} className="text-xs hover:bg-slate-50/50 transition-colors">
                    {/* Index */}
                    <td className="py-3.5 px-5 font-mono text-slate-400 font-semibold">{index + 1}</td>

                    {/* Fee Name */}
                    <td className="py-3.5 px-4 font-semibold text-slate-800">
                      {isEditingThis ? (
                        <input
                          type="text"
                          value={editJenisBiaya}
                          onChange={(e) => setEditJenisBiaya(e.target.value)}
                          className="px-2 py-1 border border-slate-300 rounded-md focus:outline-hidden focus:ring-1 focus:ring-emerald-500 text-xs w-full max-w-sm"
                        />
                      ) : (
                        biaya.jenisBiaya
                      )}
                    </td>

                    {/* Kategori Gender */}
                    <td className="py-3.5 px-4">
                      {isEditingThis ? (
                        <select
                          value={editKategoriGender}
                          onChange={(e) => setEditKategoriGender(e.target.value as any)}
                          className="px-2 py-1 border border-slate-300 rounded-md focus:outline-hidden focus:ring-1 focus:ring-emerald-500 text-xs bg-white font-medium"
                        >
                          <option value="Semua">Semua {getTerminology(appSettings, { capitalize: true })}</option>
                          <option value="Laki-laki">Putra (Laki-laki)</option>
                          <option value="Perempuan">Putri (Perempuan)</option>
                        </select>
                      ) : (
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold border ${
                          biaya.kategoriGender === 'Laki-laki'
                            ? 'bg-blue-50 text-blue-700 border-blue-100'
                            : biaya.kategoriGender === 'Perempuan'
                            ? 'bg-pink-50 text-pink-700 border-pink-100'
                            : 'bg-slate-100 text-slate-600 border-slate-200'
                        }`}>
                          {biaya.kategoriGender === 'Laki-laki' ? 'Putra' : biaya.kategoriGender === 'Perempuan' ? 'Putri' : 'Semua'}
                        </span>
                      )}
                    </td>

                    {/* Nominal */}
                    <td className="py-3.5 px-4 text-right font-mono font-bold text-slate-900 text-sm">
                      {isEditingThis ? (
                        <div className="flex items-center justify-end gap-1.5">
                          <span className="text-slate-400 font-sans text-xs">Rp</span>
                          <input
                            type="number"
                            value={editNominal}
                            onChange={(e) => setEditNominal(e.target.value === '' ? '' : Number(e.target.value))}
                            className="px-2 py-1 border border-slate-300 rounded-md focus:outline-hidden focus:ring-1 focus:ring-emerald-500 text-xs w-36 text-right font-mono font-bold"
                          />
                        </div>
                      ) : (
                        `Rp ${biaya.nominal.toLocaleString('id-ID')}`
                      )}
                    </td>

                    {/* Actions */}
                    {canModify && (
                      <td className="py-3.5 px-5 text-center">
                        {isEditingThis ? (
                          <div className="flex items-center justify-center gap-1.5">
                            <button
                              onClick={() => handleEditSubmit(biaya.id)}
                              className="bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 p-1 rounded-md transition-all cursor-pointer"
                              title="Simpan"
                            >
                              <Save size={14} />
                            </button>
                            <button
                              onClick={() => setEditId(null)}
                              className="bg-slate-100 hover:bg-slate-200 text-slate-600 p-1 rounded-md transition-all cursor-pointer"
                              title="Batal"
                            >
                              <X size={14} />
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center justify-center gap-1.5">
                            <button
                              id={`btn-edit-fee-${biaya.id}`}
                              onClick={() => handleStartEdit(biaya)}
                              className="p-1.5 text-slate-600 hover:text-indigo-700 hover:bg-slate-100 rounded-md transition-all cursor-pointer"
                              title="Edit Biaya"
                            >
                              <Edit2 size={14} />
                            </button>
                            <button
                              id={`btn-delete-fee-${biaya.id}`}
                              onClick={() => handleDeleteCheck(biaya.id, biaya.jenisBiaya)}
                              className="p-1.5 text-slate-600 hover:text-red-600 hover:bg-red-50 rounded-md transition-all cursor-pointer"
                              title="Hapus Biaya"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        )}
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {formError && editId && (
        <div className="bg-red-50 text-red-700 border border-red-200 p-3 rounded-lg text-xs font-semibold">
          Error: {formError}
        </div>
      )}

      {/* CUSTOM CONFIRMATION MODAL FOR DELETION */}
      {deleteConfirmTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-100 animate-in zoom-in-95 duration-150 relative">
            <button 
              onClick={() => setDeleteConfirmTarget(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
            >
              <X size={20} />
            </button>
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center text-red-600 shrink-0">
                <Trash2 size={20} />
              </div>
              <div className="space-y-2 flex-1">
                <h3 className="text-sm font-bold text-slate-900">Konfirmasi Hapus Komponen Biaya</h3>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Apakah Anda yakin ingin menghapus jenis biaya <strong className="text-slate-800">"{deleteConfirmTarget.jenisBiaya}"</strong> dari Master Biaya?
                </p>
                <div className="text-xs text-amber-700 bg-amber-50 p-2.5 rounded-lg border border-amber-100/50">
                  <span className="font-bold">Catatan:</span> Hal ini tidak memengaruhi tagihan {getTerminology(appSettings)} yang sudah terdaftar sebelumnya, tetapi {getTerminology(appSettings)} baru yang didaftarkan setelah ini tidak akan dikenakan biaya ini.
                </div>
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={() => setDeleteConfirmTarget(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50 border border-slate-200 rounded-xl transition-all cursor-pointer"
              >
                Batal
              </button>
              <button
                onClick={() => {
                  onDeleteBiaya(deleteConfirmTarget.id);
                  setDeleteConfirmTarget(null);
                }}
                className="px-4 py-2 text-xs font-semibold text-white bg-red-600 hover:bg-red-700 rounded-xl shadow-xs transition-all cursor-pointer"
              >
                Ya, Hapus
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
