import React, { useRef, useState } from 'react';
import Modal, { btnPrimary, btnSecondary, inputBase, Spinner } from '../Modal';
import { createMurid, updateMurid, getErrorMessage } from '../../services/api';

export default function SiswaFormModal({
  open,
  mode,
  siswa,
  kelasId,
  namaKelas,
  daftarSiswa,
  nextNoUrut,
  onClose,
  onSaved,
}) {
  const isEdit = mode === 'edit';
  const namaRef = useRef(null);

  const [nama, setNama] = useState(() => (isEdit ? siswa?.nama_murid || '' : ''));
  const [noUrut, setNoUrut] = useState(() => (isEdit ? String(siswa?.no_urut ?? '') : ''));
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState('');
  const [busy, setBusy] = useState(false);

  const noUrutNum = Number(noUrut);
  const bentrok =
    noUrut !== '' && daftarSiswa.find((m) => m.no_urut === noUrutNum && m.id !== siswa?.id);

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
      </form>
    </Modal>
  );
}
