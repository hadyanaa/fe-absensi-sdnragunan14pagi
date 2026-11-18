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
import GuruHistoryModal from './GuruHistoryModal';

const STATUS_GURU_OPTIONS = [
  {
    value: 'AKTIF',
    label: 'Aktif Bertugas',
    desc: 'Guru aktif mengajar dan dapat login ke sistem.',
  },
  {
    value: 'MUTASI_KELUAR',
    label: 'Mutasi Keluar',
    desc: 'Pindah tugas. Akun dinonaktifkan dan histori mengajar tetap tersimpan.',
  },
  {
    value: 'PENSIUN',
    label: 'Pensiun',
    desc: 'Purna tugas. Akun dinonaktifkan dan histori mengajar tetap tersimpan.',
  },
];

const STATUS_GURU_BADGE = {
  AKTIF: {
    label: 'Aktif',
    cls: 'border-emerald-200 bg-emerald-50 text-emerald-800',
  },
  MUTASI_KELUAR: {
    label: 'Mutasi Keluar',
    cls: 'border-slate-300 bg-slate-100 text-slate-800',
  },
  PENSIUN: {
    label: 'Pensiun',
    cls: 'border-amber-300 bg-amber-50 text-amber-900',
  },
};

function GuruFormModal({ mode, targetGuru, kelasList, isAdmin, onClose, onSaved }) {
  const isEdit = mode === 'edit';
  const firstRef = useRef(null);

  const [username, setUsername] = useState(
    isEdit ? targetGuru?.username || targetGuru?.nip || '' : ''
  );
  const [nipNikki, setNipNikki] = useState(isEdit ? targetGuru?.nip_nikki || '' : '');
  const [nuptk, setNuptk] = useState(isEdit ? targetGuru?.nuptk || '' : '');
  const [nrg, setNrg] = useState(isEdit ? targetGuru?.nrg || '' : '');
  const [golonganRuang, setGolonganRuang] = useState(
    isEdit ? targetGuru?.golongan_ruang || '' : ''
  );
  const [jabatan, setJabatan] = useState(isEdit ? targetGuru?.jabatan || '' : '');
  const [tmtKerja, setTmtKerja] = useState(isEdit ? targetGuru?.tmt_kerja || '' : '');
  const [tmtSekolah, setTmtSekolah] = useState(isEdit ? targetGuru?.tmt_sekolah || '' : '');
  const [tingkatPendidikan, setTingkatPendidikan] = useState(
    isEdit ? targetGuru?.tingkat_pendidikan || '' : ''
  );
  const [jurusan, setJurusan] = useState(isEdit ? targetGuru?.jurusan || '' : '');
  const [jenisKelamin, setJenisKelamin] = useState(
    isEdit ? targetGuru?.jenis_kelamin || '' : ''
  );
  const [tempatLahir, setTempatLahir] = useState(isEdit ? targetGuru?.tempat_lahir || '' : '');
  const [tanggalLahir, setTanggalLahir] = useState(
    isEdit ? targetGuru?.tanggal_lahir || '' : ''
  );
  const [alamat, setAlamat] = useState(isEdit ? targetGuru?.alamat || '' : '');
  const [status, setStatus] = useState(isEdit ? targetGuru?.status || 'AKTIF' : 'AKTIF');
  const [tahunKeluar, setTahunKeluar] = useState(isEdit ? targetGuru?.tahun_keluar || '' : '');

  const [namaGuru, setNamaGuru] = useState(isEdit ? targetGuru?.nama_guru || '' : '');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState(isEdit ? targetGuru?.role || 'WALI_KELAS' : 'WALI_KELAS');
  const [kelasId, setKelasId] = useState(
    isEdit && targetGuru?.kelas_id ? String(targetGuru.kelas_id) : ''
  );
  const [kelasMapelIds, setKelasMapelIds] = useState(() =>
    isEdit && Array.isArray(targetGuru?.kelas_mapel_ids) ? targetGuru.kelas_mapel_ids : []
  );
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const toggleKelasMapel = (id) => {
    setKelasMapelIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!namaGuru.trim()) {
      setError('Nama lengkap guru wajib diisi.');
      return;
    }
    if (isAdmin && !username.trim()) {
      setError('Username login wajib diisi.');
      return;
    }
    if (!isEdit && !password.trim()) {
      setError('Kata sandi awal wajib diisi untuk akun baru.');
      return;
    }

    setBusy(true);
    try {
      const payload = {
        nama_guru: namaGuru.trim(),
        nip_nikki: nipNikki.trim() || null,
        nuptk: nuptk.trim() || null,
        nrg: nrg.trim() || null,
        golongan_ruang: golonganRuang.trim() || null,
        jabatan: jabatan.trim() || null,
        tmt_kerja: tmtKerja || null,
        tmt_sekolah: tmtSekolah || null,
        tingkat_pendidikan: tingkatPendidikan || null,
        jurusan: jurusan.trim() || null,
        jenis_kelamin: jenisKelamin || null,
        tempat_lahir: tempatLahir.trim() || null,
        tanggal_lahir: tanggalLahir || null,
        alamat: alamat.trim() || null,
      };
      if (password.trim()) {
        payload.password = password.trim();
      }
      if (isAdmin) {
        payload.username = username.trim();
        payload.role = role;
        payload.kelas_id = role === 'WALI_KELAS' && kelasId ? Number(kelasId) : null;
        if (role === 'GURU_MAPEL') {
          payload.kelas_mapel_ids = kelasMapelIds;
        }
        if (isEdit) {
          payload.status = status;
          payload.tahun_keluar = status === 'AKTIF' ? null : tahunKeluar.trim() || null;
        }
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
      size="lg"
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
          ? 'Anda dapat memperbarui nama lengkap, NIP/NIKKI, atau mengganti kata sandi akun Anda.'
          : 'Lengkapi username login, profil NIP/NIKKI (opsional), peran, dan kelas perwalian/mapel.'
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
            <label htmlFor="guru-username" className="mb-1.5 block text-sm font-semibold text-slate-800">
              Username
            </label>
            <input
              ref={firstRef}
              id="guru-username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Contoh: siti.aminah atau piket01"
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

        {/* Biodata & Profil Kepegawaian (Opsional) */}
        <fieldset className="space-y-3 rounded-xl border border-slate-200 bg-slate-50/70 p-3.5">
          <legend className="px-1 text-xs font-bold uppercase tracking-wider text-slate-700">
            Biodata & Profil Kepegawaian (Opsional)
          </legend>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label htmlFor="guru-nip-nikki" className="mb-1 block text-xs font-semibold text-slate-700">
                NIP / NIKKI
              </label>
              <input
                id="guru-nip-nikki"
                type="text"
                value={nipNikki}
                onChange={(e) => setNipNikki(e.target.value)}
                placeholder="Contoh: 199203032018011003"
                className={inputBase}
              />
            </div>

            <div>
              <label htmlFor="guru-jabatan" className="mb-1 block text-xs font-semibold text-slate-700">
                Jabatan / Mapel Bidang
              </label>
              <input
                id="guru-jabatan"
                type="text"
                value={jabatan}
                onChange={(e) => setJabatan(e.target.value)}
                placeholder="Contoh: Guru Kelas, Guru PJOK, Guru PAI"
                className={inputBase}
              />
            </div>

            <div>
              <label htmlFor="guru-golongan" className="mb-1 block text-xs font-semibold text-slate-700">
                Golongan / Ruang
              </label>
              <input
                id="guru-golongan"
                type="text"
                value={golonganRuang}
                onChange={(e) => setGolonganRuang(e.target.value)}
                placeholder="Contoh: III/a, IV/a, IX (PPPK)"
                className={inputBase}
              />
            </div>

            <div>
              <label htmlFor="guru-nuptk" className="mb-1 block text-xs font-semibold text-slate-700">
                NUPTK
              </label>
              <input
                id="guru-nuptk"
                type="text"
                value={nuptk}
                onChange={(e) => setNuptk(e.target.value)}
                placeholder="16 digit NUPTK"
                className={inputBase}
              />
            </div>

            <div>
              <label htmlFor="guru-nrg" className="mb-1 block text-xs font-semibold text-slate-700">
                NRG
              </label>
              <input
                id="guru-nrg"
                type="text"
                value={nrg}
                onChange={(e) => setNrg(e.target.value)}
                placeholder="Nomor Registrasi Guru"
                className={inputBase}
              />
            </div>

            <div>
              <label htmlFor="guru-jk" className="mb-1 block text-xs font-semibold text-slate-700">
                Jenis Kelamin
              </label>
              <select
                id="guru-jk"
                value={jenisKelamin}
                onChange={(e) => setJenisKelamin(e.target.value)}
                className={inputBase}
              >
                <option value="">Belum diisi</option>
                <option value="Laki-laki">Laki-laki</option>
                <option value="Perempuan">Perempuan</option>
              </select>
            </div>

            <div>
              <label htmlFor="guru-tmt-kerja" className="mb-1 block text-xs font-semibold text-slate-700">
                TMT Kerja
              </label>
              <input
                id="guru-tmt-kerja"
                type="date"
                value={tmtKerja}
                onChange={(e) => setTmtKerja(e.target.value)}
                className={inputBase}
              />
            </div>

            <div>
              <label htmlFor="guru-tmt-sekolah" className="mb-1 block text-xs font-semibold text-slate-700">
                TMT di Sekolah Ini
              </label>
              <input
                id="guru-tmt-sekolah"
                type="date"
                value={tmtSekolah}
                onChange={(e) => setTmtSekolah(e.target.value)}
                className={inputBase}
              />
            </div>

            <div>
              <label htmlFor="guru-pendidikan" className="mb-1 block text-xs font-semibold text-slate-700">
                Tingkat Pendidikan
              </label>
              <select
                id="guru-pendidikan"
                value={tingkatPendidikan}
                onChange={(e) => setTingkatPendidikan(e.target.value)}
                className={inputBase}
              >
                <option value="">Belum diisi</option>
                <option value="SMA / Sederajat">SMA / Sederajat</option>
                <option value="D1">D1</option>
                <option value="D2">D2</option>
                <option value="D3">D3</option>
                <option value="S1 / D4">S1 / D4</option>
                <option value="S2">S2</option>
                <option value="S3">S3</option>
              </select>
            </div>

            <div>
              <label htmlFor="guru-jurusan" className="mb-1 block text-xs font-semibold text-slate-700">
                Jurusan
              </label>
              <input
                id="guru-jurusan"
                type="text"
                value={jurusan}
                onChange={(e) => setJurusan(e.target.value)}
                placeholder="Contoh: PGSD, Pendidikan Jasmani"
                className={inputBase}
              />
            </div>

            <div>
              <label htmlFor="guru-tmplahir" className="mb-1 block text-xs font-semibold text-slate-700">
                Tempat Lahir
              </label>
              <input
                id="guru-tmplahir"
                type="text"
                value={tempatLahir}
                onChange={(e) => setTempatLahir(e.target.value)}
                placeholder="Contoh: Jakarta"
                className={inputBase}
              />
            </div>

            <div>
              <label htmlFor="guru-tgllahir" className="mb-1 block text-xs font-semibold text-slate-700">
                Tanggal Lahir
              </label>
              <input
                id="guru-tgllahir"
                type="date"
                value={tanggalLahir}
                onChange={(e) => setTanggalLahir(e.target.value)}
                className={inputBase}
              />
            </div>
          </div>

          <div>
            <label htmlFor="guru-alamat" className="mb-1 block text-xs font-semibold text-slate-700">
              Alamat Tempat Tinggal
            </label>
            <textarea
              id="guru-alamat"
              rows={2}
              value={alamat}
              onChange={(e) => setAlamat(e.target.value)}
              placeholder="Alamat lengkap domisili"
              className={inputBase}
            />
          </div>
        </fieldset>

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
                <option value="PIKET">Petugas Piket (Lihat Semua Kelas)</option>
              </select>
              {role === 'PIKET' && (
                <p className="mt-1.5 rounded-lg border border-teal-200 bg-teal-50 px-3 py-2 text-xs text-teal-900">
                  Akun Piket hanya dapat melihat tab Presensi Harian untuk seluruh kelas tanpa hak ubah/hapus. Pengelolaan akun ini hanya dapat dilakukan oleh Admin.
                </p>
              )}
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

            {role === 'GURU_MAPEL' && (
              <fieldset className="space-y-2.5 rounded-xl border border-slate-200 bg-slate-50/70 p-3.5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <legend className="text-xs font-bold uppercase tracking-wider text-slate-700">
                    Kelas yang Diampu ({kelasMapelIds.length} dipilih)
                  </legend>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setKelasMapelIds(kelasList.map((k) => k.id))}
                      className="min-h-8 rounded-md px-2 text-xs font-bold text-[#0a4ea0] hover:bg-blue-100 focus-visible:outline-2 focus-visible:outline-[#098fd1] cursor-pointer"
                    >
                      Pilih Semua
                    </button>
                    {kelasMapelIds.length > 0 && (
                      <button
                        type="button"
                        onClick={() => setKelasMapelIds([])}
                        className="min-h-8 rounded-md px-2 text-xs font-semibold text-slate-600 hover:bg-slate-200 focus-visible:outline-2 focus-visible:outline-[#098fd1] cursor-pointer"
                      >
                        Kosongkan
                      </button>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  {kelasList.map((k) => {
                    const checked = kelasMapelIds.includes(k.id);
                    return (
                      <label
                        key={k.id}
                        className={`flex min-h-11 cursor-pointer items-center justify-center gap-1.5 rounded-lg border px-2 text-xs font-bold transition-colors ${
                          checked
                            ? 'border-[#0a4ea0] bg-blue-50 text-[#0a4ea0] ring-1 ring-[#098fd1]'
                            : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => toggleKelasMapel(k.id)}
                          className="h-4 w-4 accent-[#0a4ea0]"
                        />
                        <span>{k.nama_kelas}</span>
                      </label>
                    );
                  })}
                </div>
                <p className="text-xs text-slate-600">
                  1 guru mapel dapat mengisi lebih dari 1 kelas, dan 1 kelas dapat diisi lebih dari 1 guru mapel. Kosongkan semua jika guru dapat mengakses seluruh kelas.
                </p>
              </fieldset>
            )}
            {isEdit && (
              <fieldset className="space-y-2.5 rounded-xl border border-slate-200 bg-slate-50/70 p-3.5">
                <legend className="px-1 text-xs font-bold uppercase tracking-wider text-slate-700">
                  Status Keaktifan Guru
                </legend>
                <div className="space-y-2">
                  {STATUS_GURU_OPTIONS.map((opt) => {
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
                          name="status-guru"
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
                      htmlFor="guru-tahun-keluar"
                      className="mb-1 block text-xs font-bold text-slate-800"
                    >
                      Tahun {status === 'PENSIUN' ? 'Pensiun' : 'Mutasi Keluar'}{' '}
                      <span className="font-normal text-slate-500">(opsional)</span>
                    </label>
                    <input
                      id="guru-tahun-keluar"
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
        Apakah Anda yakin ingin menghapus akun <strong className="font-bold text-slate-900">{targetGuru?.nama_guru}</strong> (Username: {targetGuru?.username || targetGuru?.nip})?
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

  const [statusFilter, setStatusFilter] = useState('AKTIF');
  const [guruList, setGuruList] = useState([]);
  const [kelasList, setKelasList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [reloadTick, setReloadTick] = useState(0);

  const [guruDialog, setGuruDialog] = useState(null); // { type: 'create'|'edit'|'delete'|'history', guru }
  const [kelasDialog, setKelasDialog] = useState(null); // { type: 'create'|'edit'|'delete', kelas }

  useEffect(() => {
    let active = true;
    const activeStatusQuery = isAdmin ? statusFilter : 'AKTIF';
    const loadAll = async () => {
      setLoading(true);
      setError('');
      try {
        const [resGuru, resKelas] = await Promise.all([
          getGuru(activeStatusQuery),
          getKelas(),
        ]);
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
  }, [isAdmin, statusFilter, reloadTick]);

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
              {isAdmin && statusFilter === 'NONAKTIF'
                ? 'Arsip Guru Pensiun & Mutasi Keluar'
                : 'Data Guru & Petugas Piket'}
            </h2>
            <span className="rounded-md bg-blue-50 px-2 py-0.5 text-sm font-semibold text-[#0a4ea0]">
              {guruList.length} akun
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {isAdmin && (
              <div
                role="group"
                aria-label="Filter status keaktifan guru"
                className="inline-flex rounded-xl border border-slate-200 bg-slate-100 p-0.5"
              >
                <button
                  type="button"
                  onClick={() => setStatusFilter('AKTIF')}
                  className={`min-h-11 rounded-lg px-3.5 text-xs font-bold transition-colors focus-visible:outline-2 focus-visible:outline-[#098fd1] cursor-pointer sm:text-sm ${
                    statusFilter === 'AKTIF'
                      ? 'bg-white text-[#0a4ea0] shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Guru Aktif
                </button>
                <button
                  type="button"
                  onClick={() => setStatusFilter('NONAKTIF')}
                  className={`min-h-11 rounded-lg px-3.5 text-xs font-bold transition-colors focus-visible:outline-2 focus-visible:outline-[#098fd1] cursor-pointer sm:text-sm ${
                    statusFilter === 'NONAKTIF'
                      ? 'bg-white text-[#0a4ea0] shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Arsip Pensiun & Mutasi
                </button>
              </div>
            )}

            {myAccount && !isAdmin && (
              <button
                type="button"
                onClick={() => setGuruDialog({ type: 'edit', guru: myAccount })}
                className={btnPrimary}
              >
                Ubah Profil & Sandi Saya
              </button>
            )}
            {isAdmin && statusFilter === 'AKTIF' && (
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
          {guruList.length === 0 ? (
            <div className="px-6 py-12 text-center">
              <p className="font-bold text-slate-800">
                {statusFilter === 'NONAKTIF'
                  ? 'Belum ada arsip guru pensiun atau mutasi keluar'
                  : 'Belum ada data guru terdaftar'}
              </p>
              <p className="mx-auto mt-1 max-w-md text-sm text-slate-600">
                {statusFilter === 'NONAKTIF'
                  ? 'Guru yang status keaktifannya diubah menjadi Mutasi Keluar atau Pensiun melalui tombol Edit akan tampil di sini bersama riwayat mengajarnya.'
                  : 'Gunakan tombol + Tambah Guru untuk mendaftarkan akun guru atau petugas piket.'}
              </p>
            </div>
          ) : (
            <table className="w-full text-left text-sm">
              <caption className="sr-only">Daftar Guru SDN Ragunan 14 Pagi</caption>
              <thead className="border-b border-slate-200 bg-slate-50 text-slate-700">
                <tr>
                  <th scope="col" className="px-4 py-3 font-semibold sm:px-6">
                    Nama Guru
                  </th>
                  <th scope="col" className="hidden px-4 py-3 font-semibold sm:table-cell">
                    Username
                  </th>
                  <th scope="col" className="hidden px-4 py-3 font-semibold md:table-cell">
                    NIP / NIKKI
                  </th>
                  <th scope="col" className="px-4 py-3 font-semibold">
                    Peran & Kelas
                  </th>
                  <th scope="col" className="px-4 py-3 font-semibold">
                    Status
                  </th>
                  <th scope="col" className="px-4 py-3 text-right font-semibold sm:px-6">
                    Aksi
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {guruList.map((g) => {
                  const isMe = g.id === currentUser?.id;
                  const canEditRow = isAdmin || (isMe && g.role !== 'PIKET');
                  const usernameVal = g.username || g.nip;
                  const mapelClasses = g.kelas_mapel || [];
                  const statusBadge =
                    STATUS_GURU_BADGE[g.status || 'AKTIF'] || STATUS_GURU_BADGE.AKTIF;
                  return (
                    <tr key={g.id} className="hover:bg-blue-50/40">
                      <td className="px-4 py-2 font-semibold text-slate-900 sm:px-6">
                        {isAdmin ? (
                          <button
                            type="button"
                            onClick={() => setGuruDialog({ type: 'history', guru: g })}
                            title={`Lihat biodata & riwayat mengajar ${g.nama_guru}`}
                            className="group inline-flex min-h-11 items-center gap-2 rounded-lg px-1.5 py-1 text-left transition-colors hover:bg-blue-50 hover:text-[#0a4ea0] focus-visible:outline-2 focus-visible:outline-[#098fd1] cursor-pointer"
                          >
                            <span>
                              <span className="block">{g.nama_guru}</span>
                              {g.jabatan && (
                                <span className="block text-xs font-medium text-slate-500">
                                  {g.jabatan}
                                </span>
                              )}
                            </span>
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
                        ) : (
                          <div className="py-1">
                            <div>{g.nama_guru}</div>
                            {g.jabatan && (
                              <div className="text-xs font-medium text-slate-500">
                                {g.jabatan}
                              </div>
                            )}
                          </div>
                        )}
                        <div className="mt-0.5 font-mono text-xs text-slate-500 sm:hidden">
                          Username: {usernameVal}
                        </div>
                        {g.nip_nikki && (
                          <div className="mt-0.5 font-mono text-xs text-slate-500 md:hidden">
                            NIP/NIKKI: {g.nip_nikki}
                          </div>
                        )}
                      </td>
                      <td className="hidden px-4 py-3 font-mono text-xs text-slate-700 sm:table-cell">
                        {usernameVal}
                      </td>
                      <td className="hidden px-4 py-3 font-mono text-xs text-slate-600 md:table-cell">
                        {g.nip_nikki || <span className="text-slate-400">-</span>}
                      </td>
                      <td className="px-4 py-3">
                        {g.role === 'WALI_KELAS' ? (
                          <span className="inline-block rounded-full border border-blue-200 bg-blue-50 px-2.5 py-0.5 text-xs font-bold text-[#0a4ea0]">
                            Wali Kelas {g.nama_kelas || '-'}
                          </span>
                        ) : g.role === 'PIKET' ? (
                          <span className="inline-block rounded-full border border-teal-200 bg-teal-50 px-2.5 py-0.5 text-xs font-bold text-teal-900">
                            Petugas Piket (Lihat Semua Kelas)
                          </span>
                        ) : (
                          <div className="flex flex-wrap items-center gap-1.5">
                            <span className="inline-block rounded-full border border-amber-200 bg-amber-50 px-2.5 py-0.5 text-xs font-bold text-amber-800">
                              Guru Mapel
                            </span>
                            {mapelClasses.length > 0 ? (
                              mapelClasses.map((km) => (
                                <span
                                  key={km.id}
                                  className="inline-block rounded-md border border-slate-200 bg-slate-100 px-2 py-0.5 text-[11px] font-bold text-slate-700"
                                >
                                  {km.nama_kelas}
                                </span>
                              ))
                            ) : (
                              <span className="text-xs font-medium text-slate-500">
                                {g.status && g.status !== 'AKTIF' ? '-' : 'Semua kelas'}
                              </span>
                            )}
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-block rounded-full border px-2.5 py-0.5 text-xs font-bold ${statusBadge.cls}`}
                        >
                          {g.tahun_keluar ? `${statusBadge.label} (${g.tahun_keluar})` : statusBadge.label}
                        </span>
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
          )}
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
                <th scope="col" className="hidden px-4 py-3 font-semibold md:table-cell">
                  Guru Mapel Pengajar
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
                    {k.guru_mapel?.length > 0 && (
                      <div className="mt-1 flex flex-wrap gap-1 md:hidden">
                        {k.guru_mapel.map((gm) => (
                          <span
                            key={gm.id}
                            className="inline-block rounded-md border border-amber-200 bg-amber-50 px-2 py-0.5 text-[11px] font-semibold text-amber-900"
                          >
                            {gm.nama_guru}
                          </span>
                        ))}
                      </div>
                    )}
                  </td>
                  <td className="hidden px-4 py-3 md:table-cell">
                    {k.guru_mapel?.length > 0 ? (
                      <div className="flex flex-wrap gap-1.5">
                        {k.guru_mapel.map((gm) => (
                          <span
                            key={gm.id}
                            className="inline-block rounded-md border border-amber-200 bg-amber-50 px-2 py-0.5 text-xs font-semibold text-amber-900"
                          >
                            {gm.nama_guru}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <span className="text-xs text-slate-500">Belum ada</span>
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
                username: updatedGuru.username,
                nip: updatedGuru.username || updatedGuru.nip,
                nip_nikki: updatedGuru.nip_nikki,
                role: updatedGuru.role,
                kelas_id: updatedGuru.kelas_id,
                nama_kelas: updatedGuru.nama_kelas,
                kelas_mapel_ids: updatedGuru.kelas_mapel_ids,
                kelas_mapel: updatedGuru.kelas_mapel,
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

      {guruDialog?.type === 'history' && isAdmin && (
        <GuruHistoryModal
          key={`history-guru-${guruDialog.guru?.id}`}
          open
          targetGuru={guruDialog.guru}
          onClose={() => setGuruDialog(null)}
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

