import React, { useEffect, useMemo, useState } from 'react';
import { getMurid, getErrorMessage } from '../../services/api';
import { useToast } from '../../context/ToastContext';
import { hitungUsia } from '../../utils/usia';
import { btnPrimary, Spinner } from '../Modal';
import SiswaFormModal from './SiswaFormModal';
import BulkImportModal from './BulkImportModal';
import DeleteSiswaDialog from './DeleteSiswaDialog';
import PromoteModal from './PromoteModal';
import StudentHistoryModal from '../StudentHistoryModal';

const IconPlus = () => (
  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 5v14M5 12h14" />
  </svg>
);

const IconImport = () => (
  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2"
      d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2M7 10l5 5m0 0l5-5m-5 5V3"
    />
  </svg>
);

const IconPencil = () => (
  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2"
      d="M15.232 5.232l3.536 3.536M4 20h4L18.5 9.5a2.5 2.5 0 00-3.536-3.536L4.5 16.5 4 20z"
    />
  </svg>
);

const IconTrash = () => (
  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2"
      d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6M9 7V4a1 1 0 011-1h4a1 1 0 011 1v3M4 7h16"
    />
  </svg>
);

const STATUS_BADGE = {
  AKTIF: {
    label: 'Aktif',
    cls: 'border-emerald-200 bg-emerald-50 text-emerald-800',
  },
  LULUS: {
    label: 'Lulus',
    cls: 'border-amber-300 bg-amber-50 text-amber-900',
  },
  MUTASI_KELUAR: {
    label: 'Mutasi Keluar',
    cls: 'border-slate-300 bg-slate-100 text-slate-800',
  },
};

export default function SiswaTab({
  guru,
  kelasList,
  selectedKelasId,
  onSelectKelas,
  onRosterChange,
}) {
  const notify = useToast();
  const isWali = guru?.role === 'WALI_KELAS';
  const isAdmin = guru?.role === 'ADMIN' || guru?.role === 'admin';
  const canEdit = isWali || isAdmin;
  const kelasId = isWali ? guru?.kelas_id : selectedKelasId;
  const namaKelas =
    kelasList.find((k) => k.id === kelasId)?.nama_kelas || guru?.nama_kelas || '';

  const [statusFilter, setStatusFilter] = useState('AKTIF');
  const [archiveAllClasses, setArchiveAllClasses] = useState(true);
  const [siswa, setSiswa] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [query, setQuery] = useState('');
  const [sortAsc, setSortAsc] = useState(true);
  const [reloadTick, setReloadTick] = useState(0);
  const [dialog, setDialog] = useState({ type: null, siswa: null });

  const isArchiveView = statusFilter === 'NONAKTIF';
  const effectiveKelasId = isArchiveView && !isWali && archiveAllClasses ? null : kelasId;

  useEffect(() => {
    if (!isArchiveView && !kelasId) return undefined;
    if (isArchiveView && isWali && !kelasId) return undefined;
    let active = true;

    const load = async () => {
      setLoading(true);
      setError('');
      try {
        const res = await getMurid(effectiveKelasId, undefined, statusFilter);
        if (!active) return;
        if (res.data?.success) {
          setSiswa(res.data.data || []);
        } else {
          setError(res.data?.message || 'Daftar siswa tidak dapat dimuat.');
        }
      } catch (err) {
        if (!active) return;
        setError(getErrorMessage(err, 'Daftar siswa tidak dapat dimuat.'));
      } finally {
        if (active) setLoading(false);
      }
    };

    load();
    return () => {
      active = false;
    };
  }, [effectiveKelasId, kelasId, statusFilter, isArchiveView, isWali, reloadTick]);

  const nextNoUrut = siswa.reduce((max, m) => Math.max(max, m.no_urut || 0), 0) + 1;

  const tampil = useMemo(() => {
    const q = query.trim().toLowerCase();
    const filtered = q
      ? siswa.filter((m) => m.nama_murid.toLowerCase().includes(q))
      : siswa;
    return [...filtered].sort((a, b) =>
      sortAsc ? a.no_urut - b.no_urut : b.no_urut - a.no_urut
    );
  }, [siswa, query, sortAsc]);

  const closeDialog = () => setDialog({ type: null, siswa: null });

  const handleMutated = (message) => {
    closeDialog();
    notify('success', message);
    setReloadTick((t) => t + 1);
    onRosterChange?.();
  };

  if ((!isArchiveView || isWali) && !kelasId) {
    return (
      <div className="rounded-xl border border-amber-200 bg-amber-50 p-6 text-sm text-amber-900">
        {isWali
          ? 'Akun Anda belum terhubung ke kelas mana pun. Hubungi operator sekolah agar kelas perwalian Anda didaftarkan.'
          : 'Pilih kelas terlebih dahulu untuk melihat daftar siswanya.'}
      </div>
    );
  }

  return (
    <section
      aria-labelledby="judul-siswa"
      className="rounded-xl border border-blue-900/10 bg-white shadow-[0_16px_42px_rgba(8,57,115,0.08)]"
    >
      {/* Header & Tombol Aksi */}
      <div className="space-y-4 border-b border-slate-100 p-4 sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex min-w-0 flex-wrap items-center gap-2.5">
            <h2 id="judul-siswa" className="text-lg font-bold text-slate-900 sm:text-xl">
              {isArchiveView
                ? isWali || !archiveAllClasses
                  ? `Arsip Alumni & Mutasi Kelas ${namaKelas}`
                  : 'Arsip Alumni & Mutasi Keluar (Semua Kelas)'
                : `Daftar Siswa Kelas ${namaKelas}`}
            </h2>
            {!loading && !error && (
              <span className="rounded-full border border-blue-200 bg-blue-50 px-3 py-0.5 text-xs font-bold text-[#0a4ea0]">
                {siswa.length} {isArchiveView ? 'Arsip Siswa' : 'Siswa Aktif'}
              </span>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Switch Siswa Aktif vs Arsip Alumni & Mutasi */}
            <div
              role="group"
              aria-label="Filter status keaktifan siswa"
              className="inline-flex rounded-xl border border-slate-200 bg-slate-100 p-0.5"
            >
              <button
                type="button"
                onClick={() => {
                  setQuery('');
                  setStatusFilter('AKTIF');
                }}
                className={`min-h-11 rounded-lg px-3.5 text-xs font-bold transition-colors focus-visible:outline-2 focus-visible:outline-[#098fd1] cursor-pointer sm:text-sm ${
                  !isArchiveView
                    ? 'bg-white text-[#0a4ea0] shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Siswa Aktif
              </button>
              <button
                type="button"
                onClick={() => {
                  setQuery('');
                  setStatusFilter('NONAKTIF');
                }}
                className={`min-h-11 rounded-lg px-3.5 text-xs font-bold transition-colors focus-visible:outline-2 focus-visible:outline-[#098fd1] cursor-pointer sm:text-sm ${
                  isArchiveView
                    ? 'bg-white text-[#0a4ea0] shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Alumni & Mutasi
              </button>
            </div>

            {!isWali && (
              <label className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                <span>Kelas:</span>
                <select
                  value={isArchiveView && archiveAllClasses ? 'ALL' : selectedKelasId || ''}
                  onChange={(e) => {
                    setQuery('');
                    const val = e.target.value;
                    if (val === 'ALL') {
                      setArchiveAllClasses(true);
                    } else {
                      setArchiveAllClasses(false);
                      onSelectKelas(Number(val));
                    }
                  }}
                  className="min-h-11 cursor-pointer rounded-lg border border-slate-300 bg-white px-3 text-sm font-bold text-slate-900 focus:border-[#098fd1] focus:outline-none focus:ring-4 focus:ring-[#098fd1]/15"
                >
                  {isArchiveView && <option value="ALL">Semua Kelas</option>}
                  {kelasList.map((k) => (
                    <option key={k.id} value={k.id}>
                      Kelas {k.nama_kelas} ({k.jumlah_murid || 0} Aktif)
                    </option>
                  ))}
                </select>
              </label>
            )}
          </div>
        </div>

        {!canEdit && (
          <p className="rounded-lg bg-slate-50 px-3.5 py-2.5 text-sm text-slate-600">
            Penambahan dan perubahan data siswa dilakukan oleh Wali Kelas atau Administrator.
          </p>
        )}

        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          {/* Kolom Pencarian Cepat */}
          <div className="relative md:max-w-sm md:flex-1">
            <label htmlFor="cari-siswa" className="sr-only">
              Cari nama siswa
            </label>
            <svg
              className="pointer-events-none absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-slate-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M21 21l-4.35-4.35M17 10.5a6.5 6.5 0 11-13 0 6.5 6.5 0 0113 0z"
              />
            </svg>
            <input
              id="cari-siswa"
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Cari nama siswa..."
              disabled={loading || Boolean(error)}
              className="min-h-11 w-full rounded-lg border border-slate-300 pr-3 pl-10 text-base text-slate-900 placeholder-slate-400 focus:border-[#098fd1] focus:outline-none focus:ring-4 focus:ring-[#098fd1]/15 disabled:bg-slate-50 sm:text-sm"
            />
          </div>

          {/* Tombol Aksi Utama (Khusus daftar Siswa Aktif) */}
          {canEdit && !isArchiveView && (
            <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
              {isAdmin && (
                <button
                  type="button"
                  onClick={() => setDialog({ type: 'promote', siswa: null })}
                  disabled={loading || Boolean(error)}
                  className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-amber-400 bg-amber-50 px-4 py-2 text-sm font-bold text-amber-950 transition-colors hover:bg-amber-100 disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-600 cursor-pointer"
                >
                  <svg className="h-4 w-4 text-amber-800" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 10l7-7m0 0l7 7m-7-7v18" />
                  </svg>
                  <span>Kenaikan Kelas</span>
                </button>
              )}
              <button
                type="button"
                onClick={() => setDialog({ type: 'create', siswa: null })}
                disabled={loading || Boolean(error)}
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-[#0a4ea0] px-4 py-2 text-sm font-bold text-white transition-colors hover:bg-[#098fd1] disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#098fd1] cursor-pointer"
              >
                <IconPlus />
                <span>+ Tambah 1 Siswa</span>
              </button>
              <button
                type="button"
                onClick={() => setDialog({ type: 'bulk', siswa: null })}
                disabled={loading || Boolean(error)}
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-bold text-white transition-colors hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600 cursor-pointer"
              >
                <IconImport />
                <span>Import Banyak Siswa (Bulk)</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Tabel Data Siswa / States */}
      {loading ? (
        <div className="flex items-center justify-center gap-3 px-6 py-14 text-sm font-semibold text-slate-600">
          <Spinner className="h-5 w-5 text-[#0a4ea0]" />
          <span>Memuat daftar siswa Kelas {namaKelas}...</span>
        </div>
      ) : error ? (
        <div role="alert" className="px-6 py-12 text-center">
          <p className="font-bold text-slate-800">Daftar siswa belum bisa ditampilkan</p>
          <p className="mx-auto mt-1 max-w-md text-sm text-slate-600">{error}</p>
          <button
            type="button"
            onClick={() => setReloadTick((t) => t + 1)}
            className={`${btnPrimary} mt-4`}
          >
            Muat Ulang Daftar Siswa
          </button>
        </div>
      ) : siswa.length === 0 ? (
        <div className="px-6 py-12 text-center">
          <p className="font-bold text-slate-800">
            {isArchiveView
              ? 'Belum ada data alumni atau mutasi keluar'
              : `Belum ada siswa aktif di Kelas ${namaKelas}`}
          </p>
          <p className="mx-auto mt-1 max-w-md text-sm text-slate-600">
            {isArchiveView
              ? isAdmin
                ? 'Siswa yang statusnya diubah menjadi Lulus / Alumni atau Mutasi Keluar melalui tombol Edit akan tercatat di sini beserta seluruh riwayat kehadirannya.'
                : 'Belum ada siswa berstatus Lulus atau Mutasi Keluar di kelas ini.'
              : canEdit
                ? 'Salin daftar nama siswa dari WhatsApp atau Excel, lalu gunakan tombol Import Banyak Siswa untuk menambahkan sekaligus.'
                : 'Wali kelas belum memasukkan data siswa untuk kelas ini.'}
          </p>
          {canEdit && !isArchiveView && (
            <button
              type="button"
              onClick={() => setDialog({ type: 'bulk', siswa: null })}
              className="mt-4 inline-flex min-h-11 items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-bold text-white hover:bg-emerald-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600 cursor-pointer"
            >
              <IconImport />
              <span>Import Banyak Siswa (Bulk)</span>
            </button>
          )}
        </div>
      ) : tampil.length === 0 ? (
        <div className="px-6 py-12 text-center">
          <p className="font-bold text-slate-800">
            Tidak ditemukan siswa dengan nama "{query.trim()}"
          </p>
          <p className="mt-1 text-sm text-slate-600">
            Periksa kembali ejaan nama atau kosongkan kolom pencarian.
          </p>
          <button
            type="button"
            onClick={() => setQuery('')}
            className="mt-4 inline-flex min-h-11 items-center rounded-lg border border-slate-300 px-4 text-sm font-semibold text-slate-700 hover:bg-slate-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#098fd1] cursor-pointer"
          >
            Tampilkan Semua Siswa
          </button>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <caption className="sr-only">Daftar siswa Kelas {namaKelas}</caption>
            <thead className="border-b border-slate-200 bg-slate-50 text-slate-700">
              <tr>
                <th
                  scope="col"
                  aria-sort={sortAsc ? 'ascending' : 'descending'}
                  className="w-24 px-2 py-1.5 sm:w-32 sm:px-4"
                >
                  <button
                    type="button"
                    onClick={() => setSortAsc((v) => !v)}
                    className="inline-flex min-h-11 items-center gap-1.5 rounded-md px-2 font-bold text-slate-700 hover:text-[#0a4ea0] focus-visible:outline-2 focus-visible:outline-[#098fd1] cursor-pointer"
                    aria-label={`Urutkan nomor urut ${sortAsc ? 'dari terbesar' : 'dari terkecil'}`}
                  >
                    <span>No. Urut</span>
                    <svg
                      className={`h-3.5 w-3.5 transition-transform ${sortAsc ? '' : 'rotate-180'}`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      aria-hidden="true"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2.5"
                        d="M5 15l7-7 7 7"
                      />
                    </svg>
                  </button>
                </th>
                <th scope="col" className="px-3 py-3 font-bold sm:px-4">
                  Nama Lengkap
                </th>
                <th scope="col" className="px-3 py-3 font-bold sm:px-4">
                  Jenis Kelamin
                </th>
                <th scope="col" className="px-3 py-3 font-bold sm:px-4">
                  Kelas
                </th>
                <th scope="col" className="px-3 py-3 font-bold sm:px-4">
                  Usia
                </th>
                <th scope="col" className="px-3 py-3 font-bold sm:px-4">
                  Status
                </th>
                {canEdit && (
                  <th scope="col" className="px-3 py-3 text-right font-bold sm:px-6">
                    Aksi
                  </th>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {tampil.map((m) => (
                <tr key={m.id} className="hover:bg-blue-50/40 transition-colors">
                  <td className="px-4 py-2.5 font-mono font-bold tabular-nums text-slate-700 sm:px-6">
                    {m.no_urut}
                  </td>
                  <td className="px-3 py-1.5 font-semibold break-words text-slate-900 sm:px-4">
                    <button
                      type="button"
                      onClick={() =>
                        setDialog({
                          type: 'history',
                          siswa: { ...m, nama_kelas: m.nama_kelas || namaKelas },
                        })
                      }
                      title={`Lihat riwayat kehadiran ${m.nama_murid} per tahun ajaran`}
                      aria-label={`Lihat riwayat kehadiran ${m.nama_murid}`}
                      className="group inline-flex min-h-11 items-center gap-2 rounded-lg px-1.5 py-1 text-left transition-colors hover:bg-blue-50 hover:text-[#0a4ea0] focus-visible:outline-2 focus-visible:outline-[#098fd1] cursor-pointer"
                    >
                      <span>{m.nama_murid}</span>
                      <svg
                        className="h-4 w-4 shrink-0 text-slate-400 transition-colors group-hover:text-[#0a4ea0]"
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
                  </td>
                  <td className="px-3 py-2.5 text-xs font-medium text-slate-700 sm:px-4 sm:text-sm">
                    {m.jenis_kelamin || <span className="text-slate-400">-</span>}
                  </td>
                  <td className="px-3 py-2.5 sm:px-4">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="inline-block rounded-full border border-sky-200 bg-sky-100 px-2.5 py-0.5 text-xs font-bold text-sky-800">
                        {m.nama_kelas || namaKelas}
                      </span>
                      {m.tahun_ajaran_aktif && !isArchiveView && (
                        <span className="inline-block rounded-md border border-slate-200 bg-slate-50 px-1.5 py-0.5 text-[11px] font-semibold text-slate-600">
                          {m.tahun_ajaran_aktif}
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-3 py-2.5 text-xs font-semibold tabular-nums text-slate-700 sm:px-4 sm:text-sm">
                    {(() => {
                      const usia = hitungUsia(m.tanggal_lahir);
                      return usia ? (
                        <span title={`Lahir: ${m.tanggal_lahir}`}>{usia.label}</span>
                      ) : (
                        <span className="font-normal text-slate-400">-</span>
                      );
                    })()}
                  </td>
                  <td className="px-3 py-2.5 sm:px-4">
                    {(() => {
                      const st = STATUS_BADGE[m.status || 'AKTIF'] || STATUS_BADGE.AKTIF;
                      return (
                        <span
                          className={`inline-block rounded-full border px-2.5 py-0.5 text-xs font-bold ${st.cls}`}
                        >
                          {m.tahun_keluar ? `${st.label} (${m.tahun_keluar})` : st.label}
                        </span>
                      );
                    })()}
                  </td>
                  {canEdit && (
                    <td className="px-3 py-1.5 sm:px-6">
                      <div className="flex justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => setDialog({ type: 'edit', siswa: m })}
                          aria-label={`Edit ${m.nama_murid}`}
                          title={`Edit ${m.nama_murid}`}
                          className="inline-flex min-h-11 min-w-11 items-center justify-center gap-1.5 rounded-lg px-2.5 text-sm font-semibold text-[#0a4ea0] hover:bg-blue-50 focus-visible:outline-2 focus-visible:outline-[#098fd1] cursor-pointer"
                        >
                          <IconPencil />
                          <span className="hidden sm:inline">Edit</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setDialog({ type: 'delete', siswa: m })}
                          aria-label={`Hapus ${m.nama_murid}`}
                          title={`Hapus ${m.nama_murid}`}
                          className="inline-flex min-h-11 min-w-11 items-center justify-center gap-1.5 rounded-lg px-2.5 text-sm font-semibold text-red-700 hover:bg-red-50 focus-visible:outline-2 focus-visible:outline-red-600 cursor-pointer"
                        >
                          <IconTrash />
                          <span className="hidden sm:inline">Hapus</span>
                        </button>
                      </div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal Tambah / Edit 1 Siswa */}
      {(dialog.type === 'create' || dialog.type === 'edit') && (
        <SiswaFormModal
          key={`${dialog.type}-${dialog.siswa?.id || 'new'}`}
          open
          mode={dialog.type}
          siswa={dialog.siswa}
          kelasId={dialog.siswa?.kelas_id || kelasId}
          namaKelas={dialog.siswa?.nama_kelas || namaKelas}
          kelasList={kelasList}
          daftarSiswa={siswa}
          nextNoUrut={nextNoUrut}
          isAdmin={isAdmin}
          onClose={closeDialog}
          onSaved={handleMutated}
        />
      )}

      {/* Modal Kenaikan Kelas & Kelulusan Massal (Admin) */}
      {dialog.type === 'promote' && (
        <PromoteModal
          key={`promote-${kelasId}`}
          open
          kelasList={kelasList}
          initialSourceKelasId={kelasId}
          onClose={closeDialog}
          onPromoted={handleMutated}
        />
      )}

      {/* Modal Import Banyak Siswa (Bulk) */}
      {dialog.type === 'bulk' && (
        <BulkImportModal
          key={`bulk-${kelasId}`}
          open
          kelasId={kelasId}
          namaKelas={namaKelas}
          daftarSiswa={siswa}
          nextNoUrut={nextNoUrut}
          onClose={closeDialog}
          onSaved={handleMutated}
        />
      )}

      {/* Dialog Konfirmasi Hapus Siswa */}
      {dialog.type === 'delete' && (
        <DeleteSiswaDialog
          key={`delete-${dialog.siswa?.id}`}
          open
          siswa={dialog.siswa}
          onClose={closeDialog}
          onDeleted={handleMutated}
        />
      )}

      {/* Popup Card Riwayat Kehadiran Siswa Per Tahun Ajaran */}
      {dialog.type === 'history' && (
        <StudentHistoryModal
          key={`history-${dialog.siswa?.id}`}
          open
          siswa={dialog.siswa}
          onClose={closeDialog}
        />
      )}
    </section>
  );
}
