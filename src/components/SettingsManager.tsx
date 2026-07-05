import React, { useState } from 'react';
import { Settings, Save, MapPin, Calendar, School, MessageSquare, FileText, ArrowRight, X } from 'lucide-react';
import { AppSettings, Role, FormFieldConfig } from '../types';

interface SettingsManagerProps {
  activeRole: Role;
  settings: AppSettings;
  onUpdateSettings: (settings: Partial<AppSettings>) => void;
}

export function SettingsManager({ activeRole, settings, onUpdateSettings }: SettingsManagerProps) {
  const [formData, setFormData] = useState<AppSettings>({
    pondokName: settings.pondokName,
    tahunAjaran: settings.tahunAjaran,
    pondokAddress: settings.pondokAddress,
    waTemplate: settings.waTemplate || '',
    logoUrl: settings.logoUrl || '',
    heroImageUrl: settings.heroImageUrl || '',
    formFields: settings.formFields || [],
    jenjangOptions: settings.jenjangOptions || ['SDI AL-HIDAYAH', 'SMP AL-HIDAYAH', 'SMK AL-HIDAYAH'],
    gelombangOptions: settings.gelombangOptions || ['Gelombang 1', 'Gelombang 2', 'Gelombang 3'],
    jenisLembaga: settings.jenisLembaga || 'Pondok Pesantren',
    sebutanSiswa: settings.sebutanSiswa || 'Santri',
    sebutanSiswaCustom: settings.sebutanSiswaCustom || '',
    addressLevel: settings.addressLevel || 'desa',
    isRegistrationOpen: settings.isRegistrationOpen ?? true,
    isGuideActive: settings.isGuideActive ?? false,
    guideUrl: settings.guideUrl || '',
  });
  
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  if (activeRole !== 'Master') {
    return (
      <div className="bg-white border border-slate-200 rounded-3xl p-8 text-center shadow-sm">
        <p className="text-slate-500 font-medium">Hanya Master yang dapat mengakses pengaturan aplikasi.</p>
      </div>
    );
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const toggleFieldVisibility = (id: string) => {
    setFormData(prev => ({
      ...prev,
      formFields: prev.formFields.map(f => f.id === id ? { ...f, visible: !f.visible } : f)
    }));
  };

  const updateFieldLabel = (id: string, newLabel: string) => {
    setFormData(prev => ({
      ...prev,
      formFields: prev.formFields.map(f => f.id === id ? { ...f, label: newLabel } : f)
    }));
  };

  const deleteField = (id: string) => {
    if (confirm('Apakah Anda yakin ingin menghapus kolom ini?')) {
      setFormData(prev => ({
        ...prev,
        formFields: prev.formFields.filter(f => f.id !== id)
      }));
    }
  };

  const addField = () => {
    const label = prompt('Masukkan nama kolom baru:');
    if (!label) return;
    
    const id = label.toLowerCase().replace(/[^a-z0-9]/g, '_');
    const newField: FormFieldConfig = {
      id,
      label,
      visible: true,
      order: formData.formFields.length
    };
    
    setFormData(prev => ({
      ...prev,
      formFields: [...prev.formFields, newField]
    }));
  };

  const moveField = (index: number, direction: 'up' | 'down') => {
    const newFields = [...formData.formFields];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex >= 0 && targetIndex < newFields.length) {
      [newFields[index], newFields[targetIndex]] = [newFields[targetIndex], newFields[index]];
      const updated = newFields.map((f, i) => ({ ...f, order: i }));
      setFormData(prev => ({ ...prev, formFields: updated }));
    }
  };

  const handleUpdateOption = (type: 'jenjang' | 'gelombang', index: number, value: string) => {
    const key = type === 'jenjang' ? 'jenjangOptions' : 'gelombangOptions';
    const newOptions = [...(formData[key] || [])];
    newOptions[index] = value;
    setFormData(prev => ({ ...prev, [key]: newOptions }));
  };

  const handleAddOption = (type: 'jenjang' | 'gelombang') => {
    const key = type === 'jenjang' ? 'jenjangOptions' : 'gelombangOptions';
    setFormData(prev => ({ ...prev, [key]: [...(prev[key] || []), `Opsi Baru`] }));
  };

  const handleRemoveOption = (type: 'jenjang' | 'gelombang', index: number) => {
    const key = type === 'jenjang' ? 'jenjangOptions' : 'gelombangOptions';
    setFormData(prev => ({
      ...prev,
      [key]: (prev[key] || []).filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setMessage(null);
    
    // Simulate save delay
    setTimeout(() => {
      onUpdateSettings(formData);
      setIsSaving(false);
      setMessage({ type: 'success', text: '🟢 Pengaturan aplikasi berhasil diperbarui!' });
    }, 800);
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex items-center gap-3 mb-2">
        <div className="p-2.5 bg-slate-800 text-white rounded-2xl shadow-lg">
          <Settings size={24} />
        </div>
        <div>
          <h2 className="text-xl font-bold text-slate-900">Pengaturan Aplikasi</h2>
          <p className="text-xs text-slate-500 font-medium">Konfigurasi identitas pondok, formulir, dan sistem notifikasi</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-6">
          <div className="bg-white border border-slate-200 rounded-3xl p-8 shadow-sm">
            <form onSubmit={handleSubmit} className="space-y-6">
              {message && (
                <div className={`p-4 rounded-2xl border text-sm font-medium ${
                  message.type === 'success' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-red-50 text-red-700 border-red-100'
                }`}>
                  {message.text}
                </div>
              )}

              <div className="space-y-4">
                <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest flex items-center gap-2 mb-4">
                  <School size={16} className="text-emerald-600" />
                  Identitas Lembaga
                </h3>
                
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-2">Nama Pondok Pesantren</label>
                  <input
                    type="text"
                    name="pondokName"
                    value={formData.pondokName}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 rounded-2xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-emerald-500 bg-slate-50/50 text-sm font-medium"
                    required
                  />
                </div>

                <div className="pt-4 border-t border-slate-100 space-y-4">
                  <div className={`flex items-center justify-between p-4 rounded-2xl border transition-all duration-300 ${
                    formData.isRegistrationOpen 
                      ? 'bg-slate-50 border-slate-100 shadow-xs' 
                      : 'bg-red-50 border-red-200 shadow-sm shadow-red-50'
                  }`}>
                    <div>
                      <h4 className={`text-xs font-bold uppercase tracking-wider ${formData.isRegistrationOpen ? 'text-slate-900' : 'text-red-700'}`}>
                        Status Pendaftaran: {formData.isRegistrationOpen ? 'Dibuka' : 'Ditutup'}
                      </h4>
                      <p className={`text-[10px] font-medium ${formData.isRegistrationOpen ? 'text-slate-500' : 'text-red-500'}`}>
                        {formData.isRegistrationOpen 
                          ? 'Calon pendaftar dapat mengakses formulir pendaftaran di halaman depan.' 
                          : 'Pendaftaran dinonaktifkan. Tombol pendaftaran di beranda akan menampilkan pesan tutup.'}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, isRegistrationOpen: !prev.isRegistrationOpen }))}
                      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-hidden ${formData.isRegistrationOpen ? 'bg-emerald-600' : 'bg-red-600'}`}
                    >
                      <span
                        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${formData.isRegistrationOpen ? 'translate-x-5' : 'translate-x-0'}`}
                      />
                    </button>
                  </div>

                  {/* Guide Toggle */}
                  <div className={`flex items-center justify-between p-4 rounded-2xl border transition-all duration-300 ${
                    formData.isGuideActive 
                      ? 'bg-blue-50 border-blue-100' 
                      : 'bg-slate-50 border-slate-100'
                  }`}>
                    <div className="flex-1">
                      <h4 className={`text-xs font-bold uppercase tracking-wider ${formData.isGuideActive ? 'text-blue-900' : 'text-slate-900'}`}>
                        Panduan Pendaftaran: {formData.isGuideActive ? 'Aktif' : 'Nonaktif'}
                      </h4>
                      <p className={`text-[10px] font-medium ${formData.isGuideActive ? 'text-blue-600/70' : 'text-slate-500'}`}>
                        Tampilkan tombol panduan pendaftaran di halaman beranda.
                      </p>
                      {formData.isGuideActive && (
                        <div className="mt-3">
                          <label className="block text-[9px] font-bold text-blue-400 uppercase tracking-widest mb-1">Link Panduan (URL / PDF)</label>
                          <input
                            type="url"
                            value={formData.guideUrl}
                            onChange={(e) => setFormData(prev => ({ ...prev, guideUrl: e.target.value }))}
                            placeholder="https://docs.google.com/..."
                            className="w-full px-3 py-2 text-xs border border-blue-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 bg-white"
                          />
                        </div>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, isGuideActive: !prev.isGuideActive }))}
                      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-hidden ${formData.isGuideActive ? 'bg-blue-600' : 'bg-slate-300'}`}
                    >
                      <span
                        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${formData.isGuideActive ? 'translate-x-5' : 'translate-x-0'}`}
                      />
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-2">Jenis Lembaga</label>
                    <select
                      name="jenisLembaga"
                      value={formData.jenisLembaga || 'Pondok Pesantren'}
                      onChange={(e) => setFormData(prev => ({ ...prev, jenisLembaga: e.target.value }))}
                      className="w-full px-4 py-3 rounded-2xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-emerald-500 bg-slate-50/50 text-sm font-medium"
                    >
                      <option value="lembaga formal">Lembaga Formal</option>
                      <option value="Lembaga non-formal">Lembaga Non-Formal</option>
                      <option value="Pondok Pesantren">Pondok Pesantren</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-2">Sebutan Siswa / Santri</label>
                    <select
                      name="sebutanSiswa"
                      value={formData.sebutanSiswa || 'Santri'}
                      onChange={(e) => setFormData(prev => ({ ...prev, sebutanSiswa: e.target.value }))}
                      className="w-full px-4 py-3 rounded-2xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-emerald-500 bg-slate-50/50 text-sm font-medium"
                    >
                      <option value="Siswa">Siswa</option>
                      <option value="Santri">Santri</option>
                      <option value="Mahasiswa">Mahasiswa</option>
                      <option value="Guru">Guru</option>
                      <option value="Lainnya">Lainnya (Tulis sendiri)</option>
                    </select>
                  </div>
                </div>

                {formData.sebutanSiswa === 'Lainnya' && (
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-2">Sebutan Kustom</label>
                    <input
                      type="text"
                      name="sebutanSiswaCustom"
                      value={formData.sebutanSiswaCustom || ''}
                      onChange={handleInputChange}
                      placeholder="Masukkan sebutan kustom (misal: Peserta)"
                      className="w-full px-4 py-3 rounded-2xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-emerald-500 bg-slate-50/50 text-sm font-medium"
                      required
                    />
                  </div>
                )}

                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-2">Kolom Alamat di Master Data</label>
                  <select
                    name="addressLevel"
                    value={formData.addressLevel || 'desa'}
                    onChange={(e) => setFormData(prev => ({ ...prev, addressLevel: e.target.value as any }))}
                    className="w-full px-4 py-3 rounded-2xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-emerald-500 bg-slate-50/50 text-sm font-medium"
                  >
                    <option value="desa">Desa / Kelurahan</option>
                    <option value="kecamatan">Kecamatan</option>
                    <option value="kabupatenKota">Kabupaten / Kota</option>
                    <option value="provinsi">Provinsi</option>
                  </select>
                  <p className="text-[10px] text-slate-400 mt-1">Pilih tingkatan wilayah administratif alamat yang akan ditampilkan pada tabel Master Data.</p>
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-2">URL Logo Pondok (Kosongi untuk inisial)</label>
                  <input
                    type="text"
                    name="logoUrl"
                    value={formData.logoUrl}
                    onChange={handleInputChange}
                    placeholder="https://example.com/logo.png"
                    className="w-full px-4 py-3 rounded-2xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-emerald-500 bg-slate-50/50 text-[10px] font-mono"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-2">URL Gambar Hero (Beranda)</label>
                  <input
                    type="text"
                    name="heroImageUrl"
                    value={formData.heroImageUrl}
                    onChange={handleInputChange}
                    placeholder="https://images.unsplash.com/..."
                    className="w-full px-4 py-3 rounded-2xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-emerald-500 bg-slate-50/50 text-[10px] font-mono"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-2">Tahun Ajaran</label>
                    <input
                      type="text"
                      name="tahunAjaran"
                      value={formData.tahunAjaran}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 rounded-2xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-emerald-500 bg-slate-50/50 text-sm font-medium"
                      required
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-2">Alamat</label>
                    <input
                      type="text"
                      name="pondokAddress"
                      value={formData.pondokAddress}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 rounded-2xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-emerald-500 bg-slate-50/50 text-sm font-medium"
                      required
                    />
                  </div>
                </div>

                <div className="pt-6 border-t border-slate-100 space-y-6">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Pilihan Jenjang Pendidikan</label>
                      <button type="button" onClick={() => handleAddOption('jenjang')} className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest hover:text-emerald-700">+ Tambah</button>
                    </div>
                    <div className="space-y-2">
                      {(formData.jenjangOptions || []).map((opt, i) => (
                        <div key={`jenjang-${i}`} className="flex gap-2">
                          <input type="text" value={opt} onChange={(e) => handleUpdateOption('jenjang', i, e.target.value)} className="flex-1 px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-emerald-500 bg-slate-50/50" />
                          <button type="button" onClick={() => handleRemoveOption('jenjang', i)} className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"><X size={14} /></button>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Pilihan Gelombang Pendaftaran</label>
                      <button type="button" onClick={() => handleAddOption('gelombang')} className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest hover:text-emerald-700">+ Tambah</button>
                    </div>
                    <div className="space-y-2">
                      {(formData.gelombangOptions || []).map((opt, i) => (
                        <div key={`gel-${i}`} className="flex gap-2">
                          <input type="text" value={opt} onChange={(e) => handleUpdateOption('gelombang', i, e.target.value)} className="flex-1 px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-emerald-500 bg-slate-50/50" />
                          <button type="button" onClick={() => handleRemoveOption('gelombang', i)} className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"><X size={14} /></button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="pt-6 border-t border-slate-100">
                  <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest flex items-center gap-2 mb-4">
                    <MessageSquare size={16} className="text-emerald-600" />
                    Template WhatsApp
                  </h3>
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-2">Pesan Konfirmasi Diterima</label>
                    <textarea
                      name="waTemplate"
                      value={formData.waTemplate}
                      onChange={handleInputChange}
                      rows={8}
                      className="w-full px-4 py-3 rounded-2xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-emerald-500 bg-slate-50/50 text-[11px] font-mono leading-relaxed"
                    />
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {['{NAMA}', '{NO_REG}', '{TAHUN_AJARAN}', '{PONDOK_NAME}', '{PONDOK_ADDRESS}'].map(tag => (
                        <span key={tag} className="px-1.5 py-0.5 bg-emerald-50 text-emerald-700 rounded text-[9px] font-bold border border-emerald-100">{tag}</span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              <div className="pt-4">
                <button
                  type="submit"
                  disabled={isSaving}
                  className="w-full flex items-center justify-center gap-2 bg-slate-900 hover:bg-slate-800 text-white font-bold py-3.5 rounded-2xl transition-all shadow-lg cursor-pointer"
                >
                  <Save size={18} />
                  {isSaving ? 'Menyimpan...' : 'Simpan Pengaturan'}
                </button>
              </div>
            </form>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-3xl p-8 shadow-sm h-fit">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest flex items-center gap-2">
              <FileText size={16} className="text-emerald-600" />
              Urutan & Visibilitas Formulir
            </h3>
            <button
              onClick={addField}
              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all cursor-pointer shadow-md shadow-emerald-100"
            >
              + Tambah Kolom
            </button>
          </div>
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-4">Atur kolom yang muncul di pendaftaran publik</p>
          
          <div className="space-y-3 max-h-[700px] overflow-y-auto pr-2 custom-scrollbar">
            {formData.formFields.map((field, index) => (
              <div 
                key={field.id}
                className={`group flex flex-col p-4 rounded-2xl border transition-all ${
                  field.visible ? 'bg-white border-slate-100 shadow-xs' : 'bg-slate-50 border-transparent opacity-50'
                }`}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="flex flex-col gap-0.5">
                      <button 
                        onClick={() => moveField(index, 'up')}
                        disabled={index === 0}
                        className="p-1 hover:bg-slate-100 rounded-lg disabled:opacity-0 transition-colors cursor-pointer"
                      >
                        <ArrowRight size={14} className="-rotate-90 text-slate-400" />
                      </button>
                      <button 
                        onClick={() => moveField(index, 'down')}
                        disabled={index === formData.formFields.length - 1}
                        className="p-1 hover:bg-slate-100 rounded-lg disabled:opacity-0 transition-colors cursor-pointer"
                      >
                        <ArrowRight size={14} className="rotate-90 text-slate-400" />
                      </button>
                    </div>
                    <div className="flex flex-col">
                      <input 
                        type="text"
                        value={field.label}
                        onChange={(e) => updateFieldLabel(field.id, e.target.value)}
                        className="text-xs font-bold text-slate-800 bg-transparent border-none focus:ring-0 p-0 hover:bg-slate-50 transition-colors rounded-sm"
                      />
                      <div className="text-[9px] text-slate-400 font-mono mt-0.5">{field.id}</div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => toggleFieldVisibility(field.id)}
                      className={`px-2.5 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all cursor-pointer ${
                        field.visible 
                          ? 'bg-emerald-100 text-emerald-700' 
                          : 'bg-slate-200 text-slate-500'
                      }`}
                    >
                      {field.visible ? 'Tampil' : 'Sembunyi'}
                    </button>
                    {/* Basic fields like nama, nik shouldn't be easily deleted maybe? But user asked for it. */}
                    <button
                      onClick={() => deleteField(field.id)}
                      className="p-1.5 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all opacity-0 group-hover:opacity-100 cursor-pointer"
                    >
                      <ArrowRight size={14} className="rotate-45" /> {/* Using arrow as delete icon alternative if Trash is not imported, but wait I have it? No I used Lucide. Let me check imported icons. */}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
