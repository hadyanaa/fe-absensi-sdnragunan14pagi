import React, { useRef, useState } from 'react';
import Modal, { btnPrimary, btnSecondary, inputBase, Spinner } from '../Modal';
import { createMurid, updateMurid, getErrorMessage } from '../../services/api';

const STATUS_OPTIONS = [
  {
    value: 'AKTIF',
    label: 'Aktif Belajar',
    desc: 'Tampil di daftar presensi harian kelas.',
  },
  {
    value: 'LULUS',
    label: 'Lulus / Alumni',
    desc: 'Arsip kelulusan. Riwayat presensi tetap tersimpan.',
  },
  {
    value: 'MUTASI_KELUAR',
    label: 'Mutasi Keluar',
    desc: 'Pindah sekolah. Tidak diabsen lagi, riwayat tetap ada.',
  },
];

export default function SiswaFormModal({
  open,
  mode,
  siswa,
  kelasId,
  namaKelas,
  daftarSiswa,
  nextNoUrut,
  isAdmin = false,
  onClose,
  onSaved,
}) {
  const isEdit = mode === 'edit';
  const namaRef = useRef(null);

  const [nama, setNama] = useState(() => (isEdit ? siswa?.nama_murid || '' : ''));
  const [noUrut, setNoUrut] = useState(() => (isEdit ? String(siswa?.no_urut ?? '') : ''));
  const [status, setStatus] = useState(() => (isEdit ? siswa?.status || 'AKTIF' : 'AKTIF'));
  const [tahunKeluar, setTahunKeluar] = useState(() =>
    isEdit ? siswa?.tahun_keluar || '' : ''
  );
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState('');
  const [busy, setBusy] = useState(false);

  const noUrutNum = Number(noUrut);
  const bentrok =
    noUrut !== '' &&
    status === 'AKTIF' &&
    daftarSiswa.find(
      (m) =>
        m.no_urut === noUrutNum &&
        m.id !== siswa?.id &&
        m.kelas_id === kelasId &&
        (m.status || 'AKTIF') === 'AKTIF'
    );

  const validate = () => {
    const next = {};
    if (!nama.trim()) next.nama = 'Nama lengkap murid wajib diisi.';
    else if (nama.trim().length > 100) next.nama = 'Nama terlalu panjang (maksimal 100 karakter).';

    if (noUrut !== '') {
      if (!Number.isInteger(noUrutNum) || noUrutNum < 1) {
        next.noUrut = 'Nomor urut harus angka bulat mulai dari 1.';
      }
    } else if (isEdit) {
      next.noUrut = 'Nomor urut wajib diisi saat mengubah data.';
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setServerError('');
    if (!validate()) return;

    setBusy(true);
    try {
      const payload = { nama_murid: nama.trim() };
      if (noUrut !== '') payload.no_urut = noUrutNum;
      if (isEdit && isAdmin) {
        payload.status = status;
        payload.tahun_keluar = status === 'AKTIF' ? null : tahunKeluar.trim() || null;
      }

      const res = isEdit
        ? await updateMurid(siswa.id, payload)
        : await createMurid({ ...payload, kelas_id: kelasId });

      if (res.data?.success) {
        onSaved(
          isEdit
            ? `Data ${payload.nama_murid} berhasil diperbarui.`
            : `${payload.nama_murid} berhasil ditambahkan ke Kelas ${namaKelas} (No. Urut ${res.data.data?.no_urut ?? payload.no_urut ?? nextNoUrut}).`
        );
      } else {
        setServerError(res.data?.message || 'Data siswa gagal disimpan.');
      }
    } catch (err) {
      setServerError(getErrorMessage(err, 'Data siswa gagal disimpan.'));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      busy={busy}
      size="sm"
      initialFocusRef={namaRef}
      title={isEdit ? 'Edit Data Siswa' : `Tambah 1 Siswa ke Kelas ${namaKelas}`}
      description={isEdit ? `Kelas ${namaKelas}` : 'Isi nama lengkap murid sesuai daftar kelas.'}
      footer={
        <>
          <button type="button" onClick={onClose} disabled={busy} className={btnSecondary}>
            Batal
          </button>
          <button type="submit" form="form-siswa" disabled={busy} className={btnPrimary}>
            {busy && <Spinner />}
            {busy ? 'Menyimpan...' : isEdit ? 'Simpan Perubahan' : 'Simpan Siswa'}
          </button>
        </>
      }
    >
      <form id="form-siswa" onSubmit={handleSubmit} noValidate className="space-y-4">
        {serverError && (
          <p
            role="alert"
            className="rounded-lg border border-rose-200 bg-rose-50 px-3.5 py-2.5 text-sm font-medium text-rose-800"
          >
            {serverError}
          </p>
        )}

        <div>
          <label htmlFor="siswa-nama" className="mb-1.5 block text-sm font-semibold text-slate-800">
            Nama Lengkap Murid
          </label>
          <input
            ref={namaRef}
            id="siswa-nama"
            type="text"
            value={nama}
            onChange={(e) => setNama(e.target.value)}
            placeholder="Contoh: Fathan Pratama"
            autoComplete="off"
            aria-invalid={Boolean(errors.nama)}
            aria-describedby={errors.nama ? 'siswa-nama-err' : undefined}
            className={`${inputBase} ${errors.nama ? 'border-rose-400' : ''}`}
          />
          {errors.nama && (
            <p id="siswa-nama-err" className="mt-1.5 text-sm text-rose-700">
              {errors.nama}
            </p>
          )}
        </div>

        <div>
          <label
            htmlFor="siswa-nourut"
            className="mb-1.5 block text-sm font-semibold text-slate-800"
          >
            Nomor Urut Absen{' '}
            {!isEdit && <span className="font-normal text-slate-500">(opsional)</span>}
          </label>
          <input
            id="siswa-nourut"
            type="number"
            inputMode="numeric"
            min="1"
            value={noUrut}
            onChange={(e) => setNoUrut(e.target.value)}
            placeholder={!isEdit && nextNoUrut ? `Otomatis: ${nextNoUrut}` : ''}
            aria-invalid={Boolean(errors.noUrut)}
            aria-describedby="siswa-nourut-help"
            className={`${inputBase} max-w-44 ${errors.noUrut ? 'border-rose-400' : ''}`}
          />
          <div id="siswa-nourut-help" className="mt-1.5 text-sm">
            {errors.noUrut ? (
              <p className="text-rose-700">{errors.noUrut}</p>
            ) : bentrok ? (
              <p className="text-amber-800">
                Nomor {noUrutNum} sudah dipakai oleh {bentrok.nama_murid}.
              </p>
            ) : (
              !isEdit && (
                <p className="text-slate-600">
                  Jika dikosongkan, sistem otomatis mengisi nomor urut berikutnya ({nextNoUrut}).
                </p>
              )
            )}
          </div>
        </div>

        {isEdit && isAdmin && (
          <fieldset className="space-y-2.5 rounded-xl border border-slate-200 bg-slate-50/70 p-3.5">
            <legend className="px-1 text-xs font-bold uppercase tracking-wider text-slate-700">
              Status Keaktifan Siswa
            </legend>
            <div className="space-y-2">
              {STATUS_OPTIONS.map((opt) => {
                const selected = status === opt.value;
                return (
                  <label
                    key={opt.value}
                    className={`flex min-h-11 cursor-pointer items-start gap-3 rounded-lg border px-3 py-2.5 transition-colors ${
                      selected
                        ? 'border-[#0a4ea0] bg-white ring-2 ring-[#098fd1]/20'
                        : 'border-slate-200 bg-white/70 hover:bg-white'
                    }`}
                  >
                    <input
                      type="radio"
                      name="status-keaktifan"
                      value={opt.value}
                      checked={selected}
                      onChange={() => setStatus(opt.value)}
                      className="mt-1 h-4 w-4 accent-[#0a4ea0]"
                    />
                    <span className="min-w-0">
                      <span className="block text-sm font-bold text-slate-900">{opt.label}</span>
                      <span className="block text-xs text-slate-600">{opt.desc}</span>
                    </span>
                  </label>
                );
              })}
            </div>

            {status !== 'AKTIF' && (
              <div className="pt-1">
                <label
                  htmlFor="siswa-tahun-keluar"
                  className="mb-1 block text-xs font-bold text-slate-800"
                >
                  Tahun {status === 'LULUS' ? 'Lulus' : 'Mutasi Keluar'}{' '}
                  <span className="font-normal text-slate-500">(opsional)</span>
                </label>
                <input
                  id="siswa-tahun-keluar"
                  type="text"
                  maxLength={20}
                  value={tahunKeluar}
                  onChange={(e) => setTahunKeluar(e.target.value)}
                  placeholder="Contoh: 2026 atau 2025/2026"
                  className={inputBase}
                />
              </div>
            )}
          </fieldset>
        )}
      </form>
    </Modal>
  );
}
