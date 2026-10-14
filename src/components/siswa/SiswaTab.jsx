import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { getMurid, getErrorMessage } from '../../services/api';
import { useToast } from '../../context/ToastContext';
import { btnPrimary, Spinner } from '../Modal';
import SiswaFormModal from './SiswaFormModal';
import BulkImportModal from './BulkImportModal';
import DeleteSiswaDialog from './DeleteSiswaDialog';

const IconPlus = () => (
  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 5v14M5 12h14" />
  </svg>
);
// Papan klip: menggambarkan "tempel daftar yang sudah disalin"
const IconPaste = () => (
  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 7h6m-6 4h4" />
  </svg>
);
const IconPencil = () => (
  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536M4 20h4L18.5 9.5a2.5 2.5 0 00-3.536-3.536L4.5 16.5 4 20z" />
  </svg>
);
const IconTrash = () => (
  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6M9 7V4a1 1 0 011-1h4a1 1 0 011 1v3M4 7h16" />
  </svg>
);

export default function SiswaTab({ guru, kelasList, selectedKelasId, onSelectKelas, onRosterChange }) {
  const notify = useToast();
  const canEdit = guru?.role === 'WALI_KELAS';
  const kelasId = canEdit ? guru?.kelas_id : selectedKelasId;
  const namaKelas = kelasList.find((k) => k.id === kelasId)?.nama_kelas || guru?.nama_kelas || '';

  const [siswa, setSiswa] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [query, setQuery] = useState('');
  const [sortAsc, setSortAsc] = useState(true);
  const [dialog, setDialog] = useState({ type: null, siswa: null });

  const fetchSiswa = useCallback(async () => {
    if (!kelasId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError('');
    try {
      const res = await getMurid(kelasId);
      if (res.data?.success) setSiswa(res.data.data || []);
      else setError(res.data?.message || 'Daftar siswa tidak dapat dimuat.');
    } catch (err) {
      setError(getErrorMessage(err, 'Daftar siswa tidak dapat dimuat.'));
    } finally {
      setLoading(false);
    }
  }, [kelasId]);

  useEffect(() => {
    fetchSiswa();
    setQuery('');
  }, [fetchSiswa]);

  const nextNoUrut = siswa.reduce((max, m) => Math.max(max, m.no_urut || 0), 0) + 1;

  // Pencarian langsung di data yang sudah dimuat: tidak ada jeda jaringan saat mengetik
  const tampil = useMemo(() => {
    const q = query.trim().toLowerCase();
    const filtered = q ? siswa.filter((m) => m.nama_murid.toLowerCase().includes(q)) : siswa;
    return [...filtered].sort((a, b) => (sortAsc ? a.no_urut - b.no_urut : b.no_urut - a.no_urut));
  }, [siswa, query, sortAsc]);

  const closeDialog = () => setDialog({ type: null, siswa: null });

  const handleMutated = (message) => {
    closeDialog();
    notify('success', message);
    fetchSiswa();
    onRosterChange?.();
  };

  // ---------- Kelas belum terhubung ----------
  if (!kelasId) {
    return (
      <div className="rounded-xl border border-amber-200 bg-amber-50 p-6 text-sm text-amber-900">
        {canEdit
          ? 'Akun Anda belum terhubung ke kelas mana pun. Hubungi operator sekolah agar kelas perwalian Anda didaftarkan.'
          : 'Pilih kelas untuk melihat daftar siswanya.'}
      </div>
    );
  }

  return (
    <section
      aria-labelledby="judul-siswa"
      className="rounded-xl border border-blue-900/10 bg-white shadow-[0_16px_42px_rgba(8,57,115,0.08)]"
    >
      {/* Kepala: judul + jumlah, lalu alat cari dan tombol aksi */}
      <div className="space-y-4 border-b border-slate-100 p-4 sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex min-w-0 flex-wrap items-baseline gap-x-3 gap-y-1">
            <h2 id="judul-siswa" className="text-lg font-bold text-slate-900 sm:text-xl">
              Daftar Siswa Kelas {namaKelas}
            </h2>
            {!loading && !error && (
              <span className="rounded-md bg-blue-50 px-2 py-0.5 text-sm font-semibold text-[#0a4ea0]">
                {siswa.length} siswa terdaftar
              </span>
            )}
          </div>

          {!canEdit && (
            <label className="flex items-center gap-2 text-sm font-semibold text-slate-700">
              <span>Kelas</span>
              <select
                value={selectedKelasId || ''}
                onChange={(e) => onSelectKelas(Number(e.target.value))}
                className="min-h-11 cursor-pointer rounded-lg border border-slate-300 bg-white px-3 text-sm font-semibold text-slate-900 focus:border-[#098fd1] focus:outline-none focus:ring-4 focus:ring-[#098fd1]/15"
              >
                {kelasList.map((k) => (
                  <option key={k.id} value={k.id}>
                    {k.nama_kelas}
                  </option>
                ))}
              </select>
            </label>
          )}
        </div>

        {!canEdit && (
          <p className="rounded-lg bg-slate-50 px-3.5 py-2.5 text-sm text-slate-600">
            Data siswa hanya bisa diubah oleh wali kelas. Anda dapat melihat daftar ini sebagai guru bidang studi.
          </p>
        )}

        <div className="flex flex-col gap-3 md:flex-row md:items-center">
          <div className="relative md:max-w-sm md:flex-1">
            <label htmlFor="cari-siswa" className="sr-only">
              Cari nama siswa
            </label>
            <svg className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-4.35-4.35M17 10.5a6.5 6.5 0 11-13 0 6.5 6.5 0 0113 0z" />
            </svg>
            <input
              id="cari-siswa"
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Cari nama siswa..."
              disabled={loading || Boolean(error)}
              className="min-h-11 w-full rounded-lg border border-slate-300 pr-3 pl-9 text-base text-slate-900 placeholder-slate-400 focus:border-[#098fd1] focus:outline-none focus:ring-4 focus:ring-[#098fd1]/15 disabled:bg-slate-50 sm:text-sm"
            />
          </div>

          {canEdit && (
            <div className="grid grid-cols-2 gap-2 md:ml-auto md:flex">
              <button type="button" onClick={() => setDialog({ type: 'create', siswa: null })} disabled={loading || Boolean(error)} className={btnPrimary}>
                <IconPlus />
                <span>Tambah 1 Siswa</span>
              </button>
              <button
                type="button"
                onClick={() => setDialog({ type: 'bulk', siswa: null })}
                disabled={loading || Boolean(error)}
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-emerald-600 px-4 text-sm font-bold text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600 cursor-pointer"
              >
                <IconPaste />
                <span>Import Banyak Siswa</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Isi: loading / error / kosong / tabel */}
      {loading ? (
        <div className="flex items-center justify-center gap-3 px-6 py-14 text-sm font-semibold text-slate-600">
          <Spinner className="h-5 w-5 text-[#0a4ea0]" />
          Memuat daftar siswa Kelas {namaKelas}...
        </div>
      ) : error ? (
        <div role="alert" className="px-6 py-12 text-center">
          <p className="font-bold text-slate-800">Daftar siswa belum bisa ditampilkan</p>
          <p className="mx-auto mt-1 max-w-md text-sm text-slate-600">{error}</p>
          <button type="button" onClick={fetchSiswa} className={`${btnPrimary} mt-4`}>
            Muat ulang daftar siswa
          </button>
        </div>
      ) : siswa.length === 0 ? (
        <div className="px-6 py-12 text-center">
          <p className="font-bold text-slate-800">Belum ada siswa di Kelas {namaKelas}</p>
          <p className="mx-auto mt-1 max-w-md text-sm text-slate-600">
            {canEdit
              ? 'Punya daftar nama di WhatsApp atau Excel? Tempelkan sekaligus, nomor urut diisi otomatis.'
              : 'Wali kelas belum memasukkan data siswa untuk kelas ini.'}
          </p>
          {canEdit && (
            <button
              type="button"
              onClick={() => setDialog({ type: 'bulk', siswa: null })}
              className="mt-4 inline-flex min-h-11 items-center gap-2 rounded-lg bg-emerald-600 px-4 text-sm font-bold text-white hover:bg-emerald-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600 cursor-pointer"
            >
              <IconPaste />
              Tempel daftar nama siswa
            </button>
          )}
        </div>
      ) : tampil.length === 0 ? (
        <div className="px-6 py-12 text-center">
          <p className="font-bold text-slate-800">Tidak ada siswa bernama "{query.trim()}"</p>
          <p className="mt-1 text-sm text-slate-600">Periksa ejaan, atau cari dengan sebagian nama saja.</p>
          <button
            type="button"
            onClick={() => setQuery('')}
            className="mt-4 inline-flex min-h-11 items-center rounded-lg border border-slate-300 px-4 text-sm font-semibold text-slate-700 hover:bg-slate-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#098fd1] cursor-pointer"
          >
            Tampilkan semua siswa
          </button>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <caption className="sr-only">Daftar siswa Kelas {namaKelas}</caption>
            <thead className="border-b border-slate-200 bg-slate-50 text-slate-700">
              <tr>
                <th scope="col" aria-sort={sortAsc ? 'ascending' : 'descending'} className="w-20 px-2 py-1 sm:w-28 sm:px-4">
                  <button
                    type="button"
                    onClick={() => setSortAsc((v) => !v)}
                    className="inline-flex min-h-11 items-center gap-1 rounded-md px-2 font-semibold hover:text-[#0a4ea0] focus-visible:outline-2 focus-visible:outline-[#098fd1] cursor-pointer"
                    aria-label={`Urutkan nomor urut ${sortAsc ? 'dari terbesar' : 'dari terkecil'}`}
                  >
                    No.
                    <svg className={`h-3.5 w-3.5 transition-transform ${sortAsc ? '' : 'rotate-180'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 15l7-7 7 7" />
                    </svg>
                  </button>
                </th>
                <th scope="col" className="px-2 py-3 font-semibold sm:px-4">
                  Nama Lengkap
                </th>
                <th scope="col" className="hidden px-4 py-3 font-semibold md:table-cell">
                  Kelas
                </th>
                {canEdit && (
                  <th scope="col" className="px-2 py-3 text-right font-semibold sm:px-4">
                    <span className="sr-only sm:not-sr-only">Aksi</span>
                  </th>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {tampil.map((m) => (
                <tr key={m.id} className="hover:bg-blue-50/40">
                  <td className="px-4 py-2 font-semibold tabular-nums text-slate-600 sm:px-6">{m.no_urut}</td>
                  <td className="px-2 py-2 font-semibold break-words text-slate-900 sm:px-4">{m.nama_murid}</td>
                  <td className="hidden px-4 py-2 md:table-cell">
                    <span className="inline-block rounded-full bg-sky-100 px-2.5 py-0.5 text-xs font-bold text-sky-800">
                      {m.nama_kelas || namaKelas}
                    </span>
                  </td>
                  {canEdit && (
                    <td className="px-2 py-1.5 sm:px-4">
                      <div className="flex justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => setDialog({ type: 'edit', siswa: m })}
                          aria-label={`Ubah data ${m.nama_murid}`}
                          className="inline-flex min-h-11 min-w-11 items-center justify-center gap-1.5 rounded-lg px-2.5 text-sm font-semibold text-[#0a4ea0] hover:bg-blue-50 focus-visible:outline-2 focus-visible:outline-[#098fd1] cursor-pointer"
                        >
                          <IconPencil />
                          <span className="hidden sm:inline">Edit</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setDialog({ type: 'delete', siswa: m })}
                          aria-label={`Hapus ${m.nama_murid}`}
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

      {canEdit && (
        <>
          <SiswaFormModal
            open={dialog.type === 'create' || dialog.type === 'edit'}
            mode={dialog.type === 'edit' ? 'edit' : 'create'}
            siswa={dialog.siswa}
            kelasId={kelasId}
            namaKelas={namaKelas}
            daftarSiswa={siswa}
            nextNoUrut={nextNoUrut}
            onClose={closeDialog}
            onSaved={handleMutated}
          />
          <BulkImportModal
            open={dialog.type === 'bulk'}
            kelasId={kelasId}
            namaKelas={namaKelas}
            daftarSiswa={siswa}
            nextNoUrut={nextNoUrut}
            onClose={closeDialog}
            onSaved={handleMutated}
          />
          <DeleteSiswaDialog open={dialog.type === 'delete'} siswa={dialog.siswa} onClose={closeDialog} onDeleted={handleMutated} />
        </>
      )}
    </section>
  );
}

