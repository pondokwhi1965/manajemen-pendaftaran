import React, { createContext, useContext } from 'react';
import { Role, FormFieldConfig, AppSettings, getTerminology } from '../types';

const ConfigContext = createContext<FormFieldConfig[] | undefined>(undefined);

const SectionHeader = ({ title, letter }: { title: string; letter: string }) => (
  <div className="col-span-full border-b border-slate-100 pb-2 mt-6 mb-2">
    <h3 className="text-sm font-black text-slate-800 flex items-center gap-2 uppercase tracking-tight">
      <span className="w-6 h-6 rounded-lg bg-emerald-600 text-white flex items-center justify-center text-[10px]">{letter}</span>
      {title}
    </h3>
  </div>
);

const FieldWrapper = ({ id, label, children, required = false }: { id: string; label: string; children: React.ReactNode; required?: boolean }) => {
  const config = useContext(ConfigContext);
  const isVisible = !config || config.find(f => f.id === id)?.visible !== false;
  if (!isVisible) return null;

  const displayLabel = config?.find(f => f.id === id)?.label || label;

  return (
    <div key={id}>
      <label className="block text-[11px] font-semibold text-slate-600 mb-1">
        {displayLabel} {required && '*'}
      </label>
      {children}
    </div>
  );
};

interface SantriFormFieldsProps {
  formData: any;
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => void;
  setFormData: React.Dispatch<React.SetStateAction<any>>;
  activeRole: Role;
  config?: FormFieldConfig[];
  jenjangOptions?: string[];
  gelombangOptions?: string[];
  appSettings?: AppSettings;
}

export function SantriFormFields({ formData, onChange, setFormData, activeRole, config, jenjangOptions = ['SDI AL-HIDAYAH', 'SMP AL-HIDAYAH', 'SMK AL-HIDAYAH'], gelombangOptions = ['Gelombang 1', 'Gelombang 2', 'Gelombang 3'], appSettings }: SantriFormFieldsProps) {
  return (
    <ConfigContext.Provider value={config}>
      <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-xs space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Section A: IDENTITAS SANTRI */}
        <SectionHeader letter="A" title={`Identitas ${getTerminology(appSettings, { capitalize: true })}`} />
        
        <FieldWrapper id="nama" label="Nama Lengkap" required>
          <input
            type="text"
            name="nama"
            required
            value={formData.nama}
            onChange={onChange}
            placeholder="Sesuai Akte Kelahiran"
            className="px-4 py-3 sm:px-3 sm:py-2 text-sm sm:text-xs border border-slate-200 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-emerald-500 w-full transition-all"
          />
        </FieldWrapper>

        <FieldWrapper id="tempatLahir" label="Tempat Lahir">
          <input
            type="text"
            name="tempatLahir"
            value={formData.tempatLahir}
            onChange={onChange}
            placeholder="Kota Lahir"
            className="px-4 py-3 sm:px-3 sm:py-2 text-sm sm:text-xs border border-slate-200 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-emerald-500 w-full transition-all"
          />
        </FieldWrapper>

        <FieldWrapper id="tanggalLahir" label="Tanggal Lahir">
          <input
            type="date"
            name="tanggalLahir"
            value={formData.tanggalLahir}
            onChange={onChange}
            className="px-4 py-3 sm:px-3 sm:py-2 text-sm sm:text-xs border border-slate-200 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-emerald-500 w-full transition-all"
          />
        </FieldWrapper>

        <FieldWrapper id="jenisKelamin" label="Jenis Kelamin" required>
          <div className="flex gap-4 mt-2">
            {activeRole !== 'Admin Putri' && (
              <label className="flex items-center gap-1.5 text-xs cursor-pointer text-slate-700">
                <input
                  type="radio"
                  name="jenisKelamin"
                  value="Laki-laki"
                  checked={formData.jenisKelamin === 'Laki-laki'}
                  onChange={() => setFormData((prev: any) => ({ ...prev, jenisKelamin: 'Laki-laki' }))}
                  className="accent-emerald-600"
                />
                Laki-laki
              </label>
            )}
            {activeRole !== 'Admin Putra' && (
              <label className="flex items-center gap-1.5 text-xs cursor-pointer text-slate-700">
                <input
                  type="radio"
                  name="jenisKelamin"
                  value="Perempuan"
                  checked={formData.jenisKelamin === 'Perempuan'}
                  onChange={() => setFormData((prev: any) => ({ ...prev, jenisKelamin: 'Perempuan' }))}
                  className="accent-emerald-600"
                />
                Perempuan
              </label>
            )}
          </div>
        </FieldWrapper>

        <FieldWrapper id="anakKe" label="Anak Ke">
          <input
            type="text"
            name="anakKe"
            value={formData.anakKe || ''}
            onChange={onChange}
            placeholder="Contoh: 1"
            className="px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-emerald-500 w-full"
          />
        </FieldWrapper>

        <FieldWrapper id="jumlahSaudara" label="Jumlah Saudara">
          <input
            type="text"
            name="jumlahSaudara"
            value={formData.jumlahSaudara || ''}
            onChange={onChange}
            placeholder="Contoh: 3"
            className="px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-emerald-500 w-full"
          />
        </FieldWrapper>

        <FieldWrapper id="nik" label={`NIK ${getTerminology(appSettings, { capitalize: true })}`}>
          <input
            type="text"
            name="nik"
            value={formData.nik || ''}
            onChange={onChange}
            placeholder="16 Digit NIK"
            maxLength={16}
            className="px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-emerald-500 w-full font-mono"
          />
        </FieldWrapper>

        <FieldWrapper id="noKk" label="No KK">
          <input
            type="text"
            name="noKk"
            value={formData.noKk || ''}
            onChange={onChange}
            placeholder="16 Digit No KK"
            maxLength={16}
            className="px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-emerald-500 w-full font-mono"
          />
        </FieldWrapper>

        {/* Section B: KELEMBAGAAN */}
        <SectionHeader letter="B" title="Kelembagaan" />

        <FieldWrapper id="asalSekolah" label="Asal Sekolah/Madrasah">
          <input
            type="text"
            name="asalSekolah"
            value={formData.asalSekolah}
            onChange={onChange}
            placeholder="Nama Sekolah"
            className="px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-emerald-500 w-full"
          />
        </FieldWrapper>

        <FieldWrapper id="npsnAsal" label="NPSN Sekolah Asal">
          <input
            type="text"
            name="npsnAsal"
            value={formData.npsnAsal || ''}
            onChange={onChange}
            placeholder="8 Digit NPSN"
            className="px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-emerald-500 w-full"
          />
        </FieldWrapper>

        <FieldWrapper id="alamatSekolahAsal" label="Alamat Sekolah Asal">
          <input
            type="text"
            name="alamatSekolahAsal"
            value={formData.alamatSekolahAsal || ''}
            onChange={onChange}
            placeholder="Kota/Kecamatan Sekolah"
            className="px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-emerald-500 w-full"
          />
        </FieldWrapper>

        <FieldWrapper id="nisn" label="NISN">
          <input
            type="text"
            name="nisn"
            value={formData.nisn || ''}
            onChange={onChange}
            placeholder="10 Digit NISN"
            className="px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-emerald-500 w-full"
          />
        </FieldWrapper>

        <FieldWrapper id="jenjang" label="Mendaftar Jenjang" required>
          <select
            name="jenjang"
            required
            value={formData.jenjang}
            onChange={onChange}
            className="px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-emerald-500 w-full bg-white font-medium"
          >
            {jenjangOptions.map(opt => (
              <option key={opt} value={opt}>{opt}</option>
            ))}
          </select>
        </FieldWrapper>

        <FieldWrapper id="mendaftarKelas" label="Mendaftar Untuk Kelas">
          <input
            type="text"
            name="mendaftarKelas"
            value={formData.mendaftarKelas || ''}
            onChange={onChange}
            placeholder="Contoh: Kelas 7"
            className="px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-emerald-500 w-full"
          />
        </FieldWrapper>

        <FieldWrapper id="gelombangPendaftaran" label="Gelombang Pendaftaran" required>
          <select
            name="gelombangPendaftaran"
            required
            value={formData.gelombangPendaftaran}
            onChange={onChange}
            className="px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-emerald-500 w-full bg-white font-medium"
          >
            {gelombangOptions.map(opt => (
              <option key={opt} value={opt}>{opt}</option>
            ))}
          </select>
        </FieldWrapper>

        {/* Section C: ALAMAT */}
        <SectionHeader letter="C" title="Alamat" />

        <FieldWrapper id="alamat" label="Jalan/Dusun">
          <input
            type="text"
            name="alamat"
            value={formData.alamat}
            onChange={onChange}
            placeholder="Contoh: Jl. Merdeka No. 10"
            className="px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-emerald-500 w-full"
          />
        </FieldWrapper>

        <FieldWrapper id="rt" label="RT">
          <input
            type="text"
            name="rt"
            value={formData.rt || ''}
            onChange={onChange}
            placeholder="000"
            className="px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-emerald-500 w-full"
          />
        </FieldWrapper>

        <FieldWrapper id="rw" label="RW">
          <input
            type="text"
            name="rw"
            value={formData.rw || ''}
            onChange={onChange}
            placeholder="000"
            className="px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-emerald-500 w-full"
          />
        </FieldWrapper>

        <FieldWrapper id="desa" label="Kelurahan/Desa">
          <input
            type="text"
            name="desa"
            value={formData.desa}
            onChange={onChange}
            placeholder="Desa"
            className="px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-emerald-500 w-full"
          />
        </FieldWrapper>

        <FieldWrapper id="kecamatan" label="Kecamatan">
          <input
            type="text"
            name="kecamatan"
            value={formData.kecamatan}
            onChange={onChange}
            placeholder="Kecamatan"
            className="px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-emerald-500 w-full"
          />
        </FieldWrapper>

        <FieldWrapper id="kabupatenKota" label="Kabupaten/Kota">
          <input
            type="text"
            name="kabupatenKota"
            value={formData.kabupatenKota}
            onChange={onChange}
            placeholder="Kabupaten"
            className="px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-emerald-500 w-full"
          />
        </FieldWrapper>

        <FieldWrapper id="provinsi" label="Provinsi">
          <input
            type="text"
            name="provinsi"
            value={formData.provinsi}
            onChange={onChange}
            placeholder="Provinsi"
            className="px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-emerald-500 w-full"
          />
        </FieldWrapper>

        <FieldWrapper id="kodePos" label="Kode Pos">
          <input
            type="text"
            name="kodePos"
            value={formData.kodePos || ''}
            onChange={onChange}
            placeholder="5 Digit Kode Pos"
            className="px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-emerald-500 w-full"
          />
        </FieldWrapper>

        {/* Section D: IDENTITAS ORANG TUA */}
        <SectionHeader letter="D" title="Identitas Orang Tua" />
        
        <div className="col-span-full">
           <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">DATA AYAH</h4>
        </div>

        <FieldWrapper id="namaAyah" label="Nama Lengkap Ayah">
          <input
            type="text"
            name="namaAyah"
            value={formData.namaAyah}
            onChange={onChange}
            placeholder="Nama Ayah"
            className="px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-emerald-500 w-full"
          />
        </FieldWrapper>

        <FieldWrapper id="nikAyah" label="NIK Ayah">
          <input
            type="text"
            name="nikAyah"
            value={formData.nikAyah || ''}
            onChange={onChange}
            placeholder="NIK Ayah"
            className="px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-emerald-500 w-full font-mono"
          />
        </FieldWrapper>

        <FieldWrapper id="statusAyah" label="Status Ayah">
          <select
            name="statusAyah"
            value={formData.statusAyah || 'Hidup'}
            onChange={onChange}
            className="px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-emerald-500 w-full bg-white"
          >
            <option value="Hidup">Hidup</option>
            <option value="Wafat">Wafat</option>
          </select>
        </FieldWrapper>

        <FieldWrapper id="tempatLahirAyah" label="Tempat Lahir Ayah">
          <input
            type="text"
            name="tempatLahirAyah"
            value={formData.tempatLahirAyah || ''}
            onChange={onChange}
            className="px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-emerald-500 w-full"
          />
        </FieldWrapper>

        <FieldWrapper id="tanggalLahirAyah" label="Tanggal Lahir Ayah">
          <input
            type="date"
            name="tanggalLahirAyah"
            value={formData.tanggalLahirAyah || ''}
            onChange={onChange}
            className="px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-emerald-500 w-full"
          />
        </FieldWrapper>

        <FieldWrapper id="pendidikanAyah" label="Pendidikan Terakhir Ayah">
          <input
            type="text"
            name="pendidikanAyah"
            value={formData.pendidikanAyah || ''}
            onChange={onChange}
            className="px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-emerald-500 w-full"
          />
        </FieldWrapper>

        <FieldWrapper id="pekerjaanAyah" label="Pekerjaan Ayah">
          <input
            type="text"
            name="pekerjaanAyah"
            value={formData.pekerjaanAyah || ''}
            onChange={onChange}
            className="px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-emerald-500 w-full"
          />
        </FieldWrapper>

        <FieldWrapper id="penghasilanAyah" label="Penghasilan Rata-rata Ayah">
          <input
            type="text"
            name="penghasilanAyah"
            value={formData.penghasilanAyah || ''}
            onChange={onChange}
            className="px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-emerald-500 w-full"
          />
        </FieldWrapper>

        <FieldWrapper id="noHpAyah" label="No. HP Ayah">
          <input
            type="text"
            name="noHpAyah"
            value={formData.noHpAyah || ''}
            onChange={onChange}
            className="px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-emerald-500 w-full font-mono"
          />
        </FieldWrapper>

        <div className="col-span-full pt-4 border-t border-slate-50">
           <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">DATA IBU</h4>
        </div>

        <FieldWrapper id="namaIbu" label="Nama Lengkap Ibu">
          <input
            type="text"
            name="namaIbu"
            value={formData.namaIbu}
            onChange={onChange}
            placeholder="Nama Ibu"
            className="px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-emerald-500 w-full"
          />
        </FieldWrapper>

        <FieldWrapper id="nikIbu" label="NIK Ibu">
          <input
            type="text"
            name="nikIbu"
            value={formData.nikIbu || ''}
            onChange={onChange}
            placeholder="NIK Ibu"
            className="px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-emerald-500 w-full font-mono"
          />
        </FieldWrapper>

        <FieldWrapper id="statusIbu" label="Status Ibu">
          <select
            name="statusIbu"
            value={formData.statusIbu || 'Hidup'}
            onChange={onChange}
            className="px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-emerald-500 w-full bg-white"
          >
            <option value="Hidup">Hidup</option>
            <option value="Wafat">Wafat</option>
          </select>
        </FieldWrapper>

        <FieldWrapper id="tempatLahirIbu" label="Tempat Lahir Ibu">
          <input
            type="text"
            name="tempatLahirIbu"
            value={formData.tempatLahirIbu || ''}
            onChange={onChange}
            className="px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-emerald-500 w-full"
          />
        </FieldWrapper>

        <FieldWrapper id="tanggalLahirIbu" label="Tanggal Lahir Ibu">
          <input
            type="date"
            name="tanggalLahirIbu"
            value={formData.tanggalLahirIbu || ''}
            onChange={onChange}
            className="px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-emerald-500 w-full"
          />
        </FieldWrapper>

        <FieldWrapper id="pendidikanIbu" label="Pendidikan Terakhir Ibu">
          <input
            type="text"
            name="pendidikanIbu"
            value={formData.pendidikanIbu || ''}
            onChange={onChange}
            className="px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-emerald-500 w-full"
          />
        </FieldWrapper>

        <FieldWrapper id="pekerjaanIbu" label="Pekerjaan Ibu">
          <input
            type="text"
            name="pekerjaanIbu"
            value={formData.pekerjaanIbu || ''}
            onChange={onChange}
            className="px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-emerald-500 w-full"
          />
        </FieldWrapper>

        <FieldWrapper id="penghasilanIbu" label="Penghasilan Rata-rata Ibu">
          <input
            type="text"
            name="penghasilanIbu"
            value={formData.penghasilanIbu || ''}
            onChange={onChange}
            className="px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-emerald-500 w-full"
          />
        </FieldWrapper>

        <FieldWrapper id="noHpIbu" label="No. HP Ibu">
          <input
            type="text"
            name="noHpIbu"
            value={formData.noHpIbu || ''}
            onChange={onChange}
            className="px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-emerald-500 w-full font-mono"
          />
        </FieldWrapper>

        {/* Section E: IDENTITAS WALI */}
        <SectionHeader letter="E" title="Identitas Wali" />

        <FieldWrapper id="namaWali" label="Nama Lengkap Wali">
          <input
            type="text"
            name="namaWali"
            value={formData.namaWali || ''}
            onChange={onChange}
            placeholder="Nama Lengkap Wali"
            className="px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-emerald-500 w-full"
          />
        </FieldWrapper>

        <FieldWrapper id="tempatLahirWali" label="Tempat Lahir Wali">
          <input
            type="text"
            name="tempatLahirWali"
            value={formData.tempatLahirWali || ''}
            onChange={onChange}
            className="px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-emerald-500 w-full"
          />
        </FieldWrapper>

        <FieldWrapper id="tanggalLahirWali" label="Tanggal Lahir Wali">
          <input
            type="date"
            name="tanggalLahirWali"
            value={formData.tanggalLahirWali || ''}
            onChange={onChange}
            className="px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-emerald-500 w-full"
          />
        </FieldWrapper>

        <FieldWrapper id="pendidikanWali" label="Pendidikan Terakhir Wali">
          <input
            type="text"
            name="pendidikanWali"
            value={formData.pendidikanWali || ''}
            onChange={onChange}
            className="px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-emerald-500 w-full"
          />
        </FieldWrapper>

        <FieldWrapper id="pekerjaanWali" label="Pekerjaan Wali">
          <input
            type="text"
            name="pekerjaanWali"
            value={formData.pekerjaanWali || ''}
            onChange={onChange}
            className="px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-emerald-500 w-full"
          />
        </FieldWrapper>

        <FieldWrapper id="penghasilanWali" label="Penghasilan Rata-rata Wali">
          <input
            type="text"
            name="penghasilanWali"
            value={formData.penghasilanWali || ''}
            onChange={onChange}
            className="px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-emerald-500 w-full"
          />
        </FieldWrapper>

        <FieldWrapper id="nikWali" label="NIK Wali">
          <input
            type="text"
            name="nikWali"
            value={formData.nikWali || ''}
            onChange={onChange}
            className="px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-emerald-500 w-full font-mono"
          />
        </FieldWrapper>

        <FieldWrapper id="noHpWali" label="No. HP Wali">
          <input
            type="text"
            name="noHpWali"
            value={formData.noHpWali || ''}
            onChange={onChange}
            className="px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-emerald-500 w-full font-mono"
          />
        </FieldWrapper>

        {/* Whatsapp Utama */}
        <div className="col-span-full pt-4 border-t border-slate-50">
           <h4 className="text-[10px] font-black text-emerald-600 uppercase tracking-widest mb-3">KONTAK UTAMA</h4>
        </div>

        <FieldWrapper id="nomorHpOrangTua" label="Nomor WhatsApp Aktif" required>
          <input
            type="text"
            name="nomorHpOrangTua"
            required
            value={formData.nomorHpOrangTua}
            onChange={onChange}
            placeholder="Contoh: 08123456789"
            className="px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-emerald-500 w-full"
          />
        </FieldWrapper>
      </div>
    </div>
    </ConfigContext.Provider>
  );
}
