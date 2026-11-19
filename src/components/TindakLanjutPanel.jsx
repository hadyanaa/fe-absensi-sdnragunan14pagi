import React, { useEffect, useState } from 'react';
import {
  getTindakLanjut,
  createTindakLanjut,
  uploadTindakLanjutLampiran,
  fetchTindakLanjutFileBlob,
  deleteTindakLanjut,
  getErrorMessage,
} from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { btnPrimary, btnSecondary, inputBase, Spinner } from './Modal';

const JENIS_META = {
  KARTU_REFLEKSI: {
    label: 'Kartu Refleksi Siswa',
    short: 'Kartu Refleksi',
    badgeCls: 'border-blue-200 bg-blue-50 text-[#0a4ea0]',
  },
  PEMANGGILAN_ORTU: {
    label: 'Pemanggilan Orang Tua',
    short: 'Pemanggilan Ortu',
    badgeCls: 'border-amber-300 bg-amber-50 text-amber-900',
  },
  HOME_VISIT: {
    label: 'Home Visit',
    short: 'Home Visit',
    badgeCls: 'border-emerald-200 bg-emerald-50 text-emerald-800',
  },
};

const NAMA_BULAN_LENGKAP = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember',
];

const formatTglIndo = (isoDate) => {
  if (!isoDate) return '-';
  const parts = String(isoDate).split('T')[0].split('-');
  if (parts.length !== 3) return isoDate;
  const [y, m, d] = parts;
  return `${parseInt(d, 10)} ${NAMA_BULAN_LENGKAP[parseInt(m, 10) - 1] || m} ${y}`;
};

const formatFileSize = (bytes) => {
  if (!bytes) return '';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

const getTodayISO = () => {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

export default function TindakLanjutPanel({ muridId, muridKelasId }) {
  const { guru } = useAuth();
  const notify = useToast();

  const isAdmin = guru?.role === 'ADMIN' || guru?.role === 'admin';
  const isWali = guru?.role === 'WALI_KELAS';
  const canUpload = isAdmin || (isWali && (!muridKelasId || guru?.kelas_id === muridKelasId));
  const canDelete = isAdmin;

  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [reloadTick, setReloadTick] = useState(0);
  const [filterJenis, setFilterJenis] = useState('ALL');

  // Form upload baru
  const [showForm, setShowForm] = useState(false);
  const [jenis, setJenis] = useState('KARTU_REFLEKSI');
  const [tanggal, setTanggal] = useState(getTodayISO);
  const [catatan, setCatatan] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  // Status aksi per item (upload susulan, preview, hapus)
  const [attachingId, setAttachingId] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const [openingFileId, setOpeningFileId] = useState(null);
  const [preview, setPreview] = useState(null); // { url, fileName, mimeType }

  useEffect(() => {
    if (!muridId) return undefined;
    let active = true;

    const load = async () => {
      setLoading(true);
      setError('');
      try {
        const res = await getTindakLanjut(muridId);
        if (!active) return;
        if (res.data?.success) {
          setRecords(res.data.data || []);
        } else {
          setError(res.data?.message || 'Riwayat tindak lanjut gagal dimuat.');
        }
      } catch (err) {
        if (!active) return;
        setError(getErrorMessage(err, 'Riwayat tindak lanjut gagal dimuat.'));
      } finally {
        if (active) setLoading(false);
      }
    };

    load();
    return () => {
      active = false;
    };
  }, [muridId, reloadTick]);

  // Bersihkan Blob URL saat preview ditutup atau komponen unmount
  useEffect(() => {
    const currentUrl = preview?.url;
    return () => {
      if (currentUrl) URL.revokeObjectURL(currentUrl);
    };
  }, [preview?.url]);

  const validateFile = (file) => {
    if (!file) return null;
    if (file.size > 5 * 1024 * 1024) {
      return 'Ukuran file terlalu besar. Maksimal 5 MB per file.';
    }
    const allowed = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
    if (!allowed.includes(file.type)) {
      return 'Format file harus gambar (JPG, PNG, WEBP) atau PDF.';
    }
    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');

    if (!tanggal) {
      setFormError('Tanggal kegiatan wajib diisi.');
      return;
    }
    const fileErr = validateFile(selectedFile);
    if (fileErr) {
      setFormError(fileErr);
      return;
    }

    const formData = new FormData();
    formData.append('jenis', jenis);
    formData.append('tanggal', tanggal);
    if (catatan.trim()) formData.append('catatan', catatan.trim());
    if (selectedFile) formData.append('file', selectedFile);

    setSubmitting(true);
    try {
      const res = await createTindakLanjut(muridId, formData);
      if (res.data?.success) {
        notify('success', 'Catatan tindak lanjut berhasil disimpan.');
        setCatatan('');
        setSelectedFile(null);
        setShowForm(false);
        setReloadTick((t) => t + 1);
      } else {
        setFormError(res.data?.message || 'Gagal menyimpan catatan tindak lanjut.');
      }
    } catch (err) {
      setFormError(getErrorMessage(err, 'Gagal menyimpan catatan tindak lanjut.'));
    } finally {
      setSubmitting(false);
    }
  };

  const handleAttachLater = async (recordId, file) => {
    if (!file) return;
    const fileErr = validateFile(file);
    if (fileErr) {
      notify('error', fileErr);
      return;
    }

    const formData = new FormData();
    formData.append('file', file);

    setAttachingId(recordId);
    try {
      const res = await uploadTindakLanjutLampiran(recordId, formData);
      if (res.data?.success) {
        notify('success', 'File lampiran berhasil diunggah.');
        setReloadTick((t) => t + 1);
      } else {
        notify('error', res.data?.message || 'Gagal mengunggah file lampiran.');
      }
    } catch (err) {
      notify('error', getErrorMessage(err, 'Gagal mengunggah file lampiran.'));
    } finally {
      setAttachingId(null);
    }
  };

  const handleOpenFile = async (rec) => {
    setOpeningFileId(rec.id);
    try {
      const res = await fetchTindakLanjutFileBlob(rec.id);
      const blob = res.data;
      const url = URL.createObjectURL(blob);
      setPreview({
        url,
        fileName: rec.file_name || `lampiran-${rec.id}`,
        mimeType: rec.mime_type || blob.type || '',
      });
    } catch (err) {
      notify('error', getErrorMessage(err, 'File lampiran gagal dibuka.'));
    } finally {
      setOpeningFileId(null);
    }
  };

  const handleDelete = async (rec) => {
    const label = JENIS_META[rec.jenis]?.label || 'catatan';
    if (!window.confirm(`Hapus catatan ${label} tanggal ${formatTglIndo(rec.tanggal)}?`)) {
      return;
    }

    setDeletingId(rec.id);
    try {
      const res = await deleteTindakLanjut(rec.id);
      if (res.data?.success) {
        notify('success', 'Catatan tindak lanjut berhasil dihapus.');
        setReloadTick((t) => t + 1);
      } else {
        notify('error', res.data?.message || 'Gagal menghapus catatan.');
      }
    } catch (err) {
      notify('error', getErrorMessage(err, 'Gagal menghapus catatan.'));
    } finally {
      setDeletingId(null);
    }
  };

  const displayedRecords =
    filterJenis === 'ALL' ? records : records.filter((r) => r.jenis === filterJenis);

  return (
    <div className="space-y-4">
      {/* Header & Tombol Tambah / Upload */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3.5">
        <div>
          <h3 className="text-sm font-bold text-slate-900">
            Arsip Tindak Lanjut & Kartu Refleksi
          </h3>
          <p className="text-xs text-slate-600">
            Scan kartu refleksi siswa, riwayat pemanggilan orang tua, dan catatan home visit.
          </p>
        </div>

        {canUpload && !showForm && (
          <button
            type="button"
            onClick={() => {
              setFormError('');
              setShowForm(true);
            }}
            className={btnPrimary}
          >
            + Upload / Catat Tindak Lanjut
          </button>
        )}
      </div>

      {/* Form Upload / Catat Baru (Khusus Admin & Wali Kelas) */}
      {canUpload && showForm && (
        <form
          onSubmit={handleSubmit}
          className="space-y-3.5 rounded-xl border border-blue-200 bg-blue-50/40 p-4"
        >
          <div className="flex items-center justify-between gap-2">
            <h4 className="text-sm font-bold text-slate-900">Tambah Catatan Tindak Lanjut</h4>
            <button
              type="button"
              onClick={() => setShowForm(false)}
              disabled={submitting}
              className="min-h-11 rounded-lg px-3 text-xs font-bold text-slate-600 hover:bg-white cursor-pointer"
            >
              Tutup
            </button>
          </div>

          {formError && (
            <p
              role="alert"
              className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-800"
            >
              {formError}
            </p>
          )}

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label htmlFor="tl-jenis" className="mb-1 block text-xs font-bold text-slate-800">
                Jenis Tindak Lanjut
              </label>
              <select
                id="tl-jenis"
                value={jenis}
                onChange={(e) => setJenis(e.target.value)}
                className={`${inputBase} bg-white`}
              >
                <option value="KARTU_REFLEKSI">Kartu Refleksi Siswa (Scan)</option>
                <option value="PEMANGGILAN_ORTU">Pemanggilan Orang Tua ke Sekolah</option>
                <option value="HOME_VISIT">Home Visit (Kunjungan Rumah)</option>
              </select>
            </div>

            <div>
              <label htmlFor="tl-tanggal" className="mb-1 block text-xs font-bold text-slate-800">
                Tanggal Kegiatan
              </label>
              <input
                id="tl-tanggal"
                type="date"
                value={tanggal}
                onChange={(e) => setTanggal(e.target.value)}
                className={`${inputBase} bg-white`}
              />
            </div>
          </div>

          <div>
            <label htmlFor="tl-catatan" className="mb-1 block text-xs font-bold text-slate-800">
              Catatan / Keterangan{' '}
              <span className="font-normal text-slate-500">(opsional)</span>
            </label>
            <textarea
              id="tl-catatan"
              rows={2}
              value={catatan}
              onChange={(e) => setCatatan(e.target.value)}
              placeholder="Contoh: Refleksi keterlambatan minggu ke-2, atau hasil pertemuan dengan orang tua..."
              className={`${inputBase} bg-white`}
            />
          </div>

          <div>
            <label htmlFor="tl-file" className="mb-1 block text-xs font-bold text-slate-800">
              Upload Hasil Scan / Foto / Surat{' '}
              <span className="font-normal text-slate-500">(opsional, bisa menyusul)</span>
            </label>
            <input
              id="tl-file"
              type="file"
              accept=".jpg,.jpeg,.png,.webp,.pdf"
              onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
              className="block min-h-11 w-full cursor-pointer rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs text-slate-700 file:mr-3 file:rounded-md file:border-0 file:bg-blue-50 file:px-3 file:py-1.5 file:text-xs file:font-bold file:text-[#0a4ea0] hover:file:bg-blue-100"
            />
            <p className="mt-1 text-[11px] text-slate-600">
              Format yang didukung: JPG, PNG, WEBP, atau PDF (maksimal 5 MB).
            </p>
          </div>

          <div className="flex flex-col-reverse gap-2 pt-1 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={() => setShowForm(false)}
              disabled={submitting}
              className={btnSecondary}
            >
              Batal
            </button>
            <button type="submit" disabled={submitting} className={btnPrimary}>
              {submitting && <Spinner />}
              {submitting ? 'Menyimpan...' : 'Simpan Catatan'}
            </button>
          </div>
        </form>
      )}

      {/* Preview Inline Lampiran File */}
      {preview && (
        <div className="rounded-xl border border-[#098fd1]/40 bg-slate-900/5 p-3.5">
          <div className="mb-2.5 flex flex-wrap items-center justify-between gap-2">
            <p className="truncate text-xs font-bold text-slate-900">
              Preview: {preview.fileName}
            </p>
            <div className="flex items-center gap-2">
              <a
                href={preview.url}
                download={preview.fileName}
                className="inline-flex min-h-11 items-center rounded-lg border border-slate-300 bg-white px-3 text-xs font-bold text-slate-800 hover:bg-slate-50"
              >
                Unduh File
              </a>
              <button
                type="button"
                onClick={() => setPreview(null)}
                className="inline-flex min-h-11 items-center rounded-lg bg-slate-800 px-3 text-xs font-bold text-white hover:bg-slate-900 cursor-pointer"
              >
                Tutup Preview
              </button>
            </div>
          </div>

          {preview.mimeType.startsWith('image/') ? (
            <div className="flex max-h-[55vh] justify-center overflow-auto rounded-lg border border-slate-200 bg-white p-2">
              <img
                src={preview.url}
                alt={preview.fileName}
                className="max-h-[50vh] w-auto object-contain"
              />
            </div>
          ) : preview.mimeType === 'application/pdf' ? (
            <iframe
              title={preview.fileName}
              src={preview.url}
              className="h-[52vh] w-full rounded-lg border border-slate-200 bg-white"
            />
          ) : (
            <p className="rounded-lg bg-white p-4 text-center text-xs text-slate-600">
              Gunakan tombol Unduh File di atas untuk membuka berkas ini.
            </p>
          )}
        </div>
      )}

      {/* Filter Jenis Kegiatan */}
      {records.length > 0 && (
        <div
          role="group"
          aria-label="Filter jenis tindak lanjut"
          className="flex flex-wrap gap-1.5"
        >
          {[
            { id: 'ALL', label: `Semua (${records.length})` },
            { id: 'KARTU_REFLEKSI', label: 'Kartu Refleksi' },
            { id: 'PEMANGGILAN_ORTU', label: 'Pemanggilan Ortu' },
            { id: 'HOME_VISIT', label: 'Home Visit' },
          ].map((f) => (
            <button
              key={f.id}
              type="button"
              onClick={() => setFilterJenis(f.id)}
              className={`min-h-11 rounded-lg border px-3 text-xs font-bold transition-colors focus-visible:outline-2 focus-visible:outline-[#098fd1] cursor-pointer ${
                filterJenis === f.id
                  ? 'border-[#0a4ea0] bg-blue-50 text-[#0a4ea0]'
                  : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      )}

      {/* Daftar Riwayat / States */}
      {loading ? (
        <div className="flex items-center justify-center gap-2 py-10 text-sm font-semibold text-slate-600">
          <Spinner className="h-5 w-5 text-[#0a4ea0]" />
          <span>Memuat riwayat tindak lanjut...</span>
        </div>
      ) : error ? (
        <div role="alert" className="rounded-xl border border-rose-200 bg-rose-50/50 p-6 text-center">
          <p className="font-bold text-slate-900">Riwayat tindak lanjut gagal dimuat</p>
          <p className="mt-1 text-xs text-slate-600">{error}</p>
          <button
            type="button"
            onClick={() => setReloadTick((t) => t + 1)}
            className={`${btnPrimary} mt-3`}
          >
            Muat Ulang
          </button>
        </div>
      ) : records.length === 0 ? (
        <div className="rounded-xl border border-slate-200 bg-white px-5 py-10 text-center">
          <p className="font-bold text-slate-900">Belum ada arsip tindak lanjut</p>
          <p className="mx-auto mt-1 max-w-md text-xs text-slate-600">
            {canUpload
              ? 'Gunakan tombol "+ Upload / Catat Tindak Lanjut" di atas untuk menyimpan hasil scan kartu refleksi siswa, pemanggilan orang tua, atau kunjungan rumah.'
              : 'Belum ada catatan kartu refleksi, pemanggilan orang tua, atau home visit untuk siswa ini.'}
          </p>
        </div>
      ) : displayedRecords.length === 0 ? (
        <div className="rounded-xl border border-slate-200 bg-white px-5 py-8 text-center text-sm text-slate-600">
          Tidak ada catatan untuk kategori tersebut.
        </div>
      ) : (
        <div className="space-y-3">
          {displayedRecords.map((rec) => {
            const meta = JENIS_META[rec.jenis] || JENIS_META.KARTU_REFLEKSI;
            const isAttaching = attachingId === rec.id;
            const isOpening = openingFileId === rec.id;
            const isDeleting = deletingId === rec.id;

            return (
              <article
                key={rec.id}
                className="rounded-xl border border-slate-200 bg-white p-4 transition-colors hover:border-slate-300"
              >
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className={`inline-block rounded-full border px-2.5 py-0.5 text-xs font-bold ${meta.badgeCls}`}
                    >
                      {meta.label}
                    </span>
                    <span className="text-xs font-bold text-slate-800">
                      {formatTglIndo(rec.tanggal)}
                    </span>
                  </div>

                  {rec.dibuat_oleh_nama && (
                    <span className="text-xs font-medium text-slate-500">
                      Dicatat oleh: {rec.dibuat_oleh_nama}
                    </span>
                  )}
                </div>

                {rec.catatan && (
                  <p className="mt-2.5 whitespace-pre-line text-sm leading-relaxed text-slate-700">
                    {rec.catatan}
                  </p>
                )}

                <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 pt-2.5">
                  <div className="flex flex-wrap items-center gap-2">
                    {rec.has_file ? (
                      <button
                        type="button"
                        onClick={() => handleOpenFile(rec)}
                        disabled={isOpening}
                        className="inline-flex min-h-11 items-center gap-1.5 rounded-lg border border-blue-200 bg-blue-50 px-3 text-xs font-bold text-[#0a4ea0] hover:bg-blue-100 disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-[#098fd1] cursor-pointer"
                      >
                        {isOpening ? (
                          <Spinner className="h-3.5 w-3.5" />
                        ) : (
                          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth="2"
                              d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                            />
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth="2"
                              d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                            />
                          </svg>
                        )}
                        <span>
                          Lihat Lampiran ({rec.file_name}
                          {rec.file_size ? ` - ${formatFileSize(rec.file_size)}` : ''})
                        </span>
                      </button>
                    ) : canUpload ? (
                      <label className="inline-flex min-h-11 cursor-pointer items-center gap-1.5 rounded-lg border border-dashed border-slate-300 bg-slate-50 px-3 text-xs font-bold text-slate-700 hover:border-[#098fd1] hover:bg-blue-50/50 hover:text-[#0a4ea0]">
                        {isAttaching ? <Spinner className="h-3.5 w-3.5" /> : null}
                        <span>
                          {isAttaching ? 'Mengunggah...' : '+ Upload Lampiran (Susulan)'}
                        </span>
                        <input
                          type="file"
                          accept=".jpg,.jpeg,.png,.webp,.pdf"
                          disabled={isAttaching}
                          onChange={(e) => {
                            const f = e.target.files?.[0];
                            e.target.value = '';
                            if (f) handleAttachLater(rec.id, f);
                          }}
                          className="sr-only"
                        />
                      </label>
                    ) : (
                      <span className="text-xs text-slate-500">Belum ada file lampiran</span>
                    )}
                  </div>

                  {canDelete && (
                    <button
                      type="button"
                      onClick={() => handleDelete(rec)}
                      disabled={isDeleting}
                      className="inline-flex min-h-11 items-center rounded-lg px-3 text-xs font-bold text-red-700 hover:bg-red-50 disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-red-600 cursor-pointer"
                    >
                      {isDeleting ? 'Menghapus...' : 'Hapus'}
                    </button>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
