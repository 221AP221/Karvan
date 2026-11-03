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

const src = fs.readFileSync(process.argv[2], "utf8").split("\n");

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
  const sum = weights.reduce((a, b) => a + b, 0);
  const widths = weights.map((w) => Math.round((w / sum) * CONTENT_WIDTH));
  widths[cols - 1] = CONTENT_WIDTH - widths.slice(0, -1).reduce((a, b) => a + b, 0);

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
    body.push(buildTable(rows.map((r) => (r.length === cols ? r : [...r, ...Array(cols - r.length).fill("")]).slice(0, cols))));
    body.push(new Paragraph({ text: "", spacing: { after: 160 } }));
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
const meta = [
  ["Məhsul", "Karvan — link-in-bio, sifariş, faktura və ödəniş izləmə platforması"],
  ["Sənəd", "Biznes Tələbləri Sənədi (BRD)"],
  ["Versiya", "1.0 — reallaşdırılmış məhsulun vəziyyəti"],
  ["Status", "Beta-ya hazır"],
  ["Domen", "karvan.az"],
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
    children: [new TextRun({ text: "Business Requirements Document · BRD", size: 24, color: MUTED })],
    border: { bottom: { style: BorderStyle.SINGLE, size: 8, color: BRAND } },
    spacing: { after: 600 },
  }),
  buildTable([["Sahə", "Dəyər"], ...meta]),
  new Paragraph({
    children: [
      new TextRun({
        text: "Bu sənəd reallaşdırılmış məhsulu təsvir edir: hər tələbin yanında vəziyyət göstərilib — ✅ hazır, 🟡 qismən, ⬜ planlaşdırılan.",
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

const doc = new Document({
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
      children: [...cover, ...body],
    },
  ],
});

Packer.toBuffer(doc).then((buf) => {
  fs.writeFileSync(process.argv[3], buf);
  console.log(`${process.argv[3]}: ${(buf.length / 1024).toFixed(0)} KB, ${body.length} blok`);
});
