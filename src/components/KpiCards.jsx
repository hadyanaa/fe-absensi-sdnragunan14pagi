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
    <div className="grid grid-cols-2 gap-3.5 lg:grid-cols-4">
      {cards.map((card) => (
        <div
          key={card.label}
          className={`${card.bg} border ${card.border} flex flex-col justify-between rounded-xl p-4`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <span className={`h-2 w-2 rounded-full ${card.dot}`} aria-hidden="true" />
              <p className="text-xs font-bold text-slate-800">{card.label}</p>
            </div>
            <span className="hidden text-[11px] font-semibold text-slate-600 sm:inline">
              {card.desc}
            </span>
          </div>

          <div className="mt-3 flex items-baseline justify-between">
            <p className={`text-2xl font-black tabular-nums sm:text-3xl ${card.text}`}>
              {card.value}
            </p>
            <span className="text-xs font-medium text-slate-600">Presensi</span>
          </div>
        </div>
      ))}
    </div>
  );
}
