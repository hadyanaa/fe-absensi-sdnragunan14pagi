import React, { useEffect, useState } from 'react';
import { getGuruHistory, getErrorMessage } from '../../services/api';
import { hitungUsia } from '../../utils/usia';
import Modal, { btnPrimary, btnSecondary, Spinner } from '../Modal';

const NAMA_BULAN_LENGKAP = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember',
];

const formatTglIndo = (isoDate) => {
  if (!isoDate) return '-';
  const parts = String(isoDate).split('T')[0].split('-');
  if (parts.length !== 3) return isoDate;
  const [y, m, d] = parts;
  const mName = NAMA_BULAN_LENGKAP[parseInt(m, 10) - 1] || m;
  return `${parseInt(d, 10)} ${mName} ${y}`;
};

const ROLE_LABEL = {
  WALI_KELAS: 'Wali Kelas',
  GURU_MAPEL: 'Guru Bidang Studi',
  PIKET: 'Petugas Piket',
};

const STATUS_GURU_BADGE = {
  AKTIF: {
    label: 'Aktif Bertugas',
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

/**
 * Popup card detail kepegawaian & riwayat mengajar guru per Tahun Ajaran (khusus Admin).
 */
export default function GuruHistoryModal({ open, targetGuru, onClose }) {
  const guruId = targetGuru?.id;
  const [activeTab, setActiveTab] = useState('riwayat');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [data, setData] = useState(null);
  const [reloadTick, setReloadTick] = useState(0);

  useEffect(() => {
    if (!open || !guruId) return undefined;
    let active = true;

    const load = async () => {
      setLoading(true);
      setError('');
      try {
        const res = await getGuruHistory(guruId);
        if (!active) return;
        if (res.data?.success) {
          setData(res.data.data);
        } else {
          setError(res.data?.message || 'Riwayat guru gagal dimuat.');
        }
      } catch (err) {
        if (!active) return;
        setError(getErrorMessage(err, 'Riwayat guru gagal dimuat.'));
      } finally {
        if (active) setLoading(false);
      }
    };

    load();
    return () => {
      active = false;
    };
  }, [open, guruId, reloadTick]);

  const g = data?.guru || targetGuru;
  const riwayat = data?.riwayat_mengajar || [];
  const statusInfo = STATUS_GURU_BADGE[g?.status || 'AKTIF'] || STATUS_GURU_BADGE.AKTIF;
  const statusText = g?.tahun_keluar
    ? `${statusInfo.label} (${g.tahun_keluar})`
    : statusInfo.label;
  const usia = hitungUsia(g?.tanggal_lahir);

  return (
    <Modal
      open={open}
      onClose={onClose}
      size="lg"
      title={`Profil & Riwayat Guru: ${g?.nama_guru || 'Guru'}`}
      description={`@${g?.username || g?.nip || '-'} | ${ROLE_LABEL[g?.role] || g?.role || '-'} | ${statusText}`}
      footer={
        <button type="button" onClick={onClose} className={btnSecondary}>
          Tutup
        </button>
      }
    >
      {loading && (
        <div className="flex flex-col items-center justify-center gap-3 py-12 text-center">
          <Spinner className="h-7 w-7 text-[#0a4ea0]" />
          <p className="text-sm font-semibold text-slate-600">
            Memuat profil & riwayat mengajar...
          </p>
        </div>
      )}

      {!loading && error && (
        <div role="alert" className="rounded-xl border border-rose-200 bg-rose-50/50 p-6 text-center">
          <p className="font-bold text-slate-900">Data guru belum bisa ditampilkan</p>
          <p className="mx-auto mt-1 max-w-md text-sm text-slate-600">{error}</p>
          <button
            type="button"
            onClick={() => setReloadTick((t) => t + 1)}
            className={`${btnPrimary} mt-4`}
          >
            Coba Muat Ulang
          </button>
        </div>
      )}

      {!loading && !error && data && (
        <div className="space-y-5">
          {/* Sub-tab Popup */}
          <div
            role="tablist"
            aria-label="Bagian profil guru"
            className="inline-flex w-full rounded-xl border border-slate-200 bg-slate-100 p-1 sm:w-auto"
          >
            {[
              { id: 'riwayat', label: 'Riwayat Mengajar per TA' },
              { id: 'biodata', label: 'Biodata & Kepegawaian' },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                role="tab"
                aria-selected={activeTab === tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`min-h-11 flex-1 rounded-lg px-4 text-xs font-bold transition-colors focus-visible:outline-2 focus-visible:outline-[#098fd1] cursor-pointer sm:flex-none sm:text-sm ${
                  activeTab === tab.id
                    ? 'bg-white text-[#0a4ea0] shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {activeTab === 'riwayat' ? (
            <div className="rounded-xl border border-slate-200 bg-white p-4">
              <h3 className="mb-3 text-sm font-bold text-slate-900">
                Jejak Tugas Mengajar per Tahun Ajaran
              </h3>
              {riwayat.length === 0 ? (
                <p className="py-6 text-center text-sm text-slate-600">
                  Belum ada catatan riwayat mengajar pada tahun ajaran mana pun.
                </p>
              ) : (
                <div className="overflow-x-auto rounded-lg border border-slate-200">
                  <table className="w-full text-left text-xs sm:text-sm">
                    <thead className="border-b border-slate-200 bg-slate-50 text-slate-700">
                      <tr>
                        <th scope="col" className="px-3 py-2.5 font-bold">
                          Tahun Ajaran
                        </th>
                        <th scope="col" className="px-3 py-2.5 font-bold">
                          Peran Sistem
                        </th>
                        <th scope="col" className="px-3 py-2.5 font-bold">
                          Jabatan / Mapel
                        </th>
                        <th scope="col" className="px-3 py-2.5 font-bold">
                          Kelas yang Diampu
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {riwayat.map((rm) => (
                        <tr key={rm.id || rm.tahun_ajaran}>
                          <td className="px-3 py-2.5 font-bold text-slate-900">
                            TA {rm.tahun_ajaran}
                          </td>
                          <td className="px-3 py-2.5 font-semibold text-slate-700">
                            {ROLE_LABEL[rm.role] || rm.role}
                          </td>
                          <td className="px-3 py-2.5 text-slate-700">
                            {rm.jabatan || '-'}
                          </td>
                          <td className="px-3 py-2.5">
                            <span className="inline-block rounded-md border border-blue-200 bg-blue-50 px-2.5 py-0.5 text-xs font-bold text-[#0a4ea0]">
                              {rm.keterangan_kelas}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          ) : (
            <div className="rounded-xl border border-slate-200 bg-white p-4">
              <h3 className="mb-3 text-sm font-bold text-slate-900">
                Detail Biodata & Kepegawaian
              </h3>
              <dl className="grid grid-cols-1 gap-x-6 gap-y-3 text-sm sm:grid-cols-2">
                <div>
                  <dt className="text-xs font-semibold text-slate-500">Nama Lengkap & Gelar</dt>
                  <dd className="mt-0.5 font-bold text-slate-900">{g?.nama_guru || '-'}</dd>
                </div>
                <div>
                  <dt className="text-xs font-semibold text-slate-500">Status Keaktifan</dt>
                  <dd className="mt-0.5">
                    <span className={`inline-block rounded-full border px-2.5 py-0.5 text-xs font-bold ${statusInfo.cls}`}>
                      {statusText}
                    </span>
                  </dd>
                </div>
                <div>
                  <dt className="text-xs font-semibold text-slate-500">Username Login</dt>
                  <dd className="mt-0.5 font-mono font-semibold text-slate-800">{g?.username || '-'}</dd>
                </div>
                <div>
                  <dt className="text-xs font-semibold text-slate-500">Jabatan / Mapel Bidang</dt>
                  <dd className="mt-0.5 font-semibold text-slate-800">{g?.jabatan || '-'}</dd>
                </div>
                <div>
                  <dt className="text-xs font-semibold text-slate-500">NIP / NIKKI</dt>
                  <dd className="mt-0.5 font-mono font-semibold text-slate-800">{g?.nip_nikki || '-'}</dd>
                </div>
                <div>
                  <dt className="text-xs font-semibold text-slate-500">Golongan / Ruang</dt>
                  <dd className="mt-0.5 font-semibold text-slate-800">{g?.golongan_ruang || '-'}</dd>
                </div>
                <div>
                  <dt className="text-xs font-semibold text-slate-500">NUPTK</dt>
                  <dd className="mt-0.5 font-mono font-semibold text-slate-800">{g?.nuptk || '-'}</dd>
                </div>
                <div>
                  <dt className="text-xs font-semibold text-slate-500">NRG</dt>
                  <dd className="mt-0.5 font-mono font-semibold text-slate-800">{g?.nrg || '-'}</dd>
                </div>
                <div>
                  <dt className="text-xs font-semibold text-slate-500">TMT Kerja</dt>
                  <dd className="mt-0.5 font-semibold text-slate-800">{formatTglIndo(g?.tmt_kerja)}</dd>
                </div>
                <div>
                  <dt className="text-xs font-semibold text-slate-500">TMT di Sekolah Ini</dt>
                  <dd className="mt-0.5 font-semibold text-slate-800">{formatTglIndo(g?.tmt_sekolah)}</dd>
                </div>
                <div>
                  <dt className="text-xs font-semibold text-slate-500">Tingkat Pendidikan</dt>
                  <dd className="mt-0.5 font-semibold text-slate-800">{g?.tingkat_pendidikan || '-'}</dd>
                </div>
                <div>
                  <dt className="text-xs font-semibold text-slate-500">Jurusan</dt>
                  <dd className="mt-0.5 font-semibold text-slate-800">{g?.jurusan || '-'}</dd>
                </div>
                <div>
                  <dt className="text-xs font-semibold text-slate-500">Jenis Kelamin</dt>
                  <dd className="mt-0.5 font-semibold text-slate-800">{g?.jenis_kelamin || '-'}</dd>
                </div>
                <div>
                  <dt className="text-xs font-semibold text-slate-500">Tempat, Tanggal Lahir</dt>
                  <dd className="mt-0.5 font-semibold text-slate-800">
                    {g?.tempat_lahir || g?.tanggal_lahir
                      ? `${g?.tempat_lahir || '-'}, ${formatTglIndo(g?.tanggal_lahir)}${
                          usia ? ` (${usia.label})` : ''
                        }`
                      : '-'}
                  </dd>
                </div>
                <div className="sm:col-span-2">
                  <dt className="text-xs font-semibold text-slate-500">Alamat</dt>
                  <dd className="mt-0.5 font-medium text-slate-800">{g?.alamat || '-'}</dd>
                </div>
              </dl>
            </div>
          )}
        </div>
      )}
    </Modal>
  );
}
