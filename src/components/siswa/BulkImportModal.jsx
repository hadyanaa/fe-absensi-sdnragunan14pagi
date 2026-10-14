import React, { useEffect, useMemo, useRef, useState } from 'react';
import Modal, { btnSecondary, Spinner } from '../Modal';
import { createMuridBulk, getErrorMessage } from '../../services/api';

/**
 * Ubah teks tempelan (WhatsApp / Excel) menjadi daftar nama.
 * Membuang nomor di depan ("1. ", "2) ", "3 - "), tanda bullet, spasi ganda, dan baris kosong.
 * Kolom dari Excel (dipisah tab) hanya diambil kolom pertama yang berisi huruf.
 */
export const parseNamaSiswa = (text) =>
  text
    .split(/\r?\n/)
    .map((line) => {
      const cells = line.split('\t').map((c) => c.trim());
      const cell = cells.find((c) => /\p{L}/u.test(c)) || '';
      return cell
        .replace(/^[\s•\-*]+/, '')
        .replace(/^\d+\s*(?:[.)\-:]\s*|\s+)/, '')
        .replace(/\s+/g, ' ')
        .trim();
    })
    .filter((nama) => /\p{L}/u.test(nama));

const PLACEHOLDER = `Contoh: Cukup paste nama siswa di sini (1 baris untuk 1 siswa):
Ahmad Fauzi
Budi Santoso
Citra Kirana
Dewi Lestari`;

export default function BulkImportModal({ open, kelasId, namaKelas, daftarSiswa, nextNoUrut, onClose, onSaved }) {
  const textareaRef = useRef(null);
  const [text, setText] = useState('');
  const [skipDuplikat, setSkipDuplikat] = useState(true);
  const [serverError, setServerError] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!open) return;
    setText('');
    setServerError('');
    setSkipDuplikat(true);
  }, [open]);

  const { semua, akanDiimpor, duplikat } = useMemo(() => {
    const terdaftar = new Set(daftarSiswa.map((m) => m.nama_murid.toLowerCase()));
    const dilihat = new Set();
    const rows = parseNamaSiswa(text).map((nama) => {
      const key = nama.toLowerCase();
      const sudahAda = terdaftar.has(key) || dilihat.has(key);
      dilihat.add(key);
      return { nama, sudahAda };
    });
    const target = skipDuplikat ? rows.filter((r) => !r.sudahAda) : rows;
    return { semua: rows, akanDiimpor: target, duplikat: rows.filter((r) => r.sudahAda).length };
  }, [text, daftarSiswa, skipDuplikat]);

  const handleImport = async () => {
    setServerError('');
    if (akanDiimpor.length === 0) return;
    setBusy(true);
    try {
      const res = await createMuridBulk({ kelas_id: kelasId, murid: akanDiimpor.map((r) => r.nama) });
      if (res.data?.success) {
        onSaved(`${res.data.count ?? akanDiimpor.length} siswa ditambahkan ke Kelas ${namaKelas}.`);
      } else {
        setServerError(res.data?.message || 'Import gagal. Tidak ada siswa yang ditambahkan.');
      }
    } catch (err) {
      setServerError(getErrorMessage(err, 'Import gagal. Tidak ada siswa yang ditambahkan.'));
    } finally {
      setBusy(false);
    }
  };

  // Nomor urut pratinjau dihitung dengan aturan yang sama seperti backend: lanjut dari nomor terakhir
  let nomor = nextNoUrut;

  return (
    <Modal
      open={open}
      onClose={onClose}
      busy={busy}
      size="lg"
      initialFocusRef={textareaRef}
      title={`Import Banyak Siswa ke Kelas ${namaKelas}`}
      description="Salin daftar nama dari WhatsApp atau Excel, lalu tempel di bawah. Nomor di depan nama dibuang otomatis."
      footer={
        <>
          <button type="button" onClick={onClose} disabled={busy} className={btnSecondary}>
            Batal
          </button>
          <button
            type="button"
            onClick={handleImport}
            disabled={busy || akanDiimpor.length === 0}
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-emerald-600 px-4 text-sm font-bold text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600 cursor-pointer"
          >
            {busy && <Spinner />}
            {busy
              ? 'Mengimpor...'
              : akanDiimpor.length > 0
                ? `Import Sekarang (${akanDiimpor.length} siswa)`
                : 'Import Sekarang'}
          </button>
        </>
      }
    >
      <div className="grid gap-5 md:grid-cols-[minmax(0,1fr)_minmax(0,16rem)]">
        <div>
          <label htmlFor="bulk-text" className="mb-1.5 block text-sm font-semibold text-slate-800">
            Daftar nama siswa
          </label>
          <textarea
            ref={textareaRef}
            id="bulk-text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder={PLACEHOLDER}
            rows={12}
            spellCheck={false}
            aria-describedby="bulk-summary"
            className="w-full resize-y rounded-lg border border-slate-300 px-3.5 py-3 font-['Plus_Jakarta_Sans',sans-serif] text-base leading-relaxed text-slate-900 placeholder-slate-400 focus:border-[#098fd1] focus:outline-none focus:ring-4 focus:ring-[#098fd1]/15 sm:text-sm"
          />

          <div id="bulk-summary" aria-live="polite" className="mt-2 text-sm">
            {semua.length === 0 ? (
              <p className="text-slate-500">Belum ada nama yang terbaca.</p>
            ) : (
              <p className="font-semibold text-slate-800">
                {semua.length} siswa terdeteksi
                {duplikat > 0 && <span className="font-normal text-amber-800">, {duplikat} sudah terdaftar atau ganda</span>}
              </p>
            )}
          </div>

          {duplikat > 0 && (
            <label className="mt-2 flex min-h-11 cursor-pointer items-center gap-2.5 text-sm text-slate-700">
              <input
                type="checkbox"
                checked={skipDuplikat}
                onChange={(e) => setSkipDuplikat(e.target.checked)}
                className="h-5 w-5 rounded border-slate-300 accent-[#0a4ea0]"
              />
              Lewati nama yang sudah ada di kelas ini
            </label>
          )}

          {serverError && (
            <p role="alert" className="mt-3 rounded-lg border border-rose-200 bg-rose-50 px-3.5 py-2.5 text-sm font-medium text-rose-800">
              {serverError}
            </p>
          )}
        </div>

        {/* Pratinjau supaya guru bisa memeriksa hasil potongan nama sebelum disimpan */}
        <div className="min-w-0">
          <p className="mb-1.5 text-sm font-semibold text-slate-800">Pratinjau nomor urut</p>
          <div className="max-h-72 overflow-y-auto rounded-lg border border-slate-200 bg-slate-50">
            {semua.length === 0 ? (
              <p className="px-3.5 py-6 text-center text-sm text-slate-500">Hasil potongan nama akan muncul di sini.</p>
            ) : (
              <ol className="divide-y divide-slate-200 text-sm">
                {semua.map((row, i) => {
                  const dilewati = row.sudahAda && skipDuplikat;
                  const no = dilewati ? null : nomor++;
                  return (
                    <li key={`${row.nama}-${i}`} className={`flex items-baseline gap-2.5 px-3.5 py-2 ${dilewati ? 'text-slate-400' : 'text-slate-800'}`}>
                      <span className="w-7 shrink-0 text-right font-semibold tabular-nums text-slate-500">{no ?? '-'}</span>
                      <span className={`min-w-0 break-words ${dilewati ? 'line-through' : ''}`}>{row.nama}</span>
                      {row.sudahAda && <span className="ml-auto shrink-0 text-xs font-semibold text-amber-800">sudah ada</span>}
                    </li>
                  );
                })}
              </ol>
            )}
          </div>
        </div>
      </div>
    </Modal>
  );
}
