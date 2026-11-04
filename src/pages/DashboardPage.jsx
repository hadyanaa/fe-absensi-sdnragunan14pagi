import React, { useCallback, useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { getKelas } from '../services/api';
import Topbar from '../components/Topbar';
import TabNav from '../components/TabNav';
import PresensiTab from '../components/PresensiTab';
import SiswaTab from '../components/siswa/SiswaTab';
import GuruKelasTab from '../components/admin/GuruKelasTab';

const IconPresensi = (
  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
    <path
      strokeLinecap="round"/*  */
      strokeLinejoin="round"
      strokeWidth="2"
      d="M8 7V3m8 4V3M4 11h16M5 5h14a1 1 0 011 1v13a1 1 0 01-1 1H5a1 1 0 01-1-1V6a1 1 0 011-1zm4 10l2 2 4-4"
    />
  </svg>
);

const IconSiswa = (
  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2"
      d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"
    />
  </svg>
);

const IconSekolah = (
  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2"
      d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
    />
  </svg>
);

export default function DashboardPage() {
  const { guru } = useAuth();
  const isWali = guru?.role === 'WALI_KELAS';
  const isAdmin = guru?.role === 'ADMIN' || guru?.role === 'admin';
  const guruKelasId = guru?.kelas_id || null;

  const [activeTab, setActiveTab] = useState('presensi');
  const [kelasList, setKelasList] = useState([]);
  const [selectedKelasId, setSelectedKelasId] = useState(guruKelasId);
  const [rosterVersion, setRosterVersion] = useState(0);
  const [kelasTick, setKelasTick] = useState(0);
  const [unsavedPresensi, setUnsavedPresensi] = useState(0);

  useEffect(() => {
    let active = true;
    const loadKelas = async () => {
      try {
        const res = await getKelas();
        if (!active) return;
        if (res.data?.success) {
          const list = res.data.data || [];
          setKelasList(list);
          if (isWali && guruKelasId) {
            setSelectedKelasId(guruKelasId);
          } else {
            setSelectedKelasId((curr) => curr || list[0]?.id || null);
          }
        }
      } catch (err) {
        console.error('Gagal mengambil daftar kelas:', err);
      }
    };
    loadKelas();
    return () => {
      active = false;
    };
  }, [isWali, guruKelasId, kelasTick]);

  const handleRosterChange = useCallback(() => {
    setRosterVersion((v) => v + 1);
    setKelasTick((t) => t + 1);
  }, []);

  const tabs = [
    {
      id: 'presensi',
      label: 'Presensi Harian',
      shortLabel: 'Presensi',
      icon: IconPresensi,
      badge: activeTab !== 'presensi' && unsavedPresensi > 0 ? unsavedPresensi : null,
    },
    {
      id: 'siswa',
      label: 'Kelola Data Siswa',
      shortLabel: 'Data Siswa',
      icon: IconSiswa,
    },
    {
      id: 'guru-kelas',
      label: isAdmin ? 'Kelola Guru & Kelas' : 'Data Guru & Kelas',
      shortLabel: 'Guru & Kelas',
      icon: IconSekolah,
    },
  ];

  return (
    <div className="min-h-screen bg-[#f9fafa] pb-16 font-['Plus_Jakarta_Sans',sans-serif] text-slate-800">
      <Topbar />
      <TabNav tabs={tabs} activeId={activeTab} onChange={setActiveTab} />

      <main className="mx-auto max-w-[1540px] px-3 pt-5 sm:px-8 sm:pt-6">
        <div
          id="panel-presensi"
          role="tabpanel"
          aria-labelledby="tab-presensi"
          hidden={activeTab !== 'presensi'}
        >
          <PresensiTab
            guru={guru}
            kelasList={kelasList}
            selectedKelasId={selectedKelasId}
            onSelectKelas={setSelectedKelasId}
            rosterVersion={rosterVersion}
            onUnsavedChange={setUnsavedPresensi}
            onOpenSiswaTab={() => setActiveTab('siswa')}
          />
        </div>

        <div
          id="panel-siswa"
          role="tabpanel"
          aria-labelledby="tab-siswa"
          hidden={activeTab !== 'siswa'}
        >
          <SiswaTab
            guru={guru}
            kelasList={kelasList}
            selectedKelasId={selectedKelasId}
            onSelectKelas={(id) => {
              if (
                unsavedPresensi > 0 &&
                !window.confirm(
                  'Ada perubahan presensi yang belum disimpan untuk kelas ini. Ganti kelas dan buang perubahan tersebut?'
                )
              ) {
                return;
              }
              setSelectedKelasId(id);
            }}
            onRosterChange={handleRosterChange}
          />
        </div>

        {activeTab === 'guru-kelas' && (
          <div id="panel-guru-kelas" role="tabpanel" aria-labelledby="tab-guru-kelas">
            <GuruKelasTab onDataChanged={handleRosterChange} />
          </div>
        )}
      </main>
    </div>
  );
}
