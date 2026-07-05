import React, { useState } from 'react';
import { Santri, Role, getTerminology } from '../types';
import { 
  Search, 
  CreditCard, 
  CheckCircle, 
  AlertTriangle, 
  Eye, 
  RefreshCw, 
  BadgeCent, 
  Users, 
  TrendingUp, 
  BookOpen, 
  Layers,
  Sparkles,
  ArrowRight
} from 'lucide-react';
import { motion } from 'motion/react';

interface DataPembayaranManagerProps {
  santriList: Santri[];
  tagihanMap: Record<string, { id: string; jenisBiaya: string; nominal: number; terbayar: number }[]>;
  activeRole: Role;
  onNavigateToPembayaran: (nomorPendaftaran: string) => void;
  appSettings: any;
}

export function DataPembayaranManager({
  santriList,
  tagihanMap,
  activeRole,
  onNavigateToPembayaran,
  appSettings
}: DataPembayaranManagerProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterJenjang, setFilterJenjang] = useState('All');
  const [filterGelombang, setFilterGelombang] = useState('All');
  const [filterStatus, setFilterStatus] = useState('All');
  
  // Detail Modal States
  const [selectedSantri, setSelectedSantri] = useState<Santri | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  // Sorting State
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' }>({
    key: 'nomorPendaftaran',
    direction: 'asc'
  });

  const getBillingSummary = (noReg: string) => {
    const items = tagihanMap[noReg] || [];
    const total = items.reduce((acc, i) => acc + i.nominal, 0);
    const paid = items.reduce((acc, i) => acc + i.terbayar, 0);
    const sisa = total - paid;
    return { items, total, paid, sisa };
  };

  // Calculations for overall summary cards
  let grandTotalTagihan = 0;
  let grandTotalTerbayar = 0;
  let grandTotalSisa = 0;

  santriList.forEach(s => {
    const summary = getBillingSummary(s.nomorPendaftaran);
    grandTotalTagihan += summary.total;
    grandTotalTerbayar += summary.paid;
    grandTotalSisa += summary.sisa;
  });

  const progressPercentage = grandTotalTagihan > 0 
    ? Math.round((grandTotalTerbayar / grandTotalTagihan) * 100) 
    : 0;

  // Filter list
  const filteredList = santriList.filter(s => {
    const matchesSearch = s.nama.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          s.nomorPendaftaran.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesJenjang = filterJenjang === 'All' || s.jenjang === filterJenjang;
    const matchesGelombang = filterGelombang === 'All' || s.gelombangPendaftaran === filterGelombang;
    
    const summary = getBillingSummary(s.nomorPendaftaran);
    let computedStatus = 'Belum Bayar';
    if (summary.paid >= summary.total && summary.total > 0) {
      computedStatus = 'Lunas';
    } else if (summary.paid > 0) {
      computedStatus = 'Cicilan';
    }

    const matchesStatus = filterStatus === 'All' || computedStatus === filterStatus;

    return matchesSearch && matchesJenjang && matchesGelombang && matchesStatus;
  });

  // Sorting handler
  const requestSort = (key: string) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const sortedList = [...filteredList].sort((a, b) => {
    if (sortConfig.key === 'nomorPendaftaran' || sortConfig.key === 'nama' || sortConfig.key === 'jenjang') {
      const aVal = a[sortConfig.key as keyof Santri] ?? '';
      const bVal = b[sortConfig.key as keyof Santri] ?? '';
      if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
    } else if (sortConfig.key === 'total' || sortConfig.key === 'paid' || sortConfig.key === 'sisa') {
      const aSummary = getBillingSummary(a.nomorPendaftaran);
      const bSummary = getBillingSummary(b.nomorPendaftaran);
      const aVal = sortConfig.key === 'total' ? aSummary.total : sortConfig.key === 'paid' ? aSummary.paid : aSummary.sisa;
      const bVal = sortConfig.key === 'total' ? bSummary.total : sortConfig.key === 'paid' ? bSummary.paid : bSummary.sisa;
      return sortConfig.direction === 'asc' ? aVal - bVal : bVal - aVal;
    }
    return 0;
  });

  const openDetailModal = (s: Santri) => {
    setSelectedSantri(s);
    setShowDetailModal(true);
  };

  return (
    <div className="space-y-6">
      {/* Title */}
      <div>
        <h1 className="text-xl font-bold text-slate-900 tracking-tight">Rangkuman Data Pembayaran {getTerminology(appSettings, { capitalize: true })}</h1>
        <p className="text-xs text-slate-500">Pemantauan rincian tagihan, akumulasi setoran loket, sisa piutang, dan status pembayaran {getTerminology(appSettings)} baru</p>
      </div>

      {/* Top Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total Target */}
        <div className="bg-white border border-slate-100 rounded-xl p-4 shadow-xs flex items-center gap-4">
          <div className="bg-blue-50 text-blue-600 w-10 h-10 rounded-lg flex items-center justify-center shrink-0 border border-blue-100">
            <BadgeCent size={20} />
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Tagihan</p>
            <p className="text-sm font-bold text-slate-900 mt-0.5">Rp {grandTotalTagihan.toLocaleString('id-ID')}</p>
          </div>
        </div>

        {/* Card 2: Total Terbayar */}
        <div className="bg-white border border-slate-100 rounded-xl p-4 shadow-xs flex items-center gap-4">
          <div className="bg-emerald-50 text-emerald-600 w-10 h-10 rounded-lg flex items-center justify-center shrink-0 border border-emerald-100">
            <TrendingUp size={20} />
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Terbayar</p>
            <p className="text-sm font-bold text-emerald-700 mt-0.5">Rp {grandTotalTerbayar.toLocaleString('id-ID')}</p>
          </div>
        </div>

        {/* Card 3: Total Sisa Piutang */}
        <div className="bg-white border border-slate-100 rounded-xl p-4 shadow-xs flex items-center gap-4">
          <div className="bg-rose-50 text-rose-600 w-10 h-10 rounded-lg flex items-center justify-center shrink-0 border border-rose-100">
            <AlertTriangle size={20} />
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Sisa Piutang</p>
            <p className="text-sm font-bold text-rose-700 mt-0.5">Rp {grandTotalSisa.toLocaleString('id-ID')}</p>
          </div>
        </div>

        {/* Card 4: Persentase Pelunasan */}
        <div className="bg-white border border-slate-100 rounded-xl p-4 shadow-xs flex flex-col justify-center space-y-2">
          <div className="flex items-center justify-between text-[10px] font-bold text-slate-400 uppercase tracking-wider">
            <span>Rasio Pelunasan</span>
            <span className="text-emerald-600 font-extrabold">{progressPercentage}%</span>
          </div>
          <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
            <div className="bg-emerald-500 h-full rounded-full transition-all duration-500" style={{ width: `${progressPercentage}%` }}></div>
          </div>
        </div>
      </div>

      {/* Filters & Actions Panel */}
      <div className="bg-white border border-slate-100 rounded-xl p-4 shadow-xs space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Search bar */}
          <div className="relative">
            <Search className="absolute left-3 top-2.5 text-slate-400" size={16} />
            <input
              type="text"
              placeholder="Cari nama / no. pendaftaran..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 pr-4 py-2 text-xs border border-slate-200 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-emerald-500 w-full bg-slate-50 font-medium"
            />
          </div>

          {/* Jenjang Select */}
          <div>
            <select
              value={filterJenjang}
              onChange={(e) => setFilterJenjang(e.target.value)}
              className="px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-emerald-500 w-full bg-slate-50 font-medium"
            >
              <option value="All">Semua Jenjang</option>
              {(appSettings?.jenjangOptions || ['SDI AL-HIDAYAH', 'SMP AL-HIDAYAH', 'SMK AL-HIDAYAH']).map(opt => (
                <option key={opt} value={opt}>{opt}</option>
              ))}
            </select>
          </div>

          {/* Gelombang Select */}
          <div>
            <select
              value={filterGelombang}
              onChange={(e) => setFilterGelombang(e.target.value)}
              className="px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-emerald-500 w-full bg-slate-50 font-medium"
            >
              <option value="All">Semua Gelombang</option>
              {(appSettings?.gelombangOptions || ['Gelombang 1', 'Gelombang 2', 'Gelombang 3']).map(opt => (
                <option key={opt} value={opt}>{opt}</option>
              ))}
            </select>
          </div>

          {/* Status Select */}
          <div>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-emerald-500 w-full bg-slate-50 font-medium"
            >
              <option value="All">Semua Status Bayar</option>
              <option value="Lunas">Lunas</option>
              <option value="Cicilan">Cicilan</option>
              <option value="Belum Bayar">Belum Bayar</option>
            </select>
          </div>
        </div>
      </div>

      {/* Main Table */}
      <div className="bg-white border border-slate-100 rounded-xl shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-100 text-xs font-bold text-slate-400 uppercase tracking-wider bg-slate-50/70">
                <th className="py-3 px-4 cursor-pointer hover:bg-slate-100/50 transition-colors" onClick={() => requestSort('nomorPendaftaran')}>
                  <div className="flex items-center gap-1">
                    No. Registrasi
                    {sortConfig.key === 'nomorPendaftaran' && (
                      <span>{sortConfig.direction === 'asc' ? '↑' : '↓'}</span>
                    )}
                  </div>
                </th>
                <th className="py-3 px-4 cursor-pointer hover:bg-slate-100/50 transition-colors" onClick={() => requestSort('nama')}>
                  <div className="flex items-center gap-1">
                    Nama {getTerminology(appSettings, { capitalize: true })}
                    {sortConfig.key === 'nama' && (
                      <span>{sortConfig.direction === 'asc' ? '↑' : '↓'}</span>
                    )}
                  </div>
                </th>
                <th className="py-3 px-4">L/P</th>
                <th className="py-3 px-4 cursor-pointer hover:bg-slate-100/50 transition-colors" onClick={() => requestSort('jenjang')}>
                  <div className="flex items-center gap-1">
                    Jenjang & Gelombang
                    {sortConfig.key === 'jenjang' && (
                      <span>{sortConfig.direction === 'asc' ? '↑' : '↓'}</span>
                    )}
                  </div>
                </th>
                <th className="py-3 px-4 cursor-pointer hover:bg-slate-100/50 transition-colors" onClick={() => requestSort('total')}>
                  <div className="flex items-center gap-1">
                    Jumlah Tagihan
                    {sortConfig.key === 'total' && (
                      <span>{sortConfig.direction === 'asc' ? '↑' : '↓'}</span>
                    )}
                  </div>
                </th>
                <th className="py-3 px-4 cursor-pointer hover:bg-slate-100/50 transition-colors" onClick={() => requestSort('paid')}>
                  <div className="flex items-center gap-1">
                    Sudah Dibayar
                    {sortConfig.key === 'paid' && (
                      <span>{sortConfig.direction === 'asc' ? '↑' : '↓'}</span>
                    )}
                  </div>
                </th>
                <th className="py-3 px-4 cursor-pointer hover:bg-slate-100/50 transition-colors" onClick={() => requestSort('sisa')}>
                  <div className="flex items-center gap-1">
                    Sisa Tagihan
                    {sortConfig.key === 'sisa' && (
                      <span>{sortConfig.direction === 'asc' ? '↑' : '↓'}</span>
                    )}
                  </div>
                </th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {sortedList.length > 0 ? (
                sortedList.map((s) => {
                  const bill = getBillingSummary(s.nomorPendaftaran);
                  let computedStatus = 'Belum Bayar';
                  let badgeClass = 'bg-rose-50 text-rose-700 border-rose-100';
                  
                  if (bill.paid >= bill.total && bill.total > 0) {
                    computedStatus = 'Lunas';
                    badgeClass = 'bg-emerald-50 text-emerald-700 border-emerald-100';
                  } else if (bill.paid > 0) {
                    computedStatus = 'Cicilan';
                    badgeClass = 'bg-amber-50 text-amber-700 border-amber-100';
                  }

                  return (
                    <tr key={s.nomorPendaftaran} className="hover:bg-slate-50/40 transition-colors">
                      {/* No Reg */}
                      <td className="py-3 px-4 font-mono font-bold text-slate-900">{s.nomorPendaftaran}</td>
                      
                      {/* Nama */}
                      <td className="py-3 px-4 font-semibold text-slate-800">{s.nama}</td>
                      
                      {/* L/P */}
                      <td className="py-3 px-4">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          s.jenisKelamin === 'Laki-laki' ? 'bg-blue-50 text-blue-700' : 'bg-pink-50 text-pink-700'
                        }`}>
                          {s.jenisKelamin === 'Laki-laki' ? 'L' : 'P'}
                        </span>
                      </td>

                      {/* Jenjang */}
                      <td className="py-3 px-4 space-y-0.5">
                        <div className="text-[10px] font-bold text-slate-600">{s.jenjang}</div>
                        <div className="text-[9px] text-slate-400 font-medium">{s.gelombangPendaftaran}</div>
                      </td>

                      {/* Tagihan */}
                      <td className="py-3 px-4 font-mono font-medium text-slate-900">Rp {bill.total.toLocaleString('id-ID')}</td>

                      {/* Terbayar */}
                      <td className="py-3 px-4 font-mono font-bold text-emerald-600">Rp {bill.paid.toLocaleString('id-ID')}</td>

                      {/* Sisa */}
                      <td className="py-3 px-4 font-mono font-semibold text-rose-600">Rp {bill.sisa.toLocaleString('id-ID')}</td>

                      {/* Status */}
                      <td className="py-3 px-4 text-center">
                        <span className={`px-2 py-1 rounded-full border text-[10px] font-extrabold ${badgeClass}`}>
                          {computedStatus.toUpperCase()}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => openDetailModal(s)}
                            className="p-1.5 text-slate-500 hover:text-emerald-700 hover:bg-slate-50 rounded-lg transition-all cursor-pointer"
                            title="Rincian Tagihan & Pembayaran"
                          >
                            <Eye size={15} />
                          </button>
                          
                          {computedStatus !== 'Lunas' && (
                            <button
                              onClick={() => onNavigateToPembayaran(s.nomorPendaftaran)}
                              className="bg-emerald-600 hover:bg-emerald-700 text-white px-2 py-1 rounded-lg text-[10px] font-bold transition-all cursor-pointer flex items-center gap-1 shadow-xs"
                              title="Bayar Sekarang"
                            >
                              <CreditCard size={11} />
                              <span>Bayar</span>
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={9} className="py-10 text-center text-slate-400">
                    Tidak ditemukan data pembayaran {getTerminology(appSettings)} yang cocok.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* DETAIL MODAL */}
      {showDetailModal && selectedSantri && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="bg-emerald-950 text-white px-6 py-4 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-sm tracking-tight">Rincian Pembayaran {getTerminology(appSettings, { capitalize: true })}</h3>
                <p className="text-[10px] text-emerald-300">No. Registrasi: {selectedSantri.nomorPendaftaran}</p>
              </div>
              <button 
                onClick={() => setShowDetailModal(false)}
                className="text-white hover:text-emerald-200 p-1 rounded-lg hover:bg-white/10"
              >
                Tutup
              </button>
            </div>

            {/* Content */}
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4 text-xs">
                <div>
                  <span className="text-slate-400 block font-bold uppercase tracking-wider text-[10px]">Nama {getTerminology(appSettings, { capitalize: true })}</span>
                  <span className="text-sm font-bold text-slate-800">{selectedSantri.nama}</span>
                </div>
                <div>
                  <span className="text-slate-400 block font-bold uppercase tracking-wider text-[10px]">Jenjang / Gelombang</span>
                  <span className="text-sm font-bold text-slate-800">{selectedSantri.jenjang} / {selectedSantri.gelombangPendaftaran}</span>
                </div>
              </div>

              <hr className="border-slate-100" />

              {/* Rincian Tagihan */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Daftar Tagihan Alokasi Biaya</h4>
                <div className="border border-slate-100 rounded-xl overflow-hidden text-xs">
                  <div className="bg-slate-50 px-3 py-2 font-bold text-slate-500 border-b border-slate-100 flex justify-between">
                    <span>Jenis Biaya</span>
                    <div className="flex gap-12 font-mono">
                      <span>Tagihan</span>
                      <span>Terbayar</span>
                    </div>
                  </div>

                  <div className="divide-y divide-slate-100 max-h-48 overflow-y-auto">
                    {getBillingSummary(selectedSantri.nomorPendaftaran).items.map((item) => {
                      const sisa = item.nominal - item.terbayar;
                      const isItemLunas = sisa <= 0;
                      return (
                        <div key={item.id} className="p-3 flex justify-between items-center bg-white hover:bg-slate-50/20">
                          <div>
                            <span className="font-semibold text-slate-700 block">{item.jenisBiaya}</span>
                            {isItemLunas ? (
                              <span className="text-[9px] bg-emerald-50 text-emerald-700 px-1 py-0.2 rounded-xs font-bold mt-0.5 inline-block">LUNAS</span>
                            ) : (
                              <span className="text-[9px] text-slate-400 mt-0.5 inline-block font-mono">
                                Sisa: Rp {sisa.toLocaleString('id-ID')}
                              </span>
                            )}
                          </div>
                          <div className="flex gap-8 font-mono font-medium text-right shrink-0">
                            <span className="text-slate-600">Rp {item.nominal.toLocaleString('id-ID')}</span>
                            <span className={item.terbayar > 0 ? 'text-emerald-600 font-semibold' : 'text-slate-400'}>
                              Rp {item.terbayar.toLocaleString('id-ID')}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Aggregate */}
                  {(() => {
                    const bill = getBillingSummary(selectedSantri.nomorPendaftaran);
                    return (
                      <div className="bg-slate-100 p-3.5 border-t border-slate-200 space-y-1.5 font-medium text-xs">
                        <div className="flex justify-between text-slate-600">
                          <span>Total Tagihan:</span>
                          <span className="font-mono">Rp {bill.total.toLocaleString('id-ID')}</span>
                        </div>
                        <div className="flex justify-between text-emerald-700">
                          <span>Total Terbayar:</span>
                          <span className="font-mono font-bold">Rp {bill.paid.toLocaleString('id-ID')}</span>
                        </div>
                        <div className="flex justify-between text-red-700 font-bold pt-1.5 border-t border-dashed border-slate-300">
                          <span>Sisa Piutang:</span>
                          <span className="font-mono text-sm">Rp {bill.sisa.toLocaleString('id-ID')}</span>
                        </div>
                      </div>
                    );
                  })()}
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="bg-slate-50 px-6 py-4 flex justify-between gap-2 border-t border-slate-100">
              <div>
                {getBillingSummary(selectedSantri.nomorPendaftaran).sisa > 0 && (
                  <button
                    onClick={() => {
                      setShowDetailModal(false);
                      onNavigateToPembayaran(selectedSantri.nomorPendaftaran);
                    }}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2 px-4 rounded-lg text-xs transition-colors flex items-center gap-1.5 shadow-sm"
                  >
                    <CreditCard size={14} />
                    Proses Pembayaran Loket
                  </button>
                )}
              </div>
              <button
                onClick={() => setShowDetailModal(false)}
                className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg text-xs font-semibold cursor-pointer"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
