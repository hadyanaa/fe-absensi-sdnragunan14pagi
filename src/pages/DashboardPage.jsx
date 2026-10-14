import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import Topbar from '../components/Topbar';
import ControlBar from '../components/ControlBar';
import KpiCards from '../components/KpiCards';
import AbsensiGrid from '../components/AbsensiGrid';

export default function DashboardPage() {
  const { guru } = useAuth();

  // Periode default: bulan dan tahun saat ini
  const today = new Date();
  const [bulan, setBulan] = useState(today.getMonth() + 1);
  const [tahun, setTahun] = useState(today.getFullYear());

  // Kelas yang dipilih
  const [selectedKelasId, setSelectedKelasId] = useState(guru?.kelas_id || null);
  const [kelasList, setKelasList] = useState([]);

  // Data absensi dari server
  const [dataAbsensi, setDataAbsensi] = useState({
    total_hari: 31,
    data: [],
  });
  const [loading, setLoading] = useState(false);
  const [errorState, setErrorState] = useState(null);

  // Buffer perubahan belum disimpan: { "muridId_hari": "H"|"S"|"I"|"A"|null }
  const [stagedChanges, setStagedChanges] = useState({});
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState(null);

  // 1. Ambil daftar kelas
  useEffect(() => {
    let isMounted = true;
    const fetchKelas = async () => {
      try {
        const res = await api.get('/absensi/daftar-kelas');
        if (res.data?.success && isMounted) {
          const list = res.data.data || [];
          setKelasList(list);

          // Jika role WALI_KELAS tapi selectedKelasId belum terset, gunakan kelas guru
          if (guru?.role === 'WALI_KELAS' && guru?.kelas_id) {
            setSelectedKelasId(guru.kelas_id);
          } else if (!selectedKelasId && list.length > 0) {
            setSelectedKelasId(list[0].id);
          }
        }
      } catch (err) {
        console.error('Gagal mengambil daftar kelas:', err);
      }
    };

    fetchKelas();
    return () => {
      isMounted = false;
    };
  }, [guru]);

  // 2. Ambil data absensi berdasarkan filter
  const fetchAbsensi = useCallback(async () => {
    if (!selectedKelasId) return;

    setLoading(true);
    setErrorState(null);
    try {
      const res = await api.get('/absensi', {
        params: {
          bulan,
          tahun,
          kelas_id: selectedKelasId,
        },
      });

      if (res.data?.success) {
        setDataAbsensi(res.data);
        setStagedChanges({});
      } else {
        setErrorState(res.data?.message || 'Gagal memuat lembar absensi.');
      }
    } catch (err) {
      setErrorState(err.response?.data?.message || 'Gagal terhubung ke API absensi.');
    } finally {
      setLoading(false);
    }
  }, [selectedKelasId, bulan, tahun]);

  useEffect(() => {
    fetchAbsensi();
  }, [fetchAbsensi]);

  // Perubahan cell lokal
  const handleCellChange = (muridId, day, newStatus) => {
    setStagedChanges((prev) => ({
      ...prev,
      [`${muridId}_${day}`]: newStatus,
    }));
  };

  // Tandai semua hadir pada hari tertentu
  const handleSetAllPresent = (day) => {
    const updates = {};
    (dataAbsensi.data || []).forEach((m) => {
      updates[`${m.murid_id}_${day}`] = 'H';
    });
    setStagedChanges((prev) => ({ ...prev, ...updates }));
  };

  // Hitung total KPI (rekapitulasi seluruh kelas)
  const calculateTotals = () => {
    let H = 0, S = 0, I = 0, A = 0;
    const totalDays = dataAbsensi.total_hari || 31;
    const days = Array.from({ length: totalDays }, (_, i) => i + 1);

    (dataAbsensi.data || []).forEach((murid) => {
      days.forEach((day) => {
        const key = `${murid.murid_id}_${day}`;
        const st = stagedChanges[key] !== undefined ? stagedChanges[key] : murid.absensi?.[String(day)];
        if (st === 'H') H++;
        else if (st === 'S') S++;
        else if (st === 'I') I++;
        else if (st === 'A') A++;
      });
    });

    return { H, S, I, A };
  };

  // Simpan Batch ke POST /absensi
  const handleSave = async () => {
    const changesArray = [];
    Object.entries(stagedChanges).forEach(([key, status]) => {
      const [muridId, day] = key.split('_');
      const formattedDate = `${tahun}-${String(bulan).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      changesArray.push({
        murid_id: Number(muridId),
        tanggal: formattedDate,
        status: status,
      });
    });

    if (changesArray.length === 0) return;

    setSaving(true);
    try {
      const res = await api.post('/absensi', changesArray);
      if (res.data?.success) {
        setToast({
          type: 'success',
          message: `Berhasil menyimpan ${res.data.count || changesArray.length} data presensi.`,
        });

        // Update state lokal
        setDataAbsensi((prev) => {
          const updatedData = (prev.data || []).map((m) => {
            const updatedAbsensi = { ...m.absensi };
            Object.entries(stagedChanges).forEach(([k, st]) => {
              const [mId, d] = k.split('_');
              if (Number(mId) === m.murid_id) {
                updatedAbsensi[d] = st;
              }
            });
            return { ...m, absensi: updatedAbsensi };
          });
          return { ...prev, data: updatedData };
        });

        setStagedChanges({});
      } else {
        setToast({
          type: 'error',
          message: res.data?.message || 'Gagal menyimpan perubahan.',
        });
      }
    } catch (err) {
      setToast({
        type: 'error',
        message: err.response?.data?.message || 'Terjadi kesalahan saat menyimpan presensi.',
      });
    } finally {
      setSaving(false);
      setTimeout(() => setToast(null), 4000);
    }
  };

  const totals = calculateTotals();
  const unsavedCount = Object.keys(stagedChanges).length;

  return (
    <div className="min-h-screen bg-[#f9fafa] font-['Plus_Jakarta_Sans',sans-serif] text-slate-800 pb-16">
      <Topbar />

      <main className="max-w-[1540px] mx-auto px-4 sm:px-8 pt-6 space-y-6">
        {/* Toast Notifikasi Status */}
        {toast && (
          <div
            className={`fixed bottom-6 right-6 z-50 px-5 py-3.5 rounded-xl shadow-xl flex items-center gap-3 text-sm font-semibold transition-all ${
              toast.type === 'error'
                ? 'bg-rose-600 text-white'
                : 'bg-[#0a4ea0] text-white'
            }`}
          >
            {toast.type === 'error' ? (
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            ) : (
              <svg className="w-5 h-5 text-[#f5c542]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
              </svg>
            )}
            <span>{toast.message}</span>
          </div>
        )}

        {/* Bar Kontrol Kelas, Bulan & Tombol Simpan */}
        <ControlBar
          role={guru?.role}
          kelasList={kelasList}
          selectedKelasId={selectedKelasId}
          onSelectKelas={setSelectedKelasId}
          bulan={bulan}
          tahun={tahun}
          onChangeBulan={(b, t) => {
            setBulan(b);
            setTahun(t);
          }}
          unsavedCount={unsavedCount}
          onSave={handleSave}
          saving={saving}
        />

        {/* Kartu Ringkasan Kehadiran */}
        <KpiCards
          totalHadir={totals.H}
          totalSakit={totals.S}
          totalIzin={totals.I}
          totalAlpa={totals.A}
        />

        {/* State Loading */}
        {loading && (
          <div className="bg-white rounded-2xl border border-blue-900/10 p-16 text-center shadow-sm">
            <div className="inline-block animate-spin w-8 h-8 border-4 border-[#0a4ea0] border-t-transparent rounded-full mb-3" />
            <p className="text-sm font-semibold text-slate-500">Memuat lembar presensi siswa...</p>
          </div>
        )}

        {/* State Error */}
        {!loading && errorState && (
          <div className="bg-white rounded-2xl border border-rose-200 p-10 text-center shadow-sm">
            <div className="w-12 h-12 rounded-full bg-rose-50 text-rose-500 mx-auto flex items-center justify-center mb-3">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h3 className="text-base font-bold text-slate-800">Gagal Memuat Data</h3>
            <p className="text-sm text-slate-500 mt-1 max-w-md mx-auto">{errorState}</p>
            <button
              onClick={fetchAbsensi}
              className="mt-4 px-4 py-2 bg-[#0a4ea0] text-white text-xs font-bold rounded-xl hover:bg-[#083e80] transition-colors cursor-pointer"
            >
              Coba Muat Ulang
            </button>
          </div>
        )}

        {/* Matriks Grid Absensi */}
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
      </main>
    </div>
  );
}

