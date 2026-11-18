import React from 'react';

const STATUS_CYCLE = ['H', 'S', 'I', 'A', null];

const getDayInfo = (year, month, day) => {
  const dayNames = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];
  const date = new Date(year, month - 1, day);
  const dayIdx = date.getDay();
  return {
    name: dayNames[dayIdx],
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
  const daysArray = Array.from({ length: totalHari || 31 }, (_, i) => i + 1);

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

  return (
    <div className="overflow-hidden rounded-xl border border-blue-900/10 bg-white shadow-[0_16px_42px_rgba(8,57,115,0.08)]">
      {/* Legend & Panduan Interaksi */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200/80 bg-slate-50 px-5 py-3.5 text-xs text-slate-700">
        <div className="flex flex-wrap items-center gap-4">
          <span className="font-bold text-slate-900">Petunjuk Pengisian:</span>
          <div className="flex flex-wrap items-center gap-3">
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

        <p className="text-xs text-slate-600">
          {readOnly
            ? 'Mode lihat saja (Petugas Piket). Klik nama murid untuk melihat riwayat kehadiran per tahun ajaran.'
            : 'Klik sel tanggal untuk mengubah status, atau klik nama murid untuk melihat riwayat per tahun ajaran.'}
        </p>
      </div>

      {/* Tabel Matriks Grid */}
      <div className="relative max-h-[68vh] overflow-x-auto scrollbar-thin">
        <table className="w-full border-collapse text-left text-xs">
          <thead className="sticky top-0 z-30 border-b border-slate-200 bg-slate-100">
            <tr>
              {/* Sticky Kolom No */}
              <th className="sticky left-0 z-40 w-12 border-r border-slate-200 bg-slate-100 px-3 py-3 text-center font-bold text-slate-800 select-none">
                No
              </th>

              {/* Sticky Kolom Nama Siswa */}
              <th className="sticky left-12 z-40 min-w-[190px] border-r border-slate-200 bg-slate-100 px-4 py-3 font-bold text-slate-800 sm:min-w-[240px] select-none">
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

              {/* Sticky Kolom Rekap */}
              <th className="sticky right-0 z-40 min-w-[140px] border-l border-slate-300 bg-slate-200 px-3 py-3 text-center font-bold text-slate-800 select-none">
                Rekap (H / S / I / A)
              </th>
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
            {dataMurid.length === 0 ? (
              <tr>
                <td colSpan={daysArray.length + 3} className="py-14 text-center text-slate-600">
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
                </td>
              </tr>
            ) : (
              dataMurid.map((murid, idx) => {
                const rekap = computeStudentRekap(murid);
                return (
                  <tr key={murid.murid_id} className="transition-colors hover:bg-blue-50/40">
                    {/* Sticky No Urut */}
                    <td className="sticky left-0 z-20 border-r border-slate-200 bg-white px-3 py-2 text-center font-mono text-xs text-slate-700 select-none">
                      {murid.no_urut || idx + 1}
                    </td>

                    {/* Sticky Nama Murid */}
                    <td className="sticky left-12 z-20 max-w-[240px] border-r border-slate-200 bg-white px-2 py-1 font-semibold text-slate-900">
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

                    {/* Sticky Rekap Murid */}
                    <td className="sticky right-0 z-20 border-l border-slate-200 bg-slate-50 px-3 py-2 text-center font-bold">
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
