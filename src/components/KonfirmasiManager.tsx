import React, { useState } from 'react';
import { Santri, AppSettings, getTerminology } from '../types';
import { 
  CheckCircle, 
  XCircle, 
  Printer, 
  MessageSquare, 
  Search, 
  Filter,
  UserCheck,
  AlertCircle,
  MoreVertical,
  CheckSquare,
  Square,
  X,
  Edit,
  Send
} from 'lucide-react';
import { RegistrationCardViewer } from './RegistrationCardViewer';
import { motion, AnimatePresence } from 'motion/react';

interface KonfirmasiManagerProps {
  santriList: Santri[];
  appSettings: AppSettings;
  onAccept: (nomorPendaftaran: string, isAccepted: boolean) => void;
  onAcceptBulk?: (nomorPendaftaranList: string[], isAccepted: boolean) => void;
  onUpdateSantri?: (nomorPendaftaran: string, data: Partial<Santri>) => void;
}

export function KonfirmasiManager({ 
  santriList, 
  appSettings, 
  onAccept, 
  onAcceptBulk,
  onUpdateSantri 
}: KonfirmasiManagerProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterJenjang, setFilterJenjang] = useState('All');
  const [filterAccepted, setFilterAccepted] = useState('All');
  const [selectedForPrint, setSelectedForPrint] = useState<Santri | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [modalSantri, setModalSantri] = useState<Santri | null>(null);
  const [newRegNo, setNewRegNo] = useState('');

  const filteredList = santriList.filter(s => {
    const matchesSearch = s.nama.toLowerCase().includes(searchTerm.toLowerCase()) || 
                         s.nomorPendaftaran.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesJenjang = filterJenjang === 'All' || s.jenjang === filterJenjang;
    const matchesAccepted = filterAccepted === 'All' || 
                           (filterAccepted === 'Accepted' && s.isAccepted) ||
                           (filterAccepted === 'Pending' && !s.isAccepted);
    
    return matchesSearch && matchesJenjang && matchesAccepted;
  });

  const toggleSelectAll = () => {
    if (selectedIds.length === filteredList.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredList.map(s => s.nomorPendaftaran));
    }
  };

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const handleBulkAccept = (isAccepted: boolean) => {
    if (onAcceptBulk) {
      onAcceptBulk(selectedIds, isAccepted);
      setSelectedIds([]);
    }
  };

  const openConfirmationModal = (santri: Santri) => {
    setModalSantri(santri);
    setNewRegNo(santri.nomorPendaftaran);
  };

  const handleUpdateRegNo = () => {
    if (modalSantri && onUpdateSantri && newRegNo && newRegNo !== modalSantri.nomorPendaftaran) {
      onUpdateSantri(modalSantri.nomorPendaftaran, { nomorPendaftaran: newRegNo });
      setModalSantri(prev => prev ? { ...prev, nomorPendaftaran: newRegNo } : null);
    }
  };

  const handleSendWA = (santri: Santri) => {
    if (!appSettings?.waTemplate) return;

    let message = appSettings.waTemplate
      .replace(/{TAHUN_AJARAN}/g, appSettings.tahunAjaran || '2026/2027')
      .replace(/{NO_REG}/g, santri.nomorPendaftaran)
      .replace(/{NAMA}/g, santri.nama)
      .replace(/{PONDOK_NAME}/g, appSettings.pondokName || '')
      .replace(/{PONDOK_ADDRESS}/g, appSettings.pondokAddress || '');

    const phoneNumber = santri.nomorHpOrangTua.replace(/[^0-9]/g, '');
    const formattedPhone = phoneNumber.startsWith('0') ? '62' + phoneNumber.slice(1) : phoneNumber;
    
    const url = `https://wa.me/${formattedPhone}?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank');
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Konfirmasi Penerimaan</h1>
          <p className="text-xs text-slate-500">Konfirmasi status diterima, cetak kartu registrasi, dan kirim notifikasi</p>
        </div>
        
        {selectedIds.length > 0 && (
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 px-4 py-2 rounded-2xl"
          >
            <span className="text-xs font-bold text-emerald-800">{selectedIds.length} terpilih</span>
            <div className="h-4 w-[1px] bg-emerald-200 mx-1" />
            <button 
              onClick={() => handleBulkAccept(true)}
              className="px-3 py-1 bg-emerald-600 text-white text-[10px] font-bold rounded-lg hover:bg-emerald-700 transition-colors cursor-pointer"
            >
              Terima Semua
            </button>
            <button 
              onClick={() => handleBulkAccept(false)}
              className="px-3 py-1 bg-white text-slate-600 border border-slate-200 text-[10px] font-bold rounded-lg hover:bg-slate-50 transition-colors cursor-pointer"
            >
              Pending Semua
            </button>
          </motion.div>
        )}
      </div>

      <div className="bg-white border border-slate-200 rounded-3xl shadow-xs overflow-hidden">
        {/* Filters */}
        <div className="p-4 border-b border-slate-100 flex flex-col md:flex-row gap-3 bg-slate-50/50">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
            <input
              type="text"
              placeholder="Cari nama atau nomor registrasi..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-xs border border-slate-200 rounded-xl focus:outline-hidden focus:ring-1 focus:ring-emerald-500 bg-white"
            />
          </div>
          <div className="flex gap-2">
            <select
              value={filterJenjang}
              onChange={(e) => setFilterJenjang(e.target.value)}
              className="px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-hidden focus:ring-1 focus:ring-emerald-500 bg-white font-medium"
            >
              <option value="All">Semua Jenjang</option>
              <option value="SDI AL-HIDAYAH">SDI</option>
              <option value="SMP AL-HIDAYAH">SMP</option>
              <option value="SMK AL-HIDAYAH">SMK</option>
            </select>
            <select
              value={filterAccepted}
              onChange={(e) => setFilterAccepted(e.target.value)}
              className="px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-hidden focus:ring-1 focus:ring-emerald-500 bg-white font-medium"
            >
              <option value="All">Status Penerimaan</option>
              <option value="Accepted">Diterima</option>
              <option value="Pending">Belum Dikonfirmasi</option>
            </select>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-100 text-[10px] font-bold text-slate-400 uppercase bg-slate-50">
                <th className="py-3 px-4 w-10">
                  <button onClick={toggleSelectAll} className="text-slate-400 hover:text-emerald-600 transition-colors cursor-pointer">
                    {selectedIds.length === filteredList.length && filteredList.length > 0 ? (
                      <CheckSquare size={16} className="text-emerald-600" />
                    ) : (
                      <Square size={16} />
                    )}
                  </button>
                </th>
                <th className="py-3 px-4">No Registrasi</th>
                <th className="py-3 px-4">Nama</th>
                <th className="py-3 px-3 text-center">L/P</th>
                <th className="py-3 px-3">Jenjang</th>
                <th className="py-3 px-3 text-center">Status</th>
                <th className="py-3 px-4 text-center">Opsi</th>
              </tr>
            </thead>
            <tbody>
              {filteredList.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400 text-xs">
                    Tidak ada data santri.
                  </td>
                </tr>
              ) : (
                filteredList.map((s) => (
                  <tr key={s.nomorPendaftaran} className={`border-b border-slate-50 hover:bg-slate-50/50 transition-colors group ${selectedIds.includes(s.nomorPendaftaran) ? 'bg-emerald-50/30' : ''}`}>
                    <td className="py-3 px-4">
                      <button onClick={() => toggleSelect(s.nomorPendaftaran)} className="text-slate-300 hover:text-emerald-600 transition-colors cursor-pointer">
                        {selectedIds.includes(s.nomorPendaftaran) ? (
                          <CheckSquare size={16} className="text-emerald-600" />
                        ) : (
                          <Square size={16} />
                        )}
                      </button>
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-mono font-bold text-emerald-600 text-[10px]">{s.nomorPendaftaran}</div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-bold text-slate-900 text-sm">{s.nama}</div>
                    </td>
                    <td className="py-3 px-3 text-center">
                      <span className="text-[10px] font-bold text-slate-500">{s.jenisKelamin === 'Laki-laki' ? 'L' : 'P'}</span>
                    </td>
                    <td className="py-3 px-3">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-600">
                        {s.jenjang}
                      </span>
                    </td>
                    <td className="py-3 px-3">
                      <div className="flex justify-center">
                        {s.isAccepted ? (
                          <span className="flex items-center gap-1 text-emerald-600 text-[9px] font-black uppercase tracking-tighter">
                            <CheckCircle size={10} />
                            Diterima
                          </span>
                        ) : (
                          <span className="flex items-center gap-1 text-slate-400 text-[9px] font-black uppercase tracking-tighter">
                            <AlertCircle size={10} />
                            Pending
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <button
                        onClick={() => openConfirmationModal(s)}
                        className="p-2 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-all cursor-pointer"
                        title="Opsi Konfirmasi"
                      >
                        <MoreVertical size={16} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Confirmation Modal */}
      <AnimatePresence>
        {modalSantri && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setModalSantri(null)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden"
            >
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className="text-lg font-black text-slate-900">Konfirmasi {getTerminology(appSettings, { capitalize: true })}</h3>
                    <p className="text-xs text-slate-500">Kelola status dan kelengkapan pendaftaran</p>
                  </div>
                  <button 
                    onClick={() => setModalSantri(null)}
                    className="p-2 hover:bg-slate-100 rounded-full transition-colors"
                  >
                    <X size={20} className="text-slate-400" />
                  </button>
                </div>

                <div className="bg-slate-50 rounded-2xl p-4 mb-6">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center font-black text-lg">
                      {modalSantri.nama.charAt(0)}
                    </div>
                    <div>
                      <div className="font-bold text-slate-900">{modalSantri.nama}</div>
                      <div className="text-[10px] font-mono font-bold text-emerald-600">{modalSantri.nomorPendaftaran}</div>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  {/* Status Konfirmasi */}
                  <div className="flex items-center justify-between p-3 border border-slate-100 rounded-2xl">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-xl ${modalSantri.isAccepted ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-50 text-slate-400'}`}>
                        <UserCheck size={18} />
                      </div>
                      <div>
                        <div className="text-xs font-bold text-slate-800">Status Konfirmasi</div>
                        <div className="text-[10px] text-slate-500">{modalSantri.isAccepted ? 'Sudah Diterima' : 'Belum Dikonfirmasi'}</div>
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        onAccept(modalSantri.nomorPendaftaran, !modalSantri.isAccepted);
                        setModalSantri(prev => prev ? { ...prev, isAccepted: !prev.isAccepted } : null);
                      }}
                      className={`px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all ${
                        modalSantri.isAccepted 
                        ? 'bg-red-50 text-red-600 hover:bg-red-100' 
                        : 'bg-emerald-600 text-white hover:bg-emerald-700'
                      }`}
                    >
                      {modalSantri.isAccepted ? 'Batalkan' : `Terima ${getTerminology(appSettings, { capitalize: true })}`}
                    </button>
                  </div>

                  {/* Edit Nomor Registrasi */}
                  <div className="p-3 border border-slate-100 rounded-2xl">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="p-2 rounded-xl bg-indigo-50 text-indigo-600">
                        <Edit size={18} />
                      </div>
                      <div>
                        <div className="text-xs font-bold text-slate-800">Tentukan Nomor Registrasi</div>
                        <div className="text-[10px] text-slate-500">Ubah jika diperlukan oleh petugas</div>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <input 
                        type="text" 
                        value={newRegNo}
                        onChange={(e) => setNewRegNo(e.target.value)}
                        className="flex-1 px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-indigo-500 font-mono font-bold"
                      />
                      <button 
                        onClick={handleUpdateRegNo}
                        className="px-3 py-2 bg-indigo-600 text-white text-[10px] font-bold rounded-lg hover:bg-indigo-700 transition-colors"
                      >
                        Simpan
                      </button>
                    </div>
                  </div>

                  {/* Actions Row */}
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      onClick={() => setSelectedForPrint(modalSantri)}
                      className="flex items-center justify-center gap-2 p-4 bg-slate-50 hover:bg-slate-100 border border-slate-100 rounded-2xl transition-all group"
                    >
                      <Printer size={18} className="text-slate-600 group-hover:text-emerald-600" />
                      <span className="text-xs font-bold text-slate-700">Cetak Kartu Registrasi</span>
                    </button>
                    <button
                      onClick={() => handleSendWA(modalSantri)}
                      className="flex items-center justify-center gap-2 p-4 bg-slate-50 hover:bg-slate-100 border border-slate-100 rounded-2xl transition-all group"
                    >
                      <MessageSquare size={18} className="text-slate-600 group-hover:text-blue-600" />
                      <span className="text-xs font-bold text-slate-700">Kirim Pesan</span>
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {selectedForPrint && (
        <RegistrationCardViewer 
          santri={selectedForPrint} 
          appSettings={appSettings} 
          onClose={() => setSelectedForPrint(null)} 
        />
      )}
    </div>
  );
}
