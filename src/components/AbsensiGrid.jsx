import React, { useState } from 'react';

const STATUS_CYCLE = ['H', 'S', 'I', 'A', null];

const HARI_LENGKAP = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];

const MOBILE_STATUS_BUTTONS = [
  {
    code: 'H',
    label: 'Hadir',
    activeCls: 'border-emerald-600 bg-emerald-600 text-white shadow-xs',
    idleCls: 'border-slate-200 bg-white text-slate-700 hover:bg-emerald-50',
  },
  {
    code: 'S',
    label: 'Sakit',
    activeCls: 'border-amber-500 bg-amber-500 text-white shadow-xs',
    idleCls: 'border-slate-200 bg-white text-slate-700 hover:bg-amber-50',
  },
  {
    code: 'I',
    label: 'Izin',
    activeCls: 'border-sky-600 bg-sky-600 text-white shadow-xs',
    idleCls: 'border-slate-200 bg-white text-slate-700 hover:bg-sky-50',
  },
  {
    code: 'A',
    label: 'Alpa',
    activeCls: 'border-rose-600 bg-rose-600 text-white shadow-xs',
    idleCls: 'border-slate-200 bg-white text-slate-700 hover:bg-rose-50',
  },
];

const getDayInfo = (year, month, day) => {
  const dayNames = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];
  const date = new Date(year, month - 1, day);
  const dayIdx = date.getDay();
  return {
    name: dayNames[dayIdx],
    fullName: HARI_LENGKAP[dayIdx],
    isWeekend: dayIdx === 0 || dayIdx === 6,
  };
};

export default function AbsensiGrid({
  bulan,
  tahun,
  totalHari = 31,
  dataMurid = [],
  stagedAbsensi = {},
  onCellChange,
  onSetAllPresentForDay,
  onOpenSiswaTab,
  onSelectStudent,
  readOnly = false,
}) {
  const daysCount = totalHari || 31;
  const daysArray = Array.from({ length: daysCount }, (_, i) => i + 1);

  const [mobileView, setMobileView] = useState('harian'); // 'harian' | 'tabel'
  const [selectedDay, setSelectedDay] = useState(() => {
    const now = new Date();
    if (now.getMonth() + 1 === bulan && now.getFullYear() === tahun) {
      return now.getDate();
    }
    return 1;
  });

  const activeDay = Math.min(Math.max(1, selectedDay), daysCount);
  const activeDayInfo = getDayInfo(tahun, bulan, activeDay);

  const getStatus = (murid, day) => {
    const key = `${murid.murid_id}_${day}`;
    if (stagedAbsensi[key] !== undefined) {
      return stagedAbsensi[key];
    }
    return murid.absensi?.[String(day)] || null;
  };

  const handleCellClick = (muridId, day, currentStatus) => {
    const currIdx = STATUS_CYCLE.indexOf(currentStatus);
    const nextStatus = STATUS_CYCLE[(currIdx + 1) % STATUS_CYCLE.length];
    onCellChange(muridId, day, nextStatus);
  };

  const handleMobileTapStatus = (muridId, day, currentStatus, targetCode) => {
    if (readOnly) return;
    // Ketuk ulang tombol status yang sedang aktif untuk mengosongkan status
    const next = currentStatus === targetCode ? null : targetCode;
    onCellChange(muridId, day, next);
  };

  const handleContextMenu = (e, muridId, day) => {
    e.preventDefault();
    onCellChange(muridId, day, null);
  };

  const renderBadge = (status) => {
    switch (status) {
      case 'H':
        return (
          <span className="flex h-7 w-7 items-center justify-center rounded-lg border border-emerald-300 bg-emerald-100 text-xs font-bold text-emerald-800">
            H
          </span>
        );
      case 'S':
        return (
          <span className="flex h-7 w-7 items-center justify-center rounded-lg border border-amber-300 bg-amber-100 text-xs font-bold text-amber-800">
            S
          </span>
        );
      case 'I':
        return (
          <span className="flex h-7 w-7 items-center justify-center rounded-lg border border-sky-300 bg-sky-100 text-xs font-bold text-sky-800">
            I
          </span>
        );
      case 'A':
        return (
          <span className="flex h-7 w-7 items-center justify-center rounded-lg border border-rose-300 bg-rose-100 text-xs font-bold text-rose-800">
            A
          </span>
        );
      case 'L':
        return (
          <span className="flex h-7 w-7 items-center justify-center rounded-lg border border-slate-300 bg-slate-200 text-xs font-bold text-slate-700">
            L
          </span>
        );
      default:
        return (
          <span className="flex h-7 w-7 items-center justify-center rounded-lg text-sm font-bold text-slate-400 hover:bg-slate-100 hover:text-slate-700 select-none">
            -
          </span>
        );
    }
  };

  const computeStudentRekap = (murid) => {
    const rekap = { H: 0, S: 0, I: 0, A: 0 };
    daysArray.forEach((day) => {
      const st = getStatus(murid, day);
      if (st && rekap[st] !== undefined) {
        rekap[st]++;
      }
    });
    return rekap;
  };

  const renderEmptyState = () => (
    <div className="py-14 text-center text-slate-600">
      <div className="mx-auto flex max-w-md flex-col items-center justify-center gap-2 px-4">
        <p className="text-sm font-bold text-slate-800">
          Belum ada siswa terdaftar di kelas ini
        </p>
        <p className="text-xs text-slate-600">
          Tambahkan atau impor daftar nama siswa terlebih dahulu melalui tab Kelola Data Siswa.
        </p>
        {onOpenSiswaTab && (
          <button
            type="button"
            onClick={onOpenSiswaTab}
            className="mt-2 inline-flex min-h-11 items-center rounded-lg bg-[#0a4ea0] px-4 py-2 text-xs font-bold text-white hover:bg-[#098fd1] focus-visible:outline-2 focus-visible:outline-[#098fd1] cursor-pointer"
          >
            Buka Kelola Data Siswa
          </button>
        )}
      </div>
    </div>
  );

  return (
    <div className="overflow-hidden rounded-xl border border-blue-900/10 bg-white shadow-[0_16px_42px_rgba(8,57,115,0.08)]">
      {/* Legend, Panduan Interaksi & Switch Tampilan Khusus Mobile */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200/80 bg-slate-50 px-4 py-3 text-xs text-slate-700 sm:px-5 sm:py-3.5">
        <div className="flex flex-wrap items-center gap-3 sm:gap-4">
          <span className="font-bold text-slate-900">Keterangan:</span>
          <div className="flex flex-wrap items-center gap-2.5 sm:gap-3">
            <span className="inline-flex items-center gap-1">
              <span className="flex h-4 w-4 items-center justify-center rounded border border-emerald-300 bg-emerald-100 text-[10px] font-bold text-emerald-800">
                H
              </span>
              <span className="text-xs font-medium">Hadir</span>
            </span>
            <span className="inline-flex items-center gap-1">
              <span className="flex h-4 w-4 items-center justify-center rounded border border-amber-300 bg-amber-100 text-[10px] font-bold text-amber-800">
                S
              </span>
              <span className="text-xs font-medium">Sakit</span>
            </span>
            <span className="inline-flex items-center gap-1">
              <span className="flex h-4 w-4 items-center justify-center rounded border border-sky-300 bg-sky-100 text-[10px] font-bold text-sky-800">
                I
              </span>
              <span className="text-xs font-medium">Izin</span>
            </span>
            <span className="inline-flex items-center gap-1">
              <span className="flex h-4 w-4 items-center justify-center rounded border border-rose-300 bg-rose-100 text-[10px] font-bold text-rose-800">
                A
              </span>
              <span className="text-xs font-medium">Alpa</span>
            </span>
          </div>
        </div>

        {/* Toggle Mode Tampilan Khusus Layar HP (< md) */}
        <div
          role="group"
          aria-label="Pilih mode tampilan presensi mobile"
          className="inline-flex w-full rounded-lg border border-slate-200 bg-white p-0.5 md:hidden"
        >
          <button
            type="button"
            onClick={() => setMobileView('harian')}
            className={`min-h-11 flex-1 rounded-md px-3 text-xs font-bold transition-colors cursor-pointer ${
              mobileView === 'harian'
                ? 'bg-[#0a4ea0] text-white'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Mode Harian (Mudah di HP)
          </button>
          <button
            type="button"
            onClick={() => setMobileView('tabel')}
            className={`min-h-11 flex-1 rounded-md px-3 text-xs font-bold transition-colors cursor-pointer ${
              mobileView === 'tabel'
                ? 'bg-[#0a4ea0] text-white'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Mode Tabel Bulanan
          </button>
        </div>

        <p className="hidden text-xs text-slate-600 md:block">
          {readOnly
            ? 'Mode lihat saja (Petugas Piket). Klik nama murid untuk melihat riwayat kehadiran per tahun ajaran.'
            : 'Klik sel tanggal untuk mengubah status, atau klik nama murid untuk melihat profil & riwayat.'}
        </p>
      </div>

      {/* ================================================================
          TAMPILAN 1: KHUSUS MOBILE MODE HARIAN (Tampil default di < md)
          Tidak terhalang kolom sticky, cukup pilih tanggal & ketuk status!
         ================================================================ */}
      {mobileView === 'harian' && (
        <div className="md:hidden">
          {/* Bar Navigasi Tanggal Harian Mobile */}
          <div className="space-y-3 border-b border-slate-200 bg-white p-3.5">
            <div className="flex items-center justify-between gap-2">
              <button
                type="button"
                onClick={() => setSelectedDay((d) => Math.max(1, d - 1))}
                disabled={activeDay <= 1}
                aria-label="Tanggal sebelumnya"
                className="flex min-h-11 min-w-11 items-center justify-center rounded-xl border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 disabled:opacity-40 cursor-pointer"
              >
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 19l-7-7 7-7" />
                </svg>
              </button>

              <div className="flex-1">
                <label htmlFor="mobile-day-select" className="sr-only">
                  Pilih tanggal presensi
                </label>
                <select
                  id="mobile-day-select"
                  value={activeDay}
                  onChange={(e) => setSelectedDay(Number(e.target.value))}
                  className={`min-h-11 w-full rounded-xl border px-3 text-center text-sm font-bold focus:border-[#098fd1] focus:outline-none ${
                    activeDayInfo.isWeekend
                      ? 'border-slate-300 bg-slate-100 text-slate-700'
                      : 'border-blue-200 bg-blue-50/60 text-[#0a4ea0]'
                  }`}
                >
                  {daysArray.map((d) => {
                    const info = getDayInfo(tahun, bulan, d);
                    return (
                      <option key={d} value={d}>
                        Tanggal {d} ({info.fullName})
                      </option>
                    );
                  })}
                </select>
              </div>

              <button
                type="button"
                onClick={() => setSelectedDay((d) => Math.min(daysCount, d + 1))}
                disabled={activeDay >= daysCount}
                aria-label="Tanggal berikutnya"
                className="flex min-h-11 min-w-11 items-center justify-center rounded-xl border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 disabled:opacity-40 cursor-pointer"
              >
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>

            {!readOnly && !activeDayInfo.isWeekend && dataMurid.length > 0 && (
              <button
                type="button"
                onClick={() => onSetAllPresentForDay(activeDay)}
                className="flex min-h-11 w-full items-center justify-center gap-2 rounded-xl border border-blue-200 bg-blue-50 px-4 text-xs font-bold text-[#0a4ea0] hover:bg-blue-100 cursor-pointer"
              >
                <span>✓ Tandai Semua Murid Hadir (Tgl {activeDay})</span>
              </button>
            )}

            {activeDayInfo.isWeekend && (
              <p className="rounded-lg bg-slate-100 px-3 py-2 text-center text-xs font-medium text-slate-600">
                Hari {activeDayInfo.fullName} (akhir pekan).
              </p>
            )}
          </div>

          {/* Daftar Kartu Murid Mobile */}
          {dataMurid.length === 0 ? (
            renderEmptyState()
          ) : (
            <div className="divide-y divide-slate-200">
              {dataMurid.map((murid, idx) => {
                const currentStatus = getStatus(murid, activeDay);
                const rekap = computeStudentRekap(murid);
                return (
                  <div key={murid.murid_id} className="space-y-2.5 p-3.5">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex min-w-0 items-center gap-2">
                        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-slate-100 font-mono text-xs font-bold text-slate-700">
                          {murid.no_urut || idx + 1}
                        </span>
                        {onSelectStudent ? (
                          <button
                            type="button"
                            onClick={() => onSelectStudent(murid)}
                            className="min-h-11 min-w-0 truncate rounded-lg px-1.5 text-left text-sm font-bold text-slate-900 underline decoration-slate-300 underline-offset-4 hover:text-[#0a4ea0] cursor-pointer"
                          >
                            {murid.nama_murid}
                          </button>
                        ) : (
                          <span className="truncate text-sm font-bold text-slate-900">
                            {murid.nama_murid}
                          </span>
                        )}
                      </div>

                      <div className="shrink-0 rounded-lg bg-slate-50 px-2 py-1 text-[11px] font-bold tabular-nums text-slate-600">
                        {rekap.H}H / {rekap.S}S / {rekap.I}I / {rekap.A}A
                      </div>
                    </div>

                    {readOnly ? (
                      <div className="flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs">
                        <span className="font-medium text-slate-600">Status Tgl {activeDay}:</span>
                        <span className="font-bold text-slate-900">
                          {currentStatus === 'H'
                            ? 'Hadir (H)'
                            : currentStatus === 'S'
                              ? 'Sakit (S)'
                              : currentStatus === 'I'
                                ? 'Izin (I)'
                                : currentStatus === 'A'
                                  ? 'Alpa (A)'
                                  : currentStatus === 'L'
                                    ? 'Libur (L)'
                                    : 'Belum diisi'}
                        </span>
                      </div>
                    ) : (
                      <div className="grid grid-cols-4 gap-2">
                        {MOBILE_STATUS_BUTTONS.map((btn) => {
                          const isSelected = currentStatus === btn.code;
                          return (
                            <button
                              key={btn.code}
                              type="button"
                              aria-pressed={isSelected}
                              onClick={() =>
                                handleMobileTapStatus(
                                  murid.murid_id,
                                  activeDay,
                                  currentStatus,
                                  btn.code
                                )
                              }
                              className={`flex min-h-11 flex-col items-center justify-center rounded-xl border px-1 py-1.5 text-xs font-bold transition-colors focus-visible:outline-2 focus-visible:outline-[#098fd1] cursor-pointer ${
                                isSelected ? btn.activeCls : btn.idleCls
                              }`}
                            >
                              <span className="text-sm leading-none">{btn.code}</span>
                              <span className="mt-0.5 text-[10px] font-semibold leading-none opacity-90">
                                {btn.label}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ================================================================
          TAMPILAN 2: TABEL MATRIKS BULANAN
          - Sticky kiri & kanan hanya aktif di tablet/desktop (md:sticky)
          - Di HP (mode 'tabel'), semua kolom ikut bergeser rapi sehingga tanggal 1-31 terlihat penuh!
         ================================================================ */}
      <div
        className={`relative max-h-[68vh] overflow-x-auto scrollbar-thin ${
          mobileView === 'harian' ? 'hidden md:block' : 'block'
        }`}
      >
        <table className="w-full border-collapse text-left text-xs">
          <thead className="sticky top-0 z-30 border-b border-slate-200 bg-slate-100">
            <tr>
              {/* No Urut (Sticky mulai ukuran md) */}
              <th className="w-11 border-r border-slate-200 bg-slate-100 px-2.5 py-3 text-center font-bold text-slate-800 select-none md:sticky md:left-0 md:z-40 md:w-12 md:px-3">
                No
              </th>

              {/* Nama Murid (Sticky mulai ukuran md) */}
              <th className="min-w-[155px] border-r border-slate-200 bg-slate-100 px-3 py-3 font-bold text-slate-800 select-none md:sticky md:left-12 md:z-40 md:min-w-[230px] md:px-4">
                Nama Murid
              </th>

              {/* Header Tanggal 1 s.d. 31 */}
              {daysArray.map((day) => {
                const { name, isWeekend } = getDayInfo(tahun, bulan, day);
                return (
                  <th
                    key={day}
                    className={`min-w-[44px] border-r border-slate-200 px-1 py-2 text-center select-none ${
                      isWeekend ? 'bg-slate-200/80 text-slate-600' : 'bg-slate-100 text-slate-800'
                    }`}
                  >
                    <div className="font-mono text-xs font-bold leading-none">{day}</div>
                    <div className="mt-0.5 text-[10px] font-medium text-slate-600">{name}</div>
                    {!isWeekend && !readOnly && (
                      <button
                        type="button"
                        onClick={() => onSetAllPresentForDay(day)}
                        title={`Tandai semua murid hadir pada tgl ${day}`}
                        className="mx-auto mt-1 block rounded px-1 py-0.5 text-[10px] font-bold text-[#0a4ea0] transition-colors hover:bg-blue-100 focus-visible:outline-2 focus-visible:outline-[#098fd1] cursor-pointer"
                      >
                        ✓All
                      </button>
                    )}
                  </th>
                );
              })}

              {/* Kolom Rekap (Sticky mulai ukuran md) */}
              <th className="min-w-[130px] border-l border-slate-300 bg-slate-200 px-3 py-3 text-center font-bold text-slate-800 select-none md:sticky md:right-0 md:z-40 md:min-w-[140px]">
                Rekap (H / S / I / A)
              </th>
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
            {dataMurid.length === 0 ? (
              <tr>
                <td colSpan={daysArray.length + 3}>{renderEmptyState()}</td>
              </tr>
            ) : (
              dataMurid.map((murid, idx) => {
                const rekap = computeStudentRekap(murid);
                return (
                  <tr key={murid.murid_id} className="transition-colors hover:bg-blue-50/40">
                    {/* No Urut */}
                    <td className="border-r border-slate-200 bg-white px-2.5 py-2 text-center font-mono text-xs text-slate-700 select-none md:sticky md:left-0 md:z-20 md:px-3">
                      {murid.no_urut || idx + 1}
                    </td>

                    {/* Nama Murid */}
                    <td className="max-w-[180px] border-r border-slate-200 bg-white px-2 py-1 font-semibold text-slate-900 md:sticky md:left-12 md:z-20 md:max-w-[240px]">
                      {onSelectStudent ? (
                        <button
                          type="button"
                          onClick={() => onSelectStudent(murid)}
                          title={`Lihat riwayat kehadiran ${murid.nama_murid} per tahun ajaran`}
                          aria-label={`Lihat riwayat kehadiran ${murid.nama_murid}`}
                          className="group flex min-h-11 w-full items-center justify-between gap-2 rounded-lg px-2 text-left transition-colors hover:bg-blue-50 hover:text-[#0a4ea0] focus-visible:outline-2 focus-visible:outline-[#098fd1] cursor-pointer"
                        >
                          <span className="truncate">{murid.nama_murid}</span>
                          <svg
                            className="h-3.5 w-3.5 shrink-0 text-slate-400 transition-colors group-hover:text-[#0a4ea0]"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                            aria-hidden="true"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth="2"
                              d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                            />
                          </svg>
                        </button>
                      ) : (
                        <span className="block truncate px-2 py-2">{murid.nama_murid}</span>
                      )}
                    </td>

                    {/* Cell Tanggal */}
                    {daysArray.map((day) => {
                      const { isWeekend } = getDayInfo(tahun, bulan, day);
                      const currentStatus = getStatus(murid, day);

                      return (
                        <td
                          key={day}
                          className={`border-r border-slate-100 p-0.5 text-center ${
                            isWeekend ? 'bg-slate-50/80' : ''
                          }`}
                        >
                          {readOnly ? (
                            <span
                              title={`Tgl ${day}: ${murid.nama_murid} (${currentStatus || 'Belum diisi'})`}
                              className="flex h-9 w-full items-center justify-center rounded-lg"
                            >
                              {renderBadge(currentStatus)}
                            </span>
                          ) : (
                            <button
                              type="button"
                              onClick={() => handleCellClick(murid.murid_id, day, currentStatus)}
                              onContextMenu={(e) => handleContextMenu(e, murid.murid_id, day)}
                              title={`Tgl ${day}: ${murid.nama_murid} (${currentStatus || 'Belum diisi'})`}
                              aria-label={`Tanggal ${day}, ${murid.nama_murid}, status ${currentStatus || 'belum diisi'}`}
                              className="flex h-9 w-full items-center justify-center rounded-lg focus-visible:outline-2 focus-visible:outline-[#098fd1] cursor-pointer"
                            >
                              {renderBadge(currentStatus)}
                            </button>
                          )}
                        </td>
                      );
                    })}

                    {/* Rekap Murid */}
                    <td className="border-l border-slate-200 bg-slate-50 px-3 py-2 text-center font-bold md:sticky md:right-0 md:z-20">
                      <div className="flex items-center justify-center gap-1.5 text-[11px] tabular-nums">
                        <span className="font-bold text-emerald-800" title="Hadir">
                          {rekap.H}H
                        </span>
                        <span className="text-slate-400">/</span>
                        <span className="font-bold text-amber-800" title="Sakit">
                          {rekap.S}S
                        </span>
                        <span className="text-slate-400">/</span>
                        <span className="font-bold text-sky-800" title="Izin">
                          {rekap.I}I
                        </span>
                        <span className="text-slate-400">/</span>
                        <span className="font-bold text-rose-800" title="Alpa">
                          {rekap.A}A
                        </span>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
