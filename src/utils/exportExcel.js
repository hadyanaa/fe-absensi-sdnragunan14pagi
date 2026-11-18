const NAMA_BULAN = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember',
];

const HARI_SINGKAT = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];

const xmlEscape = (val) =>
  String(val ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');

// Konversi indeks kolom 1-based menjadi huruf kolom Excel (1 -> A, 27 -> AA)
const colLetter = (n) => {
  let num = n;
  let str = '';
  while (num > 0) {
    const rem = (num - 1) % 26;
    str = String.fromCharCode(65 + rem) + str;
    num = Math.floor((num - 1) / 26);
  }
  return str;
};

// Builder ZIP (Stored / method 0) murni di browser untuk kemasan .xlsx standar OOXML
const crcTable = (() => {
  const table = new Uint32Array(256);
  for (let i = 0; i < 256; i++) {
    let c = i;
    for (let k = 0; k < 8; k++) {
      c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    }
    table[i] = c >>> 0;
  }
  return table;
})();

const crc32 = (bytes) => {
  let crc = 0xffffffff;
  for (let i = 0; i < bytes.length; i++) {
    crc = crcTable[(crc ^ bytes[i]) & 0xff] ^ (crc >>> 8);
  }
  return (crc ^ 0xffffffff) >>> 0;
};

const createZipBlob = (files) => {
  const encoder = new TextEncoder();
  const entries = files.map((f) => ({
    nameBytes: encoder.encode(f.path),
    dataBytes: encoder.encode(f.content),
  }));

  let localSize = 0;
  let centralSize = 0;
  entries.forEach((e) => {
    localSize += 30 + e.nameBytes.length + e.dataBytes.length;
    centralSize += 46 + e.nameBytes.length;
  });

  const totalSize = localSize + centralSize + 22;
  const buf = new Uint8Array(totalSize);
  const view = new DataView(buf.buffer);

  let localOffset = 0;
  entries.forEach((e) => {
    e.offset = localOffset;
    e.crc = crc32(e.dataBytes);

    view.setUint32(localOffset, 0x04034b50, true); // Local file header signature
    view.setUint16(localOffset + 4, 20, true); // Version needed
    view.setUint16(localOffset + 6, 0x0800, true); // UTF-8 flag
    view.setUint16(localOffset + 8, 0, true); // Stored (no compression)
    view.setUint16(localOffset + 10, 0, true); // Mod time
    view.setUint16(localOffset + 12, 0x21, true); // Mod date
    view.setUint32(localOffset + 14, e.crc, true);
    view.setUint32(localOffset + 18, e.dataBytes.length, true);
    view.setUint32(localOffset + 22, e.dataBytes.length, true);
    view.setUint16(localOffset + 26, e.nameBytes.length, true);
    view.setUint16(localOffset + 28, 0, true);

    buf.set(e.nameBytes, localOffset + 30);
    buf.set(e.dataBytes, localOffset + 30 + e.nameBytes.length);
    localOffset += 30 + e.nameBytes.length + e.dataBytes.length;
  });

  let centralOffset = localOffset;
  entries.forEach((e) => {
    view.setUint32(centralOffset, 0x02014b50, true); // Central directory signature
    view.setUint16(centralOffset + 4, 20, true);
    view.setUint16(centralOffset + 6, 20, true);
    view.setUint16(centralOffset + 8, 0x0800, true);
    view.setUint16(centralOffset + 10, 0, true);
    view.setUint16(centralOffset + 12, 0, true);
    view.setUint16(centralOffset + 14, 0x21, true);
    view.setUint32(centralOffset + 16, e.crc, true);
    view.setUint32(centralOffset + 20, e.dataBytes.length, true);
    view.setUint32(centralOffset + 24, e.dataBytes.length, true);
    view.setUint16(centralOffset + 28, e.nameBytes.length, true);
    view.setUint16(centralOffset + 30, 0, true);
    view.setUint16(centralOffset + 32, 0, true);
    view.setUint16(centralOffset + 34, 0, true);
    view.setUint16(centralOffset + 36, 0, true);
    view.setUint32(centralOffset + 38, 0, true);
    view.setUint32(centralOffset + 42, e.offset, true);

    buf.set(e.nameBytes, centralOffset + 46);
    centralOffset += 46 + e.nameBytes.length;
  });

  // End of central directory record
  view.setUint32(centralOffset, 0x06054b50, true);
  view.setUint16(centralOffset + 4, 0, true);
  view.setUint16(centralOffset + 6, 0, true);
  view.setUint16(centralOffset + 8, entries.length, true);
  view.setUint16(centralOffset + 10, entries.length, true);
  view.setUint32(centralOffset + 12, centralSize, true);
  view.setUint32(centralOffset + 16, localOffset, true);
  view.setUint16(centralOffset + 20, 0, true);

  return new Blob([buf], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
};

const STYLES_XML = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
  <fonts count="10">
    <font><sz val="10"/><color rgb="FF1E293B"/><name val="Calibri"/></font>
    <font><b/><sz val="13"/><color rgb="FF0A4EA0"/><name val="Calibri"/></font>
    <font><b/><sz val="10"/><color rgb="FF1E293B"/><name val="Calibri"/></font>
    <font><b/><sz val="10"/><color rgb="FFFFFFFF"/><name val="Calibri"/></font>
    <font><b/><sz val="9"/><color rgb="FF475569"/><name val="Calibri"/></font>
    <font><b/><sz val="10"/><color rgb="FF065F46"/><name val="Calibri"/></font>
    <font><b/><sz val="10"/><color rgb="FF92400E"/><name val="Calibri"/></font>
    <font><b/><sz val="10"/><color rgb="FF075985"/><name val="Calibri"/></font>
    <font><b/><sz val="10"/><color rgb="FF9F1239"/><name val="Calibri"/></font>
    <font><sz val="10"/><color rgb="FF94A3B8"/><name val="Calibri"/></font>
  </fonts>
  <fills count="9">
    <fill><patternFill patternType="none"/></fill>
    <fill><patternFill patternType="gray125"/></fill>
    <fill><patternFill patternType="solid"><fgColor rgb="FF0A4EA0"/></patternFill></fill>
    <fill><patternFill patternType="solid"><fgColor rgb="FFE2E8F0"/></patternFill></fill>
    <fill><patternFill patternType="solid"><fgColor rgb="FFD1FAE5"/></patternFill></fill>
    <fill><patternFill patternType="solid"><fgColor rgb="FFFEF3C7"/></patternFill></fill>
    <fill><patternFill patternType="solid"><fgColor rgb="FFE0F2FE"/></patternFill></fill>
    <fill><patternFill patternType="solid"><fgColor rgb="FFFFE4E6"/></patternFill></fill>
    <fill><patternFill patternType="solid"><fgColor rgb="FFF1F5F9"/></patternFill></fill>
  </fills>
  <borders count="2">
    <border><left/><right/><top/><bottom/><diagonal/></border>
    <border>
      <left style="thin"><color rgb="FFCBD5E1"/></left>
      <right style="thin"><color rgb="FFCBD5E1"/></right>
      <top style="thin"><color rgb="FFCBD5E1"/></top>
      <bottom style="thin"><color rgb="FFCBD5E1"/></bottom>
      <diagonal/>
    </border>
  </borders>
  <cellStyleXfs count="1">
    <xf numFmtId="0" fontId="0" fillId="0" borderId="0"/>
  </cellStyleXfs>
  <cellXfs count="17">
    <xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/>
    <xf numFmtId="0" fontId="1" fillId="0" borderId="0" xfId="0" applyFont="1" applyAlignment="1"><alignment vertical="center"/></xf>
    <xf numFmtId="0" fontId="2" fillId="0" borderId="0" xfId="0" applyFont="1" applyAlignment="1"><alignment vertical="center"/></xf>
    <xf numFmtId="0" fontId="3" fillId="2" borderId="1" xfId="0" applyFont="1" applyFill="1" applyBorder="1" applyAlignment="1"><alignment horizontal="center" vertical="center" wrapText="1"/></xf>
    <xf numFmtId="0" fontId="4" fillId="3" borderId="1" xfId="0" applyFont="1" applyFill="1" applyBorder="1" applyAlignment="1"><alignment horizontal="center" vertical="center" wrapText="1"/></xf>
    <xf numFmtId="0" fontId="0" fillId="0" borderId="1" xfId="0" applyBorder="1" applyAlignment="1"><alignment horizontal="center" vertical="center"/></xf>
    <xf numFmtId="0" fontId="0" fillId="0" borderId="1" xfId="0" applyBorder="1" applyAlignment="1"><alignment horizontal="left" vertical="center"/></xf>
    <xf numFmtId="0" fontId="9" fillId="0" borderId="1" xfId="0" applyFont="1" applyBorder="1" applyAlignment="1"><alignment horizontal="center" vertical="center"/></xf>
    <xf numFmtId="0" fontId="9" fillId="8" borderId="1" xfId="0" applyFont="1" applyFill="1" applyBorder="1" applyAlignment="1"><alignment horizontal="center" vertical="center"/></xf>
    <xf numFmtId="0" fontId="5" fillId="4" borderId="1" xfId="0" applyFont="1" applyFill="1" applyBorder="1" applyAlignment="1"><alignment horizontal="center" vertical="center"/></xf>
    <xf numFmtId="0" fontId="6" fillId="5" borderId="1" xfId="0" applyFont="1" applyFill="1" applyBorder="1" applyAlignment="1"><alignment horizontal="center" vertical="center"/></xf>
    <xf numFmtId="0" fontId="7" fillId="6" borderId="1" xfId="0" applyFont="1" applyFill="1" applyBorder="1" applyAlignment="1"><alignment horizontal="center" vertical="center"/></xf>
    <xf numFmtId="0" fontId="8" fillId="7" borderId="1" xfId="0" applyFont="1" applyFill="1" applyBorder="1" applyAlignment="1"><alignment horizontal="center" vertical="center"/></xf>
    <xf numFmtId="0" fontId="4" fillId="3" borderId="1" xfId="0" applyFont="1" applyFill="1" applyBorder="1" applyAlignment="1"><alignment horizontal="center" vertical="center"/></xf>
    <xf numFmtId="0" fontId="2" fillId="8" borderId="1" xfId="0" applyFont="1" applyFill="1" applyBorder="1" applyAlignment="1"><alignment horizontal="center" vertical="center"/></xf>
    <xf numFmtId="0" fontId="2" fillId="8" borderId="1" xfId="0" applyFont="1" applyFill="1" applyBorder="1" applyAlignment="1"><alignment horizontal="right" vertical="center"/></xf>
    <xf numFmtId="9" fontId="2" fillId="8" borderId="1" xfId="0" applyNumberFormat="1" applyFont="1" applyFill="1" applyBorder="1" applyAlignment="1"><alignment horizontal="center" vertical="center"/></xf>
  </cellXfs>
</styleSheet>`;

const formulaEscape = (val) =>
  String(val ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

const strCell = (ref, styleIdx, text) =>
  `<c r="${ref}" s="${styleIdx}" t="inlineStr"><is><t>${xmlEscape(text)}</t></is></c>`;

const numCell = (ref, styleIdx, num) =>
  `<c r="${ref}" s="${styleIdx}"><v>${Number(num) || 0}</v></c>`;

const formulaCell = (ref, styleIdx, formula, cachedNum = 0) =>
  `<c r="${ref}" s="${styleIdx}"><f>${formulaEscape(formula)}</f><v>${
    Number.isFinite(cachedNum) ? cachedNum : 0
  }</v></c>`;

/**
 * Ekspor matriks absensi bulanan menjadi file Excel (.xlsx) asli lengkap dengan warna status dan rekapitulasi.
 */
export function exportAbsensiToExcel({
  namaKelas = '',
  waliKelas = '',
  bulan,
  tahun,
  totalHari = 31,
  dataMurid = [],
  stagedChanges = {},
}) {
  const namaBulan = NAMA_BULAN[(bulan || 1) - 1] || '';
  const namaWali =
    typeof waliKelas === 'object' && waliKelas !== null
      ? waliKelas.nama_guru || waliKelas.namaGuru || '-'
      : String(waliKelas || '-');
  const daysArray = Array.from({ length: totalHari || 31 }, (_, i) => i + 1);
  const totalCols = 2 + daysArray.length + 5; // No, Nama, 1..N, H, S, I, A, % Hadir
  const lastColLetter = colLetter(totalCols);

  const getStatus = (murid, day) => {
    const key = `${murid.murid_id}_${day}`;
    if (stagedChanges[key] !== undefined) return stagedChanges[key];
    return murid.absensi?.[String(day)] || null;
  };

  // Lebar kolom
  const colsXml = [
    `<col min="1" max="1" width="6" customWidth="1"/>`,
    `<col min="2" max="2" width="30" customWidth="1"/>`,
    `<col min="3" max="${2 + daysArray.length}" width="4.5" customWidth="1"/>`,
    `<col min="${3 + daysArray.length}" max="${6 + daysArray.length}" width="6.5" customWidth="1"/>`,
    `<col min="${7 + daysArray.length}" max="${7 + daysArray.length}" width="10" customWidth="1"/>`,
  ].join('');

  const rowsXml = [];
  const merges = [
    `A1:${lastColLetter}1`,
    `A2:${lastColLetter}2`,
    'A4:A5',
    'B4:B5',
    `C4:${colLetter(2 + daysArray.length)}4`,
    `${colLetter(3 + daysArray.length)}4:${lastColLetter}4`,
  ];

  // Baris 1 & 2: Judul Lembar Presensi
  rowsXml.push(
    `<row r="1" ht="22" customHeight="1">${strCell(
      'A1',
      1,
      `DAFTAR HADIR SISWA SDN RAGUNAN 14 PAGI - KELAS ${namaKelas}`
    )}</row>`
  );
  rowsXml.push(
    `<row r="2" ht="18" customHeight="1">${strCell(
      'A2',
      2,
      `Periode: ${namaBulan} ${tahun}   |   Wali Kelas: ${namaWali}   |   Jumlah Siswa: ${dataMurid.length}`
    )}</row>`
  );

  // Baris 4: Header Utama Tabel
  const row4Cells = [
    strCell('A4', 3, 'No'),
    strCell('B4', 3, 'Nama Lengkap Siswa'),
  ];
  daysArray.forEach((d, idx) => {
    const col = colLetter(3 + idx);
    row4Cells.push(strCell(`${col}4`, 3, idx === 0 ? `Tanggal (${namaBulan} ${tahun})` : ''));
  });
  const rekapStartIdx = 3 + daysArray.length;
  ['Rekapitulasi', '', '', '', ''].forEach((label, idx) => {
    row4Cells.push(strCell(`${colLetter(rekapStartIdx + idx)}4`, 3, label));
  });
  rowsXml.push(`<row r="4" ht="20" customHeight="1">${row4Cells.join('')}</row>`);

  // Baris 5: Sub-header Nomor Tanggal & Singkatan Hari + Kolom Rekap
  const row5Cells = [strCell('A5', 3, ''), strCell('B5', 3, '')];
  daysArray.forEach((day, idx) => {
    const dateObj = new Date(tahun, bulan - 1, day);
    const dayIdx = dateObj.getDay();
    const isWeekend = dayIdx === 0 || dayIdx === 6;
    const col = colLetter(3 + idx);
    row5Cells.push(
      strCell(`${col}5`, isWeekend ? 4 : 3, `${day}\n${HARI_SINGKAT[dayIdx]}`)
    );
  });
  ['H', 'S', 'I', 'A', '% Hadir'].forEach((label, idx) => {
    row5Cells.push(strCell(`${colLetter(rekapStartIdx + idx)}5`, 3, label));
  });
  rowsXml.push(`<row r="5" ht="28" customHeight="1">${row5Cells.join('')}</row>`);

  // Baris Data Siswa (mulai baris 6)
  let grandTotals = { H: 0, S: 0, I: 0, A: 0 };
  const firstDayCol = colLetter(3);
  const lastDayCol = colLetter(2 + daysArray.length);
  const colH = colLetter(rekapStartIdx);
  const colS = colLetter(rekapStartIdx + 1);
  const colI = colLetter(rekapStartIdx + 2);
  const colA = colLetter(rekapStartIdx + 3);
  const colPersen = colLetter(rekapStartIdx + 4);

  dataMurid.forEach((murid, idx) => {
    const r = 6 + idx;
    const cells = [
      numCell(`A${r}`, 5, murid.no_urut || idx + 1),
      strCell(`B${r}`, 6, murid.nama_murid),
    ];

    const rekap = { H: 0, S: 0, I: 0, A: 0 };
    daysArray.forEach((day, dIdx) => {
      const dateObj = new Date(tahun, bulan - 1, day);
      const isWeekend = dateObj.getDay() === 0 || dateObj.getDay() === 6;
      const st = getStatus(murid, day);
      const col = colLetter(3 + dIdx);

      let styleIdx = isWeekend ? 8 : 7;
      if (st === 'H') styleIdx = 9;
      else if (st === 'S') styleIdx = 10;
      else if (st === 'I') styleIdx = 11;
      else if (st === 'A') styleIdx = 12;
      else if (st === 'L') styleIdx = 13;

      if (st && rekap[st] !== undefined) {
        rekap[st]++;
        grandTotals[st]++;
      }

      cells.push(strCell(`${col}${r}`, styleIdx, st || '-'));
    });

    const totalHariAktif = rekap.H + rekap.S + rekap.I + rekap.A;
    const cachedRatio =
      totalHariAktif > 0 ? Number((rekap.H / totalHariAktif).toFixed(4)) : 0;
    const rowDateRange = `${firstDayCol}${r}:${lastDayCol}${r}`;
    const rowRekapRange = `${colH}${r}:${colA}${r}`;

    cells.push(formulaCell(`${colH}${r}`, 14, `COUNTIF(${rowDateRange},"H")`, rekap.H));
    cells.push(formulaCell(`${colS}${r}`, 14, `COUNTIF(${rowDateRange},"S")`, rekap.S));
    cells.push(formulaCell(`${colI}${r}`, 14, `COUNTIF(${rowDateRange},"I")`, rekap.I));
    cells.push(formulaCell(`${colA}${r}`, 14, `COUNTIF(${rowDateRange},"A")`, rekap.A));
    cells.push(
      formulaCell(
        `${colPersen}${r}`,
        16,
        `IF(SUM(${rowRekapRange})>0,${colH}${r}/SUM(${rowRekapRange}),0)`,
        cachedRatio
      )
    );

    rowsXml.push(`<row r="${r}" ht="19" customHeight="1">${cells.join('')}</row>`);
  });

  // Baris Total Keseluruhan di Bawah Tabel
  const firstStudentRow = 6;
  const lastStudentRow = Math.max(6, 6 + dataMurid.length - 1);
  const summaryRowIdx = 6 + dataMurid.length;
  merges.push(`A${summaryRowIdx}:${lastDayCol}${summaryRowIdx}`);

  const summaryCells = [
    strCell(`A${summaryRowIdx}`, 15, 'TOTAL REKAPITULASI KELAS'),
  ];
  for (let c = 2; c <= 2 + daysArray.length; c++) {
    summaryCells.push(strCell(`${colLetter(c)}${summaryRowIdx}`, 15, ''));
  }
  const totalAll = grandTotals.H + grandTotals.S + grandTotals.I + grandTotals.A;
  const cachedTotalRatio =
    totalAll > 0 ? Number((grandTotals.H / totalAll).toFixed(4)) : 0;
  const summaryRekapRange = `${colH}${summaryRowIdx}:${colA}${summaryRowIdx}`;

  summaryCells.push(
    formulaCell(
      `${colH}${summaryRowIdx}`,
      14,
      `SUM(${colH}${firstStudentRow}:${colH}${lastStudentRow})`,
      grandTotals.H
    )
  );
  summaryCells.push(
    formulaCell(
      `${colS}${summaryRowIdx}`,
      14,
      `SUM(${colS}${firstStudentRow}:${colS}${lastStudentRow})`,
      grandTotals.S
    )
  );
  summaryCells.push(
    formulaCell(
      `${colI}${summaryRowIdx}`,
      14,
      `SUM(${colI}${firstStudentRow}:${colI}${lastStudentRow})`,
      grandTotals.I
    )
  );
  summaryCells.push(
    formulaCell(
      `${colA}${summaryRowIdx}`,
      14,
      `SUM(${colA}${firstStudentRow}:${colA}${lastStudentRow})`,
      grandTotals.A
    )
  );
  summaryCells.push(
    formulaCell(
      `${colPersen}${summaryRowIdx}`,
      16,
      `IF(SUM(${summaryRekapRange})>0,${colH}${summaryRowIdx}/SUM(${summaryRekapRange}),0)`,
      cachedTotalRatio
    )
  );

  rowsXml.push(
    `<row r="${summaryRowIdx}" ht="22" customHeight="1">${summaryCells.join('')}</row>`
  );

  // Keterangan Legenda di Bawah
  const legendRowIdx = summaryRowIdx + 2;
  rowsXml.push(
    `<row r="${legendRowIdx}">${strCell(
      `B${legendRowIdx}`,
      0,
      'Keterangan: H = Hadir, S = Sakit, I = Izin, A = Alpa (Tanpa Keterangan), L = Libur'
    )}</row>`
  );

  const sheetXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
  <cols>${colsXml}</cols>
  <sheetData>${rowsXml.join('')}</sheetData>
  <mergeCells count="${merges.length}">
    ${merges.map((m) => `<mergeCell ref="${m}"/>`).join('')}
  </mergeCells>
</worksheet>`;

  const sheetName = `Kelas ${namaKelas || 'Presensi'} ${namaBulan}`.slice(0, 31);

  const files = [
    {
      path: '[Content_Types].xml',
      content: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>
  <Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>
  <Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>
</Types>`,
    },
    {
      path: '_rels/.rels',
      content: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/>
</Relationships>`,
    },
    {
      path: 'xl/workbook.xml',
      content: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
  <sheets>
    <sheet name="${xmlEscape(sheetName)}" sheetId="1" r:id="rId1"/>
  </sheets>
  <calcPr fullCalcOnLoad="1"/>
</workbook>`,
    },
    {
      path: 'xl/_rels/workbook.xml.rels',
      content: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/>
  <Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>
</Relationships>`,
    },
    {
      path: 'xl/styles.xml',
      content: STYLES_XML,
    },
    {
      path: 'xl/worksheets/sheet1.xml',
      content: sheetXml,
    },
  ];

  const blob = createZipBlob(files);
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  const safeKelas = String(namaKelas || 'Kelas').replace(/[^a-zA-Z0-9_-]/g, '');
  const filename = `Rekap_Absensi_Kelas_${safeKelas}_${namaBulan}_${tahun}.xlsx`;
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 2000);
  return filename;
}

