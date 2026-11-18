import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import logoSekolah from '../assets/logo-sekolah.jpg';

export default function LoginPage() {
  const { login, loading } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    if (!username.trim() || !password.trim()) {
      setErrorMsg('Harap isi username dan kata sandi dengan lengkap.');
      return;
    }

    const res = await login(username.trim(), password);
    if (!res.success) {
      setErrorMsg(res.message);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#f9fafa] px-4 py-8 sm:px-6">
      <div className="w-full max-w-4xl overflow-hidden rounded-2xl border border-blue-900/10 bg-white shadow-[0_16px_42px_rgba(8,57,115,0.08)] md:grid md:grid-cols-[1.05fr_1fr]">
        {/* Panel Identitas SDN Ragunan 14 Pagi */}
        <div className="relative flex flex-col justify-between bg-[#0a4ea0] px-6 py-7 text-white sm:px-8 sm:py-9 md:p-10">
          {/* Aksen tipis emas #f5c542 sebagai penanda identitas sekolah */}
          <div className="absolute inset-x-0 top-0 h-1.5 bg-[#f5c542]" aria-hidden="true" />

          <div className="flex items-center gap-4 md:block">
            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-white p-1.5 shadow-sm sm:h-20 sm:w-20 md:mb-6 md:h-24 md:w-24 md:p-2">
              <img
                src={logoSekolah}
                alt="Logo SDN Ragunan 14 Pagi"
                className="h-full w-full object-contain select-none"
              />
            </div>

            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-[#f5c542]">
                Sistem Presensi & Data Siswa
              </p>
              <h1 className="mt-1 text-xl font-extrabold tracking-tight text-white sm:text-2xl md:text-3xl">
                SDN Ragunan 14 Pagi
              </h1>
            </div>
          </div>

          <div className="mt-5 hidden border-t border-white/15 pt-5 text-sm leading-relaxed text-blue-50 md:block">
            <p>
              Masuk menggunakan akun Wali Kelas, Guru Bidang Studi, Petugas Piket, atau Administrator untuk mengelola kehadiran harian serta data siswa.
            </p>
            <p className="mt-4 text-xs font-medium text-blue-100/90">
              Kecamatan Pasar Minggu, Kota Administrasi Jakarta Selatan
            </p>
          </div>
        </div>

        {/* Panel Form Login */}
        <div className="p-6 sm:p-8 md:p-10">
          <div className="mb-6">
            <h2 className="text-xl font-bold tracking-tight text-slate-900">Masuk ke Akun</h2>
            <p className="mt-1 text-sm text-slate-600">
              Masukkan username dan kata sandi Anda.
            </p>
          </div>

          {errorMsg && (
            <div
              role="alert"
              className="mb-5 flex items-start gap-2.5 rounded-xl border border-rose-200 bg-rose-50 p-3.5 text-xs font-semibold text-rose-800"
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

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label
                htmlFor="input-username"
                className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-700"
              >
                Username
              </label>
              <input
                id="input-username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Masukkan username akun"
                autoComplete="username"
                className="min-h-11 w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-base font-medium text-slate-900 placeholder-slate-400 transition-colors focus:border-[#098fd1] focus:outline-none focus:ring-4 focus:ring-[#098fd1]/15 sm:text-sm"
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
              <div className="relative">
                <input
                  id="input-password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Masukkan kata sandi"
                  autoComplete="current-password"
                  className="min-h-11 w-full rounded-xl border border-slate-300 bg-white py-2.5 pr-12 pl-4 text-base font-medium text-slate-900 placeholder-slate-400 transition-colors focus:border-[#098fd1] focus:outline-none focus:ring-4 focus:ring-[#098fd1]/15 sm:text-sm"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  aria-label={showPassword ? 'Sembunyikan kata sandi' : 'Tampilkan kata sandi'}
                  title={showPassword ? 'Sembunyikan kata sandi' : 'Tampilkan kata sandi'}
                  className="absolute top-1/2 right-1 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-lg text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-800 focus-visible:outline-2 focus-visible:outline-[#098fd1] cursor-pointer"
                >
                  {showPassword ? (
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"
                      />
                    </svg>
                  ) : (
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                      />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="mt-2 flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#0a4ea0] px-4 py-3 text-sm font-bold text-white shadow-sm transition-colors hover:bg-[#098fd1] disabled:cursor-not-allowed disabled:opacity-60 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#098fd1] cursor-pointer"
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
                'Masuk ke Sistem'
              )}
            </button>
          </form>

          <p className="mt-6 border-t border-slate-100 pt-4 text-center text-xs text-slate-600 md:hidden">
            Kecamatan Pasar Minggu, Kota Administrasi Jakarta Selatan
          </p>
        </div>
      </div>
    </div>
  );
}
