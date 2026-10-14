import React, { useCallback, useEffect, useRef, useState } from 'react';
import { getAbsensi, saveAbsensiBatch, getErrorMessage } from '../services/api';
import { useToast } from '../context/ToastContext';
import ControlBar from './ControlBar';
import KpiCards from './KpiCards';
import AbsensiGrid from './AbsensiGrid';

const CONFIRM_DISCARD = 'Ada perubahan presensi yang belum disimpan. Lanjutkan dan buang perubahan tersebut?';

export default function PresensiTab({ guru, kelasList, selectedKelasId, onSelectKelas, rosterVersion, onUnsavedChange }) {
  const notify = useToast();

  const today = new Date();
  const [bulan, setBulan] = useState(today.getMonth() + 1);
  const [tahun, setTahun] = useState(today.getFullYear());

  const [dataAbsensi, setDataAbsensi] = useState({ total_hari: 31, data: [] });
  const [loading, setLoading] = useState(false);
  const [errorState, setErrorState] = useState(null);
  const [saving, setSaving] = useState(false);

  // Buffer perubahan belum disimpan: { "muridId_hari": "H"|"S"|"I"|"A"|null }
  const [stagedChanges, setStagedChanges] = useState({});
  const unsavedCount = Object.keys(stagedChanges).length;

  useEffect(() => {
    onUnsavedChange?.(unsavedCount);
  }, [unsavedCount, onUnsavedChange]);

  // Peringatan browser bila guru menutup tab dengan perubahan yang belum disimpan
  useEffect(() => {
    if (unsavedCount === 0) return undefined;
    const handler = (e) => {
      e.preventDefault();
      e.returnValue = '';
    };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [unsavedCount]);

  const fetchAbsensi = useCallback(
    async ({ keepStaged = false } = {}) => {
      if (!selectedKelasId) return;
      setLoading(true);
      setErrorState(null);
      try {
        const res = await getAbsensi({ bulan, tahun, kelas_id: selectedKelasId });
        if (res.data?.success) {
          setDataAbsensi(res.data);
          if (keepStaged) {
            // Data siswa berubah dari tab lain: pertahankan isian guru untuk siswa yang masih ada
            const ids = new Set((res.data.data || []).map((m) => String(m.murid_id)));
            setStagedChanges((prev) =>
              Object.fromEntries(Object.entries(prev).filter(([key]) => ids.has(key.split('_')[0])))
            );
          } else {
            setStagedChanges({});
          }
        } else {
          setErrorState(res.data?.message || 'Lembar presensi tidak dapat dimuat.');
        }
      } catch (err) {
        setErrorState(getErrorMessage(err, 'Lembar presensi tidak dapat dimuat.'));
      } finally {
        setLoading(false);
      }
    },
    [selectedKelasId, bulan, tahun]
  );

  useEffect(() => {
    fetchAbsensi();
  }, [fetchAbsensi]);

  // Muat ulang tanpa membuang isian saat daftar siswa ditambah/diubah/dihapus di tab Data Siswa
  const firstRoster = useRef(true);
  useEffect(() => {
    if (firstRoster.current) {
      firstRoster.current = false;
      return;
    }
    fetchAbsensi({ keepStaged: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rosterVersion]);

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
        const st = stagedChanges[key] !== undefined ? stagedChanges[key] : murid.absensi?.[String(day)];
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
        notify('success', `${res.data.count || rows.length} isian presensi tersimpan.`);
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
      notify('error', getErrorMessage(err, 'Presensi gagal disimpan. Isian Anda masih ada, coba simpan lagi.'));
    } finally {
      setSaving(false);
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
      />

      <KpiCards totalHadir={totals.H} totalSakit={totals.S} totalIzin={totals.I} totalAlpa={totals.A} />

      {loading && (
        <div className="rounded-xl border border-blue-900/10 bg-white p-12 text-center">
          <div className="mb-3 inline-block h-8 w-8 animate-spin rounded-full border-4 border-[#0a4ea0] border-t-transparent" />
          <p className="text-sm font-semibold text-slate-600">Memuat lembar presensi siswa...</p>
        </div>
      )}

      {!loading && errorState && (
        <div role="alert" className="rounded-xl border border-rose-200 bg-white p-8 text-center">
          <h3 className="text-base font-bold text-slate-800">Lembar presensi belum bisa ditampilkan</h3>
          <p className="mx-auto mt-1 max-w-md text-sm text-slate-600">{errorState}</p>
          <button
            type="button"
            onClick={() => fetchAbsensi()}
            className="mt-4 inline-flex min-h-11 items-center rounded-lg bg-[#0a4ea0] px-4 text-sm font-bold text-white hover:bg-[#098fd1] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#098fd1] cursor-pointer"
          >
            Muat ulang lembar presensi
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
        />
      )}
    </div>
  );
}

