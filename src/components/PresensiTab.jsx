import React, { useEffect, useRef, useState } from 'react';
import { getAbsensi, saveAbsensiBatch, getErrorMessage } from '../services/api';
import { useToast } from '../context/ToastContext';
import { exportAbsensiToExcel } from '../utils/exportExcel';
import ControlBar from './ControlBar';
import KpiCards from './KpiCards';
import AbsensiGrid from './AbsensiGrid';
import StudentHistoryModal from './StudentHistoryModal';

const CONFIRM_DISCARD =
  'Ada perubahan presensi yang belum disimpan. Lanjutkan dan buang perubahan tersebut?';

export default function PresensiTab({
  guru,
  kelasList,
  selectedKelasId,
  onSelectKelas,
  rosterVersion,
  onUnsavedChange,
  onOpenSiswaTab,
}) {
  const notify = useToast();

  const [bulan, setBulan] = useState(() => new Date().getMonth() + 1);
  const [tahun, setTahun] = useState(() => new Date().getFullYear());

  const [dataAbsensi, setDataAbsensi] = useState({ total_hari: 31, data: [] });
  const [loading, setLoading] = useState(false);
  const [errorState, setErrorState] = useState(null);
  const [saving, setSaving] = useState(false);
  const [reloadTick, setReloadTick] = useState(0);
  const [historySiswa, setHistorySiswa] = useState(null);

  // Buffer perubahan belum disimpan: { "muridId_hari": "H"|"S"|"I"|"A"|null }
  const [stagedChanges, setStagedChanges] = useState({});
  const unsavedCount = Object.keys(stagedChanges).length;
  const prevRosterRef = useRef(rosterVersion);

  useEffect(() => {
    onUnsavedChange?.(unsavedCount);
  }, [unsavedCount, onUnsavedChange]);

  useEffect(() => {
    if (unsavedCount === 0) return undefined;
    const handler = (e) => {
      e.preventDefault();
      e.returnValue = '';
    };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [unsavedCount]);

  useEffect(() => {
    if (!selectedKelasId) return undefined;
    let active = true;
    const isRosterRefresh = prevRosterRef.current !== rosterVersion;
    prevRosterRef.current = rosterVersion;

    const load = async () => {
      setLoading(true);
      setErrorState(null);
      try {
        const res = await getAbsensi({ bulan, tahun, kelas_id: selectedKelasId });
        if (!active) return;
        if (res.data?.success) {
          setDataAbsensi(res.data);
          if (isRosterRefresh) {
            const ids = new Set((res.data.data || []).map((m) => String(m.murid_id)));
            setStagedChanges((prev) =>
              Object.fromEntries(
                Object.entries(prev).filter(([key]) => ids.has(key.split('_')[0]))
              )
            );
          } else {
            setStagedChanges({});
          }
        } else {
          setErrorState(res.data?.message || 'Lembar presensi tidak dapat dimuat.');
        }
      } catch (err) {
        if (!active) return;
        setErrorState(getErrorMessage(err, 'Lembar presensi tidak dapat dimuat.'));
      } finally {
        if (active) setLoading(false);
      }
    };

    load();
    return () => {
      active = false;
    };
  }, [selectedKelasId, bulan, tahun, rosterVersion, reloadTick]);

  const confirmDiscard = () => unsavedCount === 0 || window.confirm(CONFIRM_DISCARD);

  const handleSelectKelas = (id) => {
    if (confirmDiscard()) onSelectKelas(id);
  };

  const handleChangeBulan = (b, t) => {
    if (!confirmDiscard()) return;
    setBulan(b);
    setTahun(t);
  };

  const handleCellChange = (muridId, day, newStatus) => {
    setStagedChanges((prev) => ({ ...prev, [`${muridId}_${day}`]: newStatus }));
  };

  const handleSetAllPresent = (day) => {
    const updates = {};
    (dataAbsensi.data || []).forEach((m) => {
      updates[`${m.murid_id}_${day}`] = 'H';
    });
    setStagedChanges((prev) => ({ ...prev, ...updates }));
  };

  const totals = (() => {
    const t = { H: 0, S: 0, I: 0, A: 0 };
    const days = Array.from({ length: dataAbsensi.total_hari || 31 }, (_, i) => i + 1);
    (dataAbsensi.data || []).forEach((murid) => {
      days.forEach((day) => {
        const key = `${murid.murid_id}_${day}`;
        const st =
          stagedChanges[key] !== undefined ? stagedChanges[key] : murid.absensi?.[String(day)];
        if (t[st] !== undefined) t[st]++;
      });
    });
    return t;
  })();

  const handleSave = async () => {
    const rows = Object.entries(stagedChanges).map(([key, status]) => {
      const [muridId, day] = key.split('_');
      return {
        murid_id: Number(muridId),
        tanggal: `${tahun}-${String(bulan).padStart(2, '0')}-${String(day).padStart(2, '0')}`,
        status,
      };
    });
    if (rows.length === 0) return;

    setSaving(true);
    try {
      const res = await saveAbsensiBatch(rows);
      if (res.data?.success) {
        notify('success', `${res.data.count || rows.length} data presensi berhasil disimpan.`);
        setDataAbsensi((prev) => ({
          ...prev,
          data: (prev.data || []).map((m) => {
            const absensi = { ...m.absensi };
            Object.entries(stagedChanges).forEach(([k, st]) => {
              const [mId, d] = k.split('_');
              if (Number(mId) === m.murid_id) absensi[d] = st;
            });
            return { ...m, absensi };
          }),
        }));
        setStagedChanges({});
      } else {
        notify('error', res.data?.message || 'Presensi gagal disimpan.');
      }
    } catch (err) {
      notify(
        'error',
        getErrorMessage(err, 'Presensi gagal disimpan. Isian Anda masih tersimpan di layar, coba lagi.')
      );
    } finally {
      setSaving(false);
    }
  };

  const handleExportExcel = () => {
    const muridList = dataAbsensi.data || [];
    if (muridList.length === 0) {
      notify('error', 'Belum ada data siswa pada kelas ini untuk diekspor.');
      return;
    }

    const activeKelas = kelasList.find((k) => k.id === selectedKelasId);
    const namaKelas = activeKelas?.nama_kelas || guru?.nama_kelas || String(selectedKelasId || '');
    const rawWali = activeKelas?.wali_kelas;
    const waliKelas =
      (typeof rawWali === 'object' && rawWali !== null
        ? rawWali.nama_guru || rawWali.namaGuru
        : rawWali) ||
      activeKelas?.nama_wali_kelas ||
      (guru?.role === 'WALI_KELAS' ? guru?.nama_guru : '-');

    try {
      const filename = exportAbsensiToExcel({
        namaKelas,
        waliKelas,
        bulan,
        tahun,
        totalHari: dataAbsensi.total_hari || 31,
        dataMurid: muridList,
        stagedChanges,
      });
      notify('success', `File Excel berhasil diunduh: ${filename}`);
    } catch (err) {
      notify('error', getErrorMessage(err, 'Gagal mengekspor lembar presensi ke Excel.'));
    }
  };

  return (
    <div className="space-y-5">
      <ControlBar
        role={guru?.role}
        kelasList={kelasList}
        selectedKelasId={selectedKelasId}
        onSelectKelas={handleSelectKelas}
        bulan={bulan}
        tahun={tahun}
        onChangeBulan={handleChangeBulan}
        unsavedCount={unsavedCount}
        onSave={handleSave}
        saving={saving}
        onExportExcel={handleExportExcel}
        canExport={!loading && (dataAbsensi.data || []).length > 0}
      />

      <KpiCards
        totalHadir={totals.H}
        totalSakit={totals.S}
        totalIzin={totals.I}
        totalAlpa={totals.A}
      />

      {loading && (
        <div className="rounded-xl border border-blue-900/10 bg-white p-12 text-center shadow-[0_16px_42px_rgba(8,57,115,0.08)]">
          <div className="mb-3 inline-block h-8 w-8 animate-spin rounded-full border-4 border-[#0a4ea0] border-t-transparent" />
          <p className="text-sm font-semibold text-slate-600">Memuat lembar presensi siswa...</p>
        </div>
      )}

      {!loading && errorState && (
        <div
          role="alert"
          className="rounded-xl border border-rose-200 bg-white p-8 text-center shadow-[0_16px_42px_rgba(8,57,115,0.08)]"
        >
          <h3 className="text-base font-bold text-slate-800">
            Lembar presensi belum bisa ditampilkan
          </h3>
          <p className="mx-auto mt-1 max-w-md text-sm text-slate-600">{errorState}</p>
          <button
            type="button"
            onClick={() => setReloadTick((t) => t + 1)}
            className="mt-4 inline-flex min-h-11 items-center rounded-lg bg-[#0a4ea0] px-4 text-sm font-bold text-white hover:bg-[#098fd1] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#098fd1] cursor-pointer"
          >
            Muat Ulang Lembar Presensi
          </button>
        </div>
      )}

      {!loading && !errorState && (
        <AbsensiGrid
          bulan={bulan}
          tahun={tahun}
          totalHari={dataAbsensi.total_hari}
          dataMurid={dataAbsensi.data || []}
          stagedAbsensi={stagedChanges}
          onCellChange={handleCellChange}
          onSetAllPresentForDay={handleSetAllPresent}
          onOpenSiswaTab={onOpenSiswaTab}
          onSelectStudent={(murid) => {
            const activeKelas = kelasList.find((k) => k.id === selectedKelasId);
            setHistorySiswa({
              id: murid.murid_id,
              no_urut: murid.no_urut,
              nama_murid: murid.nama_murid,
              nama_kelas: activeKelas?.nama_kelas || guru?.nama_kelas || '',
            });
          }}
        />
      )}

      {historySiswa && (
        <StudentHistoryModal
          key={`history-${historySiswa.id}`}
          open
          siswa={historySiswa}
          onClose={() => setHistorySiswa(null)}
        />
      )}
    </div>
  );
}
