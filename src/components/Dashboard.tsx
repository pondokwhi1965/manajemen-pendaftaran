import { useState } from 'react';
import { Users, CreditCard, CheckCircle2, AlertCircle, TrendingUp, History, Search, ShieldCheck, FileCheck, UserPlus, GraduationCap } from 'lucide-react';
import { SystemState, getTerminology } from '../types';

interface DashboardProps {
  state: SystemState;
  onNavigateToSantri?: () => void;
  onNavigateToPembayaran?: (nomorPendaftaran: string) => void;
}

export function Dashboard({ state, onNavigateToSantri, onNavigateToPembayaran }: DashboardProps) {
  const { santriList, pembayaranList, tagihanMap, logs, appSettings } = state;

  // 1. Basic Calculations
  const totalSantri = santriList.length;
  const totalLunas = santriList.filter(s => s.status === 'Lunas').length;
  const totalValid = santriList.filter(s => s.statusValidasi === 'Valid').length;
  
  // Gender Statistics
  const totalPutra = santriList.filter(s => s.jenisKelamin === 'Laki-laki').length;
  const totalPutri = santriList.filter(s => s.jenisKelamin === 'Perempuan').length;

  // Verification Statistics
  const verifiedCount = santriList.filter(s => s.statusValidasi === 'Valid').length;
  const unverifiedCount = totalSantri - verifiedCount;

  // Berkas Statistics
  const berkasLengkapCount = santriList.filter(s => {
    const b = s.berkas;
    return b && b.kk && b.akta && b.ktpOrtu && b.sklIjazah;
  }).length;
  const berkasBelumLengkapCount = totalSantri - berkasLengkapCount;

  // Calculate Tagihan & Terbayar across all students
  let totalTagihan = 0;
  let totalSudahDibayar = 0;

  Object.values(tagihanMap).forEach((tagihans) => {
    tagihans.forEach((t) => {
      totalTagihan += t.nominal;
      totalSudahDibayar += t.terbayar;
    });
  });

  const totalPiutang = totalTagihan - totalSudahDibayar;

  // Calculate Today's Payment
  const todayStr = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
  const pembayaranHariIni = pembayaranList
    .filter(p => p.status === 'Sukses' && p.tanggal.startsWith(todayStr))
    .reduce((acc, p) => acc + p.nominal, 0);

  // 2. Monthly Collection Chart Data
  const monthlyData = [
    { month: 'Mei', target: 8000000, actual: 5200000 },
    { month: 'Juni', target: 12000000, actual: 8650000 },
    { month: 'Juli', target: 15000000, actual: pembayaranList
        .filter(p => p.status === 'Sukses' && p.tanggal.includes('2026-07'))
        .reduce((acc, p) => acc + p.nominal, 0) + 4000000 
    }
  ];

  // 3. Jenjang Distribution Data
  const jenjangCounts = santriList.reduce((acc, s) => {
    acc[s.jenjang] = (acc[s.jenjang] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const jenjangColors: Record<string, string> = {
    'SDI AL-HIDAYAH': '#10b981',   // Emerald
    'SMP AL-HIDAYAH': '#6366f1',   // Indigo
    'SMK AL-HIDAYAH': '#f59e0b',   // Amber
  };

  const jenjangData = Object.entries(jenjangCounts).map(([name, value]) => ({
    name: name.split(' ')[0], // Get SDI, SMP, SMK
    fullName: name,
    value,
    color: jenjangColors[name] || '#64748b'
  }));

  const totalJenjangValue = jenjangData.reduce((acc, item) => acc + item.value, 0) || 1;

  // 4. Filter List of Students with Remaining Balances
  const [searchTerm, setSearchTerm] = useState('');
  const tunggakanSantri = santriList
    .filter(s => s.status !== 'Lunas')
    .map(s => {
      const items = tagihanMap[s.nomorPendaftaran] || [];
      const total = items.reduce((acc, i) => acc + i.nominal, 0);
      const paid = items.reduce((acc, i) => acc + i.terbayar, 0);
      const sisa = total - paid;
      return {
        ...s,
        total,
        paid,
        sisa,
      };
    })
    .filter(s => s.nama.toLowerCase().includes(searchTerm.toLowerCase()) || s.nomorPendaftaran.toLowerCase().includes(searchTerm.toLowerCase()))
    .slice(0, 5); // display top 5

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className={`transition-all duration-500 rounded-3xl p-6 shadow-md relative overflow-hidden border ${
        appSettings?.isRegistrationOpen 
          ? 'bg-emerald-900 border-emerald-800' 
          : 'bg-red-950 border-red-900 shadow-red-900/20 shadow-xl'
      }`}>
        <div className="relative z-10 max-w-2xl space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <span className={`text-[10px] font-bold tracking-wider uppercase px-2.5 py-1 rounded-full border transition-colors ${
              appSettings?.isRegistrationOpen 
                ? 'bg-emerald-800/60 text-emerald-100 border-emerald-700/50' 
                : 'bg-red-900/60 text-red-100 border-red-800/50'
            }`}>
              Tahun Ajaran {appSettings?.tahunAjaran || '2026/2027'}
            </span>
            <span className={`text-[10px] font-black tracking-wider uppercase px-2.5 py-1 rounded-full border flex items-center gap-1.5 transition-all ${
              appSettings?.isRegistrationOpen 
                ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' 
                : 'bg-red-500/20 text-red-200 border-red-500/30 ring-2 ring-red-500/10'
            }`}>
              <span className={`w-1.5 h-1.5 rounded-full ${appSettings?.isRegistrationOpen ? 'bg-emerald-400 animate-pulse' : 'bg-red-400'}`} />
              Pendaftaran: {appSettings?.isRegistrationOpen ? 'Dibuka' : 'Ditutup'}
            </span>
          </div>
          <h1 className="text-lg sm:text-xl md:text-2xl font-bold font-sans tracking-tight pt-1 leading-tight text-white">
            Manajemen Pendaftaran {getTerminology(appSettings, { capitalize: true })} Baru<br/>
            <span className={`${appSettings?.isRegistrationOpen ? 'text-emerald-300' : 'text-red-400'} font-medium text-base sm:text-lg transition-colors`}>
              {appSettings?.pondokName || 'Pondok Pesantren Wahyu Hidayatul Islam'}
            </span>
          </h1>
          <p className={`${appSettings?.isRegistrationOpen ? 'text-emerald-100' : 'text-red-100/70'} text-xs md:text-sm leading-relaxed max-w-lg transition-colors`}>
            {appSettings?.isRegistrationOpen 
              ? `Dashboard monitoring pendaftaran dan administrasi ${getTerminology(appSettings)} baru secara real-time.`
              : `Pendaftaran sedang ditutup. Panel admin tetap aktif untuk pengelolaan data yang sudah masuk.`}
          </p>
        </div>
        <div className={`absolute right-0 bottom-0 top-0 opacity-10 flex items-center pr-10 pointer-events-none transition-colors ${
          appSettings?.isRegistrationOpen ? 'text-emerald-300' : 'text-red-300'
        }`}>
          <TrendingUp size={240} />
        </div>
      </div>

      {/* Metric Cards Bento Grid - Primary */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Card 1: Total Santri Split */}
        <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-sm transition-all hover:shadow-md">
          <div className="flex items-center gap-3 mb-4">
            <span className="p-2.5 bg-blue-50 text-blue-600 rounded-xl"><Users size={20} /></span>
            <p className="text-slate-500 text-[11px] font-bold uppercase tracking-wider">Total Pendaftar</p>
          </div>
          <h2 className="text-3xl font-black text-slate-900">{totalSantri} <span className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">{getTerminology(appSettings, { capitalize: true })}</span></h2>
          <div className="grid grid-cols-2 gap-2 mt-4">
            <div className="bg-slate-50 p-2 rounded-xl border border-slate-100 text-center">
              <span className="text-[10px] text-slate-400 font-bold block uppercase leading-none mb-1">Putra</span>
              <span className="text-sm font-bold text-blue-600">{totalPutra}</span>
            </div>
            <div className="bg-slate-50 p-2 rounded-xl border border-slate-100 text-center">
              <span className="text-[10px] text-slate-400 font-bold block uppercase leading-none mb-1">Putri</span>
              <span className="text-sm font-bold text-rose-500">{totalPutri}</span>
            </div>
          </div>
        </div>

        {/* Card 2: Jenjang Statistics */}
        <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-sm transition-all hover:shadow-md">
          <div className="flex items-center gap-3 mb-4">
            <span className="p-2.5 bg-indigo-50 text-indigo-600 rounded-xl"><GraduationCap size={20} /></span>
            <p className="text-slate-500 text-[11px] font-bold uppercase tracking-wider">Distribusi Jenjang</p>
          </div>
          <div className="space-y-2">
            {jenjangData.map(item => (
              <div key={item.fullName} className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-slate-600">{item.name}</span>
                <div className="flex items-center gap-2 flex-1 mx-3">
                  <div className="h-1.5 flex-1 bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full rounded-full" style={{ width: `${(item.value / totalJenjangValue) * 100}%`, backgroundColor: item.color }}></div>
                  </div>
                </div>
                <span className="text-[11px] font-black text-slate-800">{item.value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Card 3: Verification & Berkas */}
        <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-sm transition-all hover:shadow-md">
          <div className="flex items-center gap-3 mb-4">
            <span className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl"><ShieldCheck size={20} /></span>
            <p className="text-slate-500 text-[11px] font-bold uppercase tracking-wider">Status Validasi</p>
          </div>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
                <span className="text-[11px] font-bold text-slate-600 tracking-tight">Data Terverifikasi</span>
              </div>
              <span className="text-xs font-black text-emerald-600">{verifiedCount}</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-amber-400 rounded-full"></div>
                <span className="text-[11px] font-bold text-slate-600 tracking-tight">Menunggu Verifikasi</span>
              </div>
              <span className="text-xs font-black text-amber-500">{unverifiedCount}</span>
            </div>
            <div className="h-px bg-slate-100 my-1"></div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileCheck size={14} className="text-indigo-500" />
                <span className="text-[11px] font-bold text-slate-600 tracking-tight">Berkas Lengkap</span>
              </div>
              <span className="text-xs font-black text-indigo-600">{berkasLengkapCount}</span>
            </div>
          </div>
        </div>

        {/* Card 4: Financial Overview */}
        <div className="bg-slate-900 text-white rounded-3xl p-5 shadow-xl transition-all hover:shadow-2xl">
          <div className="flex items-center gap-3 mb-4">
            <span className="p-2.5 bg-slate-800 text-emerald-400 rounded-xl"><CreditCard size={20} /></span>
            <p className="text-slate-400 text-[11px] font-bold uppercase tracking-wider">Target Realisasi</p>
          </div>
          <div className="mb-3">
            <h2 className="text-2xl font-black text-white">
              {totalTagihan > 0 ? ((totalSudahDibayar / totalTagihan) * 100).toFixed(0) : 0}%
            </h2>
            <div className="w-full h-1.5 bg-slate-800 rounded-full mt-2 overflow-hidden">
              <div className="bg-emerald-500 h-full" style={{ width: `${totalTagihan > 0 ? (totalSudahDibayar / totalTagihan) * 100 : 0}%` }}></div>
            </div>
          </div>
          <div className="space-y-1 mt-4">
            <div className="flex justify-between text-[10px] font-bold text-slate-400">
              <span>PENERIMAAN</span>
              <span className="text-emerald-400">Rp {totalSudahDibayar.toLocaleString('id-ID')}</span>
            </div>
            <div className="flex justify-between text-[10px] font-bold text-slate-400">
              <span>SISA PIUTANG</span>
              <span className="text-rose-400">Rp {totalPiutang.toLocaleString('id-ID')}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Secondary Quick Metrics Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
        <div className="bg-white border border-slate-200 p-4 rounded-2xl text-center shadow-xs">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Pemasukan Hari Ini</p>
          <p className="text-base font-extrabold text-emerald-600 mt-1">Rp {pembayaranHariIni.toLocaleString('id-ID')}</p>
        </div>
        <div className="bg-white border border-slate-200 p-4 rounded-2xl text-center shadow-xs">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Rasio Pelunasan</p>
          <p className="text-base font-extrabold text-indigo-600 mt-1">
            {totalSantri > 0 ? ((totalLunas / totalSantri) * 100).toFixed(0) : 0}% Lunas
          </p>
        </div>
        <div className="bg-white border border-slate-200 p-4 rounded-2xl text-center shadow-xs">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Transaksi Aktif</p>
          <p className="text-base font-extrabold text-slate-700 mt-1">
            {pembayaranList.filter(p => p.status === 'Sukses').length} Kwitansi
          </p>
        </div>
        <div className="bg-white border border-slate-200 p-4 rounded-2xl text-center shadow-xs">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Transaksi Dibatalkan</p>
          <p className="text-base font-extrabold text-rose-600 mt-1">
            {pembayaranList.filter(p => p.status === 'Dibatalkan').length} Log
          </p>
        </div>
      </div>

      {/* Visual Charts Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Monthly Payments - Custom Bar Chart */}
        <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm lg:col-span-2 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-bold text-slate-900">Statistik Penerimaan Biaya Masuk</h3>
              <p className="text-xs text-slate-500">Perbandingan Target Gelombang vs Aktual Pembayaran</p>
            </div>
            <span className="text-[10px] bg-slate-100 text-slate-600 px-2.5 py-1 rounded-full font-mono font-bold uppercase tracking-wider">Bulanan</span>
          </div>

          {/* Bar Chart drawing in SVG */}
          <div className="h-52 flex items-end justify-around pt-6 px-4 border-b border-slate-100">
            {monthlyData.map((data, index) => {
              const maxVal = 16000000;
              const targetHeight = (data.target / maxVal) * 100;
              const actualHeight = (data.actual / maxVal) * 100;

              return (
                <div key={index} className="flex flex-col items-center w-24 space-y-3">
                  <div className="flex items-end gap-3 w-full h-36 justify-center">
                    {/* Target Bar */}
                    <div className="group relative w-5 bg-slate-100 rounded-t-lg hover:bg-slate-200 transition-all duration-300" style={{ height: `${targetHeight}%` }}>
                      <span className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-slate-800 text-white text-[10px] py-1 px-2.5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-20 shadow-md">
                        Target: Rp {(data.target / 1000000).toFixed(1)}jt
                      </span>
                    </div>
                    {/* Actual Bar */}
                    <div className="group relative w-5 bg-emerald-500 rounded-t-lg hover:bg-emerald-600 transition-all duration-300" style={{ height: `${actualHeight}%` }}>
                      <span className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-emerald-800 text-white text-[10px] py-1 px-2.5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-20 shadow-md">
                        Aktual: Rp {(data.actual / 1000000).toFixed(1)}jt
                      </span>
                    </div>
                  </div>
                  <span className="text-xs font-semibold text-slate-600">{data.month}</span>
                </div>
              );
            })}
          </div>

          {/* Legends */}
          <div className="flex items-center justify-center gap-6 mt-4 text-xs text-slate-500">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 bg-slate-200 rounded-sm"></span>
              <span>Target Rencana</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 bg-emerald-500 rounded-sm"></span>
              <span>Aktual Pemasukan</span>
            </div>
          </div>
        </div>

        {/* Jenjang Distribution - Custom Donut Chart */}
        <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm flex flex-col justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-900">Distribusi Pendaftar</h3>
            <p className="text-xs text-slate-500">Berdasarkan Jenjang Sekolah Terpilih</p>
          </div>

          <div className="flex flex-col items-center justify-center space-y-6 my-4">
            {/* Visual Arc ring utilizing SVG */}
            <div className="relative w-36 h-36 flex items-center justify-center">
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 42 42">
                <circle cx="21" cy="21" r="15.915" fill="transparent" stroke="#f1f5f9" strokeWidth="4"></circle>
                {(() => {
                  let accumulatedPercent = 0;
                  return jenjangData.map((item, index) => {
                    const pct = (item.value / totalJenjangValue) * 100;
                    const strokeDasharray = `${pct} ${100 - pct}`;
                    const strokeDashoffset = 100 - accumulatedPercent;
                    accumulatedPercent += pct;

                    return (
                      <circle
                        key={index}
                        cx="21"
                        cy="21"
                        r="15.915"
                        fill="transparent"
                        stroke={item.color}
                        strokeWidth="4.2"
                        strokeDasharray={strokeDasharray}
                        strokeDashoffset={strokeDashoffset}
                      ></circle>
                    );
                  });
                })()}
              </svg>
              <div className="absolute flex flex-col items-center justify-center">
                <span className="text-2xl font-black text-slate-800">{totalSantri}</span>
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{getTerminology(appSettings, { capitalize: true })} Baru</span>
              </div>
            </div>

            {/* Legends list */}
            <div className="w-full grid grid-cols-2 gap-2 text-xs">
              {jenjangData.length > 0 ? (
                jenjangData.map((item, idx) => (
                  <div key={idx} className="flex items-center gap-1.5 bg-slate-50 px-2.5 py-1.5 rounded-xl border border-slate-100">
                    <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: item.color }}></span>
                    <span className="text-slate-700 font-medium truncate">{item.name} ({item.value})</span>
                  </div>
                ))
              ) : (
                <p className="text-xs text-slate-400 text-center col-span-2 py-2">Belum ada data pendaftar</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Santri Belum Lunas & Recent Audit Logs */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Santri Belum Lunas (Tunggakan) Panel */}
        <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm lg:col-span-2 flex flex-col justify-between space-y-4">
          <div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
              <div>
                <h3 className="text-base font-bold text-slate-900">Pemantauan Tunggakan {getTerminology(appSettings, { capitalize: true })}</h3>
                <p className="text-xs text-slate-500">Daftar {getTerminology(appSettings)} baru yang memiliki sisa pembayaran</p>
              </div>
              {/* Search filter for tunggakan */}
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-400" />
                <input
                  type="text"
                  placeholder={`Cari ${getTerminology(appSettings)} tunggakan...`}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8 pr-3 py-1.5 text-xs border border-slate-200 rounded-xl focus:outline-hidden focus:ring-1 focus:ring-emerald-500 w-full sm:w-48 bg-slate-50"
                />
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-100 text-[10px] font-bold text-slate-400 uppercase tracking-wider bg-slate-50">
                    <th className="py-2.5 px-3">Nama {getTerminology(appSettings, { capitalize: true })}</th>
                    <th className="py-2.5 px-3">Jenjang</th>
                    <th className="py-2.5 px-3 text-right">Total Tagihan</th>
                    <th className="py-2.5 px-3 text-right">Sudah Dibayar</th>
                    <th className="py-2.5 px-3 text-right text-red-600">Sisa Piutang</th>
                    <th className="py-2.5 px-3 text-center">Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {tunggakanSantri.length > 0 ? (
                    tunggakanSantri.map((s) => (
                      <tr key={s.nomorPendaftaran} className="border-b border-slate-100 text-xs hover:bg-slate-50/50 transition-colors">
                        <td className="py-2.5 px-3">
                          <div className="font-semibold text-slate-800">{s.nama}</div>
                          <div className="text-[10px] text-slate-400 font-mono">{s.nomorPendaftaran}</div>
                        </td>
                        <td className="py-2.5 px-3">
                          <span className="bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded text-[10px] font-medium">
                            {s.jenjang}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono font-medium text-slate-600">
                          Rp {s.total.toLocaleString('id-ID')}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono font-medium text-emerald-600">
                          Rp {s.paid.toLocaleString('id-ID')}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono font-bold text-red-600">
                          Rp {s.sisa.toLocaleString('id-ID')}
                        </td>
                        <td className="py-2.5 px-3 text-center">
                          <button
                            onClick={() => onNavigateToPembayaran && onNavigateToPembayaran(s.nomorPendaftaran)}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold px-3 py-1 rounded-xl text-[10px] transition-colors cursor-pointer"
                          >
                            Bayar
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-xs text-slate-400">
                        Tidak ada {getTerminology(appSettings)} menunggak / pencarian tidak ditemukan.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="flex justify-end pt-3 border-t border-slate-100">
            <button
              onClick={onNavigateToSantri}
              className="text-xs text-emerald-700 hover:text-emerald-800 font-semibold inline-flex items-center gap-1 cursor-pointer"
            >
              Lihat Seluruh Master {getTerminology(appSettings, { capitalize: true })} &rarr;
            </button>
          </div>
        </div>

        {/* Recent Audit Logs Panel */}
        <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm flex flex-col justify-between space-y-4">
          <div>
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-1.5 mb-4">
              <History size={18} className="text-slate-400" />
              Aktivitas Sistem Terkini
            </h3>

            <div className="space-y-4 max-h-80 overflow-y-auto pr-1">
              {logs.slice(0, 6).map((log) => (
                <div key={log.id} className="text-xs border-l-2 border-slate-200 pl-3 space-y-1 relative">
                  {/* Indicator dot */}
                  <div className="absolute -left-[5px] top-1.5 w-2 h-2 rounded-full bg-slate-300"></div>

                  <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono">
                    <span>{log.tanggal}</span>
                    <span className="bg-slate-100 px-1.5 py-0.2 rounded text-[9px] font-bold text-slate-600">{log.role}</span>
                  </div>
                  <div className="font-semibold text-slate-800 flex items-center gap-1">
                    <span>{log.aktivitas}</span>
                    <span className="text-slate-400 font-normal">by</span>
                    <span className="text-slate-500 font-medium">{log.user}</span>
                  </div>
                  <p className="text-slate-500 text-[11px] leading-relaxed break-words">
                    {log.keterangan}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
