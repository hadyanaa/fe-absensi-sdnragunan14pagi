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
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#f9fafa] p-4">
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-[#0a4ea0]/5 via-transparent to-[#098fd1]/10" />

      <div className="relative w-full max-w-md rounded-xl border border-blue-900/10 bg-white p-6 shadow-[0_16px_42px_rgba(8,57,115,0.08)] sm:p-10">
        {/* Identitas Sekolah SDN 14 Ragunan */}
        <div className="mb-8 text-center">
          <div className="mb-4 inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-tr from-[#0a4ea0] to-[#098fd1] text-2xl font-black text-white shadow-md select-none">
            14
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">SDN 14 RAGUNAN</h1>
          <p className="mt-1 text-sm font-medium text-slate-600">
            Sistem Presensi & Data Siswa
          </p>
        </div>

        {errorMsg && (
          <div
            role="alert"
            className="mb-6 flex items-start gap-2.5 rounded-xl border border-rose-200 bg-rose-50 p-3.5 text-xs font-semibold text-rose-800"
          >
            <svg
              className="mt-0.5 h-4 w-4 shrink-0 text-rose-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <span className="leading-relaxed">{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label
              htmlFor="input-nip"
              className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-700"
            >
              Nomor Induk Pegawai (NIP)
            </label>
            <input
              id="input-nip"
              type="text"
              value={nip}
              onChange={(e) => setNip(e.target.value)}
              placeholder="Contoh: 198501012010011001"
              className="min-h-11 w-full rounded-xl border border-slate-300 px-4 py-3 text-base font-medium text-slate-900 placeholder-slate-400 transition-colors focus:border-[#098fd1] focus:outline-none focus:ring-4 focus:ring-[#098fd1]/15 sm:text-sm"
              required
              autoFocus
            />
          </div>

          <div>
            <label
              htmlFor="input-password"
              className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-700"
            >
              Kata Sandi
            </label>
            <input
              id="input-password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Masukkan kata sandi"
              className="min-h-11 w-full rounded-xl border border-slate-300 px-4 py-3 text-base font-medium text-slate-900 placeholder-slate-400 transition-colors focus:border-[#098fd1] focus:outline-none focus:ring-4 focus:ring-[#098fd1]/15 sm:text-sm"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="mt-2 flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#0a4ea0] px-4 py-3.5 text-sm font-bold text-white shadow-sm transition-all duration-150 hover:-translate-y-0.5 hover:bg-[#098fd1] active:translate-y-0 disabled:cursor-not-allowed disabled:opacity-60 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#098fd1] cursor-pointer"
          >
            {loading ? (
              <>
                <svg className="h-4 w-4 animate-spin text-white" fill="none" viewBox="0 0 24 24" aria-hidden="true">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                </svg>
                <span>Memverifikasi...</span>
              </>
            ) : (
              'Masuk ke Sistem Absensi'
            )}
          </button>
        </form>

        <div className="mt-8 border-t border-slate-100 pt-6 text-center">
          <p className="text-xs font-normal text-slate-600">
            Kecamatan Pasar Minggu, Kota Administrasi Jakarta Selatan
          </p>
        </div>
      </div>
    </div>
  );
}
