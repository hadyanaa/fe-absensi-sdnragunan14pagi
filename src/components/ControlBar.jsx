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
    <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-blue-900/10 bg-white p-4 shadow-[0_16px_42px_rgba(8,57,115,0.08)] sm:p-5">
      {/* Selector Kelas & Periode */}
      <div className="flex flex-wrap items-end gap-3">
        {/* Kelas Selector */}
        <div>
          <label
            htmlFor="presensi-kelas"
            className="mb-1 block text-xs font-bold uppercase tracking-wider text-slate-600"
          >
            Kelas
          </label>
          {role === 'WALI_KELAS' ? (
            <div className="flex min-h-11 items-center gap-2 rounded-xl border border-slate-200 bg-slate-100 px-3.5 text-sm font-bold text-slate-800 select-none">
              <svg className="h-4 w-4 text-slate-600" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                <path
                  fillRule="evenodd"
                  d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z"
                  clipRule="evenodd"
                />
              </svg>
              <span>
                {selectedKelas ? `Kelas ${selectedKelas.nama_kelas}` : 'Kelas Terkunci'}
              </span>
            </div>
          ) : (
            <select
              id="presensi-kelas"
              value={selectedKelasId || ''}
              onChange={(e) => onSelectKelas(Number(e.target.value))}
              className="min-h-11 cursor-pointer rounded-xl border border-slate-300 bg-white px-3.5 text-sm font-bold text-slate-900 focus:border-[#098fd1] focus:outline-none focus:ring-4 focus:ring-[#098fd1]/15"
            >
              {kelasList.map((k) => (
                <option key={k.id} value={k.id}>
                  Kelas {k.nama_kelas} ({k.jumlah_murid || 0} Siswa)
                </option>
              ))}
            </select>
          )}
        </div>

        {/* Bulan & Tahun Selector */}
        <div>
          <span className="mb-1 block text-xs font-bold uppercase tracking-wider text-slate-600">
            Periode Presensi
          </span>
          <div className="flex items-center gap-1 rounded-xl border border-slate-200 bg-slate-50 p-0.5">
            <button
              type="button"
              onClick={handlePrevMonth}
              className="flex min-h-10 min-w-10 items-center justify-center rounded-lg text-slate-700 transition-colors hover:bg-white focus-visible:outline-2 focus-visible:outline-[#098fd1] cursor-pointer"
              title="Bulan sebelumnya"
              aria-label="Bulan sebelumnya"
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 19l-7-7 7-7" />
              </svg>
            </button>

            <span className="min-w-[128px] px-2 text-center text-xs font-bold text-slate-900 select-none">
              {NAMA_BULAN[bulan - 1]} {tahun}
            </span>

            <button
              type="button"
              onClick={handleNextMonth}
              className="flex min-h-10 min-w-10 items-center justify-center rounded-lg text-slate-700 transition-colors hover:bg-white focus-visible:outline-2 focus-visible:outline-[#098fd1] cursor-pointer"
              title="Bulan berikutnya"
              aria-label="Bulan berikutnya"
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Unsaved Changes & Tombol Simpan */}
      <div className="flex flex-wrap items-center gap-3">
        {unsavedCount > 0 ? (
          <div className="flex items-center gap-2 rounded-xl border border-amber-300 bg-amber-50 px-3 py-2 text-xs font-bold text-amber-900">
            <span className="h-2 w-2 rounded-full bg-amber-500" aria-hidden="true" />
            <span>{unsavedCount} perubahan belum disimpan</span>
          </div>
        ) : (
          <span className="hidden text-xs font-medium text-slate-600 sm:inline">
            Semua perubahan tersimpan
          </span>
        )}

        <button
          type="button"
          onClick={onSave}
          disabled={unsavedCount === 0 || saving}
          className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-[#0a4ea0] px-5 py-2.5 text-xs font-bold uppercase tracking-wider text-white shadow-sm transition-colors hover:bg-[#098fd1] disabled:cursor-not-allowed disabled:opacity-45 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#098fd1] cursor-pointer"
        >
          {saving ? (
            <>
              <svg className="h-4 w-4 animate-spin text-white" fill="none" viewBox="0 0 24 24" aria-hidden="true">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
              </svg>
              <span>Menyimpan...</span>
            </>
          ) : (
            <>
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
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
