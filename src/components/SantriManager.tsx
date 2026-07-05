import React, { useState, useEffect } from 'react';
import { Search, UserPlus, FileText, Edit3, Eye, Calendar, MapPin, Phone, GraduationCap, X, Check, CircleAlert, CheckCircle, Trash2, Upload, Download, Printer, FileSpreadsheet } from 'lucide-react';
import * as XLSX from 'xlsx';
import { motion } from 'motion/react';
import { Santri, TagihanItem, Role, AppSettings, getTerminology, getInstitutionType } from '../types';
import { SantriFormFields } from './SantriFormFields';
import { printElementInNewTab } from '../utils';

interface SantriManagerProps {
  santriList: Santri[];
  tagihanMap: Record<string, TagihanItem[]>;
  activeRole: Role;
  appSettings?: AppSettings;
  onAddSantri: (data: Omit<Santri, 'nomorPendaftaran' | 'status' | 'tanggalDaftar'> & { nomorPendaftaran?: string; tanggalDaftar?: string }) => { success: boolean; error?: string } | void;
  onEditSantri: (nomorPendaftaran: string, data: Partial<Santri>) => { success: boolean; error?: string } | void;
  onDeleteSantri?: (nomorPendaftaran: string) => void;
  onNavigateToPembayaran?: (nomorPendaftaran: string) => void;
  preSelectedSantriId?: string;
  onClearPreSelected?: () => void;
}

export function SantriManager({
  santriList,
  tagihanMap,
  activeRole,
  appSettings,
  onAddSantri,
  onEditSantri,
  onDeleteSantri,
  onNavigateToPembayaran,
  preSelectedSantriId,
  onClearPreSelected
}: SantriManagerProps) {
  const isReadOnly = false;

  // State Management
  const [searchTerm, setSearchTerm] = useState('');
  const [filterJenjang, setFilterJenjang] = useState<string>('All');
  const [filterGelombang, setFilterGelombang] = useState<string>('All');
  const [filterStatus, setFilterStatus] = useState<string>('All');
  const [filterGender, setFilterGender] = useState<string>('All');

  // Form Modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);

  // Selected Santri state
  const [selectedSantri, setSelectedSantri] = useState<Santri | null>(null);
  const [printingSantri, setPrintingSantri] = useState<Santri | null>(null);
  const [deleteConfirmTarget, setDeleteConfirmTarget] = useState<Santri | null>(null);
  const [selectedSantriIds, setSelectedSantriIds] = useState<string[]>([]);
  const [showBulkDeleteConfirm, setShowBulkDeleteConfirm] = useState(false);

  const handlePrint = (santri: Santri) => {
    setPrintingSantri(santri);
    setTimeout(() => {
      window.print();
      setTimeout(() => setPrintingSantri(null), 500);
    }, 100);
  };

  // Form fields
  const [formData, setFormData] = useState({
    nomorPendaftaran: '',
    tanggalDaftar: '',
    nama: '',
    jenisKelamin: 'Laki-laki' as 'Laki-laki' | 'Perempuan',
    tempatLahir: '',
    tanggalLahir: '',
    alamat: '', // Jalan/Dusun
    desa: '',
    kecamatan: '',
    kabupatenKota: '',
    provinsi: '',
    
    // A. Identitas Tambahan
    anakKe: '',
    jumlahSaudara: '',
    nik: '',
    noKk: '',

    // B. Kelembagaan
    asalSekolah: '',
    npsnAsal: '',
    alamatSekolahAsal: '',
    nisn: '',
    mendaftarKelas: '',

    // C. Alamat Tambahan
    rt: '',
    rw: '',
    kodePos: '',

    // D. Data Ayah
    namaAyah: '',
    nikAyah: '',
    statusAyah: 'Hidup' as 'Hidup' | 'Wafat',
    tempatLahirAyah: '',
    tanggalLahirAyah: '',
    pendidikanAyah: '',
    pekerjaanAyah: '',
    penghasilanAyah: '',
    noHpAyah: '',

    // Data Ibu
    namaIbu: '',
    nikIbu: '',
    statusIbu: 'Hidup' as 'Hidup' | 'Wafat',
    tempatLahirIbu: '',
    tanggalLahirIbu: '',
    pendidikanIbu: '',
    pekerjaanIbu: '',
    penghasilanIbu: '',
    noHpIbu: '',

    // E. Identitas Wali
    namaWali: '',
    tempatLahirWali: '',
    pendidikanWali: '',
    penghasilanWali: '',
    nikWali: '',
    tanggalLahirWali: '',
    pekerjaanWali: '',
    noHpWali: '',

    nomorHpOrangTua: '', // Nomor Whatsapp Aktif
    jenjang: appSettings?.jenjangOptions?.[0] || 'SMP AL-HIDAYAH',
    gelombangPendaftaran: appSettings?.gelombangOptions?.[0] || 'Gelombang 1',
    statusValidasi: 'Belum Divalidasi' as 'Belum Divalidasi' | 'Valid' | 'Tidak Valid',
    berkas: { kk: false, akta: false, ktpOrtu: false, sklIjazah: false },
  });

  const [formError, setFormError] = useState('');

  useEffect(() => {
    if (preSelectedSantriId) {
      const found = santriList.find(s => s.nomorPendaftaran === preSelectedSantriId);
      if (found) {
        setSearchTerm(found.nomorPendaftaran);
        openEditModal(found);
      }
      if (onClearPreSelected) {
        onClearPreSelected();
      }
    }
  }, [preSelectedSantriId, santriList]);

  const handleExportExcelAll = () => {
    try {
      const exportData = filteredSantri.map(s => {
        const billing = getBillingSummary(s.nomorPendaftaran);
        return {
          'No. Pendaftaran': s.nomorPendaftaran,
          'Tanggal Daftar': s.tanggalDaftar,
          'Nama Lengkap': s.nama,
          'Jenis Kelamin': s.jenisKelamin,
          'Jenjang': s.jenjang,
          'Gelombang': s.gelombangPendaftaran,
          'Status Bayar': s.status,
          'Total Tagihan': billing.total,
          'Terbayar': billing.paid,
          'Sisa Pembayaran': billing.sisa,
          'Tempat Lahir': s.tempatLahir,
          'Tanggal Lahir': s.tanggalLahir,
          'Alamat': `${s.alamat || ''} RT ${s.rt || ''}/RW ${s.rw || ''} Desa ${s.desa || ''} Kec. ${s.kecamatan || ''} Kab/Kota ${s.kabupatenKota || ''}`.trim(),
          'Nama Ayah': s.namaAyah,
          'Nama Ibu': s.namaIbu,
          'No. HP Orang Tua': s.nomorHpOrangTua
        };
      });

      const ws = XLSX.utils.json_to_sheet(exportData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Data Santri");
      XLSX.writeFile(wb, `DATA_SANTRI_BARU_${new Date().toISOString().split('T')[0]}.xlsx`);
    } catch (e: any) {
      alert(`Gagal mengekspor data ke Excel: ${e.message}`);
    }
  };

  const handleExportPDFAll = () => {
    const title = `DATA CALON ${getTerminology(appSettings, { capitalize: true }).toUpperCase()} BARU`;
    
    let rowsHtml = '';
    filteredSantri.forEach((s, idx) => {
      const billing = getBillingSummary(s.nomorPendaftaran);
      rowsHtml += `
        <tr class="border-b border-slate-200 hover:bg-slate-50 transition-all">
          <td class="py-2 px-3 text-[10px] text-center font-medium text-slate-500">${idx + 1}</td>
          <td class="py-2 px-3 text-[10px] font-semibold text-slate-900">${s.nomorPendaftaran}</td>
          <td class="py-2 px-3 text-[10px] font-bold text-emerald-950">${s.nama}</td>
          <td class="py-2 px-3 text-[10px] text-slate-600">${s.jenisKelamin}</td>
          <td class="py-2 px-3 text-[10px] font-medium text-slate-700">${s.jenjang}</td>
          <td class="py-2 px-3 text-[10px] text-slate-600">${s.gelombangPendaftaran}</td>
          <td class="py-2 px-3 text-[10px] text-center">
            <span class="px-2 py-0.5 rounded-full text-[9px] font-extrabold ${
              s.status === 'Lunas' ? 'bg-emerald-100 text-emerald-800' :
              s.status === 'Cicilan' ? 'bg-amber-100 text-amber-800' :
              'bg-red-100 text-red-800'
            }">${s.status}</span>
          </td>
          <td class="py-2 px-3 text-[10px] text-right font-semibold text-slate-800">Rp ${billing.total.toLocaleString('id-ID')}</td>
          <td class="py-2 px-3 text-[10px] text-right font-semibold text-emerald-700">Rp ${billing.paid.toLocaleString('id-ID')}</td>
          <td class="py-2 px-3 text-[10px] text-right font-semibold text-amber-700">Rp ${billing.sisa.toLocaleString('id-ID')}</td>
        </tr>
      `;
    });

    const reportHtml = `
      <div class="printable bg-white p-8 border-2 border-emerald-900 rounded-2xl shadow-xs space-y-6">
        <div class="flex items-center justify-between border-b-2 border-emerald-900 pb-4">
          <div>
            <h1 class="text-lg font-bold text-emerald-950 tracking-tight">${appSettings?.pondokName || 'PESANTREN WAHYU HIDAYAT'}</h1>
            <p class="text-xs text-slate-500">${appSettings?.pondokAddress || 'Jombang, Jawa Timur'}</p>
          </div>
          <div class="text-right">
            <span class="bg-emerald-50 text-emerald-800 text-[10px] font-extrabold px-3 py-1 rounded-full border border-emerald-200">
              LAPORAN REGISTRASI
            </span>
            <p class="text-[9px] text-slate-400 mt-1">Dicetak pada: ${new Date().toLocaleDateString('id-ID')}</p>
          </div>
        </div>

        <div class="space-y-2">
          <h2 class="text-sm font-bold text-slate-800 text-center uppercase tracking-wide">${title}</h2>
          <p class="text-[10px] text-slate-500 text-center">Menampilkan total ${filteredSantri.length} santri berdasarkan kriteria pencarian.</p>
        </div>

        <div class="overflow-x-auto">
          <table class="w-full text-left border-collapse">
            <thead>
              <tr class="bg-emerald-900 text-white border-b border-emerald-950">
                <th class="py-2 px-3 text-[10px] font-bold text-center">No</th>
                <th class="py-2 px-3 text-[10px] font-bold">No. Reg</th>
                <th class="py-2 px-3 text-[10px] font-bold">Nama Lengkap</th>
                <th class="py-2 px-3 text-[10px] font-bold">Gender</th>
                <th class="py-2 px-3 text-[10px] font-bold">Jenjang</th>
                <th class="py-2 px-3 text-[10px] font-bold">Gelombang</th>
                <th class="py-2 px-3 text-[10px] font-bold text-center">Status</th>
                <th class="py-2 px-3 text-[10px] font-bold text-right">Total</th>
                <th class="py-2 px-3 text-[10px] font-bold text-right">Terbayar</th>
                <th class="py-2 px-3 text-[10px] font-bold text-right">Sisa</th>
              </tr>
            </thead>
            <tbody>
              ${rowsHtml}
            </tbody>
          </table>
        </div>

        <div class="grid grid-cols-2 gap-4 pt-12 text-center text-[10px] text-slate-600">
          <div>
            <p>Mengetahui,</p>
            <p class="font-bold text-slate-800 mt-12">Ketua Panitia PSB</p>
          </div>
          <div>
            <p>Jombang, ${new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
            <p class="font-bold text-slate-800 mt-12">Staf Administrasi</p>
          </div>
        </div>
      </div>
    `;

    printElementInNewTab(reportHtml, `Laporan_Data_Santri_${new Date().toISOString().split('T')[0]}`);
  };

  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const downloadExcelTemplate = () => {
    const headers = [
      'nomorPendaftaran', 'nama', 'jenisKelamin', 'jenjang', 'tempatLahir', 'tanggalLahir', 
      'alamat', 'rt', 'rw', 'desa', 'kecamatan', 'kabupatenKota', 'provinsi', 'kodePos', 'nik', 'noKk', 'anakKe', 'jumlahSaudara', 
      'asalSekolah', 'npsnAsal', 'alamatSekolahAsal', 'nisn', 'mendaftarKelas', 
      'namaAyah', 'nikAyah', 'statusAyah', 'tempatLahirAyah', 'tanggalLahirAyah', 'pendidikanAyah', 'pekerjaanAyah', 'penghasilanAyah', 'noHpAyah',
      'namaIbu', 'nikIbu', 'statusIbu', 'tempatLahirIbu', 'tanggalLahirIbu', 'pendidikanIbu', 'pekerjaanIbu', 'penghasilanIbu', 'noHpIbu',
      'namaWali', 'nikWali', 'tempatLahirWali', 'tanggalLahirWali', 'pendidikanWali', 'pekerjaanWali', 'penghasilanWali', 'noHpWali',
      'nomorHpOrangTua', 'gelombangPendaftaran', 'tanggalDaftar'
    ];
    
    const ws = XLSX.utils.json_to_sheet([
      {
        nomorPendaftaran: '2026001',
        nama: 'Ahmad Muhammad Khusaeiri',
        jenisKelamin: 'Laki-laki',
        jenjang: 'SMP AL-HIDAYAH',
        tempatLahir: 'Jombang',
        tanggalLahir: '2012-05-15',
        alamat: 'Jl. Pesantren No. 10',
        rt: '02',
        rw: '05',
        desa: 'Cukir',
        kecamatan: 'Diwek',
        kabupatenKota: 'Jombang',
        provinsi: 'Jawa Timur',
        kodePos: '61471',
        nik: '3512010101010001',
        noKk: '3512010101010001',
        anakKe: '1',
        jumlahSaudara: '3',
        asalSekolah: 'SDN Cukir 1',
        npsnAsal: '20503001',
        alamatSekolahAsal: 'Jl. Raya Cukir',
        nisn: '0123456789',
        mendaftarKelas: '7',
        namaAyah: 'H. Abdullah',
        nikAyah: '3512010101010002',
        statusAyah: 'Hidup',
        tempatLahirAyah: 'Jombang',
        tanggalLahirAyah: '1980-01-01',
        pendidikanAyah: 'S1',
        pekerjaanAyah: 'Wiraswasta',
        penghasilanAyah: 'Rp 3.000.000',
        noHpAyah: '08123456789',
        namaIbu: 'Hj. Fatimah',
        nikIbu: '3512010101010003',
        statusIbu: 'Hidup',
        tempatLahirIbu: 'Kediri',
        tanggalLahirIbu: '1985-02-02',
        pendidikanIbu: 'SMA',
        pekerjaanIbu: 'Ibu Rumah Tangga',
        penghasilanIbu: '-',
        noHpIbu: '08123456788',
        namaWali: '',
        nikWali: '',
        tempatLahirWali: '',
        tanggalLahirWali: '',
        pendidikanWali: '',
        pekerjaanWali: '',
        penghasilanWali: '',
        noHpWali: '',
        nomorHpOrangTua: '08123456789',
        gelombangPendaftaran: 'Gelombang 1',
        tanggalDaftar: new Date().toISOString().split('T')[0]
      }
    ], { header: headers });
    
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Template Santri");
    XLSX.writeFile(wb, "Template_Data_Lengkap_Santri.xlsx");
  };

  const [sortConfig, setSortConfig] = useState<{ key: keyof Santri | 'total' | 'paid' | 'sisa'; direction: 'asc' | 'desc' }>({
    key: 'nomorPendaftaran',
    direction: 'asc'
  });

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = new Uint8Array(event.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        const json = XLSX.utils.sheet_to_json<any>(worksheet);
        
        json.forEach((row) => {
              if (row.nama) {
                onAddSantri({
                  nomorPendaftaran: row.nomorPendaftaran ? String(row.nomorPendaftaran) : undefined,
                  nama: row.nama,
                  jenisKelamin: (row.jenisKelamin === 'Perempuan' || row.jenisKelamin === 'P') ? 'Perempuan' : 'Laki-laki',
                  tempatLahir: row.tempatLahir || '',
                  tanggalLahir: row.tanggalLahir || '',
                  alamat: row.alamat || '',
                  rt: String(row.rt || ''),
                  rw: String(row.rw || ''),
                  desa: row.desa || '',
                  kecamatan: row.kecamatan || '',
                  kabupatenKota: row.kabupatenKota || '',
                  provinsi: row.provinsi || '',
                  kodePos: String(row.kodePos || ''),
                  nik: String(row.nik || ''),
                  noKk: String(row.noKk || ''),
                  anakKe: String(row.anakKe || ''),
                  jumlahSaudara: String(row.jumlahSaudara || ''),
                  asalSekolah: row.asalSekolah || '',
                  npsnAsal: String(row.npsnAsal || ''),
                  alamatSekolahAsal: row.alamatSekolahAsal || '',
                  nisn: String(row.nisn || ''),
                  mendaftarKelas: String(row.mendaftarKelas || ''),
                  namaAyah: row.namaAyah || '',
                  nikAyah: String(row.nikAyah || ''),
                  statusAyah: (row.statusAyah === 'Wafat') ? 'Wafat' : 'Hidup',
                  tempatLahirAyah: row.tempatLahirAyah || '',
                  tanggalLahirAyah: row.tanggalLahirAyah || '',
                  pendidikanAyah: row.pendidikanAyah || '',
                  pekerjaanAyah: row.pekerjaanAyah || '',
                  penghasilanAyah: row.penghasilanAyah || '',
                  noHpAyah: String(row.noHpAyah || ''),
                  namaIbu: row.namaIbu || '',
                  nikIbu: String(row.nikIbu || ''),
                  statusIbu: (row.statusIbu === 'Wafat') ? 'Wafat' : 'Hidup',
                  tempatLahirIbu: row.tempatLahirIbu || '',
                  tanggalLahirIbu: row.tanggalLahirIbu || '',
                  pendidikanIbu: row.pendidikanIbu || '',
                  pekerjaanIbu: row.pekerjaanIbu || '',
                  penghasilanIbu: row.penghasilanIbu || '',
                  noHpIbu: String(row.noHpIbu || ''),
                  namaWali: row.namaWali || '',
                  nikWali: String(row.nikWali || ''),
                  tempatLahirWali: row.tempatLahirWali || '',
                  tanggalLahirWali: row.tanggalLahirWali || '',
                  pendidikanWali: row.pendidikanWali || '',
                  pekerjaanWali: row.pekerjaanWali || '',
                  penghasilanWali: row.penghasilanWali || '',
                  noHpWali: String(row.noHpWali || ''),
                  nomorHpOrangTua: String(row.nomorHpOrangTua || ''),
                  jenjang: (appSettings?.jenjangOptions || ['SDI AL-HIDAYAH', 'SMP AL-HIDAYAH', 'SMK AL-HIDAYAH']).includes(row.jenjang) ? row.jenjang : (appSettings?.jenjangOptions?.[0] || 'SMP AL-HIDAYAH'),
                  gelombangPendaftaran: (appSettings?.gelombangOptions || ['Gelombang 1', 'Gelombang 2', 'Gelombang 3']).includes(row.gelombangPendaftaran) ? row.gelombangPendaftaran : (appSettings?.gelombangOptions?.[0] || 'Gelombang 1'),
                  statusValidasi: 'Belum Divalidasi',
                  berkas: { kk: false, akta: false, ktpOrtu: false, sklIjazah: false },
                  tanggalDaftar: row.tanggalDaftar ? String(row.tanggalDaftar) : new Date().toISOString().split('T')[0],
                });
              }
        });
        alert('Data berhasil diimpor!');
      } catch (err) {
        alert('Gagal membaca file Excel. Pastikan formatnya sesuai.');
      }
    };
    reader.readAsArrayBuffer(file);
    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

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

  const handleBulkDelete = () => {
    if (onDeleteSantri) {
      selectedSantriIds.forEach(id => onDeleteSantri(id));
      setSelectedSantriIds([]);
      setShowBulkDeleteConfirm(false);
    }
  };

  const handleBulkStatusUpdate = (newStatus: 'Belum Bayar' | 'Cicilan' | 'Lunas') => {
    selectedSantriIds.forEach(id => {
      onEditSantri(id, { status: newStatus });
    });
    setSelectedSantriIds([]);
  };

  // 1. Filtering
  const filteredSantri = santriList.filter((s) => {
    const matchesSearch =
      s.nama.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.nomorPendaftaran.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesJenjang = filterJenjang === 'All' || s.jenjang === filterJenjang;
    const matchesGelombang = filterGelombang === 'All' || s.gelombangPendaftaran === filterGelombang;
    const matchesStatus = filterStatus === 'All' || s.status === filterStatus;
    const matchesGender = filterGender === 'All' || s.jenisKelamin === filterGender;

    return matchesSearch && matchesJenjang && matchesGelombang && matchesStatus && matchesGender;
  });

  // 2. Sorting
  const addressKey = appSettings?.addressLevel || 'desa';

  const requestSort = (key: keyof Santri | 'total' | 'paid' | 'sisa') => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const sortedSantri = [...filteredSantri].sort((a, b) => {
    const aVal = a[sortConfig.key as keyof Santri];
    const bVal = b[sortConfig.key as keyof Santri];

    if (aVal < bVal) {
      return sortConfig.direction === 'asc' ? -1 : 1;
    }
    if (aVal > bVal) {
      return sortConfig.direction === 'asc' ? 1 : -1;
    }
    return 0;
  });

  // Handle Form Change
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // Open Form for Adding
  const openAddModal = () => {
    // Generate proposed registration number
    const currentYear = 2026;
    const sameYearSantri = santriList.filter(s => s.nomorPendaftaran.startsWith(String(currentYear)));
    let nextSeqNum = 1;
    if (sameYearSantri.length > 0) {
      const numbers = sameYearSantri.map(s => {
        const seq = s.nomorPendaftaran.slice(4);
        return parseInt(seq, 10);
      });
      nextSeqNum = Math.max(...numbers.filter(n => !isNaN(n))) + 1;
    }
    const generatedNoReg = `${currentYear}${String(nextSeqNum).padStart(3, '0')}`;

    setFormData({
      nomorPendaftaran: generatedNoReg,
      tanggalDaftar: new Date().toISOString().split('T')[0],
      nama: '',
      jenisKelamin: (activeRole === 'Admin Putri') ? 'Perempuan' : 'Laki-laki',
      tempatLahir: '',
      tanggalLahir: '',
      alamat: '',
      desa: '',
      kecamatan: '',
      kabupatenKota: '',
      provinsi: '',
      
      // A. Identitas Tambahan
      anakKe: '',
      jumlahSaudara: '',
      nik: '',
      noKk: '',

      // B. Kelembagaan
      asalSekolah: '',
      npsnAsal: '',
      alamatSekolahAsal: '',
      nisn: '',
      mendaftarKelas: '',

      // C. Alamat Tambahan
      rt: '',
      rw: '',
      kodePos: '',

      // D. Data Ayah
      namaAyah: '',
      nikAyah: '',
      statusAyah: 'Hidup',
      tempatLahirAyah: '',
      tanggalLahirAyah: '',
      pendidikanAyah: '',
      pekerjaanAyah: '',
      penghasilanAyah: '',
      noHpAyah: '',

      // Data Ibu
      namaIbu: '',
      nikIbu: '',
      statusIbu: 'Hidup',
      tempatLahirIbu: '',
      tanggalLahirIbu: '',
      pendidikanIbu: '',
      pekerjaanIbu: '',
      penghasilanIbu: '',
      noHpIbu: '',

      // E. Identitas Wali
      namaWali: '',
      tempatLahirWali: '',
      pendidikanWali: '',
      penghasilanWali: '',
      nikWali: '',
      tanggalLahirWali: '',
      pekerjaanWali: '',
      noHpWali: '',

      nomorHpOrangTua: '',
      jenjang: appSettings?.jenjangOptions?.[0] || 'SMP AL-HIDAYAH',
      gelombangPendaftaran: appSettings?.gelombangOptions?.[0] || 'Gelombang 1',
      statusValidasi: 'Belum Divalidasi',
      berkas: { kk: false, akta: false, ktpOrtu: false, sklIjazah: false },
    });
    setFormError('');
    setShowAddModal(true);
  };

  // Open Form for Editing
  const openEditModal = (santri: Santri) => {
    setSelectedSantri(santri);
    setFormData({
      nomorPendaftaran: santri.nomorPendaftaran,
      tanggalDaftar: santri.tanggalDaftar || new Date().toISOString().split('T')[0],
      nama: santri.nama,
      jenisKelamin: santri.jenisKelamin,
      tempatLahir: santri.tempatLahir,
      tanggalLahir: santri.tanggalLahir,
      alamat: santri.alamat,
      desa: santri.desa,
      kecamatan: santri.kecamatan,
      kabupatenKota: santri.kabupatenKota,
      provinsi: santri.provinsi,

      // A. Identitas Tambahan
      anakKe: santri.anakKe || '',
      jumlahSaudara: santri.jumlahSaudara || '',
      nik: santri.nik || '',
      noKk: santri.noKk || '',

      // B. Kelembagaan
      asalSekolah: santri.asalSekolah || '',
      npsnAsal: santri.npsnAsal || '',
      alamatSekolahAsal: santri.alamatSekolahAsal || '',
      nisn: santri.nisn || '',
      mendaftarKelas: santri.mendaftarKelas || '',

      // C. Alamat Tambahan
      rt: santri.rt || '',
      rw: santri.rw || '',
      kodePos: santri.kodePos || '',

      // D. Data Ayah
      namaAyah: santri.namaAyah,
      nikAyah: santri.nikAyah || '',
      statusAyah: santri.statusAyah || 'Hidup',
      tempatLahirAyah: santri.tempatLahirAyah || '',
      tanggalLahirAyah: santri.tanggalLahirAyah || '',
      pendidikanAyah: santri.pendidikanAyah || '',
      pekerjaanAyah: santri.pekerjaanAyah || '',
      penghasilanAyah: santri.penghasilanAyah || '',
      noHpAyah: santri.noHpAyah || '',

      // Data Ibu
      namaIbu: santri.namaIbu,
      nikIbu: santri.nikIbu || '',
      statusIbu: santri.statusIbu || 'Hidup',
      tempatLahirIbu: santri.tempatLahirIbu || '',
      tanggalLahirIbu: santri.tanggalLahirIbu || '',
      pendidikanIbu: santri.pendidikanIbu || '',
      pekerjaanIbu: santri.pekerjaanIbu || '',
      penghasilanIbu: santri.penghasilanIbu || '',
      noHpIbu: santri.noHpIbu || '',

      // E. Identitas Wali
      namaWali: santri.namaWali || '',
      tempatLahirWali: santri.tempatLahirWali || '',
      pendidikanWali: santri.pendidikanWali || '',
      penghasilanWali: santri.penghasilanWali || '',
      nikWali: santri.nikWali || '',
      tanggalLahirWali: santri.tanggalLahirWali || '',
      pekerjaanWali: santri.pekerjaanWali || '',
      noHpWali: santri.noHpWali || '',

      nomorHpOrangTua: santri.nomorHpOrangTua,
      jenjang: santri.jenjang,
      gelombangPendaftaran: santri.gelombangPendaftaran,
      statusValidasi: santri.statusValidasi || 'Belum Divalidasi',
      berkas: santri.berkas || { kk: false, akta: false, ktpOrtu: false, sklIjazah: false },
    });
    setFormError('');
    setShowEditModal(true);
  };

  // Open Santri details drawer
  const openDetailModal = (santri: Santri) => {
    setSelectedSantri(santri);
    setShowDetailModal(true);
  };

  // Submit Add form
  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.nomorPendaftaran?.trim()) {
      setFormError('Nomor registrasi wajib diisi.');
      return;
    }
    if (!formData.nama?.trim()) {
      setFormError('Nama santri wajib diisi.');
      return;
    }
    if (!formData.jenjang) {
      setFormError('Jenjang wajib dipilih.');
      return;
    }

    const result = onAddSantri(formData);
    if (result && !result.success) {
      setFormError(result.error || 'Gagal mendaftarkan santri baru.');
      return;
    }
    setShowAddModal(false);
  };

  // Submit Edit form
  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSantri) return;
    if (!formData.nomorPendaftaran?.trim()) {
      setFormError('Nomor registrasi wajib diisi.');
      return;
    }
    if (!formData.nama?.trim()) {
      setFormError('Nama santri wajib diisi.');
      return;
    }
    if (!formData.jenjang) {
      setFormError('Jenjang wajib dipilih.');
      return;
    }

    const result = onEditSantri(selectedSantri.nomorPendaftaran, formData);
    if (result && !result.success) {
      setFormError(result.error || 'Gagal mengubah profil santri.');
      return;
    }
    setShowEditModal(false);
  };

  // Calculate bill info for details modal
  const getBillingSummary = (noReg: string) => {
    const items = tagihanMap[noReg] || [];
    const total = items.reduce((acc, i) => acc + i.nominal, 0);
    const paid = items.reduce((acc, i) => acc + i.terbayar, 0);
    const sisa = total - paid;
    return { items, total, paid, sisa };
  };

  return (
    <div>
      <div className="print:hidden space-y-6">
        {/* Header and Add Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Master Data {getTerminology(appSettings, { capitalize: true })} Baru</h1>
          <p className="text-xs text-slate-500">Mendaftar, memverifikasi, dan mengelola dokumen {getTerminology(appSettings)} baru</p>
        </div>

        {!isReadOnly && (
          <div className="flex items-center gap-2">
            <button
              onClick={handleExportExcelAll}
              className="bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold px-4 py-2.5 rounded-lg inline-flex items-center gap-2 transition-all shadow-sm cursor-pointer shrink-0"
              title="Unduh Data Excel"
            >
              <FileSpreadsheet size={16} className="text-emerald-600" />
              Unduh Excel
            </button>
            <button
              onClick={handleExportPDFAll}
              className="bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold px-4 py-2.5 rounded-lg inline-flex items-center gap-2 transition-all shadow-sm cursor-pointer shrink-0"
              title="Unduh Laporan PDF / Cetak"
            >
              <FileText size={16} className="text-red-500" />
              Unduh PDF
            </button>
            <button
              id="btn-register-student"
              onClick={openAddModal}
              className="bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold px-4 py-2.5 rounded-lg inline-flex items-center gap-2 transition-all shadow-sm cursor-pointer shrink-0"
            >
              <UserPlus size={16} />
              Daftarkan {getTerminology(appSettings, { capitalize: true })} Baru
            </button>
          </div>
        )}
      </div>

      {/* Filter Options Panel */}
      <div className="bg-white border border-slate-100 p-4 rounded-xl shadow-xs space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {/* Text Search */}
          <div className="lg:col-span-2 relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Cari Nama atau Nomor Reg..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 pr-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-emerald-500 w-full bg-slate-50"
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



          {/* Gender Filter */}
          <div>
            <select
              value={filterGender}
              onChange={(e) => setFilterGender(e.target.value)}
              className="px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-emerald-500 w-full bg-slate-50 font-medium"
            >
              <option value="All">Semua Gender</option>
              <option value="Laki-laki">Laki-laki</option>
              <option value="Perempuan">Perempuan</option>
            </select>
          </div>
        </div>
      </div>

      {/* Main Students Table */}
      <div className="bg-white border border-slate-100 rounded-xl shadow-xs overflow-hidden">
        {/* Bulk Actions Toolbar */}
        {selectedSantriIds.length > 0 && (
          <div className="bg-emerald-50 border-b border-emerald-100 p-4 flex items-center justify-between animate-in slide-in-from-top duration-200">
            <div className="flex items-center gap-3">
              <span className="text-xs font-bold text-emerald-800">
                {selectedSantriIds.length} {getTerminology(appSettings)} dipilih
              </span>
              <div className="h-4 w-px bg-emerald-200 mx-1"></div>
              <div className="flex items-center gap-2">
                {/* Status update buttons removed as per user request */}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button 
                onClick={() => setShowBulkDeleteConfirm(true)}
                className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-lg text-[10px] font-bold transition-all shadow-sm flex items-center gap-1.5 cursor-pointer"
              >
                <Trash2 size={12} />
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

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-100 text-xs font-bold text-slate-400 uppercase tracking-wider bg-slate-50/70">
                <th className="py-3 px-4 text-center w-10">
                  <input 
                    type="checkbox" 
                    className="rounded text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                    checked={selectedSantriIds.length === sortedSantri.length && sortedSantri.length > 0}
                    onChange={() => toggleSelectAll(sortedSantri)}
                  />
                </th>
                <th 
                  className="py-3 px-4 cursor-pointer hover:bg-slate-100/50 transition-colors"
                  onClick={() => requestSort('nomorPendaftaran')}
                >
                  <div className="flex items-center gap-1">
                    Nomor Registrasi
                    {sortConfig.key === 'nomorPendaftaran' && (
                      <span>{sortConfig.direction === 'asc' ? '↑' : '↓'}</span>
                    )}
                  </div>
                </th>
                <th 
                  className="py-3 px-4 cursor-pointer hover:bg-slate-100/50 transition-colors"
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
                  className="py-3 px-4 cursor-pointer hover:bg-slate-100/50 transition-colors"
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
                  className="py-3 px-4 cursor-pointer hover:bg-slate-100/50 transition-colors"
                  onClick={() => requestSort(addressKey)}
                >
                  <div className="flex items-center gap-1">
                    {addressKey === 'desa' && 'Alamat (Desa)'}
                    {addressKey === 'kecamatan' && 'Alamat (Kecamatan)'}
                    {addressKey === 'kabupatenKota' && 'Alamat (Kabupaten/Kota)'}
                    {addressKey === 'provinsi' && 'Alamat (Provinsi)'}
                    {sortConfig.key === addressKey && (
                      <span>{sortConfig.direction === 'asc' ? '↑' : '↓'}</span>
                    )}
                  </div>
                </th>
                <th 
                  className="py-3 px-4 cursor-pointer hover:bg-slate-100/50 transition-colors"
                  onClick={() => requestSort('jenjang')}
                >
                  <div className="flex items-center gap-1">
                    Jenjang & Gelombang
                    {sortConfig.key === 'jenjang' && (
                      <span>{sortConfig.direction === 'asc' ? '↑' : '↓'}</span>
                    )}
                  </div>
                </th>
                <th className="py-3 px-4 text-center">Aksi</th>
              </tr>
            </thead>
            <motion.tbody
              initial="hidden"
              animate="visible"
              variants={{
                visible: { transition: { staggerChildren: 0.05 } }
              }}
            >
              {sortedSantri.length > 0 ? (
                sortedSantri.map((s) => {
                  const billSummary = getBillingSummary(s.nomorPendaftaran);
                  return (
                    <motion.tr
                      key={s.nomorPendaftaran}
                      variants={{
                        hidden: { opacity: 0, y: 10 },
                        visible: { opacity: 1, y: 0 }
                      }}
                      className="border-b border-slate-100 text-xs hover:bg-slate-50/40 transition-colors"
                    >
                      <td className="py-3 px-4 text-center">
                        <input 
                          type="checkbox" 
                          className="rounded text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                          checked={selectedSantriIds.includes(s.nomorPendaftaran)}
                          onChange={() => toggleSelectSantri(s.nomorPendaftaran)}
                          onClick={(e) => e.stopPropagation()}
                        />
                      </td>
                      {/* No Reg */}
                      <td className="py-3 px-4 font-mono font-bold text-slate-900">
                        {s.nomorPendaftaran}
                        <div className="text-[10px] text-slate-400 font-normal mt-0.5">Daftar: {s.tanggalDaftar}</div>
                      </td>

                      {/* Name */}
                      <td className="py-3 px-4">
                        <div className="font-semibold text-slate-800 text-sm">{s.nama}</div>
                      </td>

                      {/* Jenis Kelamin */}
                      <td className="py-3 px-4">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          s.jenisKelamin === 'Laki-laki' ? 'bg-blue-50 text-blue-700' : 'bg-pink-50 text-pink-700'
                        }`}>
                          {s.jenisKelamin === 'Laki-laki' ? 'L' : 'P'}
                        </span>
                      </td>

                      {/* Alamat (Sesuai setelan) */}
                      <td className="py-3 px-4 font-medium text-slate-700">
                        {addressKey === 'desa' && (s.desa ? `Desa ${s.desa}` : '-')}
                        {addressKey === 'kecamatan' && (s.kecamatan ? `Kec. ${s.kecamatan}` : '-')}
                        {addressKey === 'kabupatenKota' && (s.kabupatenKota || '-')}
                        {addressKey === 'provinsi' && (s.provinsi || '-')}
                      </td>

                      {/* Jenjang */}
                      <td className="py-3 px-4 space-y-1">
                        <div>
                          <span className="bg-emerald-50 text-emerald-800 px-2 py-0.5 rounded text-[10px] font-semibold">
                            {s.jenjang}
                          </span>
                        </div>
                        <div className="text-[10px] text-slate-500 font-medium">{s.gelombangPendaftaran}</div>
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4">
                        <div className="flex items-center justify-center gap-1.5">
                          {/* Details Button */}
                          <button
                            id={`btn-view-${s.nomorPendaftaran.toLowerCase()}`}
                            onClick={() => openDetailModal(s)}
                            className="p-1.5 text-slate-600 hover:text-emerald-700 hover:bg-slate-100 rounded-md transition-all cursor-pointer"
                            title="Detail Profil & Rincian Tagihan"
                          >
                            <Eye size={15} />
                          </button>

                          {/* Edit Button (Gated) */}
                          {!isReadOnly && (
                            <button
                              id={`btn-edit-${s.nomorPendaftaran.toLowerCase()}`}
                              onClick={() => openEditModal(s)}
                              className="p-1.5 text-slate-600 hover:text-indigo-700 hover:bg-slate-100 rounded-md transition-all cursor-pointer"
                              title="Ubah Profil"
                            >
                              <Edit3 size={15} />
                            </button>
                          )}

                          <button
                            onClick={() => handlePrint(s)}
                            className="p-1.5 text-slate-600 hover:text-emerald-700 hover:bg-slate-100 rounded-md transition-all cursor-pointer"
                            title="Cetak Formulir Pendaftaran"
                          >
                            <Printer size={15} />
                          </button>

                          {/* Delete Button (Gated) */}
                          {!isReadOnly && onDeleteSantri && (
                            <button
                              id={`btn-delete-${s.nomorPendaftaran.toLowerCase()}`}
                              onClick={() => setDeleteConfirmTarget(s)}
                              className="p-1.5 text-slate-600 hover:text-red-600 hover:bg-slate-100 rounded-md transition-all cursor-pointer"
                              title="Hapus Santri"
                            >
                              <Trash2 size={15} />
                            </button>
                          )}


                        </div>
                      </td>
                    </motion.tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={7} className="py-10 text-center text-slate-400">
                    Tidak ditemukan data santri yang sesuai dengan filter pencarian.
                  </td>
                </tr>
              )}
            </motion.tbody>
          </table>
        </div>
      </div>

      {/* DELETE BULK CONFIRMATION MODAL */}
      {showBulkDeleteConfirm && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[60] p-4 backdrop-blur-xs">
          <div className="bg-white rounded-3xl p-8 max-w-sm w-full text-center shadow-2xl animate-in fade-in zoom-in duration-200">
            <div className="w-16 h-16 bg-red-50 text-red-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Trash2 size={32} />
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-2">Hapus Data Masal?</h3>
            <p className="text-slate-500 text-sm mb-6 font-medium">
              Apakah Anda yakin ingin menghapus <strong>{selectedSantriIds.length}</strong> data {getTerminology(appSettings)}? Tindakan ini tidak dapat dibatalkan.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowBulkDeleteConfirm(false)}
                className="flex-1 px-4 py-3 border border-slate-200 rounded-2xl text-sm font-bold text-slate-600 hover:bg-slate-50 cursor-pointer"
              >
                Batal
              </button>
              <button
                onClick={handleBulkDelete}
                className="flex-1 px-4 py-3 bg-red-600 hover:bg-red-700 text-white rounded-2xl text-sm font-bold shadow-lg shadow-red-100 cursor-pointer"
              >
                Ya, Hapus Semua
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 1: ADD SANTRI */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl w-full max-w-2xl overflow-hidden shadow-xl animate-in fade-in zoom-in duration-200">
            <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-base">Formulir Registrasi Santri Baru</h3>
                <p className="text-[11px] text-slate-400">Pastikan data yang diisi telah sesuai dengan dokumen asli (KK/KTP Wali)</p>
              </div>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-white cursor-pointer">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleAddSubmit} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
              {formError && (
                <div className="bg-red-50 text-red-700 border border-red-200 p-3 rounded-lg text-xs flex items-center gap-2 font-medium">
                  <CircleAlert size={14} className="shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              {/* Grid 1: Identitas */}
              <div className="space-y-4">
                <div className="bg-emerald-50/30 p-4 rounded-2xl border border-emerald-100/60 flex items-center justify-between">
                  <div>
                    <label className="block text-[11px] font-semibold text-emerald-800 mb-1">Nomor Registrasi Santri *</label>
                    <input
                      type="text"
                      name="nomorPendaftaran"
                      value={formData.nomorPendaftaran}
                      onChange={handleInputChange}
                      placeholder="Contoh: 2026001"
                      className="px-3 py-2 text-xs border border-emerald-200 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-emerald-500 w-48 font-mono font-bold text-emerald-700 bg-white"
                      required
                    />
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] text-slate-400 block font-semibold uppercase tracking-wider">Tanggal Registrasi</span>
                    <input
                      type="date"
                      name="tanggalDaftar"
                      value={formData.tanggalDaftar}
                      onChange={handleInputChange}
                      className="px-3 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-emerald-500 font-mono text-slate-700 font-medium"
                      
                    />
                  </div>
                </div>

                <SantriFormFields
                  formData={formData}
                  onChange={handleInputChange}
                  setFormData={setFormData}
                  activeRole={activeRole}
                  config={appSettings?.formFields}
                  jenjangOptions={appSettings?.jenjangOptions}
                  gelombangOptions={appSettings?.gelombangOptions}
                  appSettings={appSettings}
                />

                <div className="bg-emerald-50/50 p-3 rounded-lg border border-emerald-100">
                  <p className="text-[10px] text-emerald-800 leading-relaxed font-medium">
                    💡 <strong>Penetapan Tagihan Otomatis:</strong> Sistem akan mengenerate tagihan awal secara otomatis berdasarkan Master Biaya yang terdaftar saat ini begitu santri didaftarkan.
                  </p>
                </div>
              </div>

              {/* Buttons */}
              <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 border border-slate-200 rounded-lg text-xs font-medium hover:bg-slate-50 text-slate-600 cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-xs font-semibold cursor-pointer shadow-sm"
                >
                  Daftarkan & Generate Tagihan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: EDIT SANTRI */}
      {showEditModal && selectedSantri && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl w-full max-w-2xl overflow-hidden shadow-xl animate-in fade-in zoom-in duration-200">
            <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-base">Ubah Profil Santri</h3>
                <p className="text-[11px] text-slate-400">Nomor Registrasi: {selectedSantri.nomorPendaftaran}</p>
              </div>
              <button onClick={() => setShowEditModal(false)} className="text-slate-400 hover:text-white cursor-pointer">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleEditSubmit} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
              {formError && (
                <div className="bg-red-50 text-red-700 border border-red-200 p-3 rounded-lg text-xs flex items-center gap-2 font-medium">
                  <CircleAlert size={14} className="shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              {/* Identitas */}
              <div className="space-y-4">
                <div className="bg-indigo-50/30 p-4 rounded-2xl border border-indigo-100/60 flex items-center justify-between">
                  <div>
                    <label className="block text-[11px] font-semibold text-indigo-800 mb-1">Nomor Registrasi Santri *</label>
                    <input
                      type="text"
                      name="nomorPendaftaran"
                      value={formData.nomorPendaftaran}
                      onChange={handleInputChange}
                      className="px-3 py-2 text-xs border border-indigo-200 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-indigo-500 w-48 font-mono font-bold text-indigo-700 bg-white"
                      required
                    />
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] text-slate-400 block font-semibold uppercase tracking-wider">Tanggal Registrasi</span>
                    <input
                      type="date"
                      name="tanggalDaftar"
                      value={formData.tanggalDaftar}
                      onChange={handleInputChange}
                      className="px-3 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-indigo-500 font-mono text-slate-700 font-medium"
                      
                    />
                  </div>
                </div>

                <SantriFormFields
                  formData={formData}
                  onChange={handleInputChange}
                  setFormData={setFormData}
                  activeRole={activeRole}
                  config={appSettings?.formFields}
                  jenjangOptions={appSettings?.jenjangOptions}
                  gelombangOptions={appSettings?.gelombangOptions}
                  appSettings={appSettings}
                />

                <div className="bg-emerald-50/50 p-3 rounded-lg border border-emerald-100">
                  <p className="text-[10px] text-emerald-800 leading-relaxed font-medium">
                    💡 <strong>Pembaruan Data:</strong> Perubahan data ini akan langsung tersinkronisasi dengan seluruh laporan dan kwitansi yang terkait.
                  </p>
                </div>
              </div>

              {/* Buttons */}
              <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="px-4 py-2 border border-slate-200 rounded-lg text-xs font-medium hover:bg-slate-50 text-slate-600 cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-700 hover:bg-indigo-800 text-white rounded-lg text-xs font-semibold cursor-pointer shadow-sm"
                >
                  Simpan Perubahan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: DETAIL SANTRI & ALLOCATION STATS */}
      {showDetailModal && selectedSantri && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl w-full max-w-3xl overflow-hidden shadow-xl animate-in fade-in zoom-in duration-200">
            {/* Modal Header */}
            <div className="bg-emerald-950 text-white p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 relative">
              <button 
                onClick={() => setShowDetailModal(false)} 
                className="absolute top-4 right-4 text-emerald-400 hover:text-white transition-colors cursor-pointer"
              >
                <X size={24} />
              </button>
              <div className="flex items-start gap-4">
                <div className="bg-emerald-900 p-3 rounded-xl border border-emerald-800 text-emerald-300">
                  <GraduationCap size={32} />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-lg md:text-xl tracking-tight">{selectedSantri.nama}</h3>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      selectedSantri.jenisKelamin === 'Laki-laki' ? 'bg-blue-900/40 text-blue-200' : 'bg-pink-900/40 text-pink-200'
                    }`}>{selectedSantri.jenisKelamin}</span>
                  </div>
                  <p className="text-xs text-slate-300 font-mono mt-0.5">ID REGISTRASI: {selectedSantri.nomorPendaftaran}</p>
                </div>
              </div>

              <div className="flex flex-col items-end gap-1 shrink-0">
                {selectedSantri.status === 'Lunas' ? (
                  <span className="bg-emerald-500 text-white px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1">
                    <CheckCircle size={14} /> LUNAS
                  </span>
                ) : selectedSantri.status === 'Cicilan' ? (
                  <span className="bg-amber-500 text-white px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1">
                    <CircleAlert size={14} /> CICILAN
                  </span>
                ) : (
                  <span className="bg-red-500 text-white px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1">
                    <CircleAlert size={14} /> BELUM BAYAR
                  </span>
                )}
                <span className="text-[10px] text-slate-400">Tgl Daftar: {selectedSantri.tanggalDaftar}</span>
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6 max-h-[65vh] overflow-y-auto">
              {/* Profil Identitas */}
              <div className="space-y-4">
                {/* A. IDENTITAS SANTRI */}
                <div>
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">A. IDENTITAS SANTRI</h4>
                  <div className="bg-slate-50 border border-slate-100 rounded-xl p-3 space-y-2 text-xs text-slate-700">
                    <div className="flex justify-between">
                      <span className="text-slate-400 font-medium">Nama Lengkap:</span>
                      <span className="font-semibold text-slate-950">{selectedSantri.nama}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400 font-medium">Tempat Lahir:</span>
                      <span className="font-medium text-slate-800">{selectedSantri.tempatLahir}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400 font-medium">Tanggal Lahir:</span>
                      <span className="font-medium text-slate-800">{selectedSantri.tanggalLahir}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400 font-medium">Jenis Kelamin:</span>
                      <span className="font-medium text-slate-800">{selectedSantri.jenisKelamin}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400 font-medium">Anak Ke / Jumlah Saudara:</span>
                      <span className="font-medium text-slate-800">
                        {selectedSantri.anakKe || '-'} dari {selectedSantri.jumlahSaudara || '-'} bersaudara
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400 font-medium">NIK:</span>
                      <span className="font-mono font-medium text-slate-800">{selectedSantri.nik || '-'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400 font-medium">No. KK:</span>
                      <span className="font-mono font-medium text-slate-800">{selectedSantri.noKk || '-'}</span>
                    </div>
                  </div>
                </div>

                {/* B. KELEMBAGAAN */}
                <div>
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">B. KELEMBAGAAN</h4>
                  <div className="bg-slate-50 border border-slate-100 rounded-xl p-3 space-y-2 text-xs text-slate-700">
                    <div className="flex justify-between">
                      <span className="text-slate-400 font-medium">Asal Sekolah/Madrasah:</span>
                      <span className="font-semibold text-slate-800">{selectedSantri.asalSekolah}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400 font-medium">NPSN Sekolah Asal:</span>
                      <span className="font-mono text-slate-800">{selectedSantri.npsnAsal || '-'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400 font-medium">Alamat Sekolah Asal:</span>
                      <span className="text-slate-800 text-right">{selectedSantri.alamatSekolahAsal || '-'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400 font-medium">NISN:</span>
                      <span className="font-mono text-slate-800">{selectedSantri.nisn || '-'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400 font-medium">Mendaftar Untuk Kelas:</span>
                      <span className="font-semibold text-slate-800">{selectedSantri.mendaftarKelas || '-'}</span>
                    </div>
                  </div>
                </div>

                {/* C. ALAMAT */}
                <div>
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">C. ALAMAT</h4>
                  <div className="bg-slate-50 border border-slate-100 rounded-xl p-3 space-y-2 text-xs text-slate-700">
                    <div className="flex justify-between">
                      <span className="text-slate-400 font-medium">Jalan/Dusun:</span>
                      <span className="text-slate-800 font-medium">{selectedSantri.alamat || '-'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400 font-medium">RT / RW:</span>
                      <span className="font-mono text-slate-800">RT {selectedSantri.rt || '00'} / RW {selectedSantri.rw || '00'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400 font-medium">Kelurahan/Desa:</span>
                      <span className="font-medium text-slate-800">{selectedSantri.desa || '-'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400 font-medium">Kecamatan:</span>
                      <span className="font-medium text-slate-800">{selectedSantri.kecamatan || '-'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400 font-medium">Kabupaten/Kota:</span>
                      <span className="font-medium text-slate-800">{selectedSantri.kabupatenKota || '-'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400 font-medium">Provinsi:</span>
                      <span className="font-medium text-slate-800">{selectedSantri.provinsi || '-'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400 font-medium">Kode Pos:</span>
                      <span className="font-mono text-slate-800">{selectedSantri.kodePos || '-'}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                {/* D. IDENTITAS ORANG TUA */}
                <div>
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">D. IDENTITAS ORANG TUA</h4>
                  <div className="bg-slate-50 border border-slate-100 rounded-xl p-3 space-y-3 text-xs text-slate-700">
                    {/* AYAH */}
                    <div className="border-b border-slate-200/60 pb-2 space-y-1.5">
                      <span className="font-bold text-[10px] text-amber-800 uppercase tracking-wide block">— DATA AYAH</span>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Nama Lengkap:</span>
                        <span className="font-semibold text-slate-950">{selectedSantri.namaAyah}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">NIK:</span>
                        <span className="font-mono">{selectedSantri.nikAyah || '-'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Status:</span>
                        <span className="font-medium">{selectedSantri.statusAyah || 'Hidup'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Tempat, Tgl Lahir:</span>
                        <span>{selectedSantri.tempatLahirAyah || '-'}, {selectedSantri.tanggalLahirAyah || '-'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Pendidikan / Pekerjaan:</span>
                        <span>{selectedSantri.pendidikanAyah || '-'} / {selectedSantri.pekerjaanAyah || '-'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Penghasilan Rata-rata:</span>
                        <span>{selectedSantri.penghasilanAyah || '-'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">No. HP:</span>
                        <span className="font-mono text-slate-800">{selectedSantri.noHpAyah || '-'}</span>
                      </div>
                    </div>

                    {/* IBU */}
                    <div className="space-y-1.5">
                      <span className="font-bold text-[10px] text-pink-800 uppercase tracking-wide block">— DATA IBU</span>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Nama Lengkap:</span>
                        <span className="font-semibold text-slate-950">{selectedSantri.namaIbu}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">NIK:</span>
                        <span className="font-mono">{selectedSantri.nikIibu || selectedSantri.nikIbu || '-'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Status:</span>
                        <span className="font-medium">{selectedSantri.statusIbu || 'Hidup'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Tempat, Tgl Lahir:</span>
                        <span>{selectedSantri.tempatLahirIbu || '-'}, {selectedSantri.tanggalLahirIbu || '-'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Pendidikan / Pekerjaan:</span>
                        <span>{selectedSantri.pendidikanIbu || '-'} / {selectedSantri.pekerjaanIbu || '-'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Penghasilan Rata-rata:</span>
                        <span>{selectedSantri.penghasilanIbu || '-'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">No. HP:</span>
                        <span className="font-mono text-slate-800">{selectedSantri.noHpIbu || '-'}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* E. IDENTITAS WALI */}
                {selectedSantri.namaWali && (
                  <div>
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">E. IDENTITAS WALI</h4>
                    <div className="bg-slate-50 border border-slate-100 rounded-xl p-3 space-y-1.5 text-xs text-slate-700">
                      <div className="flex justify-between">
                        <span className="text-slate-400">Nama Lengkap:</span>
                        <span className="font-semibold text-slate-950">{selectedSantri.namaWali}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">NIK:</span>
                        <span className="font-mono">{selectedSantri.nikWali || '-'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Tempat, Tgl Lahir:</span>
                        <span>{selectedSantri.tempatLahirWali || '-'}, {selectedSantri.tanggalLahirWali || '-'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Pendidikan / Pekerjaan:</span>
                        <span>{selectedSantri.pendidikanWali || '-'} / {selectedSantri.pekerjaanWali || '-'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Penghasilan / No. HP:</span>
                        <span>{selectedSantri.penghasilanWali || '-'} / <span className="font-mono">{selectedSantri.noHpWali || '-'}</span></span>
                      </div>
                    </div>
                  </div>
                )}

                {/* WA AKTIF & ACADEMIC PLACEMENT */}
                <div>
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Kontak Utama & Akademik</h4>
                  <div className="bg-emerald-50/50 border border-emerald-100 rounded-xl p-3 space-y-2 text-xs text-slate-800">
                    <div className="flex justify-between">
                      <span className="text-emerald-800 font-medium">WhatsApp Aktif:</span>
                      <span className="font-bold text-emerald-900 font-mono flex items-center gap-1">
                        <Phone size={12} className="text-emerald-700" />
                        {selectedSantri.nomorHpOrangTua}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-emerald-800 font-medium">Jenjang / Gelombang:</span>
                      <span className="font-bold text-emerald-900">
                        {selectedSantri.jenjang} ({selectedSantri.gelombangPendaftaran})
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Validation & Documents */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">F. Status Verifikasi & Kelengkapan Berkas</h4>
                <div className="bg-slate-50 border border-slate-100 rounded-xl p-3 space-y-2.5 text-xs text-slate-700">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400 font-medium">Status Verifikasi Data:</span>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      selectedSantri.statusValidasi === 'Valid' ? 'bg-emerald-100 text-emerald-700' :
                      selectedSantri.statusValidasi === 'Tidak Valid' ? 'bg-red-100 text-red-700' :
                      'bg-amber-100 text-amber-700'
                    }`}>
                      {selectedSantri.statusValidasi === 'Belum Divalidasi' ? 'Belum Diverifikasi' : selectedSantri.statusValidasi}
                    </span>
                  </div>
                  <div className="pt-2 border-t border-slate-100 space-y-1.5">
                    <span className="text-slate-400 font-medium block mb-1">Status Berkas Fisik:</span>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="flex items-center gap-1.5">
                        {selectedSantri.berkas?.kk ? <CheckCircle size={12} className="text-emerald-500" /> : <CircleAlert size={12} className="text-amber-500" />}
                        <span className={selectedSantri.berkas?.kk ? 'text-slate-700 font-medium' : 'text-slate-400'}>KK</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        {selectedSantri.berkas?.akta ? <CheckCircle size={12} className="text-emerald-500" /> : <CircleAlert size={12} className="text-amber-500" />}
                        <span className={selectedSantri.berkas?.akta ? 'text-slate-700 font-medium' : 'text-slate-400'}>Akta</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        {selectedSantri.berkas?.ktpOrtu ? <CheckCircle size={12} className="text-emerald-500" /> : <CircleAlert size={12} className="text-amber-500" />}
                        <span className={selectedSantri.berkas?.ktpOrtu ? 'text-slate-700 font-medium' : 'text-slate-400'}>KTP Ortu</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        {selectedSantri.berkas?.sklIjazah ? <CheckCircle size={12} className="text-emerald-500" /> : <CircleAlert size={12} className="text-amber-500" />}
                        <span className={selectedSantri.berkas?.sklIjazah ? 'text-slate-700 font-medium' : 'text-slate-400'}>Ijazah/SKL</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>


            </div>

            {/* Footer */}
            <div className="bg-slate-50 px-6 py-4 flex justify-end gap-2 border-t border-slate-100">
              <button
                onClick={() => setShowDetailModal(false)}
                className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg text-xs font-semibold cursor-pointer"
              >
                Tutup Window
              </button>
            </div>
          </div>
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
                <h3 className="text-sm font-bold text-slate-900">Konfirmasi Hapus Santri</h3>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Apakah Anda yakin ingin menghapus data santri <strong className="text-slate-800">{deleteConfirmTarget.nama} ({deleteConfirmTarget.nomorPendaftaran})</strong>?
                </p>
                <div className="text-xs text-red-600 bg-red-50 p-2.5 rounded-lg border border-red-100/50">
                  <span className="font-bold">Peringatan:</span> Semua data tagihan dan rincian transaksi terkait juga akan dihapus secara permanen dari sistem. Tindakan ini tidak dapat dibatalkan.
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
                  if (onDeleteSantri) {
                    onDeleteSantri(deleteConfirmTarget.nomorPendaftaran);
                  }
                  setDeleteConfirmTarget(null);
                }}
                className="px-4 py-2 text-xs font-semibold text-white bg-red-600 hover:bg-red-700 rounded-xl shadow-xs transition-all cursor-pointer"
              >
                Ya, Hapus Permanen
              </button>
            </div>
          </div>
        </div>
      )}
      </div>

      {/* Printable Form */}
      {printingSantri && (
        <div className="hidden print:block absolute top-0 left-0 w-full bg-white z-50 text-black p-8 font-sans">
          <div className="text-center mb-6 border-b-2 border-black pb-4">
            <h1 className="text-xl font-bold uppercase tracking-wide">Formulir Pendaftaran Santri Baru</h1>
            <p className="text-sm font-semibold">Pondok Pesantren Wahyu Hidayatul Islam</p>
            <div className="mt-3 flex justify-between text-xs font-mono max-w-md mx-auto">
              <span>No. Registrasi: <strong>{printingSantri.nomorPendaftaran}</strong></span>
              <span>Tgl. Pendaftaran: <strong>{printingSantri.tanggalDaftar}</strong></span>
            </div>
          </div>
          
          <div className="space-y-6 text-xs leading-relaxed">
            {/* A. IDENTITAS SANTRI */}
            <div>
              <h3 className="font-bold border-b border-gray-400 pb-1 mb-2">A. IDENTITAS SANTRI</h3>
              <table className="w-full">
                <tbody>
                  <tr>
                    <td className="w-1/3 py-1 font-semibold">Nama Lengkap</td>
                    <td className="py-1">: {printingSantri.nama}</td>
                  </tr>
                  <tr>
                    <td className="py-1 font-semibold">Tempat Lahir</td>
                    <td className="py-1">: {printingSantri.tempatLahir}</td>
                  </tr>
                  <tr>
                    <td className="py-1 font-semibold">Tanggal Lahir</td>
                    <td className="py-1">: {printingSantri.tanggalLahir}</td>
                  </tr>
                  <tr>
                    <td className="py-1 font-semibold">Jenis Kelamin</td>
                    <td className="py-1">: {printingSantri.jenisKelamin}</td>
                  </tr>
                  <tr>
                    <td className="py-1 font-semibold">Anak Ke</td>
                    <td className="py-1">: {printingSantri.anakKe || '-'}</td>
                  </tr>
                  <tr>
                    <td className="py-1 font-semibold">Jumlah Saudara</td>
                    <td className="py-1">: {printingSantri.jumlahSaudara || '-'}</td>
                  </tr>
                  <tr>
                    <td className="py-1 font-semibold">NIK (Nomor Induk Kependudukan)</td>
                    <td className="py-1">: {printingSantri.nik || '-'}</td>
                  </tr>
                  <tr>
                    <td className="py-1 font-semibold">No. KK (Kartu Keluarga)</td>
                    <td className="py-1">: {printingSantri.noKk || '-'}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* B. KELEMBAGAAN */}
            <div>
              <h3 className="font-bold border-b border-gray-400 pb-1 mb-2">B. KELEMBAGAAN</h3>
              <table className="w-full">
                <tbody>
                  <tr>
                    <td className="w-1/3 py-1 font-semibold">Asal Sekolah/Madrasah</td>
                    <td className="py-1">: {printingSantri.asalSekolah || '-'}</td>
                  </tr>
                  <tr>
                    <td className="py-1 font-semibold">NPSN Sekolah Asal</td>
                    <td className="py-1">: {printingSantri.npsnAsal || '-'}</td>
                  </tr>
                  <tr>
                    <td className="py-1 font-semibold">Alamat Sekolah Asal</td>
                    <td className="py-1">: {printingSantri.alamatSekolahAsal || '-'}</td>
                  </tr>
                  <tr>
                    <td className="py-1 font-semibold">NISN</td>
                    <td className="py-1">: {printingSantri.nisn || '-'}</td>
                  </tr>
                  <tr>
                    <td className="py-1 font-semibold">Mendaftar Untuk Kelas</td>
                    <td className="py-1">: {printingSantri.mendaftarKelas || '-'} (Jenjang: {printingSantri.jenjang}, {printingSantri.gelombangPendaftaran})</td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* C. ALAMAT */}
            <div>
              <h3 className="font-bold border-b border-gray-400 pb-1 mb-2">C. ALAMAT</h3>
              <table className="w-full">
                <tbody>
                  <tr>
                    <td className="w-1/3 py-1 font-semibold">Jalan/Dusun</td>
                    <td className="py-1">: {printingSantri.alamat || '-'}</td>
                  </tr>
                  <tr>
                    <td className="py-1 font-semibold">RT / RW</td>
                    <td className="py-1">: RT {printingSantri.rt || '00'} / RW {printingSantri.rw || '00'}</td>
                  </tr>
                  <tr>
                    <td className="py-1 font-semibold">Kelurahan/Desa</td>
                    <td className="py-1">: {printingSantri.desa || '-'}</td>
                  </tr>
                  <tr>
                    <td className="py-1 font-semibold">Kecamatan</td>
                    <td className="py-1">: {printingSantri.kecamatan || '-'}</td>
                  </tr>
                  <tr>
                    <td className="py-1 font-semibold">Kabupaten/Kota</td>
                    <td className="py-1">: {printingSantri.kabupatenKota || '-'}</td>
                  </tr>
                  <tr>
                    <td className="py-1 font-semibold">Provinsi</td>
                    <td className="py-1">: {printingSantri.provinsi || '-'}</td>
                  </tr>
                  <tr>
                    <td className="py-1 font-semibold">Kode Pos</td>
                    <td className="py-1">: {printingSantri.kodePos || '-'}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* D. IDENTITAS ORANG TUA */}
            <div className="page-break-before">
              <h3 className="font-bold border-b border-gray-400 pb-1 mb-2">D. IDENTITAS ORANG TUA</h3>
              
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <h4 className="font-semibold text-xs border-b border-dashed border-gray-300 pb-0.5 mb-1.5 uppercase text-gray-700">DATA AYAH:</h4>
                  <table className="w-full text-[11px]">
                    <tbody>
                      <tr>
                        <td className="w-2/5 py-0.5 font-medium">Nama Lengkap</td>
                        <td className="py-0.5">: {printingSantri.namaAyah || '-'}</td>
                      </tr>
                      <tr>
                        <td className="py-0.5 font-medium">NIK</td>
                        <td className="py-0.5">: {printingSantri.nikAyah || '-'}</td>
                      </tr>
                      <tr>
                        <td className="py-0.5 font-medium">Status</td>
                        <td className="py-0.5">: {printingSantri.statusAyah || 'Hidup'}</td>
                      </tr>
                      <tr>
                        <td className="py-0.5 font-medium">Tempat Lahir</td>
                        <td className="py-0.5">: {printingSantri.tempatLahirAyah || '-'}</td>
                      </tr>
                      <tr>
                        <td className="py-0.5 font-medium">Tanggal Lahir</td>
                        <td className="py-0.5">: {printingSantri.tanggalLahirAyah || '-'}</td>
                      </tr>
                      <tr>
                        <td className="py-0.5 font-medium">Pendidikan</td>
                        <td className="py-0.5">: {printingSantri.pendidikanAyah || '-'}</td>
                      </tr>
                      <tr>
                        <td className="py-0.5 font-medium">Pekerjaan</td>
                        <td className="py-0.5">: {printingSantri.pekerjaanAyah || '-'}</td>
                      </tr>
                      <tr>
                        <td className="py-0.5 font-medium">Penghasilan</td>
                        <td className="py-0.5">: {printingSantri.penghasilanAyah || '-'}</td>
                      </tr>
                      <tr>
                        <td className="py-0.5 font-medium">No. HP / WhatsApp</td>
                        <td className="py-0.5">: {printingSantri.noHpAyah || '-'}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                <div>
                  <h4 className="font-semibold text-xs border-b border-dashed border-gray-300 pb-0.5 mb-1.5 uppercase text-gray-700">DATA IBU:</h4>
                  <table className="w-full text-[11px]">
                    <tbody>
                      <tr>
                        <td className="w-2/5 py-0.5 font-medium">Nama Lengkap</td>
                        <td className="py-0.5">: {printingSantri.namaIbu || '-'}</td>
                      </tr>
                      <tr>
                        <td className="py-0.5 font-medium">NIK</td>
                        <td className="py-0.5">: {printingSantri.nikIibu || printingSantri.nikIbu || '-'}</td>
                      </tr>
                      <tr>
                        <td className="py-0.5 font-medium">Status</td>
                        <td className="py-0.5">: {printingSantri.statusIbu || 'Hidup'}</td>
                      </tr>
                      <tr>
                        <td className="py-0.5 font-medium">Tempat Lahir</td>
                        <td className="py-0.5">: {printingSantri.tempatLahirIbu || '-'}</td>
                      </tr>
                      <tr>
                        <td className="py-0.5 font-medium">Tanggal Lahir</td>
                        <td className="py-0.5">: {printingSantri.tanggalLahirIbu || '-'}</td>
                      </tr>
                      <tr>
                        <td className="py-0.5 font-medium">Pendidikan</td>
                        <td className="py-0.5">: {printingSantri.pendidikanIbu || '-'}</td>
                      </tr>
                      <tr>
                        <td className="py-0.5 font-medium">Pekerjaan</td>
                        <td className="py-0.5">: {printingSantri.pekerjaanIbu || '-'}</td>
                      </tr>
                      <tr>
                        <td className="py-0.5 font-medium">Penghasilan</td>
                        <td className="py-0.5">: {printingSantri.penghasilanIbu || '-'}</td>
                      </tr>
                      <tr>
                        <td className="py-0.5 font-medium">No. HP / WhatsApp</td>
                        <td className="py-0.5">: {printingSantri.noHpIbu || '-'}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* E. IDENTITAS WALI */}
            {printingSantri.namaWali && (
              <div>
                <h3 className="font-bold border-b border-gray-400 pb-1 mb-2">E. IDENTITAS WALI</h3>
                <table className="w-full text-[11px]">
                  <tbody>
                    <tr>
                      <td className="w-1/3 py-1 font-semibold">Nama Lengkap</td>
                      <td className="py-1">: {printingSantri.namaWali}</td>
                    </tr>
                    <tr>
                      <td className="py-1 font-semibold">Tempat, Tanggal Lahir</td>
                      <td className="py-1">: {printingSantri.tempatLahirWali || '-'}, {printingSantri.tanggalLahirWali || '-'}</td>
                    </tr>
                    <tr>
                      <td className="py-1 font-semibold">NIK</td>
                      <td className="py-1">: {printingSantri.nikWali || '-'}</td>
                    </tr>
                    <tr>
                      <td className="py-1 font-semibold">Pendidikan Terakhir</td>
                      <td className="py-1">: {printingSantri.pendidikanWali || '-'}</td>
                    </tr>
                    <tr>
                      <td className="py-1 font-semibold">Pekerjaan</td>
                      <td className="py-1">: {printingSantri.pekerjaanWali || '-'}</td>
                    </tr>
                    <tr>
                      <td className="py-1 font-semibold">Penghasilan Rata-rata</td>
                      <td className="py-1">: {printingSantri.penghasilanWali || '-'}</td>
                    </tr>
                    <tr>
                      <td className="py-1 font-semibold">No. HP / WhatsApp</td>
                      <td className="py-1">: {printingSantri.noHpWali || '-'}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            )}

            {/* No. HP Orang Tua / WhatsApp Aktif */}
            <div className="bg-gray-50 p-2.5 rounded-sm border border-gray-200 mt-2 text-xs">
              <span className="font-bold">No. HP Orang Tua / WhatsApp Aktif:</span> <span className="font-mono font-semibold ml-1">{printingSantri.nomorHpOrangTua}</span>
            </div>

            {/* Checklist Kelengkapan Berkas */}
            <div className="mt-4">
              <h3 className="font-bold mb-2">F. Checklist Kelengkapan Berkas Fisik:</h3>
              <div className="grid grid-cols-4 gap-2 text-[10px] border border-gray-300 p-3 bg-white">
                <div className="flex gap-2 items-center">
                  <div className="w-4 h-4 border border-black inline-block flex items-center justify-center font-bold">
                    {printingSantri.berkas?.kk ? "✓" : ""}
                  </div>
                  <span>Kartu Keluarga (KK)</span>
                </div>
                <div className="flex gap-2 items-center">
                  <div className="w-4 h-4 border border-black inline-block flex items-center justify-center font-bold">
                    {printingSantri.berkas?.akta ? "✓" : ""}
                  </div>
                  <span>Akta Kelahiran</span>
                </div>
                <div className="flex gap-2 items-center">
                  <div className="w-4 h-4 border border-black inline-block flex items-center justify-center font-bold">
                    {printingSantri.berkas?.ktpOrtu ? "✓" : ""}
                  </div>
                  <span>KTP Orang Tua</span>
                </div>
                <div className="flex gap-2 items-center">
                  <div className="w-4 h-4 border border-black inline-block flex items-center justify-center font-bold">
                    {printingSantri.berkas?.sklIjazah ? "✓" : ""}
                  </div>
                  <span>SKL / Ijazah Terakhir</span>
                </div>
              </div>
            </div>

            {/* Signatures */}
            <div className="mt-12 flex justify-between px-8 text-center text-xs">
              <div>
                <p className="mb-14">Panitia Penerimaan Santri Baru</p>
                <p className="font-bold border-b border-black pb-0.5 px-6 inline-block">(_____________________)</p>
              </div>
              <div>
                <p className="mb-14">Orang Tua / Wali Santri</p>
                <p className="font-bold border-b border-black pb-0.5 px-6 inline-block">({printingSantri.namaAyah || printingSantri.namaIbu || '___________________'})</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
