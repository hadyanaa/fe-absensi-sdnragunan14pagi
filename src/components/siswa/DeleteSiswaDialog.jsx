import React, { useEffect, useRef, useState } from 'react';
import Modal, { btnDanger, btnSecondary, Spinner } from '../Modal';
import { deleteMurid, getErrorMessage } from '../../services/api';

export default function DeleteSiswaDialog({ open, siswa, onClose, onDeleted }) {
  const [busy, setBusy] = useState(false);
  const [serverError, setServerError] = useState('');
  // Fokus awal di "Batal" supaya Enter yang tidak sengaja tidak langsung menghapus
  const cancelRef = useRef(null);

  useEffect(() => {
    if (open) setServerError('');
  }, [open]);

  const handleDelete = async () => {
    setBusy(true);
    setServerError('');
    try {
      const res = await deleteMurid(siswa.id);
      if (res.data?.success) {
        onDeleted(res.data.message || `${siswa.nama_murid} sudah dihapus.`);
      } else {
        setServerError(res.data?.message || 'Siswa gagal dihapus.');
      }
    } catch (err) {
      setServerError(getErrorMessage(err, 'Siswa gagal dihapus.'));
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
      initialFocusRef={cancelRef}
      title="Hapus siswa?"
      footer={
        <>
          <button ref={cancelRef} type="button" onClick={onClose} disabled={busy} className={btnSecondary}>
            Batal
          </button>
          <button type="button" onClick={handleDelete} disabled={busy} className={btnDanger}>
            {busy && <Spinner />}
            {busy ? 'Menghapus...' : 'Ya, Hapus Siswa'}
          </button>
        </>
      }
    >
      <p className="text-sm leading-relaxed text-slate-700">
        Apakah Anda yakin ingin menghapus siswa <strong className="font-bold text-slate-900">{siswa?.nama_murid}</strong>?
        Seluruh riwayat absensi siswa ini juga akan ikut terhapus.
      </p>
      {serverError && (
        <p role="alert" className="mt-3 rounded-lg border border-rose-200 bg-rose-50 px-3.5 py-2.5 text-sm font-medium text-rose-800">
          {serverError}
        </p>
      )}
    </Modal>
  );
}

