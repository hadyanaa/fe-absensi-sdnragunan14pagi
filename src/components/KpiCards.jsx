import React from 'react';

export default function KpiCards({ totalHadir = 0, totalSakit = 0, totalIzin = 0, totalAlpa = 0 }) {
  const cards = [
    {
      label: 'Hadir (H)',
      value: totalHadir,
      bg: 'bg-emerald-50/80',
      border: 'border-emerald-200',
      text: 'text-emerald-800',
      dot: 'bg-emerald-500',
      desc: 'Kehadiran Aktif',
    },
    {
      label: 'Sakit (S)',
      value: totalSakit,
      bg: 'bg-amber-50/80',
      border: 'border-amber-200',
      text: 'text-amber-800',
      dot: 'bg-amber-500',
      desc: 'Keterangan Sakit',
    },
    {
      label: 'Izin (I)',
      value: totalIzin,
      bg: 'bg-sky-50/80',
      border: 'border-sky-200',
      text: 'text-sky-800',
      dot: 'bg-sky-500',
      desc: 'Surat Izin',
    },
    {
      label: 'Alpa (A)',
      value: totalAlpa,
      bg: 'bg-rose-50/80',
      border: 'border-rose-200',
      text: 'text-rose-800',
      dot: 'bg-rose-500',
      desc: 'Tanpa Keterangan',
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
      {cards.map((card, idx) => (
        <div
          key={idx}
          className={`${card.bg} border ${card.border} rounded-2xl p-4 shadow-[0_4px_16px_rgba(8,57,115,0.03)] flex flex-col justify-between`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <span className={`w-2 h-2 rounded-full ${card.dot}`} />
              <p className="text-xs font-bold text-slate-700">{card.label}</p>
            </div>
            <span className="text-[10px] font-semibold text-slate-400 hidden sm:inline">{card.desc}</span>
          </div>

          <div className="mt-3 flex items-baseline justify-between">
            <p className={`text-2xl sm:text-3xl font-black ${card.text}`}>{card.value}</p>
            <span className="text-[11px] font-medium text-slate-500">Presensi</span>
          </div>
        </div>
      ))}
    </div>
  );
}

