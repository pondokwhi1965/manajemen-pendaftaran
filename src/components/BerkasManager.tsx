import React, { useState } from 'react';
import { Santri, Role, AppSettings, getTerminology } from '../types';
import { 
  Search, 
  Filter, 
  FileCheck, 
  File, 
  Check, 
  X, 
  AlertCircle,
  CheckSquare,
  Sparkles,
  Award,
  Trash2
} from 'lucide-react';

interface BerkasManagerProps {
  santriList: Santri[];
  activeRole: Role;
  onEditSantri: (nomorPendaftaran: string, data: Partial<Santri>) => { success: boolean; error?: string } | void;
  onDeleteSantri?: (nomorPendaftaran: string) => void;
  appSettings?: AppSettings;
}

export function BerkasManager({ santriList, activeRole, onEditSantri, onDeleteSantri, appSettings }: BerkasManagerProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [jenjangFilter, setJenjangFilter] = useState<string>('semua');
  const [completenessFilter, setCompletenessFilter] = useState<string>('semua');
  const [selectedSantriIds, setSelectedSantriIds] = useState<string[]>([]);
  
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const toggleSelectSantri = (id: string) => {
    setSelectedSantriIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const toggleSelectAll = (list: Santri[]) => {
    if (selectedSantriIds.length === list.length && list.length > 0) {
      setSelectedSantriIds([]);
    } else {
      setSelectedSantriIds(list.map(s => s.nomorPendaftaran));
    }
  };

  const handleBulkMarkComplete = () => {
    selectedSantriIds.forEach(id => {
      onEditSantri(id, { 
        berkas: { kk: true, akta: true, ktpOrtu: true, sklIjazah: true } 
      });
    });
    setSuccessMsg(`Berhasil menandai ${selectedSantriIds.length} data LENGKAP.`);
    setSelectedSantriIds([]);
    setTimeout(() => setSuccessMsg(''), 3000);
  };

  const handleBulkDelete = () => {
    if (onDeleteSantri && confirm(`Apakah Anda yakin ingin menghapus ${selectedSantriIds.length} data?`)) {
      selectedSantriIds.forEach(id => onDeleteSantri(id));
      setSelectedSantriIds([]);
    }
  };

  const [sortConfig, setSortConfig] = useState<{ key: keyof Santri; direction: 'asc' | 'desc' }>({
    key: 'nomorPendaftaran',
    direction: 'asc'
  });

  // Count overall stats
  const total = santriList.length;
  
  const countDocs = () => {
    let kkCount = 0;
    let aktaCount = 0;
    let ktpCount = 0;
    let sklCount = 0;
    let allComplete = 0;

    santriList.forEach(s => {
      const b = s.berkas || { kk: false, akta: false, ktpOrtu: false, sklIjazah: false };
      if (b.kk) kkCount++;
      if (b.akta) aktaCount++;
      if (b.ktpOrtu) ktpCount++;
      if (b.sklIjazah) sklCount++;
      if (b.kk && b.akta && b.ktpOrtu && b.sklIjazah) {
        allComplete++;
      }
    });

    return { kkCount, aktaCount, ktpCount, sklCount, allComplete };
  };

  const stats = countDocs();

  // Filter list
  const filteredList = santriList.filter(s => {
    const matchesSearch = s.nama.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          s.nomorPendaftaran.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesJenjang = jenjangFilter === 'semua' || s.jenjang === jenjangFilter;
    
    const b = s.berkas || { kk: false, akta: false, ktpOrtu: false, sklIjazah: false };
    const isLengkap = b.kk && b.akta && b.ktpOrtu && b.sklIjazah;
    
    let matchesCompleteness = true;
    if (completenessFilter === 'lengkap') {
      matchesCompleteness = isLengkap;
    } else if (completenessFilter === 'belum') {
      matchesCompleteness = !isLengkap;
    }

    return matchesSearch && matchesJenjang && matchesCompleteness;
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

  const handleToggleBerkas = (s: Santri, docKey: 'kk' | 'akta' | 'ktpOrtu' | 'sklIjazah', currentValue: boolean) => {
    setErrorMsg('');
    setSuccessMsg('');

    const currentBerkas = s.berkas || { kk: false, akta: false, ktpOrtu: false, sklIjazah: false };
    const updatedBerkas = {
      ...currentBerkas,
      [docKey]: !currentValue
    };

    const result = onEditSantri(s.nomorPendaftaran, { berkas: updatedBerkas });
    
    if (result && !result.success) {
      setErrorMsg(result.error || 'Gagal mengubah status berkas.');
    } else {
      const docNames = {
        kk: 'Kartu Keluarga',
        akta: 'Akta Kelahiran',
        ktpOrtu: 'KTP Orang Tua',
        sklIjazah: 'SKL/Ijazah'
      };
      setSuccessMsg(`Berhasil memperbarui berkas ${docNames[docKey]} untuk ${getTerminology(appSettings)} ${s.nama}.`);
      setTimeout(() => setSuccessMsg(''), 2000);
    }
  };

  // Toggle all documents to complete for a student
  const handleMarkAllComplete = (s: Santri) => {
    setErrorMsg('');
    setSuccessMsg('');
    
    const allCompleteBerkas = {
      kk: true,
      akta: true,
      ktpOrtu: true,
      sklIjazah: true
    };

    const result = onEditSantri(s.nomorPendaftaran, { berkas: allCompleteBerkas });
    if (result && !result.success) {
      setErrorMsg(result.error || 'Gagal mengubah status berkas.');
    } else {
      setSuccessMsg(`Berhasil menandai semua berkas LENGKAP untuk ${s.nama}.`);
      setTimeout(() => setSuccessMsg(''), 2000);
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">Manajemen Kelengkapan Berkas Persyaratan</h2>
          <p className="text-xs text-slate-500 mt-1">Kelola dan pantau kelengkapan berkas fisik (KK, Akta, KTP Ortu, Ijazah) milik masing-masing {getTerminology(appSettings)} baru.</p>
        </div>
        <div className="flex items-center gap-2 bg-slate-50 border border-slate-100 px-3 py-1.5 rounded-xl text-xs text-slate-600 font-medium">
          <span>Akses Edit:</span>
          <span className="bg-indigo-600 text-white font-bold px-2 py-0.5 rounded-md text-[10px]">{activeRole}</span>
        </div>
      </div>

      {/* Stats Cards Row */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs flex flex-col justify-between">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">KK Terkumpul</span>
          <div className="flex items-baseline justify-between mt-2">
            <span className="text-xl font-bold text-slate-800">{stats.kkCount} <span className="text-xs font-normal text-slate-400">/ {total}</span></span>
            <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded">
              {total > 0 ? Math.round((stats.kkCount / total) * 100) : 0}%
            </span>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs flex flex-col justify-between">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Akta Terkumpul</span>
          <div className="flex items-baseline justify-between mt-2">
            <span className="text-xl font-bold text-slate-800">{stats.aktaCount} <span className="text-xs font-normal text-slate-400">/ {total}</span></span>
            <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded">
              {total > 0 ? Math.round((stats.aktaCount / total) * 100) : 0}%
            </span>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs flex flex-col justify-between">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">KTP Wali Terkumpul</span>
          <div className="flex items-baseline justify-between mt-2">
            <span className="text-xl font-bold text-slate-800">{stats.ktpCount} <span className="text-xs font-normal text-slate-400">/ {total}</span></span>
            <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded">
              {total > 0 ? Math.round((stats.ktpCount / total) * 100) : 0}%
            </span>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs flex flex-col justify-between">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Ijazah Terkumpul</span>
          <div className="flex items-baseline justify-between mt-2">
            <span className="text-xl font-bold text-slate-800">{stats.sklCount} <span className="text-xs font-normal text-slate-400">/ {total}</span></span>
            <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded">
              {total > 0 ? Math.round((stats.sklCount / total) * 100) : 0}%
            </span>
          </div>
        </div>

        <div className="bg-indigo-50 border border-indigo-200/50 rounded-2xl p-4 shadow-xs col-span-2 md:col-span-1 flex flex-col justify-between">
          <span className="text-[10px] font-bold text-indigo-700 uppercase tracking-wider block">100% Lengkap</span>
          <div className="flex items-baseline justify-between mt-2">
            <span className="text-xl font-bold text-indigo-900">{stats.allComplete} <span className="text-xs font-normal text-indigo-400">/ {total}</span></span>
            <span className="text-[10px] font-bold text-indigo-600 bg-indigo-100 px-1.5 py-0.5 rounded">
              {total > 0 ? Math.round((stats.allComplete / total) * 100) : 0}%
            </span>
          </div>
        </div>
      </div>

      {/* Alerts */}
      {successMsg && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold p-3 py-2.5 rounded-xl flex items-center gap-2">
          <Check size={14} className="text-emerald-600 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}
      {errorMsg && (
        <div className="bg-red-50 border border-red-200 text-red-800 text-xs font-semibold p-3 py-2.5 rounded-xl flex items-center gap-2">
          <AlertCircle size={14} className="text-red-600 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Search and Filters */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
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
                value={completenessFilter}
                onChange={(e) => setCompletenessFilter(e.target.value)}
                className="px-2.5 py-1.5 text-xs border border-slate-200 rounded-xl bg-white focus:outline-hidden focus:ring-1 focus:ring-emerald-500 font-semibold text-slate-600"
              >
                <option value="semua">Semua Kelengkapan</option>
                <option value="lengkap">100% Lengkap</option>
                <option value="belum">Ada Belum Lengkap</option>
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
          <div className="bg-indigo-50 border-b border-indigo-100 p-4 flex items-center justify-between animate-in slide-in-from-top duration-200">
            <div className="flex items-center gap-3">
              <span className="text-xs font-bold text-indigo-800">
                {selectedSantriIds.length} {getTerminology(appSettings)} dipilih
              </span>
              <div className="h-4 w-px bg-indigo-200 mx-1"></div>
              <button 
                onClick={handleBulkMarkComplete}
                className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-[10px] font-bold transition-all shadow-sm flex items-center gap-1.5 cursor-pointer"
              >
                <Check size={12} />
                Tandai Lengkap Semua
              </button>
            </div>
            <div className="flex items-center gap-2">
              <button 
                onClick={handleBulkDelete}
                className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-lg text-[10px] font-bold transition-all shadow-sm flex items-center gap-1.5 cursor-pointer"
              >
                <Trash2 size={12} className="hidden" /> {/* Using simple text if Trash2 not imported, but wait I'll import it */}
                Hapus Terpilih
              </button>
              <button 
                onClick={() => setSelectedSantriIds([])}
                className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-all cursor-pointer"
              >
                <X size={14} />
              </button>
            </div>
          </div>
        )}

        {/* Interactive Checklist Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-100 text-[10px] font-bold text-slate-400 uppercase bg-slate-50">
                <th className="py-3 px-4 text-center w-10">
                  <input 
                    type="checkbox" 
                    className="rounded text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                    checked={selectedSantriIds.length === sortedList.length && sortedList.length > 0}
                    onChange={() => toggleSelectAll(sortedList)}
                  />
                </th>
                <th 
                  className="py-3.5 px-4 cursor-pointer hover:bg-slate-100 transition-colors"
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
                  className="py-3.5 px-4 cursor-pointer hover:bg-slate-100 transition-colors"
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
                  className="py-3.5 px-3 cursor-pointer hover:bg-slate-100 transition-colors"
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
                  className="py-3.5 px-3 cursor-pointer hover:bg-slate-100 transition-colors"
                  onClick={() => requestSort('jenjang')}
                >
                  <div className="flex items-center gap-1">
                    Jenjang
                    {sortConfig.key === 'jenjang' && (
                      <span>{sortConfig.direction === 'asc' ? '↑' : '↓'}</span>
                    )}
                  </div>
                </th>
                <th className="py-3.5 px-4 text-center">KK</th>
                <th className="py-3.5 px-4 text-center">Akta Lahir</th>
                <th className="py-3.5 px-4 text-center">KTP Ortu</th>
                <th className="py-3.5 px-4 text-center">Ijazah / SKL</th>
                <th className="py-3.5 px-4 text-center">Kelengkapan</th>
                <th className="py-3.5 px-4 text-right">Opsi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {sortedList.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-400 text-xs">
                    Tidak ada data santri yang cocok dengan filter kelengkapan berkas.
                  </td>
                </tr>
              ) : (
                sortedList.map((s) => {
                  const b = s.berkas || { kk: false, akta: false, ktpOrtu: false, sklIjazah: false };
                  const isLengkap = b.kk && b.akta && b.ktpOrtu && b.sklIjazah;
                  
                  // Count complete documents
                  const completedCount = [b.kk, b.akta, b.ktpOrtu, b.sklIjazah].filter(Boolean).length;

                  return (
                    <tr key={s.nomorPendaftaran} className="hover:bg-slate-50/30 text-xs transition-colors">
                      <td className="py-3 px-4 text-center">
                        <input 
                          type="checkbox" 
                          className="rounded text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                          checked={selectedSantriIds.includes(s.nomorPendaftaran)}
                          onChange={() => toggleSelectSantri(s.nomorPendaftaran)}
                        />
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-mono font-bold text-emerald-600 text-[10px]">{s.nomorPendaftaran}</div>
                      </td>
                      <td className="py-3 px-4 font-bold text-slate-900 text-sm">
                        {s.nama}
                      </td>
                      <td className="py-3 px-3">
                        <span className="text-[10px] font-bold text-slate-500">{s.jenisKelamin === 'Laki-laki' ? 'L' : 'P'}</span>
                      </td>
                      <td className="py-3 px-3">
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-slate-100 text-slate-600">
                          {s.jenjang.split(' ')[0]} {/* SDI, SMP, SMK */}
                        </span>
                      </td>

                      {/* KK Checkbox Column */}
                      <td className="py-3 px-4 text-center">
                        <div className="flex justify-center">
                          <button
                            onClick={() => handleToggleBerkas(s, 'kk', b.kk)}
                            className={`w-6 h-6 rounded-lg border flex items-center justify-center transition-all cursor-pointer ${
                              b.kk 
                                ? 'bg-emerald-50 border-emerald-300 text-emerald-600 shadow-xs' 
                                : 'bg-slate-50 border-slate-200 text-slate-300 hover:border-slate-300 hover:bg-slate-100/50'
                            }`}
                          >
                            <Check size={14} className={b.kk ? 'stroke-[3px]' : 'opacity-0'} />
                          </button>
                        </div>
                      </td>

                      {/* Akta Checkbox Column */}
                      <td className="py-3 px-4 text-center">
                        <div className="flex justify-center">
                          <button
                            onClick={() => handleToggleBerkas(s, 'akta', b.akta)}
                            className={`w-6 h-6 rounded-lg border flex items-center justify-center transition-all cursor-pointer ${
                              b.akta 
                                ? 'bg-emerald-50 border-emerald-300 text-emerald-600 shadow-xs' 
                                : 'bg-slate-50 border-slate-200 text-slate-300 hover:border-slate-300 hover:bg-slate-100/50'
                            }`}
                          >
                            <Check size={14} className={b.akta ? 'stroke-[3px]' : 'opacity-0'} />
                          </button>
                        </div>
                      </td>

                      {/* KTP Ortu Checkbox Column */}
                      <td className="py-3 px-4 text-center">
                        <div className="flex justify-center">
                          <button
                            onClick={() => handleToggleBerkas(s, 'ktpOrtu', b.ktpOrtu)}
                            className={`w-6 h-6 rounded-lg border flex items-center justify-center transition-all cursor-pointer ${
                              b.ktpOrtu 
                                ? 'bg-emerald-50 border-emerald-300 text-emerald-600 shadow-xs' 
                                : 'bg-slate-50 border-slate-200 text-slate-300 hover:border-slate-300 hover:bg-slate-100/50'
                            }`}
                          >
                            <Check size={14} className={b.ktpOrtu ? 'stroke-[3px]' : 'opacity-0'} />
                          </button>
                        </div>
                      </td>

                      {/* SKL/Ijazah Checkbox Column */}
                      <td className="py-3 px-4 text-center">
                        <div className="flex justify-center">
                          <button
                            onClick={() => handleToggleBerkas(s, 'sklIjazah', b.sklIjazah)}
                            className={`w-6 h-6 rounded-lg border flex items-center justify-center transition-all cursor-pointer ${
                              b.sklIjazah 
                                ? 'bg-emerald-50 border-emerald-300 text-emerald-600 shadow-xs' 
                                : 'bg-slate-50 border-slate-200 text-slate-300 hover:border-slate-300 hover:bg-slate-100/50'
                            }`}
                          >
                            <Check size={14} className={b.sklIjazah ? 'stroke-[3px]' : 'opacity-0'} />
                          </button>
                        </div>
                      </td>

                      {/* Progress/Completeness Column */}
                      <td className="py-3 px-4 text-center">
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold block w-fit mx-auto ${
                          isLengkap 
                            ? 'bg-emerald-100 text-emerald-700' 
                            : completedCount > 0 
                            ? 'bg-amber-100 text-amber-700' 
                            : 'bg-slate-100 text-slate-400'
                        }`}>
                          {isLengkap ? '100% Lengkap' : `${completedCount} / 4 Berkas`}
                        </span>
                      </td>

                      {/* Actions Column */}
                      <td className="py-3 px-4 text-right">
                        {!isLengkap && (
                          <button
                            onClick={() => handleMarkAllComplete(s)}
                            className="text-[10px] font-bold text-indigo-600 hover:text-white bg-indigo-50 hover:bg-indigo-600 border border-indigo-150 rounded-lg px-2 py-1 transition-all cursor-pointer"
                          >
                            Tandai Lengkap
                          </button>
                        )}
                        {isLengkap && (
                          <span className="text-emerald-600 font-bold text-[10px] uppercase flex items-center justify-end gap-1">
                            <FileCheck size={12} /> Selesai
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
