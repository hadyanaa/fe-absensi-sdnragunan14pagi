/**
 * Menghitung usia otomatis dari tanggal lahir (YYYY-MM-DD) terhadap tanggal sistem saat ini.
 * Mengembalikan { tahun, bulan, label } atau null bila tanggal lahir belum diisi atau tidak valid.
 */
export function hitungUsia(tanggalLahirISO) {
  if (!tanggalLahirISO) return null;
  const parts = String(tanggalLahirISO).split('T')[0].split('-');
  if (parts.length !== 3) return null;

  const birthYear = parseInt(parts[0], 10);
  const birthMonth = parseInt(parts[1], 10);
  const birthDay = parseInt(parts[2], 10);
  if (isNaN(birthYear) || isNaN(birthMonth) || isNaN(birthDay)) return null;

  const now = new Date();
  const nowYear = now.getFullYear();
  const nowMonth = now.getMonth() + 1;
  const nowDay = now.getDate();

  let tahun = nowYear - birthYear;
  let bulan = nowMonth - birthMonth;

  if (nowDay < birthDay) {
    bulan -= 1;
  }
  if (bulan < 0) {
    tahun -= 1;
    bulan += 12;
  }
  if (tahun < 0) return null;

  return {
    tahun,
    bulan,
    label: bulan > 0 ? `${tahun} th ${bulan} bln` : `${tahun} tahun`,
  };
}
