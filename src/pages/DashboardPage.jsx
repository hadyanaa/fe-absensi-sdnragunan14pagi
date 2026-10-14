import React, { useCallback, useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import Topbar from '../components/Topbar';
import TabNav from '../components/TabNav';
import PresensiTab from '../components/PresensiTab';
import SiswaTab from '../components/siswa/SiswaTab';

// Kalender bercentang: lembar presensi bulanan
const IconPresensi = (
  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3M4 11h16M5 5h14a1 1 0 011 1v13a1 1 0 01-1 1H5a1 1 0 01-1-1V6a1 1 0 011-1zm4 10l2 2 4-4" />
  </svg>
);
// Dua orang: daftar siswa satu kelas
const IconSiswa = (
  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
  </svg>
);

export default function DashboardPage() {
  const { guru } = useAuth();
  const isWali = guru?.role === 'WALI_KELAS';

  const [activeTab, setActiveTab] = useState('presensi');
  const [kelasList, setKelasList] = useState([]);
  const [selectedKelasId, setSelectedKelasId] = useState(guru?.kelas_id || null);
  // Naik setiap kali data siswa berubah, supaya lembar presensi ikut memuat ulang daftar siswanya
  const [rosterVersion, setRosterVersion] = useState(0);
  const [unsavedPresensi, setUnsavedPresensi] = useState(0);

  const fetchKelas = useCallback(async () => {
    try {
      const res = await api.get('/absensi/daftar-kelas');
      if (res.data?.success) {
        const list = res.data.data || [];
        setKelasList(list);
        if (isWali && guru?.kelas_id) setSelectedKelasId(guru.kelas_id);
        else setSelectedKelasId((curr) => curr || list[0]?.id || null);
      }
    } catch (err) {
      console.error('Gagal mengambil daftar kelas:', err);
    }
  }, [isWali, guru?.kelas_id]);

  useEffect(() => {
    fetchKelas();
  }, [fetchKelas]);

  const handleRosterChange = useCallback(() => {
    setRosterVersion((v) => v + 1);
    fetchKelas(); // jumlah siswa per kelas ikut berubah
  }, [fetchKelas]);

  const tabs = [
    {
      id: 'presensi',
      label: 'Presensi Harian',
      shortLabel: 'Presensi',
      icon: IconPresensi,
      // Penanda hanya muncul saat guru sedang di tab lain dan ada isian presensi yang belum disimpan
      badge: activeTab !== 'presensi' && unsavedPresensi > 0 ? unsavedPresensi : null,
    },
    { id: 'siswa', label: isWali ? 'Kelola Data Siswa' : 'Daftar Siswa', shortLabel: 'Data Siswa', icon: IconSiswa },
  ];

  return (
    <div className="min-h-screen bg-[#f9fafa] pb-16 font-['Plus_Jakarta_Sans',sans-serif] text-slate-800">
      <Topbar />
      <TabNav tabs={tabs} activeId={activeTab} onChange={setActiveTab} />

      <main className="mx-auto max-w-[1540px] px-3 pt-5 sm:px-8 sm:pt-6">
        {/* Kedua panel tetap terpasang agar isian presensi tidak hilang saat pindah tab */}
        <div id="panel-presensi" role="tabpanel" aria-labelledby="tab-presensi" hidden={activeTab !== 'presensi'}>
          <PresensiTab
            guru={guru}
            kelasList={kelasList}
            selectedKelasId={selectedKelasId}
            onSelectKelas={setSelectedKelasId}
            rosterVersion={rosterVersion}
            onUnsavedChange={setUnsavedPresensi}
          />
        </div>

        <div id="panel-siswa" role="tabpanel" aria-labelledby="tab-siswa" hidden={activeTab !== 'siswa'}>
          <SiswaTab
            guru={guru}
            kelasList={kelasList}
            selectedKelasId={selectedKelasId}
            onSelectKelas={(id) => {
              if (unsavedPresensi > 0 && !window.confirm('Ada perubahan presensi yang belum disimpan untuk kelas ini. Ganti kelas dan buang perubahan tersebut?')) return;
              setSelectedKelasId(id);
            }}
            onRosterChange={handleRosterChange}
          />
        </div>
      </main>
    </div>
  );
}
