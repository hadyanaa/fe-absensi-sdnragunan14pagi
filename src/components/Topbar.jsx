import React from 'react';
import { useAuth } from '../context/AuthContext';
import logoSekolah from '../assets/logo-sekolah.jpg';

export default function Topbar() {
  const { guru, logout } = useAuth();
  const isAdmin = guru?.role === 'ADMIN' || guru?.role === 'admin';
  const isPiket = guru?.role === 'PIKET';
  const loginIdentifier = guru?.username || guru?.nip;
  const mapelLabels = (guru?.kelas_mapel || []).map((k) => k.nama_kelas).join(', ');

  return (
    <header className="sticky top-0 z-40 border-b border-blue-900/10 bg-white px-4 py-3 sm:px-8">
      <div className="mx-auto flex max-w-[1540px] items-center justify-between gap-3">
        {/* Brand SDN Ragunan 14 Pagi */}
        <div className="flex items-center gap-3">
          <img
            src={logoSekolah}
            alt="Logo SDN Ragunan 14 Pagi"
            className="h-11 w-11 shrink-0 rounded-xl bg-white object-contain p-0.5 ring-1 ring-blue-900/10 select-none"
          />
          <div>
            <h1 className="text-base font-bold leading-tight text-slate-900">
              SDN Ragunan 14 Pagi
            </h1>
            <p className="text-xs font-semibold text-[#0a4ea0]">Sistem Presensi & Data Siswa</p>
          </div>
        </div>

        {/* Profil Guru & Logout */}
        <div className="flex items-center gap-3">
          <div className="hidden text-right sm:block">
            <p className="text-sm font-bold leading-tight text-slate-900">
              {guru?.nama_guru || 'Bapak/Ibu Guru'}
            </p>
            <div className="mt-0.5 flex items-center justify-end gap-2">
              {loginIdentifier && (
                <span className="font-mono text-xs text-slate-600">@{loginIdentifier}</span>
              )}
              {guru?.nip_nikki && (
                <span className="font-mono text-xs text-slate-500">
                  | NIP/NIKKI: {guru.nip_nikki}
                </span>
              )}
              <span
                className={`rounded-full border px-2 py-0.5 text-[11px] font-bold ${
                  isAdmin
                    ? 'border-purple-200 bg-purple-50 text-purple-900'
                    : isPiket
                      ? 'border-teal-200 bg-teal-50 text-teal-900'
                      : guru?.role === 'WALI_KELAS'
                        ? 'border-blue-200 bg-blue-50 text-[#0a4ea0]'
                        : 'border-amber-200 bg-amber-50 text-amber-800'
                }`}
              >
                {isAdmin
                  ? 'Administrator'
                  : isPiket
                    ? 'Petugas Piket (Lihat Saja)'
                    : guru?.role === 'WALI_KELAS'
                      ? `Wali Kelas ${guru?.nama_kelas || ''}`
                      : mapelLabels
                        ? `Guru Mapel (${mapelLabels})`
                        : 'Guru Bidang Studi'}
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={logout}
            title="Keluar dari akun"
            aria-label="Keluar dari akun"
            className="inline-flex min-h-11 min-w-11 items-center justify-center gap-1.5 rounded-xl border border-slate-200 px-3 text-xs font-bold text-slate-700 transition-colors hover:border-rose-200 hover:bg-rose-50 hover:text-rose-700 focus-visible:outline-2 focus-visible:outline-[#098fd1] cursor-pointer"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
              />
            </svg>
            <span className="hidden md:inline">Keluar</span>
          </button>
        </div>
      </div>
    </header>
  );
}
