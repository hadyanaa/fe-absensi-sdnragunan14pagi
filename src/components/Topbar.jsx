import React from 'react';
import { useAuth } from '../context/AuthContext';

export default function Topbar() {
  const { guru, logout } = useAuth();

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-blue-900/10 shadow-[0_4px_20px_rgba(8,57,115,0.03)] px-4 sm:px-8 py-3.5 flex items-center justify-between">
      {/* Brand SDN 14 Ragunan */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#0a4ea0] to-[#098fd1] text-white font-black text-lg flex items-center justify-center shadow-md shadow-blue-900/15 select-none">
          14
        </div>
        <div>
          <h2 className="text-base font-bold text-slate-900 leading-tight">SDN 14 Ragunan</h2>
          <p className="text-xs font-semibold text-[#098fd1]">Presensi Digital Siswa</p>
        </div>
      </div>

      {/* Profil Guru & Logout */}
      <div className="flex items-center gap-4">
        <div className="text-right hidden sm:block">
          <p className="text-sm font-bold text-slate-800 leading-tight">{guru?.nama_guru || 'Bapak/Ibu Guru'}</p>
          <div className="flex items-center justify-end gap-1.5 mt-0.5">
            <span className="text-[11px] text-slate-400 font-mono">NIP: {guru?.nip || '-'}</span>
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
              guru?.role === 'WALI_KELAS'
                ? 'bg-blue-50 text-[#0a4ea0] border-blue-200'
                : 'bg-amber-50 text-amber-800 border-amber-200'
            }`}>
              {guru?.role === 'WALI_KELAS' ? `Wali Kelas ${guru?.nama_kelas || ''}` : 'Guru Bidang Studi'}
            </span>
          </div>
        </div>

        <button
          onClick={logout}
          title="Keluar dari akun"
          className="p-2.5 rounded-xl border border-slate-200 text-slate-500 hover:text-rose-600 hover:bg-rose-50 hover:border-rose-200 transition-colors cursor-pointer"
          aria-label="Logout"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
        </button>
      </div>
    </header>
  );
}

