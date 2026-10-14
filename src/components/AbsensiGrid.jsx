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
          <span className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-800 border border-emerald-300 font-bold text-xs flex items-center justify-center shadow-xs transition-transform hover:scale-110">
            H
          </span>
        );
      case 'S':
        return (
          <span className="w-7 h-7 rounded-lg bg-amber-100 text-amber-800 border border-amber-300 font-bold text-xs flex items-center justify-center shadow-xs transition-transform hover:scale-110">
            S
          </span>
        );
      case 'I':
        return (
          <span className="w-7 h-7 rounded-lg bg-sky-100 text-sky-800 border border-sky-300 font-bold text-xs flex items-center justify-center shadow-xs transition-transform hover:scale-110">
            I
          </span>
        );
      case 'A':
        return (
          <span className="w-7 h-7 rounded-lg bg-rose-100 text-rose-800 border border-rose-300 font-bold text-xs flex items-center justify-center shadow-xs transition-transform hover:scale-110">
            A
          </span>
        );
      case 'L':
        return (
          <span className="w-7 h-7 rounded-lg bg-slate-200 text-slate-600 border border-slate-300 font-bold text-xs flex items-center justify-center">
            L
          </span>
        );
      default:
        return (
          <span className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-300 hover:text-slate-600 hover:bg-slate-100 font-bold text-sm select-none transition-colors">
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
    <div className="bg-white rounded-2xl border border-blue-900/10 shadow-[0_16px_42px_rgba(8,57,115,0.06)] overflow-hidden">
      {/* Legend & Panduan Interaksi */}
      <div className="px-5 py-3.5 bg-slate-50 border-b border-slate-200/80 flex flex-wrap items-center justify-between text-xs text-slate-600 gap-3">
        <div className="flex flex-wrap items-center gap-4">
          <span className="font-bold text-slate-800">Petunjuk Pengisian:</span>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1">
              <span className="w-4 h-4 rounded bg-emerald-100 text-emerald-800 font-bold text-[10px] flex items-center justify-center">H</span>
              <span className="text-[11px] font-medium">Hadir</span>
            </span>
            <span className="inline-flex items-center gap-1">
              <span className="w-4 h-4 rounded bg-amber-100 text-amber-800 font-bold text-[10px] flex items-center justify-center">S</span>
              <span className="text-[11px] font-medium">Sakit</span>
            </span>
            <span className="inline-flex items-center gap-1">
              <span className="w-4 h-4 rounded bg-sky-100 text-sky-800 font-bold text-[10px] flex items-center justify-center">I</span>
              <span className="text-[11px] font-medium">Izin</span>
            </span>
            <span className="inline-flex items-center gap-1">
              <span className="w-4 h-4 rounded bg-rose-100 text-rose-800 font-bold text-[10px] flex items-center justify-center">A</span>
              <span className="text-[11px] font-medium">Alpa</span>
            </span>
          </div>
        </div>

        <p className="text-[11px] text-slate-400">
          Klik cell untuk mengganti status. Klik kanan untuk mengosongkan.
        </p>
      </div>

      {/* Tabel Matriks Grid */}
      <div className="overflow-x-auto relative max-h-[68vh] scrollbar-thin">
        <table className="w-full border-collapse text-left text-xs">
          <thead className="sticky top-0 z-30 bg-slate-100/95 backdrop-blur-xs border-b border-slate-200 shadow-xs">
            <tr>
              {/* Sticky Kolom No */}
              <th className="sticky left-0 z-40 bg-slate-100 w-12 px-3 py-3 font-bold text-slate-700 text-center border-r border-slate-200 select-none">
                No
              </th>

              {/* Sticky Kolom Nama Siswa */}
              <th className="sticky left-12 z-40 bg-slate-100 min-w-[200px] sm:min-w-[240px] px-4 py-3 font-bold text-slate-700 border-r border-slate-200 select-none">
                Nama Murid
              </th>

              {/* Header Tanggal 1 s.d. 31 */}
              {daysArray.map((day) => {
                const { name, isWeekend } = getDayInfo(tahun, bulan, day);
                return (
                  <th
                    key={day}
                    className={`min-w-[44px] px-1 py-2 text-center border-r border-slate-200 select-none ${
                      isWeekend ? 'bg-slate-200/70 text-slate-500' : 'bg-slate-100 text-slate-800'
                    }`}
                  >
                    <div className="font-mono font-bold text-xs leading-none">{day}</div>
                    <div className="text-[10px] text-slate-500 font-normal mt-0.5">{name}</div>
                    {!isWeekend && (
                      <button
                        type="button"
                        onClick={() => onSetAllPresentForDay(day)}
                        title={`Tandai semua murid hadir pada tgl ${day}`}
                        className="mt-1 text-[9px] font-bold text-[#0a4ea0] hover:bg-blue-100 hover:text-blue-900 rounded px-1 py-0.5 cursor-pointer block mx-auto transition-colors"
                      >
                        ✓All
                      </button>
                    )}
                  </th>
                );
              })}

              {/* Sticky Kolom Rekap */}
              <th className="sticky right-0 z-40 bg-slate-200 px-3 py-3 font-bold text-slate-800 text-center border-l border-slate-300 min-w-[140px] select-none">
                Rekap (H / S / I / A)
              </th>
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
            {dataMurid.length === 0 ? (
              <tr>
                <td colSpan={daysArray.length + 3} className="text-center py-14 text-slate-400">
                  <div className="flex flex-col items-center justify-center gap-2">
                    <svg className="w-8 h-8 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                    </svg>
                    <span>Tidak ada data siswa untuk kelas ini.</span>
                  </div>
                </td>
              </tr>
            ) : (
              dataMurid.map((murid, idx) => {
                const rekap = computeStudentRekap(murid);
                return (
                  <tr key={murid.murid_id} className="hover:bg-blue-50/40 transition-colors">
                    {/* Sticky No Urut */}
                    <td className="sticky left-0 z-20 bg-white hover:bg-blue-50/40 px-3 py-2 text-center border-r border-slate-200 font-mono text-xs select-none">
                      {murid.no_urut || idx + 1}
                    </td>

                    {/* Sticky Nama Murid */}
                    <td className="sticky left-12 z-20 bg-white hover:bg-blue-50/40 px-4 py-2 border-r border-slate-200 font-semibold text-slate-800 truncate max-w-[240px]">
                      {murid.nama_murid}
                    </td>

                    {/* Cell Tanggal */}
                    {daysArray.map((day) => {
                      const { isWeekend } = getDayInfo(tahun, bulan, day);
                      const currentStatus = getStatus(murid, day);

                      return (
                        <td
                          key={day}
                          onClick={() => handleCellClick(murid.murid_id, day, currentStatus)}
                          onContextMenu={(e) => handleContextMenu(e, murid.murid_id, day)}
                          className={`p-1 text-center border-r border-slate-100 cursor-pointer select-none transition-colors ${
                            isWeekend ? 'bg-slate-50/70 hover:bg-slate-100' : 'hover:bg-blue-100/50'
                          }`}
                          title={`Tgl ${day}: ${murid.nama_murid} (${currentStatus || 'Belum diisi'})`}
                        >
                          <div className="flex items-center justify-center">
                            {renderBadge(currentStatus)}
                          </div>
                        </td>
                      );
                    })}

                    {/* Sticky Rekap Murid */}
                    <td className="sticky right-0 z-20 bg-slate-50 px-3 py-2 border-l border-slate-200 text-center font-bold">
                      <div className="flex items-center justify-center gap-1.5 text-[11px]">
                        <span className="text-emerald-700 font-bold" title="Hadir">{rekap.H}H</span>
                        <span className="text-slate-300">/</span>
                        <span className="text-amber-700 font-bold" title="Sakit">{rekap.S}S</span>
                        <span className="text-slate-300">/</span>
                        <span className="text-sky-700 font-bold" title="Izin">{rekap.I}I</span>
                        <span className="text-slate-300">/</span>
                        <span className="text-rose-700 font-bold" title="Alpa">{rekap.A}A</span>
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

