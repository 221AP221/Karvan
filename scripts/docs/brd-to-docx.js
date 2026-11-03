// BRD.md → BRD.docx. Markdown-un bu sənəddə istifadə olunan hissələrini (başlıq, cədvəl, siyahı,
// kod bloku, sitat, xətt, sətirdaxili format) Word üslublarına çevirir.
const fs = require("node:fs");
const path = require("node:path");
const {
  AlignmentType,
  BorderStyle,
  Document,
  ExternalHyperlink,
  Footer,
  Header,
  ImageRun,
  HeadingLevel,
  LevelFormat,
  PageBreak,
  PageNumber,
  Packer,
  Paragraph,
  ShadingType,
  Table,
  TableCell,
  Bookmark,
  InternalHyperlink,
  TableOfContents,
  TableRow,
  TextRun,
  WidthType,
} = require("docx");

const BRAND = "D6127E";
const INK = "1F2227";
const MUTED = "6B7280";
const LINE = "E3E5E9";
const HEAD_BG = "F4F5F7";
const CODE_BG = "F7F7F8";

const PAGE = { width: 11906, height: 16838 }; // A4
const MARGIN = 1134; // 2 sm
const CONTENT_WIDTH = PAGE.width - MARGIN * 2;

const INPUT = process.argv[2];
const src = fs.readFileSync(INPUT, "utf8").split("\n");

// ---- sətirdaxili format: **qalın**, `kod`, [mətn](link), *maili*
function inline(text, base = {}) {
  const runs = [];
  const re = /(\*\*[^*]+\*\*)|(`[^`]+`)|(\[[^\]]+\]\([^)]+\))|(\*[^*\n]+\*)/g;
  let last = 0;
  let m;
  const push = (t, extra) => t && runs.push(new TextRun({ text: t, ...base, ...extra }));
  while ((m = re.exec(text))) {
    push(text.slice(last, m.index));
    const token = m[0];
    if (token.startsWith("**")) push(token.slice(2, -2), { bold: true });
    else if (token.startsWith("`")) push(token.slice(1, -1), { font: "Consolas", size: 18, color: "A3104F" });
    else if (token.startsWith("[")) {
      const [, label, href] = /\[([^\]]+)\]\(([^)]+)\)/.exec(token);
      runs.push(
        new ExternalHyperlink({
          link: /^https?:/.test(href) ? href : `https://github.com/221AP221/REKLAM/blob/main/docs/${href.replace(/^\.\//, "")}`,
          children: [new TextRun({ text: label, ...base, color: "1B64C4", underline: {} })],
        }),
      );
    } else push(token.slice(1, -1), { italics: true });
    last = m.index + token.length;
  }
  push(text.slice(last));
  return runs.length ? runs : [new TextRun({ text: "", ...base })];
}

const para = (text, opts = {}) => new Paragraph({ children: inline(text, opts.run), ...opts.paragraph });

// ---- başlıqlar: hər biri əlfəcinlə işarələnir ki, mündəricatdan keçid işləsin
const toc = [];
const coverMeta = [];
const headingPara = (text, level) => {
  const id = `h${toc.length + 1}`;
  toc.push({ id, level, text: text.replace(/[*`]/g, "") });
  return new Paragraph({
    heading: level === 1 ? HeadingLevel.HEADING_1 : HeadingLevel.HEADING_2,
    children: [new Bookmark({ id, children: inline(text) })],
  });
};

// ---- cədvəl: sütun enləri məzmunun uzunluğuna görə bölüşdürülür
function buildTable(rows) {
  const cols = rows[0].length;
  const weights = Array.from({ length: cols }, (_, c) => {
    const longest = Math.max(...rows.map((r) => (r[c] ?? "").replace(/[*`]/g, "").length));
    return Math.min(Math.max(longest, 6), 70);
  });
  // ən uzun bölünməyən söz sütunun minimum enini müəyyən edir ("Pri" → "P ri" sınmasın)
  const mins = Array.from({ length: cols }, (_, c) => {
    const words = rows.flatMap((r) => (r[c] ?? "").replace(/[*`]/g, "").split(/\s+/));
    const longestWord = Math.max(1, ...words.map((w) => w.length));
    return Math.min(Math.round(Math.min(longestWord, 14) * 115 + 240), Math.round(CONTENT_WIDTH / 2));
  });
  const sum = weights.reduce((a, b) => a + b, 0);
  let widths = weights.map((w) => Math.round((w / sum) * CONTENT_WIDTH));
  // minimumdan dar sütunlar genişləndirilir, çatışmayan en geniş sütunlardan götürülür
  for (let pass = 0; pass < 4; pass++) {
    const debt = widths.reduce((acc, w, c) => acc + Math.max(0, mins[c] - w), 0);
    if (!debt) break;
    const slack = widths.reduce((acc, w, c) => acc + Math.max(0, w - mins[c]), 0);
    if (slack <= 0) break;
    const take = Math.min(debt, slack);
    widths = widths.map((w, c) => {
      const free = Math.max(0, w - mins[c]);
      const give = Math.round((free / slack) * take);
      return Math.max(mins[c], w < mins[c] ? mins[c] : w - give);
    });
  }
  const total = widths.reduce((a, b) => a + b, 0);
  widths[cols - 1] += CONTENT_WIDTH - total;

  const border = { style: BorderStyle.SINGLE, size: 2, color: LINE };
  return new Table({
    columnWidths: widths,
    width: { size: CONTENT_WIDTH, type: WidthType.DXA },
    borders: { top: border, bottom: border, left: border, right: border, insideHorizontal: border, insideVertical: border },
    rows: rows.map(
      (cells, r) =>
        new TableRow({
          tableHeader: r === 0,
          cantSplit: true,
          children: cells.map(
            (cell, c) =>
              new TableCell({
                width: { size: widths[c], type: WidthType.DXA },
                shading: r === 0 ? { type: ShadingType.CLEAR, fill: HEAD_BG, color: "auto" } : undefined,
                margins: { top: 60, bottom: 60, left: 110, right: 110 },
                children: [
                  new Paragraph({
                    children: inline(cell, r === 0 ? { bold: true, size: 19 } : { size: 19 }),
                    spacing: { before: 0, after: 0, line: 240 },
                  }),
                ],
              }),
          ),
        }),
    ),
  });
}

// ---- markdown → bloklar
const body = [];
let i = 0;
const isTableRow = (l) => l.trim().startsWith("|");

while (i < src.length) {
  const line = src[i];
  const t = line.trim();

  if (!t) {
    i++;
    continue;
  }

  // kod bloku (sxem diaqramları)
  if (t.startsWith("```")) {
    i++;
    const code = [];
    while (i < src.length && !src[i].trim().startsWith("```")) code.push(src[i++]);
    i++;
    code.forEach((l, n) =>
      body.push(
        new Paragraph({
          children: [new TextRun({ text: l || " ", font: "Consolas", size: 16, color: INK })],
          shading: { type: ShadingType.CLEAR, fill: CODE_BG, color: "auto" },
          spacing: { before: n === 0 ? 120 : 0, after: n === code.length - 1 ? 160 : 0, line: 200 },
          keepLines: true,
        }),
      ),
    );
    continue;
  }

  // cədvəl
  if (isTableRow(t) && src[i + 1] && /^\|[\s:-]+\|/.test(src[i + 1].trim())) {
    const cells = (l) =>
      l
        .trim()
        .replace(/^\||\|$/g, "")
        .split("|")
        .map((c) => c.trim());
    const rows = [cells(src[i])];
    i += 2;
    while (i < src.length && isTableRow(src[i])) rows.push(cells(src[i++]));
    const cols = rows[0].length;
    const norm = rows.map((r) => (r.length === cols ? r : [...r, ...Array(cols - r.length).fill("")]).slice(0, cols));
    // sənədin ilk, başlıqsız açar-dəyər cədvəli üz qabığına gedir, mətndə təkrarlanmır
    if (!coverMeta.length && cols === 2 && norm[0].every((c) => c.trim() === "")) {
      coverMeta.push(...norm.slice(1).map((r) => [r[0].replace(/\*\*/g, "").trim(), r[1].trim()]));
      continue;
    }
    body.push(buildTable(norm));
    body.push(new Paragraph({ text: "", spacing: { after: 160 } }));
    continue;
  }

  // şəkil: ![alt](yol)
  const image = /^!\[([^\]]*)\]\(([^)]+)\)$/.exec(t);
  if (image) {
    const file = path.resolve(path.dirname(INPUT), image[2]);
    const data = fs.readFileSync(file);
    // PNG başlığından ölçüləri oxuyuruq
    const pxW = data.readUInt32BE(16);
    const pxH = data.readUInt32BE(20);
    // şəkil öz landşaft səhifəsində verilir: A4 eni 29,7 sm − 2×2 sm kənar
    let w = 960;
    let h = Math.round((pxH / pxW) * w);
    const maxH = 560; // 21 sm − 2×2 sm − başlıq/altyazı
    if (h > maxH) { w = Math.round((pxW / pxH) * maxH); h = maxH; }
    const figure = new Paragraph({
      alignment: AlignmentType.CENTER,
      // sənədin standart sətir aralığı şəkli kəsdiyi üçün burada avtomatik aralıq verilir
      spacing: { before: 120, after: 80, line: 240, lineRule: "auto" },
      children: [new ImageRun({ type: "png", data, transformation: { width: w, height: h } })],
    });
    figure.__figure = true;
    body.push(figure);
    if (image[1]) {
      const caption = new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { after: 220 },
        children: [new TextRun({ text: image[1], italics: true, size: 18, color: MUTED, font: "Calibri" })],
      });
      caption.__figure = true;
      body.push(caption);
    }
    i++;
    continue;
  }

  // başlıqlar
  if (t.startsWith("### ")) {
    body.push(headingPara(t.slice(4), 2));
    i++;
    continue;
  }
  if (t.startsWith("## ")) {
    body.push(headingPara(t.slice(3), 1));
    i++;
    continue;
  }
  if (t.startsWith("# ")) {
    i++;
    continue; // sənədin adı üz qabığındadır
  }

  // üfüqi xətt
  if (/^---+$/.test(t)) {
    body.push(
      new Paragraph({
        text: "",
        border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: LINE } },
        spacing: { before: 120, after: 200 },
      }),
    );
    i++;
    continue;
  }

  // sitat
  if (t.startsWith("> ")) {
    const quote = [t.slice(2)];
    i++;
    while (i < src.length && src[i].trim().startsWith("> ")) quote.push(src[i++].trim().slice(2));
    body.push(
      new Paragraph({
        children: inline(quote.join(" "), { color: "4B5563" }),
        border: { left: { style: BorderStyle.SINGLE, size: 12, color: BRAND, space: 12 } },
        indent: { left: 180 },
        spacing: { before: 120, after: 200 },
      }),
    );
    continue;
  }

  // siyahılar
  const bullet = /^[-*] (.*)$/.exec(t);
  if (bullet) {
    body.push(para(bullet[1], { paragraph: { numbering: { reference: "bullets", level: 0 }, spacing: { after: 60 } } }));
    i++;
    continue;
  }
  const numbered = /^(\d+)\. (.*)$/.exec(t);
  if (numbered) {
    body.push(para(numbered[2], { paragraph: { numbering: { reference: "numbers", level: 0 }, spacing: { after: 60 } } }));
    i++;
    continue;
  }

  // adi abzas
  body.push(para(t, { paragraph: { spacing: { after: 140 }, alignment: AlignmentType.JUSTIFIED } }));
  i++;
}

// ---- üz qabığı
const meta = coverMeta.length
  ? coverMeta
  : [
      ["Məhsul", "Karvan"],
      ["Sənəd", "Biznes Tələbləri Sənədi (BRD)"],
      ["Tarix", new Date().toLocaleDateString("az-AZ", { day: "2-digit", month: "long", year: "numeric" })],
    ];

const cover = [
  new Paragraph({ text: "", spacing: { after: 1600 } }),
  new Paragraph({
    children: [new TextRun({ text: "KARVAN", bold: true, size: 56, color: BRAND, font: "Calibri" })],
    spacing: { after: 120 },
  }),
  new Paragraph({
    children: [new TextRun({ text: "Biznes Tələbləri Sənədi", size: 44, color: INK, font: "Calibri" })],
    spacing: { after: 80 },
  }),
  new Paragraph({
    children: [new TextRun({ text: "", size: 8 })],
    border: { bottom: { style: BorderStyle.SINGLE, size: 8, color: BRAND } },
    spacing: { after: 600 },
  }),
  buildTable([["Sahə", "Dəyər"], ...meta]),
  new Paragraph({
    children: [
      new TextRun({
        text: "Tələblərin prioriteti MoSCoW (M/S/C/W), reallaşma vəziyyəti isə ✅ hazır · 🟡 qismən · ⬜ planlaşdırılan işarələri ilə göstərilib. Oxunuş qaydaları §0.5-dədir.",
        size: 20,
        color: MUTED,
        italics: true,
      }),
    ],
    spacing: { before: 400 },
  }),
  new Paragraph({ children: [new PageBreak()] }),
  new Paragraph({ children: [new TextRun({ text: "Mündəricat", bold: true, size: 32, color: BRAND })], spacing: { after: 200 } }),
  ...toc.map(
    (e) =>
      new Paragraph({
        spacing: { after: 60 },
        indent: { left: e.level === 2 ? 340 : 0 },
        children: [
          new InternalHyperlink({
            anchor: e.id,
            children: [
              new TextRun({
                text: e.text,
                font: "Calibri",
                size: e.level === 1 ? 22 : 20,
                bold: e.level === 1,
                color: e.level === 1 ? INK : MUTED,
              }),
            ],
          }),
        ],
      })
  ),
  new Paragraph({ children: [new PageBreak()] }),
];

const headingStyle = (size, color, before, after) => ({
  run: { font: "Calibri", size, bold: true, color },
  paragraph: { spacing: { before, after }, keepNext: true, outlineLevel: undefined },
});

const docOptions = {
  creator: "Karvan",
  title: "Karvan — Biznes Tələbləri Sənədi (BRD)",
  description: "Karvan platformasının biznes tələbləri və reallaşma vəziyyəti",
  features: { updateFields: true },
  styles: {
    default: {
      document: { run: { font: "Calibri", size: 21, color: INK }, paragraph: { spacing: { line: 276 } } },
      heading1: headingStyle(30, BRAND, 400, 160),
      heading2: headingStyle(24, INK, 280, 120),
    },
  },
  numbering: {
    config: [
      {
        reference: "bullets",
        levels: [{ level: 0, format: LevelFormat.BULLET, text: "•", alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: 360, hanging: 240 } } } }],
      },
      {
        reference: "numbers",
        levels: [{ level: 0, format: LevelFormat.DECIMAL, text: "%1.", alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: 360, hanging: 240 } } } }],
      },
    ],
  },
  sections: [
    {
      properties: { page: { size: PAGE, margin: { top: MARGIN, bottom: MARGIN, left: MARGIN, right: MARGIN } } },
      headers: {
        default: new Header({
          children: [
            new Paragraph({
              children: [new TextRun({ text: "Karvan · Biznes Tələbləri Sənədi", size: 16, color: MUTED })],
              border: { bottom: { style: BorderStyle.SINGLE, size: 4, color: LINE } },
              spacing: { after: 120 },
            }),
          ],
        }),
      },
      footers: {
        default: new Footer({
          children: [
            new Paragraph({
              alignment: AlignmentType.RIGHT,
              children: [
                new TextRun({ text: "səh. ", size: 16, color: MUTED }),
                new TextRun({ children: [PageNumber.CURRENT], size: 16, color: MUTED }),
                new TextRun({ text: " / ", size: 16, color: MUTED }),
                new TextRun({ children: [PageNumber.TOTAL_PAGES], size: 16, color: MUTED }),
              ],
            }),
          ],
        }),
      },
      children: [],
    },
  ],
};

// ---- bölmələr: hər diaqram öz landşaft səhifəsində verilir
const base = docOptions.sections[0];
const LAND = { width: PAGE.height, height: PAGE.width };
const makeSection = (children, landscape) => ({
  properties: {
    page: {
      size: landscape ? LAND : PAGE,
      margin: { top: MARGIN, bottom: MARGIN, left: MARGIN, right: MARGIN },
    },
  },
  headers: base.headers,
  footers: base.footers,
  children,
});

const sections = [];
let buf_ = [...cover];
let inFigure = false;
for (const block of body) {
  const isFig = block.__figure === true;
  if (isFig !== inFigure) {
    if (buf_.length) sections.push(makeSection(buf_, inFigure));
    buf_ = [];
    inFigure = isFig;
  }
  buf_.push(block);
}
if (buf_.length) sections.push(makeSection(buf_, inFigure));
docOptions.sections = sections;

const doc = new Document(docOptions);

Packer.toBuffer(doc).then((buf) => {
  fs.writeFileSync(process.argv[3], buf);
  console.log(`${process.argv[3]}: ${(buf.length / 1024).toFixed(0)} KB, ${body.length} blok`);
});
