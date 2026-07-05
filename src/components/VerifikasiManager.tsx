import React, { useState } from 'react';
import { Santri, Role, AppSettings, getTerminology } from '../types';
import { 
  CheckCircle, 
  XCircle, 
  AlertCircle, 
  Search, 
  Filter, 
  Clock, 
  CheckSquare, 
  ArrowRight,
  UserCheck,
  Building,
  Calendar,
  Layers,
  Phone,
  RefreshCw,
  Eye,
  X
} from 'lucide-react';

interface VerifikasiManagerProps {
  santriList: Santri[];
  activeRole: Role;
  onEditSantri: (nomorPendaftaran: string, data: Partial<Santri>) => { success: boolean; error?: string } | void;
  onDeleteSantri?: (nomorPendaftaran: string) => void;
  onNavigateToMaster?: (nomorPendaftaran: string) => void;
  appSettings?: AppSettings;
}

export function VerifikasiManager({ santriList, activeRole, onEditSantri, onDeleteSantri, onNavigateToMaster, appSettings }: VerifikasiManagerProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('semua');
  const [jenjangFilter, setJenjangFilter] = useState<string>('semua');
  const [selectedSantriIds, setSelectedSantriIds] = useState<string[]>([]);
  
  // Selected student for detail view in side panel or modal
  const [selectedSantri, setSelectedSantri] = useState<Santri | null>(null);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [sortConfig, setSortConfig] = useState<{ key: keyof Santri; direction: 'asc' | 'desc' }>({
    key: 'nomorPendaftaran',
    direction: 'asc'
  });

  const toggleSelectSantri = (id: string) => {
    if (selectedSantriIds.includes(id)) {
      setSelectedSantriIds(selectedSantriIds.filter(sId => sId !== id));
    } else {
      setSelectedSantriIds([...selectedSantriIds, id]);
    }
  };

  const toggleSelectAll = (list: Santri[]) => {
    if (selectedSantriIds.length === list.length) {
      setSelectedSantriIds([]);
    } else {
      setSelectedSantriIds(list.map(s => s.nomorPendaftaran));
    }
  };

  const handleBulkUpdateStatus = (newStatus: 'Belum Divalidasi' | 'Valid' | 'Tidak Valid') => {
    selectedSantriIds.forEach(id => {
      onEditSantri(id, { statusValidasi: newStatus });
    });
    setSuccessMsg(`Berhasil mengubah status ${selectedSantriIds.length} data menjadi "${newStatus}".`);
    setSelectedSantriIds([]);
    setTimeout(() => setSuccessMsg(''), 3000);
  };

  const handleBulkDelete = () => {
    if (onDeleteSantri && confirm(`Apakah Anda yakin ingin menghapus ${selectedSantriIds.length} data?`)) {
      selectedSantriIds.forEach(id => onDeleteSantri(id));
      setSelectedSantriIds([]);
    }
  };

  // Stats calculation
  const total = santriList.length;
  const valid = santriList.filter(s => s.statusValidasi === 'Valid').length;
  const tidakValid = santriList.filter(s => s.statusValidasi === 'Tidak Valid').length;
  const belumVerifikasi = santriList.filter(s => !s.statusValidasi || s.statusValidasi === 'Belum Divalidasi').length;

  // Filter list
  const filteredList = santriList.filter(s => {
    const matchesSearch = s.nama.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          s.nomorPendaftaran.toLowerCase().includes(searchTerm.toLowerCase());
    
    const sStatus = s.statusValidasi || 'Belum Divalidasi';
    const matchesStatus = statusFilter === 'semua' || sStatus === statusFilter;
    const matchesJenjang = jenjangFilter === 'semua' || s.jenjang === jenjangFilter;

    return matchesSearch && matchesStatus && matchesJenjang;
  });

  const requestSort = (key: keyof Santri) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const sortedList = [...filteredList].sort((a, b) => {
    const aVal = a[sortConfig.key] ?? '';
    const bVal = b[sortConfig.key] ?? '';
    if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
    if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
    return 0;
  });

  const handleUpdateStatus = (nomorPendaftaran: string, newStatus: 'Belum Divalidasi' | 'Valid' | 'Tidak Valid') => {
    setErrorMsg('');
    setSuccessMsg('');
    
    const result = onEditSantri(nomorPendaftaran, { statusValidasi: newStatus });
    
    // Check if result has return status or handle successfully
    if (result && !result.success) {
      setErrorMsg(result.error || 'Gagal mengubah status verifikasi.');
    } else {
      setSuccessMsg(`Berhasil mengubah status verifikasi menjadi "${newStatus}".`);
      
      // Update local selected student state to reflect change immediately
      if (selectedSantri && selectedSantri.nomorPendaftaran === nomorPendaftaran) {
        setSelectedSantri(prev => prev ? { ...prev, statusValidasi: newStatus } : null);
      }

      // Hide success message after 3 seconds
      setTimeout(() => setSuccessMsg(''), 3000);
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">Verifikasi Data {getTerminology(appSettings, { capitalize: true })}</h2>
          <p className="text-xs text-slate-500 mt-1">Verifikasi kecocokan dokumen pendaftaran fisik dengan data sistem untuk {getTerminology(appSettings)} baru.</p>
        </div>
        <div className="flex items-center gap-2 bg-slate-50 border border-slate-100 px-3 py-1.5 rounded-xl text-xs text-slate-600 font-medium">
          <span>Pengguna Aktif:</span>
          <span className="bg-emerald-600 text-white font-bold px-2 py-0.5 rounded-md text-[10px]">{activeRole}</span>
        </div>
      </div>

      {/* Stats Counter Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Total {getTerminology(appSettings, { capitalize: true })}</span>
            <span className="text-2xl font-bold text-slate-800 leading-tight mt-1 inline-block">{total}</span>
          </div>
          <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center text-slate-600">
            <CheckSquare size={18} />
          </div>
        </div>

        <div className="bg-emerald-50 border border-emerald-200/50 rounded-2xl p-4 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider block">Sudah Valid</span>
            <span className="text-2xl font-bold text-emerald-800 leading-tight mt-1 inline-block">{valid}</span>
          </div>
          <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center text-emerald-600">
            <CheckCircle size={18} />
          </div>
        </div>

        <div className="bg-amber-50 border border-amber-200/50 rounded-2xl p-4 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold text-amber-600 uppercase tracking-wider block">Belum Diverifikasi</span>
            <span className="text-2xl font-bold text-amber-800 leading-tight mt-1 inline-block">{belumVerifikasi}</span>
          </div>
          <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center text-amber-600">
            <Clock size={18} />
          </div>
        </div>

        <div className="bg-red-50 border border-red-200/50 rounded-2xl p-4 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold text-red-600 uppercase tracking-wider block">Tidak Valid</span>
            <span className="text-2xl font-bold text-red-800 leading-tight mt-1 inline-block">{tidakValid}</span>
          </div>
          <div className="w-10 h-10 bg-red-100 rounded-xl flex items-center justify-center text-red-600">
            <XCircle size={18} />
          </div>
        </div>
      </div>

      {/* Alert Feedbacks */}
      {successMsg && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold p-3.5 rounded-xl flex items-center gap-2">
          <CheckCircle size={16} className="text-emerald-600 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}
      {errorMsg && (
        <div className="bg-red-50 border border-red-200 text-red-800 text-xs font-semibold p-3.5 rounded-xl flex items-center gap-2">
          <AlertCircle size={16} className="text-red-600 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Main Content Area */}
      <div className="grid grid-cols-1 gap-6">
        {/* Student List Section */}
        <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
          {/* Filters Bar */}
          <div className="p-4 border-b border-slate-100 flex flex-col md:flex-row gap-3 bg-slate-50/50">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-2.5 text-slate-400" size={16} />
              <input
                type="text"
                placeholder="Cari Nama / No Registrasi..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-xs border border-slate-200 rounded-xl bg-white focus:outline-hidden focus:ring-1 focus:ring-emerald-500 font-medium"
              />
            </div>

            <div className="flex gap-2">
              <div className="flex items-center gap-1.5">
                <Filter size={13} className="text-slate-400" />
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="px-2.5 py-1.5 text-xs border border-slate-200 rounded-xl bg-white focus:outline-hidden focus:ring-1 focus:ring-emerald-500 font-semibold text-slate-600"
                >
                  <option value="semua">Semua Status</option>
                  <option value="Belum Divalidasi">Belum Diverifikasi</option>
                  <option value="Valid">Valid</option>
                  <option value="Tidak Valid">Tidak Valid</option>
                </select>
              </div>

              <select
                value={jenjangFilter}
                onChange={(e) => setJenjangFilter(e.target.value)}
                className="px-2.5 py-1.5 text-xs border border-slate-200 rounded-xl bg-white focus:outline-hidden focus:ring-1 focus:ring-emerald-500 font-semibold text-slate-600"
              >
                <option value="semua">Semua Jenjang</option>
                <option value="SDI AL-HIDAYAH">SDI AL-HIDAYAH</option>
                <option value="SMP AL-HIDAYAH">SMP AL-HIDAYAH</option>
                <option value="SMK AL-HIDAYAH">SMK AL-HIDAYAH</option>
              </select>
            </div>
          </div>

          {/* Bulk Actions Toolbar */}
          {selectedSantriIds.length > 0 && (
            <div className="bg-emerald-50 border-b border-emerald-100 p-4 flex items-center justify-between">
              <span className="text-xs font-bold text-emerald-800">
                {selectedSantriIds.length} {getTerminology(appSettings)} dipilih
              </span>
              <div className="flex gap-2">
                <button onClick={() => handleBulkUpdateStatus('Valid')} className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-3 py-1.5 rounded-lg cursor-pointer">
                  Tandai Valid
                </button>
                <button onClick={() => handleBulkUpdateStatus('Tidak Valid')} className="bg-red-600 hover:bg-red-700 text-white text-xs font-bold px-3 py-1.5 rounded-lg cursor-pointer">
                  Tandai Tidak Valid
                </button>
                <button 
                  onClick={handleBulkDelete}
                  className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-bold transition-all shadow-sm flex items-center gap-1.5 cursor-pointer"
                >
                  <RefreshCw size={12} className="hidden" />
                  Hapus Terpilih
                </button>
              </div>
            </div>
          )}

          {/* Table Area */}
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 text-[10px] font-bold text-slate-400 uppercase bg-slate-50">
                  <th className="py-3 px-4 text-center">
                    <input 
                      type="checkbox" 
                      className="rounded text-emerald-600 focus:ring-emerald-500"
                      checked={selectedSantriIds.length === sortedList.length && sortedList.length > 0}
                      onChange={() => toggleSelectAll(sortedList)}
                    />
                  </th>
                  <th 
                    className="py-3 px-4 cursor-pointer hover:bg-slate-100 transition-colors"
                    onClick={() => requestSort('nomorPendaftaran')}
                  >
                    <div className="flex items-center gap-1">
                      No Registrasi
                      {sortConfig.key === 'nomorPendaftaran' && (
                        <span>{sortConfig.direction === 'asc' ? '↑' : '↓'}</span>
                      )}
                    </div>
                  </th>
                  <th 
                    className="py-3 px-4 cursor-pointer hover:bg-slate-100 transition-colors"
                    onClick={() => requestSort('nama')}
                  >
                    <div className="flex items-center gap-1">
                      Nama
                      {sortConfig.key === 'nama' && (
                        <span>{sortConfig.direction === 'asc' ? '↑' : '↓'}</span>
                      )}
                    </div>
                  </th>
                  <th 
                    className="py-3 px-3 cursor-pointer hover:bg-slate-100 transition-colors"
                    onClick={() => requestSort('jenisKelamin')}
                  >
                    <div className="flex items-center gap-1">
                      L/P
                      {sortConfig.key === 'jenisKelamin' && (
                        <span>{sortConfig.direction === 'asc' ? '↑' : '↓'}</span>
                      )}
                    </div>
                  </th>
                  <th 
                    className="py-3 px-3 cursor-pointer hover:bg-slate-100 transition-colors"
                    onClick={() => requestSort('statusValidasi')}
                  >
                    <div className="flex items-center gap-1">
                      Status Verifikasi
                      {sortConfig.key === 'statusValidasi' && (
                        <span>{sortConfig.direction === 'asc' ? '↑' : '↓'}</span>
                      )}
                    </div>
                  </th>
                  <th className="py-3 px-4 text-center">Tindakan</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {sortedList.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-slate-400 text-xs">
                      Tidak ada data {getTerminology(appSettings)} yang cocok dengan filter atau kriteria pencarian.
                    </td>
                  </tr>
                ) : (
                  sortedList.map((s) => {
                    const validationStatus = (s.statusValidasi === 'Belum Divalidasi' || !s.statusValidasi) ? 'Belum Diverifikasi' : s.statusValidasi;
                    const isSelected = selectedSantri?.nomorPendaftaran === s.nomorPendaftaran;

                    return (
                      <tr 
                        key={s.nomorPendaftaran} 
                        className={`hover:bg-slate-50/40 text-xs transition-colors cursor-pointer ${isSelected ? 'bg-emerald-50/30' : ''}`}
                        onClick={() => setSelectedSantri(s)}
                      >
                        <td className="py-3.5 px-4 text-center">
                          <input 
                            type="checkbox" 
                            className="rounded text-emerald-600 focus:ring-emerald-500"
                            checked={selectedSantriIds.includes(s.nomorPendaftaran)}
                            onChange={() => toggleSelectSantri(s.nomorPendaftaran)}
                            onClick={(e) => e.stopPropagation()}
                          />
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="font-mono font-bold text-emerald-600 text-[10px]">{s.nomorPendaftaran}</div>
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="font-bold text-slate-900">{s.nama}</div>
                        </td>
                        <td className="py-3.5 px-3">
                          <span className="text-[10px] font-bold text-slate-500">
                            {s.jenisKelamin === 'Laki-laki' ? 'L' : 'P'}
                          </span>
                        </td>
                        <td className="py-3.5 px-3">
                          <div className="flex flex-col gap-1">
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold inline-flex items-center gap-1 w-max ${
                              validationStatus === 'Valid' ? 'bg-emerald-100 text-emerald-700' :
                              validationStatus === 'Tidak Valid' ? 'bg-red-100 text-red-700' :
                              'bg-amber-100 text-amber-700'
                            }`}>
                              {validationStatus}
                            </span>
                            {s.userVerificationStatus === 'Correction Requested' && (
                              <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-amber-100 text-amber-700 w-max truncate max-w-[100px]" title="Pengajuan Perbaikan">
                                Perbaikan Data
                              </span>
                            )}
                            {s.userVerificationStatus === 'Verified' && (
                              <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-emerald-100 text-emerald-700 w-max">
                                Disetujui User
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="py-3.5 px-4 text-center" onClick={(e) => e.stopPropagation()}>
                          <div className="flex items-center justify-center gap-1">
                            <button
                              onClick={() => setSelectedSantri(s)}
                              title="Lihat Detail & Verifikasi"
                              className="p-1 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors cursor-pointer"
                            >
                              <Eye size={15} />
                            </button>
                            {s.userVerificationStatus === 'Correction Requested' && onNavigateToMaster && (
                              <button
                                onClick={() => onNavigateToMaster(s.nomorPendaftaran)}
                                title="Perbaiki Data Santri"
                                className="px-2 py-1 bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-200 rounded text-[10px] font-bold cursor-pointer transition-colors"
                              >
                                Perbaiki
                              </button>
                            )}
                            <button
                              onClick={() => handleUpdateStatus(s.nomorPendaftaran, 'Valid')}
                              title="Tandai Valid"
                              disabled={validationStatus === 'Valid'}
                              className={`p-1 rounded-lg transition-colors cursor-pointer ${
                                validationStatus === 'Valid' 
                                  ? 'text-slate-300 cursor-not-allowed' 
                                  : 'text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50'
                              }`}
                            >
                              <CheckCircle size={15} />
                            </button>
                            <button
                              onClick={() => handleUpdateStatus(s.nomorPendaftaran, 'Tidak Valid')}
                              title="Tandai Tidak Valid"
                              disabled={validationStatus === 'Tidak Valid'}
                              className={`p-1 rounded-lg transition-colors cursor-pointer ${
                                validationStatus === 'Tidak Valid' 
                                  ? 'text-slate-300 cursor-not-allowed' 
                                  : 'text-red-600 hover:text-red-700 hover:bg-red-50'
                              }`}
                            >
                              <XCircle size={15} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Modal-style Selected Student Detail & Quick Validation Controls */}
        {selectedSantri && (
          <div 
            className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 overflow-y-auto"
            onClick={() => setSelectedSantri(null)}
          >
            <div 
              className="bg-white border border-slate-200 rounded-2xl shadow-xl overflow-hidden w-full max-w-xl flex flex-col h-fit animate-in fade-in zoom-in duration-250"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="bg-emerald-950 text-white p-5 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-emerald-900 rounded-lg">
                    <UserCheck size={20} className="text-emerald-400" />
                  </div>
                  <div>
                    <span className="text-[9px] font-bold text-emerald-400 uppercase tracking-widest block">Verifikasi Pendaftar</span>
                    <h3 className="font-bold text-base">{selectedSantri.nama}</h3>
                  </div>
                </div>
                <button 
                  onClick={() => setSelectedSantri(null)}
                  className="text-slate-400 hover:text-white p-2 rounded-lg hover:bg-emerald-900 transition-colors cursor-pointer"
                >
                  <X size={20} />
                </button>
              </div>

            {/* Profil Grid */}
            <div className="p-4 space-y-4 text-xs">
              <div className="space-y-2 bg-slate-50 border border-slate-100 rounded-xl p-3.5">
                <div className="flex justify-between pb-2 border-b border-slate-150">
                  <span className="text-slate-400 font-medium">No. Registrasi:</span>
                  <span className="font-bold text-slate-800 font-mono">{selectedSantri.nomorPendaftaran}</span>
                </div>
                <div className="flex justify-between pb-1">
                  <span className="text-slate-400 font-medium">Tempat, Tgl Lahir:</span>
                  <span className="font-semibold text-slate-800">{selectedSantri.tempatLahir}, {selectedSantri.tanggalLahir}</span>
                </div>
                <div className="flex justify-between pb-1">
                  <span className="text-slate-400 font-medium">Gender:</span>
                  <span className="font-semibold text-slate-800">{selectedSantri.jenisKelamin}</span>
                </div>
                <div className="flex justify-between pb-1">
                  <span className="text-slate-400 font-medium">Jenjang & Gelombang:</span>
                  <span className="font-semibold text-emerald-800">{selectedSantri.jenjang} ({selectedSantri.gelombangPendaftaran})</span>
                </div>
                <div className="flex justify-between pb-1">
                  <span className="text-slate-400 font-medium">Asal Sekolah:</span>
                  <span className="font-semibold text-slate-800">{selectedSantri.asalSekolah || '-'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400 font-medium">No HP Orang Tua:</span>
                  <span className="font-semibold text-slate-800 font-mono">{selectedSantri.nomorHpOrangTua}</span>
                </div>
              </div>

              {/* Parents info */}
              <div className="space-y-2 bg-slate-50 border border-slate-100 rounded-xl p-3.5">
                <div className="flex justify-between">
                  <span className="text-slate-400 font-medium">Nama Ayah:</span>
                  <span className="font-semibold text-slate-800">{selectedSantri.namaAyah || '-'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400 font-medium">Nama Ibu:</span>
                  <span className="font-semibold text-slate-800">{selectedSantri.namaIbu || '-'}</span>
                </div>
                <div className="pt-2 border-t border-slate-150">
                  <span className="text-slate-400 font-medium block mb-1">Alamat Lengkap:</span>
                  <span className="text-slate-800 italic leading-relaxed">
                    {selectedSantri.alamat ? `${selectedSantri.alamat}, ` : ''}
                    {selectedSantri.desa ? `Desa ${selectedSantri.desa}, ` : ''}
                    {selectedSantri.kecamatan ? `Kec. ${selectedSantri.kecamatan}, ` : ''}
                    {selectedSantri.kabupatenKota ? `${selectedSantri.kabupatenKota}, ` : ''}
                    {selectedSantri.provinsi || ''}
                  </span>
                </div>
              </div>

              {/* Checkbox berkas summary */}
              <div className="bg-slate-50 border border-slate-100 rounded-xl p-3.5">
                <span className="text-slate-400 font-medium block mb-2">Checklist Berkas Fisik:</span>
                <div className="grid grid-cols-2 gap-2 text-[11px]">
                  <div className="flex items-center gap-1.5 font-semibold text-slate-700">
                    <span className={`w-2 h-2 rounded-full ${selectedSantri.berkas?.kk ? 'bg-emerald-500' : 'bg-red-500'}`} />
                    <span>Kartu Keluarga:</span>
                    <span className={selectedSantri.berkas?.kk ? 'text-emerald-600' : 'text-red-500'}>
                      {selectedSantri.berkas?.kk ? 'Lengkap' : 'Belum'}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 font-semibold text-slate-700">
                    <span className={`w-2 h-2 rounded-full ${selectedSantri.berkas?.akta ? 'bg-emerald-500' : 'bg-red-500'}`} />
                    <span>Akta Kelahiran:</span>
                    <span className={selectedSantri.berkas?.akta ? 'text-emerald-600' : 'text-red-500'}>
                      {selectedSantri.berkas?.akta ? 'Lengkap' : 'Belum'}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 font-semibold text-slate-700">
                    <span className={`w-2 h-2 rounded-full ${selectedSantri.berkas?.ktpOrtu ? 'bg-emerald-500' : 'bg-red-500'}`} />
                    <span>KTP Orang Tua:</span>
                    <span className={selectedSantri.berkas?.ktpOrtu ? 'text-emerald-600' : 'text-red-500'}>
                      {selectedSantri.berkas?.ktpOrtu ? 'Lengkap' : 'Belum'}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 font-semibold text-slate-700">
                    <span className={`w-2 h-2 rounded-full ${selectedSantri.berkas?.sklIjazah ? 'bg-emerald-500' : 'bg-red-500'}`} />
                    <span>Ijazah / SKL:</span>
                    <span className={selectedSantri.berkas?.sklIjazah ? 'text-emerald-600' : 'text-red-500'}>
                      {selectedSantri.berkas?.sklIjazah ? 'Lengkap' : 'Belum'}
                    </span>
                  </div>
                </div>
              </div>
              
              {/* User Verification Status */}
              {(selectedSantri.userVerificationStatus === 'Verified' || selectedSantri.userVerificationStatus === 'Correction Requested') && (
                <div className={`border rounded-xl p-3.5 ${
                  selectedSantri.userVerificationStatus === 'Verified' 
                    ? 'bg-emerald-50 border-emerald-100 text-emerald-800'
                    : 'bg-amber-50 border-amber-100 text-amber-800'
                }`}>
                  <span className="font-bold uppercase tracking-wider block text-[10px] opacity-70 mb-1">Status Verifikasi User</span>
                  <div className="flex items-start gap-2">
                    {selectedSantri.userVerificationStatus === 'Verified' ? (
                      <CheckCircle size={16} className="mt-0.5 shrink-0" />
                    ) : (
                      <AlertCircle size={16} className="mt-0.5 shrink-0" />
                    )}
                    <div>
                      <p className="font-bold">
                        {selectedSantri.userVerificationStatus === 'Verified' 
                          ? 'Data disetujui (benar) oleh User' 
                          : 'User mengajukan perbaikan data'}
                      </p>
                      {selectedSantri.correctionRequestMessage && (
                        <p className="mt-1 italic text-opacity-80">
                          "{selectedSantri.correctionRequestMessage}"
                        </p>
                      )}
                      {selectedSantri.tanggalVerifikasiUser && (
                        <p className="mt-1 text-[10px] opacity-60">
                          {new Date(selectedSantri.tanggalVerifikasiUser).toLocaleString('id-ID')}
                        </p>
                      )}
                      {selectedSantri.userVerificationStatus === 'Correction Requested' && onNavigateToMaster && (
                        <button
                          onClick={() => {
                            setSelectedSantri(null);
                            onNavigateToMaster(selectedSantri.nomorPendaftaran);
                          }}
                          className="mt-3 bg-amber-600 hover:bg-amber-700 text-white font-bold py-1.5 px-3 rounded-lg text-[10px] transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
                        >
                          <span>Perbaiki Data {getTerminology(appSettings, { capitalize: true })}</span>
                          <ArrowRight size={12} />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Status Update Actions */}
              <div className="pt-3 border-t border-slate-100 space-y-2.5">
                <span className="text-slate-500 font-bold uppercase tracking-wider block text-[10px]">Ubah Status Verifikasi</span>
                
                <div className="flex gap-2">
                  <button
                    onClick={() => handleUpdateStatus(selectedSantri.nomorPendaftaran, 'Valid')}
                    className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl font-bold cursor-pointer text-xs transition-all shadow-xs ${
                      selectedSantri.statusValidasi === 'Valid'
                        ? 'bg-emerald-600 text-white cursor-default'
                        : 'bg-white border border-emerald-200 text-emerald-700 hover:bg-emerald-50/50'
                    }`}
                  >
                    <CheckCircle size={15} />
                    <span>Tandai VALID</span>
                  </button>

                  <button
                    onClick={() => handleUpdateStatus(selectedSantri.nomorPendaftaran, 'Tidak Valid')}
                    className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl font-bold cursor-pointer text-xs transition-all shadow-xs ${
                      selectedSantri.statusValidasi === 'Tidak Valid'
                        ? 'bg-red-600 text-white cursor-default'
                        : 'bg-white border border-red-200 text-red-700 hover:bg-red-50/50'
                    }`}
                  >
                    <XCircle size={15} />
                    <span>Tandai TIDAK VALID</span>
                  </button>
                </div>

                {selectedSantri.statusValidasi && selectedSantri.statusValidasi !== 'Belum Divalidasi' && (
                  <button
                    onClick={() => handleUpdateStatus(selectedSantri.nomorPendaftaran, 'Belum Divalidasi')}
                    className="w-full flex items-center justify-center gap-1.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-semibold cursor-pointer text-xs transition-all"
                  >
                    <RefreshCw size={13} />
                    <span>Setel Ulang Ke Belum Diverifikasi</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
      </div>
    </div>
  );
}
