import React, { useEffect, useState } from 'react';
import { getMuridHistory, getErrorMessage } from '../services/api';
import Modal, { btnPrimary, btnSecondary, Spinner } from './Modal';

const NAMA_BULAN_SINGKAT = [
  'Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun',
  'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des',
];

const STATUS_META = {
  S: {
    label: 'Sakit',
    badgeClass: 'border-amber-300 bg-amber-100 text-amber-900',
  },
  I: {
    label: 'Izin',
    badgeClass: 'border-sky-300 bg-sky-100 text-sky-900',
  },
  A: {
    label: 'Alpa',
    badgeClass: 'border-rose-300 bg-rose-100 text-rose-900',
  },
};

const STATUS_SISWA_BADGE = {
  AKTIF: {
    label: 'Aktif Belajar',
    cls: 'border-emerald-200 bg-emerald-50 text-emerald-800',
  },
  LULUS: {
    label: 'Lulus / Alumni',
    cls: 'border-amber-300 bg-amber-50 text-amber-900',
  },
  MUTASI_KELUAR: {
    label: 'Mutasi Keluar',
    cls: 'border-slate-300 bg-slate-100 text-slate-800',
  },
};

function SemesterSummaryCard({ semesterKey, info, active, onSelect }) {
  const rekap = info?.rekap || { H: 0, S: 0, I: 0, A: 0 };
  const totalAktif = info?.total_aktif || 0;
  const persen = info?.persentase_hadir;

  return (
    <button
      type="button"
      onClick={() => onSelect(semesterKey)}
      aria-pressed={active}
      className={`w-full rounded-xl border p-4 text-left transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#098fd1] cursor-pointer ${
        active
          ? 'border-[#0a4ea0] bg-blue-50/50 ring-2 ring-[#098fd1]/20'
          : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/70'
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-sm font-bold text-slate-900">{info?.label}</p>
          <p className="text-xs font-medium text-slate-600">{info?.periode}</p>
        </div>
        <span
          className={`rounded-lg px-2.5 py-1 text-xs font-bold tabular-nums ${
            persen !== null && persen !== undefined
              ? 'bg-[#0a4ea0] text-white'
              : 'bg-slate-100 text-slate-600'
          }`}
        >
          {persen !== null && persen !== undefined ? `${persen}% Hadir` : 'Belum ada data'}
        </span>
      </div>

      <div className="mt-3.5 grid grid-cols-4 gap-2 text-center">
        <div className="rounded-lg border border-emerald-200 bg-emerald-50/70 px-1.5 py-2">
          <div className="text-[11px] font-bold text-emerald-800">Hadir</div>
          <div className="mt-0.5 text-base font-extrabold tabular-nums text-emerald-950">
            {totalAktif > 0 ? rekap.H : '-'}
          </div>
        </div>
        <div className="rounded-lg border border-amber-200 bg-amber-50/70 px-1.5 py-2">
          <div className="text-[11px] font-bold text-amber-800">Sakit</div>
          <div className="mt-0.5 text-base font-extrabold tabular-nums text-amber-950">
            {totalAktif > 0 ? rekap.S : '-'}
          </div>
        </div>
        <div className="rounded-lg border border-sky-200 bg-sky-50/70 px-1.5 py-2">
          <div className="text-[11px] font-bold text-sky-800">Izin</div>
          <div className="mt-0.5 text-base font-extrabold tabular-nums text-sky-950">
            {totalAktif > 0 ? rekap.I : '-'}
          </div>
        </div>
        <div className="rounded-lg border border-rose-200 bg-rose-50/70 px-1.5 py-2">
          <div className="text-[11px] font-bold text-rose-800">Alpa</div>
          <div className="mt-0.5 text-base font-extrabold tabular-nums text-rose-950">
            {totalAktif > 0 ? rekap.A : '-'}
          </div>
        </div>
      </div>
    </button>
  );
}

/**
 * Popup card riwayat kehadiran siswa per Tahun Ajaran (Semester Ganjil & Genap).
 * Dapat dibuka dari halaman Presensi Harian maupun Kelola Data Siswa.
 */
export default function StudentHistoryModal({ open, siswa, onClose }) {
  const muridId = siswa?.id || siswa?.murid_id;
  const [selectedTA, setSelectedTA] = useState('');
  const [semesterView, setSemesterView] = useState('ganjil');
  const [expandedMonthKey, setExpandedMonthKey] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [historyData, setHistoryData] = useState(null);
  const [reloadTick, setReloadTick] = useState(0);

  useEffect(() => {
    if (!open || !muridId) return undefined;
    let active = true;

    const loadHistory = async () => {
      setLoading(true);
      setError('');
      try {
        const res = await getMuridHistory(muridId, selectedTA || undefined);
        if (!active) return;
        if (res.data?.success) {
          const payload = res.data.data;
          setHistoryData(payload);

          // Pilih semester yang relevan secara otomatis saat pertama kali dibuka
          if (!selectedTA) {
            const ganjilCount = payload?.semester?.ganjil?.total_aktif || 0;
            const genapCount = payload?.semester?.genap?.total_aktif || 0;
            const currentMonth = new Date().getMonth() + 1;
            const preferGenap = currentMonth <= 6;
            if (preferGenap && genapCount > 0) {
              setSemesterView('genap');
            } else if (!preferGenap && ganjilCount > 0) {
              setSemesterView('ganjil');
            } else if (genapCount > 0 && ganjilCount === 0) {
              setSemesterView('genap');
            } else {
              setSemesterView('ganjil');
            }
          }
          setExpandedMonthKey(null);
        } else {
          setError(res.data?.message || 'Riwayat kehadiran siswa gagal dimuat.');
        }
      } catch (err) {
        if (!active) return;
        setError(getErrorMessage(err, 'Riwayat kehadiran siswa gagal dimuat.'));
      } finally {
        if (active) setLoading(false);
      }
    };

    loadHistory();
    return () => {
      active = false;
    };
  }, [open, muridId, selectedTA, reloadTick]);

  const muridInfo = historyData?.murid || siswa;
  const availableTA = historyData?.available_tahun_ajaran || [];
  const activeTA = historyData?.tahun_ajaran || selectedTA;
  const ganjil = historyData?.semester?.ganjil;
  const genap = historyData?.semester?.genap;
  const tahunan = historyData?.tahunan;

  const displayedMonths = (() => {
    if (!ganjil || !genap) return [];
    if (semesterView === 'ganjil') return ganjil.bulanan || [];
    if (semesterView === 'genap') return genap.bulanan || [];
    return [...(ganjil.bulanan || []), ...(genap.bulanan || [])];
  })();

  const titleNama = muridInfo?.nama_murid || 'Siswa';
  const statusMurid = muridInfo?.status || 'AKTIF';
  const statusBadge = STATUS_SISWA_BADGE[statusMurid] || STATUS_SISWA_BADGE.AKTIF;
  const statusText = muridInfo?.tahun_keluar
    ? `${statusBadge.label} (${muridInfo.tahun_keluar})`
    : statusBadge.label;

  const metaParts = [];
  if (muridInfo?.no_urut) metaParts.push(`No. Urut ${muridInfo.no_urut}`);
  if (muridInfo?.nama_kelas) metaParts.push(`Kelas ${muridInfo.nama_kelas}`);

  return (
    <Modal
      open={open}
      onClose={onClose}
      size="lg"
      title={`Riwayat Kehadiran: ${titleNama}`}
      description={
        metaParts.length > 0
          ? `${metaParts.join(' | ')} | ${statusText}`
          : `${statusText} | Rekapitulasi per Tahun Ajaran`
      }
      footer={
        <button type="button" onClick={onClose} className={btnSecondary}>
          Tutup
        </button>
      }
    >
      {loading && (
        <div className="flex flex-col items-center justify-center gap-3 py-12 text-center">
          <Spinner className="h-7 w-7 text-[#0a4ea0]" />
          <p className="text-sm font-semibold text-slate-600">
            Memuat riwayat kehadiran {titleNama}...
          </p>
        </div>
      )}

      {!loading && error && (
        <div role="alert" className="rounded-xl border border-rose-200 bg-rose-50/50 p-6 text-center">
          <p className="font-bold text-slate-900">Riwayat belum bisa ditampilkan</p>
          <p className="mx-auto mt-1 max-w-md text-sm text-slate-600">{error}</p>
          <button
            type="button"
            onClick={() => setReloadTick((t) => t + 1)}
            className={`${btnPrimary} mt-4`}
          >
            Coba Muat Ulang
          </button>
        </div>
      )}

      {!loading && !error && historyData && (
        <div className="space-y-5">
          {/* Bar Pilihan Tahun Ajaran & Ringkasan Tahunan */}
          <div className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3.5 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-wrap items-center gap-2.5">
              <label
                htmlFor="select-tahun-ajaran"
                className="text-xs font-bold uppercase tracking-wider text-slate-700"
              >
                Tahun Ajaran
              </label>
              {availableTA.length > 0 ? (
                <select
                  id="select-tahun-ajaran"
                  value={activeTA}
                  onChange={(e) => setSelectedTA(e.target.value)}
                  className="min-h-11 cursor-pointer rounded-lg border border-slate-300 bg-white px-3 text-sm font-bold text-slate-900 focus:border-[#098fd1] focus:outline-none focus:ring-4 focus:ring-[#098fd1]/15"
                >
                  {availableTA.map((ta) => (
                    <option key={ta} value={ta}>
                      TA {ta}
                    </option>
                  ))}
                </select>
              ) : (
                <span className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-bold text-slate-700">
                  TA {activeTA}
                </span>
              )}
            </div>

            {tahunan && tahunan.total_aktif > 0 && (
              <div className="flex flex-wrap items-center gap-2 text-xs font-bold text-slate-700">
                <span>Total 1 Tahun Ajaran:</span>
                <span className="rounded-md bg-emerald-100 px-2 py-1 text-emerald-900">
                  {tahunan.rekap.H}H
                </span>
                <span className="rounded-md bg-amber-100 px-2 py-1 text-amber-900">
                  {tahunan.rekap.S}S
                </span>
                <span className="rounded-md bg-sky-100 px-2 py-1 text-sky-900">
                  {tahunan.rekap.I}I
                </span>
                <span className="rounded-md bg-rose-100 px-2 py-1 text-rose-900">
                  {tahunan.rekap.A}A
                </span>
                <span className="rounded-md bg-[#0a4ea0] px-2.5 py-1 text-white">
                  {tahunan.persentase_hadir}%
                </span>
              </div>
            )}
          </div>

          {availableTA.length === 0 ? (
            <div className="rounded-xl border border-slate-200 bg-white px-5 py-10 text-center">
              <p className="font-bold text-slate-900">Belum ada catatan presensi</p>
              <p className="mx-auto mt-1 max-w-md text-sm text-slate-600">
                Siswa ini belum memiliki rekaman absensi pada tahun ajaran mana pun. Catatan akan muncul otomatis setelah presensi harian disimpan.
              </p>
            </div>
          ) : (
            <>
              {/* 2 Kartu Ringkasan Semester */}
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <SemesterSummaryCard
                  semesterKey="ganjil"
                  info={ganjil}
                  active={semesterView === 'ganjil'}
                  onSelect={(k) => {
                    setSemesterView(k);
                    setExpandedMonthKey(null);
                  }}
                />
                <SemesterSummaryCard
                  semesterKey="genap"
                  info={genap}
                  active={semesterView === 'genap'}
                  onSelect={(k) => {
                    setSemesterView(k);
                    setExpandedMonthKey(null);
                  }}
                />
              </div>

              {/* Filter Tampilan Bulanan */}
              <div>
                <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                  <h3 className="text-sm font-bold text-slate-900">
                    Rincian Bulanan (TA {activeTA})
                  </h3>
                  <div
                    role="group"
                    aria-label="Filter semester rincian bulanan"
                    className="inline-flex rounded-lg border border-slate-200 bg-slate-100 p-0.5"
                  >
                    {[
                      { id: 'ganjil', label: 'Ganjil (Jul-Des)' },
                      { id: 'genap', label: 'Genap (Jan-Jun)' },
                      { id: 'semua', label: 'Setahun (12 Bln)' },
                    ].map((opt) => (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => {
                          setSemesterView(opt.id);
                          setExpandedMonthKey(null);
                        }}
                        className={`min-h-11 rounded-md px-3 text-xs font-bold transition-colors focus-visible:outline-2 focus-visible:outline-[#098fd1] cursor-pointer ${
                          semesterView === opt.id
                            ? 'bg-white text-[#0a4ea0] shadow-xs'
                            : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Tabel Rincian Per Bulan */}
                <div className="overflow-x-auto rounded-xl border border-slate-200">
                  <table className="w-full text-left text-xs sm:text-sm">
                    <thead className="border-b border-slate-200 bg-slate-50 text-slate-700">
                      <tr>
                        <th scope="col" className="px-3 py-2.5 font-bold sm:px-4">
                          Bulan
                        </th>
                        <th scope="col" className="px-2 py-2.5 text-center font-bold text-emerald-800">
                          H
                        </th>
                        <th scope="col" className="px-2 py-2.5 text-center font-bold text-amber-800">
                          S
                        </th>
                        <th scope="col" className="px-2 py-2.5 text-center font-bold text-sky-800">
                          I
                        </th>
                        <th scope="col" className="px-2 py-2.5 text-center font-bold text-rose-800">
                          A
                        </th>
                        <th scope="col" className="px-2 py-2.5 text-center font-bold text-slate-700">
                          %
                        </th>
                        <th scope="col" className="px-3 py-2.5 text-right font-bold sm:px-4">
                          Catatan
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 bg-white">
                      {displayedMonths.map((item) => {
                        const monthKey = `${item.tahun}-${item.bulan}`;
                        const absenList = item.detail_ketidakhadiran || [];
                        const hasDetail = absenList.length > 0;
                        const isExpanded = expandedMonthKey === monthKey;
                        const hasData = item.total_aktif > 0;

                        return (
                          <React.Fragment key={monthKey}>
                            <tr className="hover:bg-slate-50/70">
                              <td className="px-3 py-2.5 font-semibold text-slate-900 sm:px-4">
                                <span>{item.nama_bulan}</span>{' '}
                                <span className="text-xs font-medium text-slate-500">
                                  {item.tahun}
                                </span>
                              </td>
                              <td className="px-2 py-2.5 text-center font-mono font-bold tabular-nums text-emerald-800">
                                {hasData ? item.rekap.H : '-'}
                              </td>
                              <td className="px-2 py-2.5 text-center font-mono font-bold tabular-nums text-amber-800">
                                {hasData ? item.rekap.S : '-'}
                              </td>
                              <td className="px-2 py-2.5 text-center font-mono font-bold tabular-nums text-sky-800">
                                {hasData ? item.rekap.I : '-'}
                              </td>
                              <td className="px-2 py-2.5 text-center font-mono font-bold tabular-nums text-rose-800">
                                {hasData ? item.rekap.A : '-'}
                              </td>
                              <td className="px-2 py-2.5 text-center font-bold tabular-nums text-slate-800">
                                {item.persentase_hadir !== null ? `${item.persentase_hadir}%` : '-'}
                              </td>
                              <td className="px-3 py-1.5 text-right sm:px-4">
                                {hasDetail ? (
                                  <button
                                    type="button"
                                    aria-expanded={isExpanded}
                                    onClick={() =>
                                      setExpandedMonthKey((prev) =>
                                        prev === monthKey ? null : monthKey
                                      )
                                    }
                                    className="inline-flex min-h-11 items-center gap-1 rounded-lg border border-blue-200 bg-blue-50 px-3 text-xs font-bold text-[#0a4ea0] transition-colors hover:bg-blue-100 focus-visible:outline-2 focus-visible:outline-[#098fd1] cursor-pointer"
                                  >
                                    <span>{isExpanded ? 'Tutup' : `Detail (${absenList.length})`}</span>
                                    <svg
                                      className={`h-3.5 w-3.5 transition-transform ${
                                        isExpanded ? 'rotate-180' : ''
                                      }`}
                                      fill="none"
                                      stroke="currentColor"
                                      viewBox="0 0 24 24"
                                      aria-hidden="true"
                                    >
                                      <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth="2.5"
                                        d="M19 9l-7 7-7-7"
                                      />
                                    </svg>
                                  </button>
                                ) : (
                                  <span className="text-xs font-medium text-slate-500">
                                    {hasData ? 'Hadir penuh' : '-'}
                                  </span>
                                )}
                              </td>
                            </tr>

                            {hasDetail && isExpanded && (
                              <tr className="bg-slate-50/90">
                                <td colSpan={7} className="px-3 py-3 sm:px-4">
                                  <p className="mb-2 text-xs font-bold text-slate-700">
                                    Tanggal Ketidakhadiran ({item.nama_bulan} {item.tahun}):
                                  </p>
                                  <div className="flex flex-wrap gap-2">
                                    {absenList.map((d) => {
                                      const meta = STATUS_META[d.status] || {
                                        label: d.status,
                                        badgeClass: 'border-slate-300 bg-slate-100 text-slate-800',
                                      };
                                      return (
                                        <span
                                          key={d.tanggal}
                                          className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-xs font-semibold ${meta.badgeClass}`}
                                        >
                                          <span className="font-mono font-bold">
                                            {d.hari} {NAMA_BULAN_SINGKAT[(d.bulan || 1) - 1]} {d.tahun}
                                          </span>
                                          <span>: {meta.label}</span>
                                        </span>
                                      );
                                    })}
                                  </div>
                                </td>
                              </tr>
                            )}
                          </React.Fragment>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </Modal>
  );
}
