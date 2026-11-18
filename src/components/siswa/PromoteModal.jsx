import React, { useEffect, useMemo, useState } from 'react';
import Modal, { btnPrimary, btnSecondary, inputBase, Spinner } from '../Modal';
import { getMurid, promoteMurid, getErrorMessage } from '../../services/api';

const getDefaultTA = () => {
  const now = new Date();
  const y = now.getFullYear();
  const start = now.getMonth() + 1 >= 7 ? y : y - 1;
  return `${start}/${start + 1}`;
};

export default function PromoteModal({
  open,
  kelasList = [],
  initialSourceKelasId,
  onClose,
  onPromoted,
}) {
  const [sourceKelasId, setSourceKelasId] = useState(
    () => initialSourceKelasId || kelasList[0]?.id || ''
  );
  const [aksi, setAksi] = useState('NAIK_KELAS');
  const [targetKelasId, setTargetKelasId] = useState('');
  const [tahunAjaranBaru, setTahunAjaranBaru] = useState(getDefaultTA);
  const [tahunKeluar, setTahunKeluar] = useState(getDefaultTA);
  const [filterTA, setFilterTA] = useState('ALL');

  const [students, setStudents] = useState([]);
  const [selectedIds, setSelectedIds] = useState([]);
  const [loadingList, setLoadingList] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  // Muat daftar siswa aktif pada kelas asal
  useEffect(() => {
    if (!open || !sourceKelasId) return undefined;
    let active = true;

    const load = async () => {
      setLoadingList(true);
      setError('');
      try {
        const res = await getMurid(sourceKelasId, undefined, 'AKTIF');
        if (!active) return;
        const list = res.data?.data || [];
        setStudents(list);
        setFilterTA('ALL');
        setSelectedIds(list.map((s) => s.id));
      } catch (err) {
        if (!active) return;
        setError(getErrorMessage(err, 'Gagal memuat daftar siswa kelas asal.'));
      } finally {
        if (active) setLoadingList(false);
      }
    };

    load();
    return () => {
      active = false;
    };
  }, [open, sourceKelasId]);

  const availableSourceTAs = useMemo(() => {
    const set = new Set();
    students.forEach((s) => {
      if (s.tahun_ajaran_aktif) set.add(s.tahun_ajaran_aktif);
    });
    return Array.from(set).sort((a, b) => b.localeCompare(a));
  }, [students]);

  const filteredStudents = useMemo(() => {
    if (filterTA === 'ALL') return students;
    return students.filter((s) => s.tahun_ajaran_aktif === filterTA);
  }, [students, filterTA]);

  const destOptions = kelasList.filter((k) => k.id !== Number(sourceKelasId));
  const destKelasObj = kelasList.find((k) => k.id === Number(targetKelasId));

  const toggleStudent = (id) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleSelectAllVisible = () => {
    const visibleIds = filteredStudents.map((s) => s.id);
    setSelectedIds((prev) => Array.from(new Set([...prev, ...visibleIds])));
  };

  const handleClearVisible = () => {
    const visibleSet = new Set(filteredStudents.map((s) => s.id));
    setSelectedIds((prev) => prev.filter((id) => !visibleSet.has(id)));
  };

  const selectedVisibleCount = filteredStudents.filter((s) => selectedIds.includes(s.id)).length;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const targetIds = filteredStudents
      .filter((s) => selectedIds.includes(s.id))
      .map((s) => s.id);

    if (targetIds.length === 0) {
      setError('Pilih minimal 1 siswa untuk diproses.');
      return;
    }

    if (aksi === 'NAIK_KELAS') {
      if (!targetKelasId) {
        setError('Pilih kelas tujuan kenaikan kelas.');
        return;
      }
      if (!/^\d{4}\s*\/\s*\d{4}$/.test(tahunAjaranBaru.trim())) {
        setError('Format Tahun Ajaran baru harus YYYY/YYYY (contoh: 2026/2027).');
        return;
      }
    }

    setBusy(true);
    try {
      const payload =
        aksi === 'LULUS'
          ? {
              murid_ids: targetIds,
              aksi: 'LULUS',
              tahun_keluar: tahunKeluar.trim() || undefined,
            }
          : {
              murid_ids: targetIds,
              aksi: 'NAIK_KELAS',
              target_kelas_id: Number(targetKelasId),
              tahun_ajaran_baru: tahunAjaranBaru.trim(),
            };

      const res = await promoteMurid(payload);
      if (res.data?.success) {
        onPromoted(res.data.message || 'Proses kenaikan kelas berhasil.');
      } else {
        setError(res.data?.message || 'Gagal memproses kenaikan kelas.');
      }
    } catch (err) {
      setError(getErrorMessage(err, 'Gagal memproses kenaikan kelas.'));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      busy={busy}
      size="lg"
      title="Kenaikan Kelas & Kelulusan Massal"
      description="Pindahkan siswa ke kelas tingkat berikutnya atau luluskan menjadi alumni tanpa menghapus riwayat absensi lama."
      footer={
        <>
          <button type="button" onClick={onClose} disabled={busy} className={btnSecondary}>
            Batal
          </button>
          <button
            type="submit"
            form="form-promote"
            disabled={busy || loadingList || selectedVisibleCount === 0}
            className={btnPrimary}
          >
            {busy && <Spinner />}
            {busy
              ? 'Memproses...'
              : aksi === 'LULUS'
                ? `Luluskan ${selectedVisibleCount} Siswa`
                : `Naikkan ${selectedVisibleCount} Siswa`}
          </button>
        </>
      }
    >
      <form id="form-promote" onSubmit={handleSubmit} noValidate className="space-y-4">
        {error && (
          <p
            role="alert"
            className="rounded-lg border border-rose-200 bg-rose-50 px-3.5 py-2.5 text-sm font-medium text-rose-800"
          >
            {error}
          </p>
        )}

        {/* Pengaturan Kelas Asal & Tujuan */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label
              htmlFor="promote-source"
              className="mb-1.5 block text-sm font-semibold text-slate-800"
            >
              1. Pilih Kelas Asal
            </label>
            <select
              id="promote-source"
              value={sourceKelasId}
              onChange={(e) => {
                setSourceKelasId(Number(e.target.value));
                setTargetKelasId('');
              }}
              className={inputBase}
            >
              {kelasList.map((k) => (
                <option key={k.id} value={k.id}>
                  Kelas {k.nama_kelas} ({k.jumlah_murid || 0} siswa)
                </option>
              ))}
            </select>
          </div>

          <div>
            <span className="mb-1.5 block text-sm font-semibold text-slate-800">
              2. Pilih Tujuan Proses
            </span>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setAksi('NAIK_KELAS')}
                className={`min-h-11 rounded-lg border px-3 text-xs font-bold transition-colors focus-visible:outline-2 focus-visible:outline-[#098fd1] cursor-pointer sm:text-sm ${
                  aksi === 'NAIK_KELAS'
                    ? 'border-[#0a4ea0] bg-blue-50 text-[#0a4ea0] ring-2 ring-[#098fd1]/20'
                    : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-50'
                }`}
              >
                Naik Kelas
              </button>
              <button
                type="button"
                onClick={() => setAksi('LULUS')}
                className={`min-h-11 rounded-lg border px-3 text-xs font-bold transition-colors focus-visible:outline-2 focus-visible:outline-[#098fd1] cursor-pointer sm:text-sm ${
                  aksi === 'LULUS'
                    ? 'border-amber-500 bg-amber-50 text-amber-900 ring-2 ring-amber-400/25'
                    : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-50'
                }`}
              >
                Lulus / Alumni
              </button>
            </div>
          </div>
        </div>

        {aksi === 'NAIK_KELAS' ? (
          <div className="space-y-3 rounded-xl border border-slate-200 bg-slate-50/70 p-3.5">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <label
                  htmlFor="promote-target"
                  className="mb-1 block text-xs font-bold text-slate-800"
                >
                  Kelas Tujuan
                </label>
                <select
                  id="promote-target"
                  value={targetKelasId}
                  onChange={(e) => setTargetKelasId(e.target.value)}
                  className={inputBase}
                >
                  <option value="">Pilih Kelas Tujuan</option>
                  {destOptions.map((k) => (
                    <option key={k.id} value={k.id}>
                      Kelas {k.nama_kelas} ({k.jumlah_murid || 0} siswa)
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label
                  htmlFor="promote-ta-baru"
                  className="mb-1 block text-xs font-bold text-slate-800"
                >
                  Tahun Ajaran Baru
                </label>
                <input
                  id="promote-ta-baru"
                  type="text"
                  value={tahunAjaranBaru}
                  onChange={(e) => setTahunAjaranBaru(e.target.value)}
                  placeholder="2026/2027"
                  className={inputBase}
                />
              </div>
            </div>

            {destKelasObj && (destKelasObj.jumlah_murid || 0) > 0 && (
              <p className="rounded-lg border border-amber-300 bg-amber-50 px-3 py-2 text-xs font-medium text-amber-900">
                Perhatian: Kelas {destKelasObj.nama_kelas} saat ini masih memiliki{' '}
                <strong>{destKelasObj.jumlah_murid} siswa aktif</strong>. Jika itu siswa angkatan sebelumnya, Anda tetap dapat membedakannya dari label Tahun Ajaran masing-masing siswa.
              </p>
            )}

            <p className="text-xs text-slate-600">
              Nomor urut absen seluruh siswa di kelas tujuan akan otomatis diurutkan ulang berdasarkan abjad nama.
            </p>
          </div>
        ) : (
          <div className="rounded-xl border border-amber-200 bg-amber-50/50 p-3.5">
            <label
              htmlFor="promote-tahun-lulus"
              className="mb-1 block text-xs font-bold text-slate-800"
            >
              Tahun Kelulusan (Opsional)
            </label>
            <input
              id="promote-tahun-lulus"
              type="text"
              value={tahunKeluar}
              onChange={(e) => setTahunKeluar(e.target.value)}
              placeholder="Contoh: 2026/2027"
              className={`${inputBase} max-w-xs`}
            />
            <p className="mt-1.5 text-xs text-slate-600">
              Siswa terpilih akan masuk ke arsip Alumni & Mutasi Keluar dan riwayat absensinya tetap tersimpan.
            </p>
          </div>
        )}

        {/* Daftar Checklist Siswa */}
        <div className="rounded-xl border border-slate-200 bg-white">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 px-3.5 py-2.5">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-bold text-slate-800">
                Daftar Siswa ({selectedVisibleCount} dari {filteredStudents.length} dipilih)
              </span>
              {availableSourceTAs.length > 1 && (
                <select
                  aria-label="Filter angkatan tahun ajaran"
                  value={filterTA}
                  onChange={(e) => setFilterTA(e.target.value)}
                  className="min-h-11 rounded-lg border border-slate-300 bg-white px-2.5 text-xs font-bold text-slate-800 focus:border-[#098fd1] focus:outline-none"
                >
                  <option value="ALL">Semua Tahun Ajaran</option>
                  {availableSourceTAs.map((ta) => (
                    <option key={ta} value={ta}>
                      TA {ta}
                    </option>
                  ))}
                </select>
              )}
            </div>

            {filteredStudents.length > 0 && (
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={handleSelectAllVisible}
                  className="min-h-11 rounded-md px-2.5 text-xs font-bold text-[#0a4ea0] hover:bg-blue-50 cursor-pointer"
                >
                  Pilih Semua
                </button>
                <button
                  type="button"
                  onClick={handleClearVisible}
                  className="min-h-11 rounded-md px-2.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 cursor-pointer"
                >
                  Kosongkan
                </button>
              </div>
            )}
          </div>

          {loadingList ? (
            <div className="flex items-center justify-center gap-2 py-8 text-sm text-slate-600">
              <Spinner className="h-4 w-4 text-[#0a4ea0]" />
              <span>Memuat daftar siswa...</span>
            </div>
          ) : filteredStudents.length === 0 ? (
            <p className="py-8 text-center text-sm text-slate-600">
              Tidak ada siswa aktif di kelas ini.
            </p>
          ) : (
            <div className="max-h-60 divide-y divide-slate-100 overflow-y-auto">
              {filteredStudents.map((s) => {
                const checked = selectedIds.includes(s.id);
                return (
                  <label
                    key={s.id}
                    className={`flex min-h-11 cursor-pointer items-center justify-between gap-3 px-3.5 py-2 transition-colors hover:bg-blue-50/40 ${
                      checked ? 'bg-blue-50/25' : ''
                    }`}
                  >
                    <span className="flex min-w-0 items-center gap-3">
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => toggleStudent(s.id)}
                        className="h-4 w-4 shrink-0 accent-[#0a4ea0]"
                      />
                      <span className="w-7 shrink-0 font-mono text-xs font-bold text-slate-500">
                        {s.no_urut}.
                      </span>
                      <span className="truncate text-sm font-semibold text-slate-900">
                        {s.nama_murid}
                      </span>
                    </span>
                    {s.tahun_ajaran_aktif && (
                      <span className="shrink-0 rounded-md border border-slate-200 bg-slate-100 px-2 py-0.5 text-[11px] font-bold text-slate-700">
                        TA {s.tahun_ajaran_aktif}
                      </span>
                    )}
                  </label>
                );
              })}
            </div>
          )}
        </div>
      </form>
    </Modal>
  );
}
