import React, { useState } from 'react';
import { Users, UserCheck, Shield, Plus, Lock, ShieldAlert, Trash2, X, AlertCircle, Eye, EyeOff, Edit2 } from 'lucide-react';
import { Role, User, AppSettings, getTerminology } from '../types';

interface PenggunaManagerProps {
  activeRole: Role;
  currentUser: User;
  usersList: User[];
  onRegisterUser: (username: string, name: string, role: Role, password?: string) => void;
  onEditUser?: (oldUsername: string, newUsername: string, name: string, role: Role, password?: string) => void;
  onRemoveUser: (username: string) => void;
  onUpdateUserPassword: (username: string, newPassword: string) => void;
  onUpdateUserStatus?: (username: string, isActive: boolean) => void;
  appSettings?: AppSettings;
}

export function PenggunaManager({
  activeRole,
  currentUser,
  usersList,
  onRegisterUser,
  onEditUser,
  onRemoveUser,
  onUpdateUserPassword,
  onUpdateUserStatus,
  appSettings,
}: PenggunaManagerProps) {
  const isAuthorized = activeRole === 'Superadmin';

  // Form State (Add / Edit)
  const [showForm, setShowForm] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [newUsername, setNewUsername] = useState('');
  const [newName, setNewName] = useState('');
  const [newRole, setNewRole] = useState<Role>('Admin Putra');
  const [newPassword, setNewPassword] = useState('');
  const [error, setError] = useState('');
  const [deleteConfirmUsername, setDeleteConfirmUsername] = useState<string | null>(null);

  // Password visibility map
  const [visiblePasswords, setVisiblePasswords] = useState<Record<string, boolean>>({});

  const canModify = isAuthorized;

  // 1. Gated Access Check: Admin can view, but only Super Admin can edit
  // Removed full-page blocking to allow view-only access.

  // Handle Submit
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUsername || !newName) {
      setError('Semua kolom wajib diisi.');
      return;
    }

    if (editingUser) {
      // Check duplicate username if changed
      if (newUsername.toLowerCase() !== editingUser.username.toLowerCase() && usersList.some(u => u.username.toLowerCase() === newUsername.toLowerCase())) {
        setError('Username ini telah terdaftar dalam sistem.');
        return;
      }
      
      if (onEditUser) {
        onEditUser(
          editingUser.username,
          newUsername.toLowerCase().trim(),
          newName.trim(),
          newRole,
          newPassword || undefined
        );
      }
    } else {
      // Check duplicate username
      if (usersList.some(u => u.username.toLowerCase() === newUsername.toLowerCase())) {
        setError('Username ini telah terdaftar dalam sistem.');
        return;
      }
  
      onRegisterUser(
        newUsername.toLowerCase().trim(),
        newName.trim(),
        newRole,
        newPassword || undefined
      );
    }

    handleCancelForm();
  };

  const handleStartEdit = (user: User) => {
    setEditingUser(user);
    setNewUsername(user.username);
    setNewName(user.name);
    setNewRole(user.role);
    setNewPassword(''); // Keep blank to keep old password
    setError('');
    setShowForm(true);
  };

  const handleCancelForm = () => {
    setEditingUser(null);
    setNewUsername('');
    setNewName('');
    setNewRole('Admin');
    setNewPassword('');
    setError('');
    setShowForm(false);
  };

  const handleDeleteUser = (username: string) => {
    if (username === 'superadmin') {
      setError('Gagal: Akun Super Admin tidak dapat dihapus demi keamanan darurat sistem.');
      return;
    }
    setDeleteConfirmUsername(username);
  };

  const togglePasswordVisibility = (username: string) => {
    setVisiblePasswords(prev => ({
      ...prev,
      [username]: !prev[username]
    }));
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Manajemen Pengguna & Otorisasi</h1>
          <p className="text-xs text-slate-500">Mengelola kredensial staf bendahara, admin utama, dan pimpinan yayasan</p>
        </div>

        {canModify && !showForm ? (
          <button
            id="btn-add-system-user"
            onClick={() => setShowForm(true)}
            className="bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold px-4 py-2.5 rounded-xl inline-flex items-center gap-2 transition-all shadow-sm cursor-pointer"
          >
            <Plus size={16} />
            Tambah Pengguna Baru
          </button>
        ) : (
          !canModify && (
            <div className="bg-amber-50 text-amber-700 text-xs px-3 py-2 rounded-xl font-semibold border border-amber-200">
              Hanya bisa diakses (diedit) oleh role super admin
            </div>
          )
        )}
      </div>

      {/* Grid representation */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left column: Users list table & Security configurations */}
        <div className="lg:col-span-2 space-y-6">
          {/* 2. USERS TABLE */}
          <div className="bg-white border border-slate-200 rounded-3xl shadow-sm overflow-hidden space-y-4">
            <div className="p-5 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Daftar Akun Pengguna</span>
              <span className="text-[10px] bg-emerald-100 text-emerald-800 px-2.5 py-1 rounded-full font-mono font-bold uppercase tracking-wider">Total: {usersList.length}</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-100 text-xs font-bold text-slate-400 uppercase tracking-wider bg-slate-50/25">
                    <th className="py-3 px-4">Nama Lengkap</th>
                    <th className="py-3 px-4">Username</th>
                    <th className="py-3 px-4">Kata Sandi (Password)</th>
                    <th className="py-3 px-4">Otoritas Peran</th>
                    <th className="py-3 px-4">Status Akun</th>
                    {canModify && <th className="py-3 px-4 text-center">Aksi</th>}
                  </tr>
                </thead>
                <tbody>
                  {usersList.map((user) => {
                    const isVisible = visiblePasswords[user.username] || false;

                    return (
                      <tr key={user.username} className="border-b border-slate-100 text-xs hover:bg-slate-50/50 transition-colors">
                        {/* Name */}
                        <td className="py-3.5 px-4">
                          <div className="font-semibold text-slate-800 flex items-center gap-1.5">
                            <Users size={14} className="text-slate-400" />
                            {user.name}
                            {currentUser.username === user.username && (
                              <span className="text-[9px] bg-indigo-50 text-indigo-700 border border-indigo-200 px-1 py-0.2 rounded font-mono font-bold">Anda</span>
                            )}
                          </div>
                        </td>

                        {/* Username */}
                        <td className="py-3.5 px-4 font-mono font-medium text-slate-600">
                          {user.username}
                        </td>

                        {/* Password Field */}
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-slate-600">
                              {isVisible ? (user.password || 'password123') : '••••••••'}
                            </span>
                            <button
                              onClick={() => togglePasswordVisibility(user.username)}
                              className="text-slate-400 hover:text-slate-600 cursor-pointer"
                              title={isVisible ? "Sembunyikan Kata Sandi" : "Lihat Kata Sandi"}
                            >
                              {isVisible ? <EyeOff size={12} /> : <Eye size={12} />}
                            </button>
                          </div>
                        </td>

                        {/* Role */}
                        <td className="py-3.5 px-4">
                          <span className={`px-2.5 py-1 rounded-full text-[9px] font-bold uppercase tracking-wider ${
                            user.role === 'Superadmin' ? 'bg-emerald-100 text-emerald-800' :
                            user.role === 'Admin Umum' ? 'bg-amber-100 text-amber-800' :
                            user.role === 'Admin Putri' ? 'bg-pink-100 text-pink-800' :
                            'bg-indigo-100 text-indigo-800'
                          }`}>{user.role}</span>
                        </td>

                        {/* Status */}
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-3">
                            <button
                              onClick={() => canModify && user.username !== 'superadmin' && onUpdateUserStatus?.(user.username, !(user.isActive ?? true))}
                              className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-hidden ${
                                (user.isActive ?? true) ? 'bg-emerald-600' : 'bg-slate-300'
                              } ${(!canModify || user.username === 'superadmin') ? 'opacity-50 cursor-not-allowed' : ''}`}
                              disabled={!canModify || user.username === 'superadmin'}
                              title={(user.isActive ?? true) ? "Nonaktifkan Akun" : "Aktifkan Akun"}
                            >
                              <span
                                className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                                  (user.isActive ?? true) ? 'translate-x-4' : 'translate-x-0'
                                }`}
                              />
                            </button>
                            <span className={`text-[10px] font-bold uppercase tracking-tight ${
                              (user.isActive ?? true) ? 'text-emerald-600' : 'text-slate-400'
                            }`}>
                              {(user.isActive ?? true) ? 'Aktif' : 'Nonaktif'}
                            </span>
                          </div>
                        </td>

                        {/* Action */}
                        {canModify && (
                          <td className="py-3.5 px-4 text-center">
                            <div className="flex items-center justify-center gap-1">
                              <button
                                onClick={() => handleStartEdit(user)}
                                className="text-slate-400 hover:text-emerald-600 p-1.5 rounded-lg hover:bg-slate-50 transition-colors cursor-pointer"
                                title="Edit Pengguna"
                              >
                                <Edit2 size={14} />
                              </button>
                              {user.username !== 'superadmin' ? (
                                <button
                                  onClick={() => handleDeleteUser(user.username)}
                                  className="p-1.5 text-slate-600 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all cursor-pointer"
                                  title="Hapus Kredensial"
                                >
                                  <Trash2 size={14} />
                                </button>
                              ) : (
                                <span className="text-slate-300 select-none cursor-not-allowed p-1.5">
                                  <Lock size={12} className="mx-auto" />
                                </span>
                              )}
                            </div>
                          </td>
                        )}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

        </div>

        {/* Right column: Role explanation */}
        <div className="space-y-4">
          <div className="bg-slate-50 border border-slate-150 rounded-3xl p-5 space-y-4 text-xs text-slate-600 leading-relaxed">
            <h4 className="font-bold text-slate-800 uppercase tracking-wider text-[10px] flex items-center gap-1">
              <Shield size={14} className="text-slate-400" />
              Matriks Kewenangan Staf
            </h4>

            <div className="space-y-3 divide-y divide-slate-150">
              <div className="space-y-1">
                <p className="font-bold text-indigo-800">1. Admin (Putra/Putri/Umum)</p>
                <p className="text-[11px]">Mengelola pendaftaran {getTerminology(appSettings)} baru, verifikasi data, kelengkapan berkas, pembayaran loket, dan laporan keuangan sesuai dengan lingkup gendernya (kecuali Admin Umum yang bisa keduanya).</p>
              </div>
              <div className="space-y-1 pt-2">
                <p className="font-bold text-emerald-800">2. Super Admin</p>
                <p className="text-[11px]">Otoritas tertinggi mutlak. Memiliki seluruh kewenangan Admin ditambah kemampuan mengatur master biaya, fitur keamanan login staf, manajemen staff, dan database.</p>
              </div>
            </div>
          </div>
        </div>

      {/* USER FORM MODAL (POP-UP) */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-[2.5rem] max-w-md w-full p-8 shadow-2xl border border-slate-100 animate-in zoom-in-95 duration-150 relative">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-6">
              <div>
                <h3 className="text-sm font-black text-slate-900 uppercase tracking-tight">{editingUser ? 'Edit Pengguna' : 'Tambah Pengguna Baru'}</h3>
                <p className="text-[10px] text-slate-500 font-medium">{editingUser ? 'Perbarui informasi kredensial staf' : 'Daftarkan kredensial staf baru ke sistem'}</p>
              </div>
              <button onClick={handleCancelForm} className="text-slate-400 hover:text-slate-600 cursor-pointer p-2 hover:bg-slate-50 rounded-full transition-colors">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              {error && (
                <p className="text-[10px] font-semibold text-red-600 bg-red-50 border border-red-100 p-3 rounded-xl flex items-center gap-2">
                  <AlertCircle size={14} />
                  {error}
                </p>
              )}

              <div className="space-y-4">
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-1.5 ml-1">Nama Staff Lengkap *</label>
                  <input
                    type="text"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    placeholder="Sesuai KTP beserta Gelar"
                    className="px-4 py-3 text-xs border border-slate-200 rounded-2xl focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 w-full bg-slate-50/30 transition-all"
                    required
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-1.5 ml-1">Username Unik *</label>
                  <input
                    type="text"
                    value={newUsername}
                    onChange={(e) => setNewUsername(e.target.value)}
                    placeholder="Contoh: bendahara_putra"
                    className="px-4 py-3 text-xs border border-slate-200 rounded-2xl focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 w-full font-mono bg-slate-50/30 transition-all"
                    required
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-1.5 ml-1">
                    Kata Sandi {editingUser ? '(Kosongkan jika tidak berubah)' : '*'}
                  </label>
                  <input
                    type="text"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder={editingUser ? "••••••••" : "Min. 6 karakter"}
                    className="px-4 py-3 text-xs border border-slate-200 rounded-2xl focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 w-full font-mono bg-slate-50/30 transition-all"
                    required={!editingUser}
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-1.5 ml-1">Hak Akses Peran *</label>
                  <select
                    value={newRole}
                    onChange={(e) => setNewRole(e.target.value as Role)}
                    className="px-4 py-3 text-xs border border-slate-200 rounded-2xl focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 w-full bg-white font-bold text-slate-700 transition-all"
                  >
                    <option value="Superadmin">Superadmin (Akses Penuh)</option>
                    <option value="Admin Umum">Admin Umum (Semua Gender)</option>
                    <option value="Admin Putri">Admin Putri (Khusus Putri)</option>
                    <option value="Admin Putra">Admin Putra (Khusus Putra)</option>
                  </select>
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={handleCancelForm}
                  className="flex-1 py-3.5 border border-slate-200 rounded-2xl text-xs font-bold text-slate-600 hover:bg-slate-50 cursor-pointer transition-all"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="flex-2 py-3.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-2xl text-xs font-black uppercase tracking-widest cursor-pointer shadow-lg shadow-emerald-700/20 transition-all active:scale-95"
                >
                  {editingUser ? 'Simpan Perubahan' : 'Daftarkan Pengguna'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CUSTOM CONFIRMATION MODAL FOR DELETION */}
      {deleteConfirmUsername && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-100 animate-in zoom-in-95 duration-150 relative">
            <button 
              onClick={() => setDeleteConfirmUsername(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
            >
              <X size={20} />
            </button>
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center text-red-600 shrink-0">
                <Trash2 size={20} />
              </div>
              <div className="space-y-2 flex-1">
                <h3 className="text-sm font-bold text-slate-900">Konfirmasi Hapus Akun</h3>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Apakah Anda yakin ingin menghapus akun pengguna <strong className="text-slate-800">"{deleteConfirmUsername}"</strong> dari sistem?
                </p>
                <div className="text-xs text-red-600 bg-red-50 p-2.5 rounded-lg border border-red-100/50">
                  <span className="font-bold">Peringatan:</span> Staf yang bersangkutan tidak akan dapat lagi masuk ke sistem.
                </div>
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={() => setDeleteConfirmUsername(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50 border border-slate-200 rounded-xl transition-all cursor-pointer"
              >
                Batal
              </button>
              <button
                onClick={() => {
                  onRemoveUser(deleteConfirmUsername);
                  setDeleteConfirmUsername(null);
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
    </div>
  );
}
