import React, { useEffect, useRef, useState } from 'react';
import {
  getGuru,
  createGuru,
  updateGuru,
  deleteGuru,
  getKelas,
  createKelas,
  updateKelas,
  deleteKelas,
  getErrorMessage,
} from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import Modal, { btnDanger, btnPrimary, btnSecondary, inputBase, Spinner } from '../Modal';

function GuruFormModal({ mode, targetGuru, kelasList, isAdmin, onClose, onSaved }) {
  const isEdit = mode === 'edit';
  const firstRef = useRef(null);

  const [nip, setNip] = useState(isEdit ? targetGuru?.nip || '' : '');
  const [namaGuru, setNamaGuru] = useState(isEdit ? targetGuru?.nama_guru || '' : '');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState(isEdit ? targetGuru?.role || 'WALI_KELAS' : 'WALI_KELAS');
  const [kelasId, setKelasId] = useState(
    isEdit && targetGuru?.kelas_id ? String(targetGuru.kelas_id) : ''
  );
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!namaGuru.trim()) {
      setError('Nama lengkap guru wajib diisi.');
      return;
    }
    if (isAdmin && !nip.trim()) {
      setError('NIP wajib diisi.');
      return;
    }
    if (!isEdit && !password.trim()) {
      setError('Kata sandi awal wajib diisi untuk akun guru baru.');
      return;
    }

    setBusy(true);
    try {
      const payload = {
        nama_guru: namaGuru.trim(),
      };
      if (password.trim()) {
        payload.password = password.trim();
      }
      if (isAdmin) {
        payload.nip = nip.trim();
        payload.role = role;
        payload.kelas_id = role === 'WALI_KELAS' && kelasId ? Number(kelasId) : null;
      }

      const res = isEdit
        ? await updateGuru(targetGuru.id, payload)
        : await createGuru(payload);

      if (res.data?.success) {
        onSaved(
          res.data.data,
          isEdit
            ? `Data ${payload.nama_guru} berhasil diperbarui.`
            : `Akun guru ${payload.nama_guru} berhasil ditambahkan.`
        );
      } else {
        setError(res.data?.message || 'Gagal menyimpan data guru.');
      }
    } catch (err) {
      setError(getErrorMessage(err, 'Gagal menyimpan data guru.'));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal
      open
      onClose={onClose}
      busy={busy}
      size="sm"
      initialFocusRef={firstRef}
      title={
        isEdit
          ? isAdmin
            ? 'Edit Data Guru'
            : 'Ubah Profil & Kata Sandi Saya'
          : 'Tambah Akun Guru Baru'
      }
      description={
        isEdit && !isAdmin
          ? 'Anda dapat memperbarui nama lengkap atau mengganti kata sandi akun Anda.'
          : 'Lengkapi data NIP, peran, dan kelas perwalian guru.'
      }
      footer={
        <>
          <button type="button" onClick={onClose} disabled={busy} className={btnSecondary}>
            Batal
          </button>
          <button type="submit" form="form-guru" disabled={busy} className={btnPrimary}>
            {busy && <Spinner />}
            {busy ? 'Menyimpan...' : isEdit ? 'Simpan Perubahan' : 'Simpan Guru'}
          </button>
        </>
      }
    >
      <form id="form-guru" onSubmit={handleSubmit} noValidate className="space-y-4">
        {error && (
          <p
            role="alert"
            className="rounded-lg border border-rose-200 bg-rose-50 px-3.5 py-2.5 text-sm font-medium text-rose-800"
          >
            {error}
          </p>
        )}

        {isAdmin && (
          <div>
            <label htmlFor="guru-nip" className="mb-1.5 block text-sm font-semibold text-slate-800">
              Nomor Induk Pegawai (NIP)
            </label>
            <input
              ref={firstRef}
              id="guru-nip"
              type="text"
              value={nip}
              onChange={(e) => setNip(e.target.value)}
              placeholder="Contoh: 199203032018011003"
              className={inputBase}
            />
          </div>
        )}

        <div>
          <label htmlFor="guru-nama" className="mb-1.5 block text-sm font-semibold text-slate-800">
            Nama Lengkap & Gelar
          </label>
          <input
            ref={!isAdmin ? firstRef : undefined}
            id="guru-nama"
            type="text"
            value={namaGuru}
            onChange={(e) => setNamaGuru(e.target.value)}
            placeholder="Contoh: Dewi Sartika, S.Pd"
            className={inputBase}
          />
        </div>

        <div>
          <label htmlFor="guru-pass" className="mb-1.5 block text-sm font-semibold text-slate-800">
            Kata Sandi {isEdit && <span className="font-normal text-slate-500">(kosongkan bila tidak diganti)</span>}
          </label>
          <input
            id="guru-pass"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder={isEdit ? 'Biarkan kosong jika tetap' : 'Minimal 6 karakter'}
            className={inputBase}
          />
        </div>

        {isAdmin && (
          <>
            <div>
              <label htmlFor="guru-role" className="mb-1.5 block text-sm font-semibold text-slate-800">
                Peran Tugas
              </label>
              <select
                id="guru-role"
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className={inputBase}
              >
                <option value="WALI_KELAS">Wali Kelas</option>
                <option value="GURU_MAPEL">Guru Bidang Studi (Mapel)</option>
              </select>
            </div>

            {role === 'WALI_KELAS' && (
              <div>
                <label htmlFor="guru-kelas" className="mb-1.5 block text-sm font-semibold text-slate-800">
                  Kelas Perwalian
                </label>
                <select
                  id="guru-kelas"
                  value={kelasId}
                  onChange={(e) => setKelasId(e.target.value)}
                  className={inputBase}
                >
                  <option value="">Pilih Kelas</option>
                  {kelasList.map((k) => (
                    <option key={k.id} value={k.id}>
                      Kelas {k.nama_kelas}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </>
        )}
      </form>
    </Modal>
  );
}

function DeleteGuruDialog({ targetGuru, onClose, onDeleted }) {
  const cancelRef = useRef(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const handleDelete = async () => {
    setBusy(true);
    setError('');
    try {
      const res = await deleteGuru(targetGuru.id);
      if (res.data?.success) {
        onDeleted(res.data.message || `Akun guru ${targetGuru.nama_guru} berhasil dihapus.`);
      } else {
        setError(res.data?.message || 'Gagal menghapus akun guru.');
      }
    } catch (err) {
      setError(getErrorMessage(err, 'Gagal menghapus akun guru.'));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal
      open
      onClose={onClose}
      busy={busy}
      size="sm"
      initialFocusRef={cancelRef}
      title="Hapus akun guru?"
      footer={
        <>
          <button ref={cancelRef} type="button" onClick={onClose} disabled={busy} className={btnSecondary}>
            Batal
          </button>
          <button type="button" onClick={handleDelete} disabled={busy} className={btnDanger}>
            {busy && <Spinner />}
            {busy ? 'Menghapus...' : 'Ya, Hapus Guru'}
          </button>
        </>
      }
    >
      <p className="text-sm leading-relaxed text-slate-700">
        Apakah Anda yakin ingin menghapus akun <strong className="font-bold text-slate-900">{targetGuru?.nama_guru}</strong> (NIP: {targetGuru?.nip})?
      </p>
      {error && (
        <p role="alert" className="mt-3 rounded-lg border border-rose-200 bg-rose-50 px-3.5 py-2.5 text-sm font-medium text-rose-800">
          {error}
        </p>
      )}
    </Modal>
  );
}

function KelasFormModal({ mode, targetKelas, onClose, onSaved }) {
  const isEdit = mode === 'edit';
  const inputRef = useRef(null);
  const [namaKelas, setNamaKelas] = useState(isEdit ? targetKelas?.nama_kelas || '' : '');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!namaKelas.trim()) {
      setError('Nama kelas wajib diisi (contoh: 1C).');
      return;
    }
    setBusy(true);
    try {
      const payload = { nama_kelas: namaKelas.trim().toUpperCase() };
      const res = isEdit
        ? await updateKelas(targetKelas.id, payload)
        : await createKelas(payload);
      if (res.data?.success) {
        onSaved(res.data.message || `Kelas ${payload.nama_kelas} berhasil disimpan.`);
      } else {
        setError(res.data?.message || 'Gagal menyimpan kelas.');
      }
    } catch (err) {
      setError(getErrorMessage(err, 'Gagal menyimpan kelas.'));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal
      open
      onClose={onClose}
      busy={busy}
      size="sm"
      initialFocusRef={inputRef}
      title={isEdit ? `Ubah Nama Kelas ${targetKelas?.nama_kelas}` : 'Tambah Kelas Baru'}
      footer={
        <>
          <button type="button" onClick={onClose} disabled={busy} className={btnSecondary}>
            Batal
          </button>
          <button type="submit" form="form-kelas" disabled={busy} className={btnPrimary}>
            {busy && <Spinner />}
            {busy ? 'Menyimpan...' : 'Simpan Kelas'}
          </button>
        </>
      }
    >
      <form id="form-kelas" onSubmit={handleSubmit} noValidate className="space-y-4">
        {error && (
          <p role="alert" className="rounded-lg border border-rose-200 bg-rose-50 px-3.5 py-2.5 text-sm font-medium text-rose-800">
            {error}
          </p>
        )}
        <div>
          <label htmlFor="nama-kelas" className="mb-1.5 block text-sm font-semibold text-slate-800">
            Kode / Nama Kelas
          </label>
          <input
            ref={inputRef}
            id="nama-kelas"
            type="text"
            value={namaKelas}
            onChange={(e) => setNamaKelas(e.target.value)}
            placeholder="Contoh: 1C"
            className={inputBase}
          />
        </div>
      </form>
    </Modal>
  );
}

function DeleteKelasDialog({ targetKelas, onClose, onDeleted }) {
  const cancelRef = useRef(null);
  const [busy, setBusy] = useState(false);
  const [force, setForce] = useState(false);
  const [error, setError] = useState('');

  const hasMurid = (targetKelas?.jumlah_murid || 0) > 0;

  const handleDelete = async () => {
    setBusy(true);
    setError('');
    try {
      const res = await deleteKelas(targetKelas.id, force);
      if (res.data?.success) {
        onDeleted(res.data.message || `Kelas ${targetKelas.nama_kelas} berhasil dihapus.`);
      } else {
        setError(res.data?.message || 'Gagal menghapus kelas.');
      }
    } catch (err) {
      setError(getErrorMessage(err, 'Gagal menghapus kelas.'));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal
      open
      onClose={onClose}
      busy={busy}
      size="sm"
      initialFocusRef={cancelRef}
      title={`Hapus Kelas ${targetKelas?.nama_kelas}?`}
      footer={
        <>
          <button ref={cancelRef} type="button" onClick={onClose} disabled={busy} className={btnSecondary}>
            Batal
          </button>
          <button
            type="button"
            onClick={handleDelete}
            disabled={busy || (hasMurid && !force)}
            className={btnDanger}
          >
            {busy && <Spinner />}
            {busy ? 'Menghapus...' : 'Ya, Hapus Kelas'}
          </button>
        </>
      }
    >
      <p className="text-sm leading-relaxed text-slate-700">
        Apakah Anda yakin ingin menghapus <strong className="font-bold text-slate-900">Kelas {targetKelas?.nama_kelas}</strong>?
      </p>
      {hasMurid && (
        <div className="mt-3 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
          <p className="font-semibold">Kelas ini masih memiliki {targetKelas.jumlah_murid} siswa terdaftar.</p>
          <label className="mt-2 flex min-h-11 cursor-pointer items-center gap-2.5">
            <input
              type="checkbox"
              checked={force}
              onChange={(e) => setForce(e.target.checked)}
              className="h-5 w-5 rounded border-amber-400 accent-red-600"
            />
            <span>Hapus paksa beserta seluruh data siswa di kelas ini</span>
          </label>
        </div>
      )}
      {error && (
        <p role="alert" className="mt-3 rounded-lg border border-rose-200 bg-rose-50 px-3.5 py-2.5 text-sm font-medium text-rose-800">
          {error}
        </p>
      )}
    </Modal>
  );
}

export default function GuruKelasTab({ onDataChanged }) {
  const { guru: currentUser, updateCurrentGuru } = useAuth();
  const notify = useToast();
  const isAdmin = currentUser?.role === 'ADMIN' || currentUser?.role === 'admin';

  const [guruList, setGuruList] = useState([]);
  const [kelasList, setKelasList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [reloadTick, setReloadTick] = useState(0);

  const [guruDialog, setGuruDialog] = useState(null); // { type: 'create'|'edit'|'delete', guru }
  const [kelasDialog, setKelasDialog] = useState(null); // { type: 'create'|'edit'|'delete', kelas }

  useEffect(() => {
    let active = true;
    const loadAll = async () => {
      setLoading(true);
      setError('');
      try {
        const [resGuru, resKelas] = await Promise.all([getGuru(), getKelas()]);
        if (!active) return;
        if (resGuru.data?.success) setGuruList(resGuru.data.data || []);
        if (resKelas.data?.success) setKelasList(resKelas.data.data || []);
      } catch (err) {
        if (!active) return;
        setError(getErrorMessage(err, 'Gagal memuat data guru dan kelas.'));
      } finally {
        if (active) setLoading(false);
      }
    };
    loadAll();
    return () => {
      active = false;
    };
  }, [reloadTick]);

  const refresh = () => {
    setReloadTick((t) => t + 1);
    onDataChanged?.();
  };

  if (loading) {
    return (
      <div className="rounded-xl border border-blue-900/10 bg-white p-12 text-center shadow-[0_16px_42px_rgba(8,57,115,0.08)]">
        <Spinner className="mx-auto mb-3 h-7 w-7 text-[#0a4ea0]" />
        <p className="text-sm font-semibold text-slate-600">Memuat data guru dan kelas...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div role="alert" className="rounded-xl border border-rose-200 bg-white p-8 text-center">
        <p className="font-bold text-slate-800">Data guru & kelas belum dapat dimuat</p>
        <p className="mx-auto mt-1 max-w-md text-sm text-slate-600">{error}</p>
        <button type="button" onClick={refresh} className={`${btnPrimary} mt-4`}>
          Muat Ulang
        </button>
      </div>
    );
  }

  const myAccount = guruList.find((g) => g.id === currentUser?.id);

  return (
    <div className="space-y-6">
      {/* Bagian 1: Daftar Guru */}
      <section
        aria-labelledby="judul-guru"
        className="rounded-xl border border-blue-900/10 bg-white shadow-[0_16px_42px_rgba(8,57,115,0.08)]"
      >
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 p-4 sm:p-6">
          <div className="flex flex-wrap items-baseline gap-2.5">
            <h2 id="judul-guru" className="text-lg font-bold text-slate-900 sm:text-xl">
              Data Guru Pengajar
            </h2>
            <span className="rounded-md bg-blue-50 px-2 py-0.5 text-sm font-semibold text-[#0a4ea0]">
              {guruList.length} guru terdaftar
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {myAccount && !isAdmin && (
              <button
                type="button"
                onClick={() => setGuruDialog({ type: 'edit', guru: myAccount })}
                className={btnPrimary}
              >
                Ubah Profil & Sandi Saya
              </button>
            )}
            {isAdmin && (
              <button
                type="button"
                onClick={() => setGuruDialog({ type: 'create', guru: null })}
                className={btnPrimary}
              >
                + Tambah Guru
              </button>
            )}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <caption className="sr-only">Daftar Guru SDN 14 Ragunan</caption>
            <thead className="border-b border-slate-200 bg-slate-50 text-slate-700">
              <tr>
                <th scope="col" className="px-4 py-3 font-semibold sm:px-6">
                  Nama Guru
                </th>
                <th scope="col" className="hidden px-4 py-3 font-semibold sm:table-cell">
                  NIP
                </th>
                <th scope="col" className="px-4 py-3 font-semibold">
                  Peran & Kelas
                </th>
                <th scope="col" className="px-4 py-3 text-right font-semibold sm:px-6">
                  Aksi
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {guruList.map((g) => {
                const isMe = g.id === currentUser?.id;
                const canEditRow = isAdmin || isMe;
                return (
                  <tr key={g.id} className="hover:bg-blue-50/40">
                    <td className="px-4 py-3 font-semibold text-slate-900 sm:px-6">
                      <div>{g.nama_guru}</div>
                      <div className="mt-0.5 font-mono text-xs text-slate-500 sm:hidden">
                        NIP: {g.nip}
                      </div>
                    </td>
                    <td className="hidden px-4 py-3 font-mono text-xs text-slate-600 sm:table-cell">
                      {g.nip}
                    </td>
                    <td className="px-4 py-3">
                      {g.role === 'WALI_KELAS' ? (
                        <span className="inline-block rounded-full border border-blue-200 bg-blue-50 px-2.5 py-0.5 text-xs font-bold text-[#0a4ea0]">
                          Wali Kelas {g.nama_kelas || '-'}
                        </span>
                      ) : (
                        <span className="inline-block rounded-full border border-amber-200 bg-amber-50 px-2.5 py-0.5 text-xs font-bold text-amber-800">
                          Guru Bidang Studi
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-2 text-right sm:px-6">
                      {canEditRow ? (
                        <div className="flex justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => setGuruDialog({ type: 'edit', guru: g })}
                            className="inline-flex min-h-11 items-center justify-center rounded-lg px-3 text-sm font-semibold text-[#0a4ea0] hover:bg-blue-50 focus-visible:outline-2 focus-visible:outline-[#098fd1] cursor-pointer"
                          >
                            {isMe && !isAdmin ? 'Ubah Profil' : 'Edit'}
                          </button>
                          {isAdmin && (
                            <button
                              type="button"
                              onClick={() => setGuruDialog({ type: 'delete', guru: g })}
                              className="inline-flex min-h-11 items-center justify-center rounded-lg px-3 text-sm font-semibold text-red-700 hover:bg-red-50 focus-visible:outline-2 focus-visible:outline-red-600 cursor-pointer"
                            >
                              Hapus
                            </button>
                          )}
                        </div>
                      ) : (
                        <span className="text-xs text-slate-500">-</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      {/* Bagian 2: Daftar Kelas */}
      <section
        aria-labelledby="judul-kelas"
        className="rounded-xl border border-blue-900/10 bg-white shadow-[0_16px_42px_rgba(8,57,115,0.08)]"
      >
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 p-4 sm:p-6">
          <div className="flex flex-wrap items-baseline gap-2.5">
            <h2 id="judul-kelas" className="text-lg font-bold text-slate-900 sm:text-xl">
              Daftar Rombongan Belajar (Kelas)
            </h2>
            <span className="rounded-md bg-blue-50 px-2 py-0.5 text-sm font-semibold text-[#0a4ea0]">
              {kelasList.length} kelas aktif
            </span>
          </div>

          {isAdmin && (
            <button
              type="button"
              onClick={() => setKelasDialog({ type: 'create', kelas: null })}
              className={btnPrimary}
            >
              + Tambah Kelas
            </button>
          )}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <caption className="sr-only">Daftar Kelas SDN 14 Ragunan</caption>
            <thead className="border-b border-slate-200 bg-slate-50 text-slate-700">
              <tr>
                <th scope="col" className="px-4 py-3 font-semibold sm:px-6">
                  Kelas
                </th>
                <th scope="col" className="px-4 py-3 font-semibold">
                  Wali Kelas Bertugas
                </th>
                <th scope="col" className="px-4 py-3 font-semibold">
                  Jumlah Siswa
                </th>
                {isAdmin && (
                  <th scope="col" className="px-4 py-3 text-right font-semibold sm:px-6">
                    Aksi
                  </th>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {kelasList.map((k) => (
                <tr key={k.id} className="hover:bg-blue-50/40">
                  <td className="px-4 py-3 font-bold text-slate-900 sm:px-6">
                    <span className="inline-block rounded-full bg-sky-100 px-3 py-0.5 text-xs font-bold text-sky-800">
                      Kelas {k.nama_kelas}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-700">
                    {k.wali_kelas ? (
                      <span className="font-semibold text-slate-800">{k.wali_kelas.nama_guru}</span>
                    ) : (
                      <span className="text-slate-500">Belum ditentukan</span>
                    )}
                  </td>
                  <td className="px-4 py-3 font-semibold tabular-nums text-slate-700">
                    {k.jumlah_murid || 0} siswa
                  </td>
                  {isAdmin && (
                    <td className="px-4 py-2 text-right sm:px-6">
                      <div className="flex justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => setKelasDialog({ type: 'edit', kelas: k })}
                          className="inline-flex min-h-11 items-center justify-center rounded-lg px-3 text-sm font-semibold text-[#0a4ea0] hover:bg-blue-50 focus-visible:outline-2 focus-visible:outline-[#098fd1] cursor-pointer"
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => setKelasDialog({ type: 'delete', kelas: k })}
                          className="inline-flex min-h-11 items-center justify-center rounded-lg px-3 text-sm font-semibold text-red-700 hover:bg-red-50 focus-visible:outline-2 focus-visible:outline-red-600 cursor-pointer"
                        >
                          Hapus
                        </button>
                      </div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Modal Guru */}
      {(guruDialog?.type === 'create' || guruDialog?.type === 'edit') && (
        <GuruFormModal
          key={`${guruDialog.type}-${guruDialog.guru?.id || 'new'}`}
          mode={guruDialog.type}
          targetGuru={guruDialog.guru}
          kelasList={kelasList}
          isAdmin={isAdmin}
          onClose={() => setGuruDialog(null)}
          onSaved={(updatedGuru, msg) => {
            if (updatedGuru && updatedGuru.id === currentUser?.id) {
              updateCurrentGuru({
                nama_guru: updatedGuru.nama_guru,
                nip: updatedGuru.nip,
                role: updatedGuru.role,
                kelas_id: updatedGuru.kelas_id,
                nama_kelas: updatedGuru.nama_kelas,
              });
            }
            setGuruDialog(null);
            notify('success', msg);
            refresh();
          }}
        />
      )}

      {guruDialog?.type === 'delete' && (
        <DeleteGuruDialog
          key={`del-guru-${guruDialog.guru?.id}`}
          targetGuru={guruDialog.guru}
          onClose={() => setGuruDialog(null)}
          onDeleted={(msg) => {
            setGuruDialog(null);
            notify('success', msg);
            refresh();
          }}
        />
      )}

      {/* Modal Kelas */}
      {(kelasDialog?.type === 'create' || kelasDialog?.type === 'edit') && (
        <KelasFormModal
          key={`${kelasDialog.type}-${kelasDialog.kelas?.id || 'new'}`}
          mode={kelasDialog.type}
          targetKelas={kelasDialog.kelas}
          onClose={() => setKelasDialog(null)}
          onSaved={(msg) => {
            setKelasDialog(null);
            notify('success', msg);
            refresh();
          }}
        />
      )}

      {kelasDialog?.type === 'delete' && (
        <DeleteKelasDialog
          key={`del-kelas-${kelasDialog.kelas?.id}`}
          targetKelas={kelasDialog.kelas}
          onClose={() => setKelasDialog(null)}
          onDeleted={(msg) => {
            setKelasDialog(null);
            notify('success', msg);
            refresh();
          }}
        />
      )}
    </div>
  );
}

