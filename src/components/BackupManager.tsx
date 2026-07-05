import React, { useState, useRef } from 'react';
import { Database, Download, Upload, RefreshCw, Lock, ShieldAlert, CheckCircle, AlertTriangle, FileJson, X, FileSpreadsheet, FileText, ArrowRight } from 'lucide-react';
import { Role, SystemState, Santri, getTerminology, User } from '../types';
import Papa from 'papaparse';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { motion, AnimatePresence } from 'motion/react';

interface BackupManagerProps {
  activeRole: Role;
  currentUser: User;
  state: SystemState | null;
  onRestoreBackup: (json: string) => { success: boolean; error?: string };
  onResetToDefault: () => void;
  onAddSantri?: (data: any) => void;
  onAddSantriBulk?: (data: any[]) => { success: boolean; error?: string; count: number };
}

export function BackupManager({ activeRole, currentUser, state, onRestoreBackup, onResetToDefault, onAddSantri, onAddSantriBulk }: BackupManagerProps) {
  const isAuthorized = activeRole === 'Superadmin';
  const fileInputRef = useRef<HTMLInputElement>(null);

  // States
  const [dragActive, setDragActive] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [actionModal, setActionModal] = useState<'none' | 'reset'>('none');
  const [password, setPassword] = useState('');
  const [spreadsheetLink, setSpreadsheetLink] = useState(() => {
    return localStorage.getItem('wahyu_spreadsheet_link') || '';
  });
  const [importingSheet, setImportingSheet] = useState(false);
  const [isLinkEditing, setIsLinkEditing] = useState(!localStorage.getItem('wahyu_spreadsheet_link'));

  const handleSaveSpreadsheetLink = () => {
    if (spreadsheetLink.trim() !== '') {
      localStorage.setItem('wahyu_spreadsheet_link', spreadsheetLink.trim());
      setIsLinkEditing(false);
      setSuccessMsg('Tautan spreadsheet berhasil disimpan!');
      setTimeout(() => setSuccessMsg(''), 3000);
    }
  };

  const canModify = isAuthorized;

  // 1. Gated Access: Only Super Admin can modify this panel
  // Removed full-page blocking to allow view-only access.

  // 2. BACKUP DOWNLAND TRIGGER
  const handleDownloadBackup = () => {
    if (!state) return;
    try {
      // Serialize state excluding temporary simulated user
      const backupData = {
        santriList: state.santriList,
        biayaList: state.biayaList,
        tagihanMap: state.tagihanMap,
        pembayaranList: state.pembayaranList,
        logs: state.logs,
      };

      const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(backupData, null, 2));
      const downloadAnchor = document.createElement('a');
      downloadAnchor.setAttribute('href', dataStr);
      downloadAnchor.setAttribute('download', `BACKUP_SIS_PEMBAYARAN_PSB_${new Date().toISOString().split('T')[0]}.json`);
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      document.body.removeChild(downloadAnchor);

      setSuccessMsg('🟢 File cadangan basis data (.json) berhasil diunduh ke komputer Anda!');
      setErrorMsg('');
    } catch (e: any) {
      setErrorMsg(`Gagal memproses ekspor backup: ${e.message}`);
    }
  };

  const handleExportExcel = () => {
    if (!state) return;
    try {
      const wb = XLSX.utils.book_new();

      // 1. Data Santri
      const santriData = state.santriList.map(s => ({
        'No. Pendaftaran': s.nomorPendaftaran,
        'Nama': s.nama,
        'Jenis Kelamin': s.jenisKelamin,
        'Jenjang': s.jenjang,
        'Gelombang': s.gelombangPendaftaran,
        'Status Bayar': s.status,
        'Tempat Lahir': s.tempatLahir,
        'Tanggal Lahir': s.tanggalLahir,
        'Alamat': `${s.alamat || ''} RT ${s.rt || ''}/RW ${s.rw || ''} ${s.desa || ''} ${s.kecamatan || ''} ${s.kabupatenKota || ''}`.trim(),
        'Nama Ayah': s.namaAyah,
        'Nama Ibu': s.namaIbu,
        'No. HP / WA': s.nomorHpOrangTua
      }));
      const wsSantri = XLSX.utils.json_to_sheet(santriData);
      XLSX.utils.book_append_sheet(wb, wsSantri, "Data Santri");

      // 2. Data Pembayaran
      const pembayaranData = state.pembayaranList.map(p => ({
        'No. Transaksi': p.nomorTransaksi,
        'Tanggal': p.tanggal,
        'No. Pendaftaran': p.nomorPendaftaran,
        'Nama Santri': p.namaSantri,
        'Nominal': p.nominal,
        'Metode': p.metodePembayaran,
        'Status': p.status,
        'Penerima': p.bendahara
      }));
      const wsPembayaran = XLSX.utils.json_to_sheet(pembayaranData);
      XLSX.utils.book_append_sheet(wb, wsPembayaran, "Data Pembayaran");

      // 3. Data Verifikasi
      const verifikasiData = state.santriList.map(s => ({
        'No. Pendaftaran': s.nomorPendaftaran,
        'Nama': s.nama,
        'Status Verifikasi Sistem': s.statusValidasi,
        'Verifikasi User': s.userVerificationStatus || 'Pending',
        'Catatan Perbaikan': s.correctionRequestMessage || '-'
      }));
      const wsVerifikasi = XLSX.utils.json_to_sheet(verifikasiData);
      XLSX.utils.book_append_sheet(wb, wsVerifikasi, "Data Verifikasi");

      // 4. Data Berkas Persyaratan
      const berkasData = state.santriList.map(s => ({
        'No. Pendaftaran': s.nomorPendaftaran,
        'Nama': s.nama,
        'Kartu Keluarga': s.berkas?.kk ? 'Ya' : 'Tidak',
        'Akta Kelahiran': s.berkas?.akta ? 'Ya' : 'Tidak',
        'KTP Orang Tua': s.berkas?.ktpOrtu ? 'Ya' : 'Tidak',
        'SKL / Ijazah': s.berkas?.sklIjazah ? 'Ya' : 'Tidak',
      }));
      const wsBerkas = XLSX.utils.json_to_sheet(berkasData);
      XLSX.utils.book_append_sheet(wb, wsBerkas, "Berkas Persyaratan");

      XLSX.writeFile(wb, `Laporan_PSB_${new Date().toISOString().split('T')[0]}.xlsx`);
      setSuccessMsg('Laporan Excel berhasil diunduh!');
    } catch (e: any) {
      setErrorMsg(`Gagal membuat Excel: ${e.message}`);
    }
  };

  const handleExportPDF = () => {
    if (!state) return;
    try {
      const doc = new jsPDF({ orientation: 'landscape' });
      const title = 'Laporan Data Lengkap PSB';
      
      // 1. Data Santri
      doc.setFontSize(14);
      doc.text(`${title} - Data Santri`, 14, 15);
      
      const santriBody = state.santriList.map(s => [
        s.nomorPendaftaran, s.nama, s.jenisKelamin, s.jenjang, s.gelombangPendaftaran, s.status, s.nomorHpOrangTua
      ]);
      
      autoTable(doc, {
        startY: 20,
        head: [['No. Pendaftaran', 'Nama', 'L/P', 'Jenjang', 'Gelombang', 'Status Bayar', 'No. WA']],
        body: santriBody,
        theme: 'grid',
        styles: { fontSize: 8 }
      });
      
      // 2. Data Pembayaran
      doc.addPage();
      doc.text(`${title} - Data Pembayaran`, 14, 15);
      
      const pembayaranBody = state.pembayaranList.map(p => [
        p.nomorTransaksi, p.tanggal, p.namaSantri, p.nominal.toLocaleString('id-ID'), p.metodePembayaran, p.status, p.bendahara
      ]);
      
      autoTable(doc, {
        startY: 20,
        head: [['No. Transaksi', 'Tanggal', 'Nama Santri', 'Nominal (Rp)', 'Metode', 'Status', 'Penerima']],
        body: pembayaranBody,
        theme: 'grid',
        styles: { fontSize: 8 }
      });
      
      // 3. Data Verifikasi
      doc.addPage();
      doc.text(`${title} - Data Verifikasi`, 14, 15);
      
      const verifBody = state.santriList.map(s => [
        s.nomorPendaftaran, s.nama, s.statusValidasi || '-', s.userVerificationStatus || 'Pending', s.correctionRequestMessage || '-'
      ]);
      
      autoTable(doc, {
        startY: 20,
        head: [['No. Pendaftaran', 'Nama', 'Validasi Panitia', 'Verifikasi User', 'Catatan']],
        body: verifBody,
        theme: 'grid',
        styles: { fontSize: 8 }
      });
      
      // 4. Data Berkas Persyaratan
      doc.addPage();
      doc.text(`${title} - Berkas Persyaratan`, 14, 15);
      
      const berkasBody = state.santriList.map(s => [
        s.nomorPendaftaran, s.nama, 
        s.berkas?.kk ? 'V' : '-', 
        s.berkas?.akta ? 'V' : '-', 
        s.berkas?.ktpOrtu ? 'V' : '-', 
        s.berkas?.sklIjazah ? 'V' : '-'
      ]);
      
      autoTable(doc, {
        startY: 20,
        head: [['No. Pendaftaran', 'Nama', 'KK', 'Akta', 'KTP Ortu', 'SKL/Ijazah']],
        body: berkasBody,
        theme: 'grid',
        styles: { fontSize: 8 }
      });
      
      doc.save(`Laporan_PSB_${new Date().toISOString().split('T')[0]}.pdf`);
      setSuccessMsg('Laporan PDF berhasil diunduh!');
    } catch (e: any) {
      setErrorMsg(`Gagal membuat PDF: ${e.message}`);
    }
  };

  const handleImportSpreadsheet = async () => {
    if (!spreadsheetLink) {
      setErrorMsg('Tautan spreadsheet tidak boleh kosong.');
      return;
    }

    // Extract ID
    const match = spreadsheetLink.match(/\/d\/([a-zA-Z0-9-_]+)/);
    if (!match || !match[1]) {
      setErrorMsg('Tautan tidak valid. Pastikan format Google Sheets benar.');
      return;
    }
    const sheetId = match[1];
    const exportUrl = `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=csv`;

    setImportingSheet(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      const response = await fetch(exportUrl);
      if (!response.ok) {
        throw new Error('Gagal mengakses spreadsheet. Pastikan link dapat diakses publik (Anyone with the link can view).');
      }
      
      const csvText = await response.text();
      
      Papa.parse(csvText, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => {
          let count = 0;
          const newSantris: any[] = [];
          results.data.forEach((row: any) => {
            // Try to auto-map based on common keywords
            const getVal = (keywords: string[]) => {
              const key = Object.keys(row).find(k => keywords.some(kw => k.toLowerCase().includes(kw)));
              return key ? row[key] : '';
            };

            const nama = getVal(['nama', 'name']);
            if (!nama) return; // Skip if no name

            const jkRaw = getVal(['jenis kelamin', 'kelamin', 'gender', 'jk']).toLowerCase();
            const jenisKelamin = (jkRaw.includes('perempuan') || jkRaw === 'p' || jkRaw === 'pr') ? 'Perempuan' : 'Laki-laki';
            
            let jenjangRaw = getVal(['jenjang', 'tingkat', 'kelas']);
            let jenjang = 'SMP AL-HIDAYAH'; // Default
            if (jenjangRaw.toUpperCase().includes('SD')) jenjang = 'SDI AL-HIDAYAH';
            if (jenjangRaw.toUpperCase().includes('SMK')) jenjang = 'SMK AL-HIDAYAH';
            
            const nomorReg = getVal(['nomor', 'registrasi', 'pendaftaran', 'no reg', 'noreg']) || `REG-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
            
            newSantris.push({
              nomorPendaftaran: String(nomorReg),
              nama: String(nama),
              jenisKelamin: jenisKelamin,
              tempatLahir: String(getVal(['tempat lahir', 'tempat'])),
              tanggalLahir: String(getVal(['tanggal lahir', 'tgl lahir'])),
              alamat: String(getVal(['alamat', 'jalan', 'dusun'])),
              desa: String(getVal(['desa', 'kelurahan'])),
              kecamatan: String(getVal(['kecamatan'])),
              kabupatenKota: String(getVal(['kabupaten', 'kota'])),
              provinsi: String(getVal(['provinsi'])),
              namaAyah: String(getVal(['nama ayah', 'ayah'])),
              namaIbu: String(getVal(['nama ibu', 'ibu'])),
              nomorHpOrangTua: String(getVal(['no hp', 'telepon', 'whatsapp', 'wa'])),
              asalSekolah: String(getVal(['asal sekolah', 'sekolah'])),
              jenjang: jenjang,
              gelombangPendaftaran: state?.appSettings?.gelombangOptions?.[0] || 'Gelombang 1',
              statusValidasi: 'Belum Divalidasi',
              berkas: { kk: false, akta: false, ktpOrtu: false, sklIjazah: false },
              tanggalDaftar: new Date().toISOString().split('T')[0]
            });
          });
          
          if (newSantris.length > 0 && onAddSantriBulk) {
            const result = onAddSantriBulk(newSantris);
            if (result && result.success) {
              setSuccessMsg(`🟢 Berhasil mengimpor ${result.count} data santri dari spreadsheet!`);
            } else {
              setErrorMsg(result?.error || 'Gagal mengimpor data santri.');
            }
          } else {
            setErrorMsg('Tidak ditemukan data santri yang valid dalam spreadsheet.');
          }
          setImportingSheet(false);
        },
        error: (error: any) => {
          setErrorMsg(`Gagal parsing CSV: ${error.message}`);
          setImportingSheet(false);
        }
      });
    } catch (e: any) {
      setErrorMsg(e.message || 'Gagal mengimpor dari spreadsheet.');
      setImportingSheet(false);
    }
  };

  // 3. FILE UPLOAD PARSERS (Manual and Drag-and-drop)
  const processFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      const resultJson = event.target?.result as string;
      if (resultJson) {
        const result = onRestoreBackup(resultJson);
        if (result.success) {
          setSuccessMsg('🟢 Basis data berhasil dipulihkan dari file eksternal!');
          setErrorMsg('');
        } else {
          setErrorMsg(result.error || 'Format berkas tidak cocok.');
          setSuccessMsg('');
        }
      }
    };
    reader.onerror = () => {
      setErrorMsg('Gagal membaca berkas.');
    };
    reader.readAsText(file);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleFactoryResetSubmit = () => {
    onResetToDefault();
    setSuccessMsg('🟢 Berhasil mengembalikan basis data ke pengaturan awal pabrik!');
    setErrorMsg('');
    setShowResetConfirm(false);
    setActionModal('none');
    setPassword('');
  };

  const handleModalConfirm = () => {
    if (password !== currentUser.password) {
      setErrorMsg('Password salah.');
      return;
    }
    
    if (actionModal === 'reset') {
      handleFactoryResetSubmit();
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-slate-900 tracking-tight">Backup & Pemulihan Basis Data</h1>
        <p className="text-xs text-slate-500">Mengekspor seluruh tabel keuangan ke file JSON terenkripsi dan melakukan pemulihan darurat</p>
      </div>

      {successMsg && (
        <div className="bg-emerald-50 text-emerald-800 border border-emerald-200 p-4 rounded-xl flex items-center gap-3 text-xs font-semibold">
          <CheckCircle size={18} className="text-emerald-600 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="bg-red-50 text-red-800 border border-red-200 p-4 rounded-xl flex items-center gap-3 text-xs font-semibold">
          <AlertTriangle size={18} className="text-red-600 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Grid: Backup & Restore cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Card 1: Download backup */}
        <div className="bg-white border border-slate-100 rounded-xl p-6 shadow-xs flex flex-col justify-between space-y-4">
          <div className="space-y-2">
            <div className="bg-emerald-50 text-emerald-700 w-10 h-10 rounded-lg flex items-center justify-center border border-emerald-100">
              <Download size={20} />
            </div>
            <h3 className="text-sm font-semibold text-slate-800">Ekspor Cadangan (.JSON)</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Unduh salinan cadangan lengkap basis data Anda. Berkas ini berisi seluruh rekam profil {getTerminology(state?.appSettings)}, data master alokasi biaya, transaksi kwitansi, dan log audit internal.
            </p>
          </div>

          <div className="pt-2 space-y-2">
            {canModify ? (
              <>
                <button
                  onClick={handleDownloadBackup}
                  className="w-full bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold px-4 py-2.5 rounded-lg flex items-center justify-center gap-2 cursor-pointer shadow-sm transition-all"
                >
                  <Database size={14} />
                  Unduh Berkas Cadangan (.json)
                </button>
                <div className="flex gap-2">
                  <button
                    onClick={handleExportExcel}
                    className="flex-1 bg-emerald-100 hover:bg-emerald-200 text-emerald-800 border border-emerald-200 text-xs font-semibold px-4 py-2.5 rounded-lg flex items-center justify-center gap-2 cursor-pointer shadow-sm transition-all"
                  >
                    <FileSpreadsheet size={14} />
                    Unduh Excel
                  </button>
                  <button
                    onClick={handleExportPDF}
                    className="flex-1 bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 text-xs font-semibold px-4 py-2.5 rounded-lg flex items-center justify-center gap-2 cursor-pointer shadow-sm transition-all"
                  >
                    <FileText size={14} />
                    Unduh PDF
                  </button>
                </div>
              </>
            ) : (
              <div className="bg-amber-50 text-amber-700 text-xs px-3 py-2 rounded-xl font-semibold border border-amber-200 inline-block">
                Hanya bisa diakses (diunduh) oleh role super admin
              </div>
            )}
          </div>
        </div>

        {/* Card 2: Restore backup */}
        <div className="bg-white border border-slate-100 rounded-xl p-6 shadow-xs space-y-4">
          <div className="space-y-2">
            <div className="bg-indigo-50 text-indigo-700 w-10 h-10 rounded-lg flex items-center justify-center border border-indigo-100">
              <Upload size={20} />
            </div>
            <h3 className="text-sm font-semibold text-slate-800">Impor & Pemulihan Basis Data</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Memulihkan data pesantren dari berkas JSON yang diunduh sebelumnya. Hal ini akan menimpa data yang ada saat ini secara permanen.
            </p>
          </div>

          {/* Drag and Drop Zone */}
          {canModify ? (
            <div
              onDragEnter={handleDrag}
              onDragOver={handleDrag}
              onDragLeave={handleDrag}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-xl p-6 text-center transition-all cursor-pointer ${
                dragActive
                  ? 'border-indigo-500 bg-indigo-50/50'
                  : 'border-slate-200 hover:border-slate-300 bg-slate-50'
              }`}
            >
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept=".json"
                className="hidden"
              />
              <FileJson size={28} className="mx-auto text-slate-400 mb-2" />
              <p className="text-xs font-semibold text-slate-700">Tarik berkas .json ke sini, atau klik untuk memilih</p>
              <p className="text-[10px] text-slate-400 mt-1">Hanya menerima format file valid .json database ekspor</p>
            </div>
          ) : (
            <div className="bg-amber-50 text-amber-700 text-xs px-3 py-2 rounded-xl font-semibold border border-amber-200 text-center">
              Hanya bisa diakses (diimpor) oleh role super admin
            </div>
          )}
        </div>

      </div>

      {/* Card 3: Google Sheets Import */}
      <div className="bg-white border border-slate-100 rounded-xl p-6 shadow-xs space-y-4 md:col-span-2">
        <div className="space-y-2">
          <div className="bg-emerald-50 text-emerald-700 w-10 h-10 rounded-lg flex items-center justify-center border border-emerald-100">
            <Database size={20} />
          </div>
          <h3 className="text-sm font-semibold text-slate-800">Impor Data {getTerminology(state?.appSettings, { capitalize: true })} (Google Form / Spreadsheet)</h3>
          <p className="text-xs text-slate-500 leading-relaxed">
            Impor otomatis data responden formulir eksternal. Pastikan akses tautan diatur ke <strong className="text-slate-700">"Siapa saja yang memiliki tautan dapat melihat" (Anyone with the link can view)</strong>. Sistem akan otomatis mendeteksi kolom seperti Nama, Jenis Kelamin, dsb.
          </p>
        </div>

        {canModify ? (
          <div className="flex flex-col sm:flex-row gap-3 mt-4">
            <input
              type="text"
              placeholder="Tempel tautan Google Sheets di sini..."
              value={spreadsheetLink}
              onChange={(e) => setSpreadsheetLink(e.target.value)}
              disabled={!isLinkEditing}
              className="flex-1 px-4 py-2.5 text-xs border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-emerald-500 bg-slate-50 disabled:bg-slate-100 disabled:text-slate-500"
            />
            {isLinkEditing ? (
              <button
                onClick={handleSaveSpreadsheetLink}
                className="bg-slate-800 hover:bg-slate-900 text-white text-xs font-semibold px-4 py-2.5 rounded-xl flex items-center justify-center gap-2 transition-all whitespace-nowrap"
              >
                Simpan Tautan
              </button>
            ) : (
              <button
                onClick={() => setIsLinkEditing(true)}
                className="bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-semibold px-4 py-2.5 rounded-xl flex items-center justify-center gap-2 transition-all whitespace-nowrap"
              >
                Ubah Tautan
              </button>
            )}
            <button
              onClick={handleImportSpreadsheet}
              disabled={importingSheet || !spreadsheetLink}
              className="bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs font-semibold px-5 py-2.5 rounded-xl flex items-center justify-center gap-2 transition-all whitespace-nowrap"
            >
              {importingSheet ? (
                <RefreshCw size={16} className="animate-spin" />
              ) : (
                <Upload size={16} />
              )}
              {importingSheet ? 'Memproses...' : 'Impor Data'}
            </button>
          </div>
        ) : (
          <div className="bg-amber-50 text-amber-700 text-xs px-3 py-2 rounded-xl font-semibold border border-amber-200 inline-block mt-2">
            Hanya bisa diakses oleh role super admin
          </div>
        )}
      </div>

      {/* Safety Factory Reset */}
      <div className="bg-red-50/50 border border-red-100 p-6 rounded-xl space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <h4 className="text-xs font-bold text-red-950 flex items-center gap-1.5">
              <AlertTriangle size={16} className="text-red-600" />
              BAHAYA: Kembalikan ke Setelan Awal
            </h4>
            <p className="text-xs text-red-800 leading-relaxed max-w-xl">
              Aksi ini akan menghapus seluruh data yang Anda tambahkan (pendaftaran baru, nominal biaya, transaksi loket) dan memulihkannya kembali ke data awal default bawaan (seperti santri Ahmad Fauzi, Siti Aminah).
            </p>
          </div>

          {canModify ? (
            <button
              id="btn-safety-reset"
              onClick={() => setActionModal('reset')}
              className="bg-red-600 hover:bg-red-700 text-white text-xs font-semibold px-4 py-2.5 rounded-lg flex items-center gap-1.5 cursor-pointer shadow-sm transition-all whitespace-nowrap"
            >
              <RefreshCw size={14} />
              Reset ke Default Pabrik
            </button>
          ) : (
            <div className="bg-amber-50 text-amber-700 text-xs px-3 py-2 rounded-xl font-semibold border border-amber-200">
              Hanya bisa diakses (direset) oleh role super admin
            </div>
          )}
        </div>
      </div>
      
      {/* Action Confirmation Modal */}
      <AnimatePresence>
        {actionModal !== 'none' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-2xl"
            >
              <h2 className="text-lg font-bold text-slate-900 mb-2">
                Konfirmasi Reset Pabrik
              </h2>
              <p className="text-xs text-slate-600 mb-6">
                Masukkan password akun Anda untuk melanjutkan aksi ini.
              </p>
              
              <div className="mb-6">
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">Password *</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                  placeholder="Masukkan password..."
                />
              </div>
              
              <div className="flex gap-2">
                <button
                  onClick={() => { setActionModal('none'); setPassword(''); }}
                  className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold px-4 py-2.5 rounded-lg cursor-pointer"
                >
                  Batal
                </button>
                <button
                  onClick={handleModalConfirm}
                  className="flex-1 text-white text-xs font-bold px-4 py-2.5 rounded-lg cursor-pointer shadow-sm bg-red-600 hover:bg-red-700"
                >
                  Ya
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
