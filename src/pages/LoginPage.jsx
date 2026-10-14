import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';

export default function LoginPage() {
  const { login, loading } = useAuth();
  const [nip, setNip] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    if (!nip.trim() || !password.trim()) {
      setErrorMsg('Harap isi NIP dan kata sandi dengan lengkap.');
      return;
    }

    const res = await login(nip.trim(), password);
    if (!res.success) {
      setErrorMsg(res.message);
    }
  };

  return (
    <div className="min-h-screen bg-[#f9fafa] flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background Ambience halus tanpa generic slop */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#0a4ea0]/5 via-transparent to-[#098fd1]/10 pointer-events-none" />

      <div className="relative w-full max-w-md bg-white rounded-2xl border border-blue-900/10 shadow-[0_16px_42px_rgba(8,57,115,0.08)] p-8 sm:p-10">
        {/* Identitas Sekolah SDN 14 Ragunan */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-tr from-[#0a4ea0] to-[#098fd1] text-white font-black text-2xl shadow-lg shadow-blue-900/20 mb-4 select-none">
            14
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">SDN 14 RAGUNAN</h1>
          <p className="text-sm text-slate-500 font-medium mt-1">Sistem Presensi & Absensi Siswa</p>
        </div>

        {errorMsg && (
          <div className="mb-6 p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-start gap-2.5">
            <svg className="w-4 h-4 shrink-0 text-rose-500 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="leading-relaxed">{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label htmlFor="input-nip" className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider">
              Nomor Induk Pegawai (NIP)
            </label>
            <input
              id="input-nip"
              type="text"
              value={nip}
              onChange={(e) => setNip(e.target.value)}
              placeholder="Masukkan NIP Anda"
              className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#098fd1] focus:ring-4 focus:ring-[#098fd1]/10 transition-all font-medium"
              required
              autoFocus
            />
          </div>

          <div>
            <label htmlFor="input-password" className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider">
              Kata Sandi
            </label>
            <input
              id="input-password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#098fd1] focus:ring-4 focus:ring-[#098fd1]/10 transition-all font-medium"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 py-3.5 px-4 rounded-xl bg-[#0a4ea0] hover:bg-[#083e80] text-white font-semibold text-sm shadow-md hover:shadow-lg transition-all duration-200 hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2 cursor-pointer"
          >
            {loading ? (
              <>
                <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
                </svg>
                <span>Memverifikasi...</span>
              </>
            ) : (
              'Masuk ke Sistem Absensi'
            )}
          </button>
        </form>

        <div className="mt-8 pt-6 border-t border-slate-100 text-center">
          <p className="text-xs text-slate-400 font-normal">
            Kecamatan Pasar Minggu, Kota Administrasi Jakarta Selatan
          </p>
        </div>
      </div>
    </div>
  );
}

