import React from 'react';

const NAMA_BULAN = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
];

export default function ControlBar({
  role,
  kelasList,
  selectedKelasId,
  onSelectKelas,
  bulan,
  tahun,
  onChangeBulan,
  unsavedCount,
  onSave,
  saving,
}) {
  const handlePrevMonth = () => {
    if (bulan === 1) {
      onChangeBulan(12, tahun - 1);
    } else {
      onChangeBulan(bulan - 1, tahun);
    }
  };

  const handleNextMonth = () => {
    if (bulan === 12) {
      onChangeBulan(1, tahun + 1);
    } else {
      onChangeBulan(bulan + 1, tahun);
    }
  };

  const selectedKelas = kelasList.find((k) => k.id === selectedKelasId);

  return (
    <div className="bg-white rounded-2xl border border-blue-900/10 shadow-[0_10px_30px_rgba(8,57,115,0.04)] p-4 sm:p-5 flex flex-wrap items-center justify-between gap-4">
      {/* Selector Kelas & Periode */}
      <div className="flex flex-wrap items-center gap-3">
        {/* Kelas Selector */}
        <div>
          <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
            Kelas
          </label>
          {role === 'WALI_KELAS' ? (
            <div className="px-3.5 py-2 rounded-xl bg-slate-100 border border-slate-200 text-sm font-bold text-slate-700 flex items-center gap-2 select-none">
              <svg className="w-4 h-4 text-slate-500" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
              </svg>
              <span>{selectedKelas ? `Kelas ${selectedKelas.nama_kelas}` : 'Kelas Terkunci'}</span>
            </div>
          ) : (
            <select
              value={selectedKelasId || ''}
              onChange={(e) => onSelectKelas(Number(e.target.value))}
              className="px-3.5 py-2 rounded-xl border border-slate-200 bg-white text-sm font-bold text-slate-800 focus:outline-none focus:border-[#098fd1] focus:ring-4 focus:ring-[#098fd1]/10 cursor-pointer"
            >
              {kelasList.map((k) => (
                <option key={k.id} value={k.id}>
                  Kelas {k.nama_kelas} {k.jumlah_murid ? `(${k.jumlah_murid} Siswa)` : ''}
                </option>
              ))}
            </select>
          )}
        </div>

        {/* Bulan & Tahun Selector */}
        <div>
          <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
            Periode Presensi
          </label>
          <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 p-1 rounded-xl">
            <button
              type="button"
              onClick={handlePrevMonth}
              className="p-1.5 rounded-lg hover:bg-white text-slate-600 transition-colors cursor-pointer"
              title="Bulan sebelumnya"
              aria-label="Bulan sebelumnya"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 19l-7-7 7-7" />
              </svg>
            </button>

            <span className="text-xs font-bold text-slate-800 px-2 min-w-[120px] text-center select-none">
              {NAMA_BULAN[bulan - 1]} {tahun}
            </span>

            <button
              type="button"
              onClick={handleNextMonth}
              className="p-1.5 rounded-lg hover:bg-white text-slate-600 transition-colors cursor-pointer"
              title="Bulan berikutnya"
              aria-label="Bulan berikutnya"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Unsaved Changes & Tombol Simpan */}
      <div className="flex items-center gap-3">
        {unsavedCount > 0 ? (
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs font-semibold">
            <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping" />
            <span>{unsavedCount} perubahan belum disimpan</span>
          </div>
        ) : (
          <span className="text-xs font-medium text-slate-400 hidden sm:inline">Semua perubahan tersimpan</span>
        )}

        <button
          type="button"
          onClick={onSave}
          disabled={unsavedCount === 0 || saving}
          className="px-5 py-2.5 rounded-xl bg-[#0a4ea0] hover:bg-[#083e80] text-white text-xs font-bold uppercase tracking-wider shadow-md hover:shadow-lg transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2 cursor-pointer"
        >
          {saving ? (
            <>
              <svg className="animate-spin h-3.5 w-3.5 text-white" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
              </svg>
              <span>Menyimpan...</span>
            </>
          ) : (
            <>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
              </svg>
              <span>Simpan Perubahan</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}

