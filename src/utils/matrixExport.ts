/**
 * matrixExport.ts
 * Xuất Ma Trận Đề Kiểm Tra (.docx) – A4 ngang, tính toán 100% bằng TypeScript (0 AI calls)
 */
import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  Table,
  TableRow,
  TableCell,
  WidthType,
  AlignmentType,
  BorderStyle,
  ShadingType,
  convertInchesToTwip,
  PageOrientation,
  UnderlineType,
} from 'docx';
import { ExerciseResult, ExerciseParameter, ExamHeaderInfo, CognitiveLevel } from '../types';

// ─────────────────────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────────────────────
const FONT = 'Times New Roman';
const SZ_SM = 18;   // 9pt
const SZ_BODY = 22; // 11pt
const SZ_H = 24;    // 12pt
const SZ_TITLE = 26;// 13pt
const LINE = 264;   // ~1.1× spacing

const COGNITIVE_LEVELS: CognitiveLevel[] = [
  'Nhận biết',
  'Thông hiểu',
  'Vận dụng',
  'Vận dụng cao',
];

/** Màu nền header bảng */
const COLOR_HEADER_BG = '1E3A8A';
const COLOR_HEADER_TEXT = 'FFFFFF';
const COLOR_SUBHEADER_BG = 'DBEAFE';
const COLOR_TOTAL_BG = 'FEF9C3';
const COLOR_BORDER = '94A3B8';

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────
function tr(
  text: string,
  opts: { bold?: boolean; italics?: boolean; size?: number; color?: string; underline?: boolean } = {}
): TextRun {
  return new TextRun({
    text,
    font: FONT,
    size: opts.size ?? SZ_BODY,
    bold: opts.bold,
    italics: opts.italics,
    color: opts.color,
    underline: opts.underline ? { type: UnderlineType.SINGLE } : undefined,
  });
}

function centeredPara(children: TextRun[], spacing?: { before?: number; after?: number }): Paragraph {
  return new Paragraph({
    children,
    alignment: AlignmentType.CENTER,
    spacing: { line: LINE, before: spacing?.before ?? 0, after: spacing?.after ?? 80 },
  });
}

function leftPara(children: TextRun[], spacing?: { before?: number; after?: number }): Paragraph {
  return new Paragraph({
    children,
    alignment: AlignmentType.LEFT,
    spacing: { line: LINE, before: spacing?.before ?? 0, after: spacing?.after ?? 80 },
  });
}

function cell(
  paras: Paragraph[],
  opts: {
    bgColor?: string;
    span?: number;
    width?: number;
    noBorder?: boolean;
  } = {}
): TableCell {
  const borderStyle = opts.noBorder
    ? { style: BorderStyle.NONE, size: 0, color: 'auto' }
    : { style: BorderStyle.SINGLE, size: 4, color: COLOR_BORDER };

  return new TableCell({
    columnSpan: opts.span,
    width: opts.width ? { size: opts.width, type: WidthType.PERCENTAGE } : undefined,
    shading: opts.bgColor
      ? { type: ShadingType.CLEAR, fill: opts.bgColor, color: 'auto' }
      : undefined,
    borders: {
      top:    borderStyle,
      bottom: borderStyle,
      left:   borderStyle,
      right:  borderStyle,
    },
    children: paras,
  });
}

function tcText(
  text: string,
  opts: { bold?: boolean; size?: number; color?: string; align?: AlignmentType; bgColor?: string; span?: number; width?: number } = {}
): TableCell {
  return cell(
    [
      new Paragraph({
        alignment: opts.align ?? AlignmentType.CENTER,
        spacing: { line: LINE, before: 40, after: 40 },
        children: [tr(text, { bold: opts.bold, size: opts.size ?? SZ_BODY, color: opts.color })],
      }),
    ],
    { bgColor: opts.bgColor, span: opts.span, width: opts.width }
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Calculation helpers
// ─────────────────────────────────────────────────────────────────────────────

interface ExerciseStats {
  exercise: ExerciseResult;
  param: ExerciseParameter | undefined;
  questionCount: number;
  cognitiveLevel: CognitiveLevel;
}

interface CognitiveBreakdown {
  level: CognitiveLevel;
  count: number;
  point: number;
  pct: number;
}

interface ExerciseMatrixRow {
  order: number;
  title: string;
  exerciseType: string;
  cefrLevel: string;
  totalQuestions: number;
  breakdown: CognitiveBreakdown[];
  totalPoint: number;
  totalPct: number;
}

function buildMatrixData(
  exercises: ExerciseResult[],
  parameters: ExerciseParameter[],
  totalScore: number
): { rows: ExerciseMatrixRow[]; grandTotal: number; pointPerQ: number } {
  const grandTotal = exercises.reduce((sum, ex) => sum + ex.questions.length, 0);
  const pointPerQ = grandTotal > 0 ? totalScore / grandTotal : 0;

  const rows: ExerciseMatrixRow[] = exercises.map((ex) => {
    const param = parameters.find((p) => p.id === ex.id);
    const qCount = ex.questions.length;

    // Count by cognitive level from question tags, fall back to exercise level
    const levelCounts: Record<CognitiveLevel, number> = {
      'Nhận biết': 0,
      'Thông hiểu': 0,
      'Vận dụng': 0,
      'Vận dụng cao': 0,
    };

    ex.questions.forEach((q) => {
      const tag = (q.cognitiveTag ?? ex.cognitiveLevel) as CognitiveLevel;
      if (tag in levelCounts) levelCounts[tag]++;
    });

    const breakdown: CognitiveBreakdown[] = COGNITIVE_LEVELS.map((lvl) => {
      const count = levelCounts[lvl];
      const point = parseFloat((count * pointPerQ).toFixed(2));
      const pct = grandTotal > 0 ? parseFloat(((count / grandTotal) * 100).toFixed(1)) : 0;
      return { level: lvl, count, point, pct };
    });

    const totalPoint = parseFloat((qCount * pointPerQ).toFixed(2));
    const totalPct = grandTotal > 0 ? parseFloat(((qCount / grandTotal) * 100).toFixed(1)) : 0;

    return {
      order: ex.order,
      title: ex.title || `Bài ${ex.order}`,
      exerciseType: ex.exerciseType,
      cefrLevel: ex.cefrLevel,
      totalQuestions: qCount,
      breakdown,
      totalPoint,
      totalPct,
    };
  });

  return { rows, grandTotal, pointPerQ };
}

// ─────────────────────────────────────────────────────────────────────────────
// Main export function
// ─────────────────────────────────────────────────────────────────────────────
export async function generateMatrixDocument(
  exercises: ExerciseResult[],
  parameters: ExerciseParameter[],
  headerInfo: ExamHeaderInfo,
  totalScore: number = 10
): Promise<Blob> {
  const { rows, grandTotal, pointPerQ } = buildMatrixData(exercises, parameters, totalScore);

  const docChildren: any[] = [];

  // ── Tiêu đề ──────────────────────────────────────────────────────────────
  docChildren.push(
    centeredPara([tr((headerInfo.schoolName || 'TRƯỜNG THPT').toUpperCase(), { bold: true, size: SZ_TITLE, color: '1E3A8A' })], { before: 0, after: 40 })
  );
  docChildren.push(
    centeredPara([tr(`Môn: ${headerInfo.subject || 'Tiếng Anh'} – Lớp: ${headerInfo.gradeOrClass} – Năm học: ${headerInfo.academicYear}`, { italics: true, size: SZ_BODY })], { before: 0, after: 40 })
  );
  docChildren.push(
    centeredPara([tr('MA TRẬN ĐỀ KIỂM TRA', { bold: true, size: 32, color: '1E3A8A', underline: true })], { before: 80, after: 40 })
  );
  docChildren.push(
    centeredPara([tr(`${(headerInfo.testTitle || '').toUpperCase()} – Thời gian: ${headerInfo.durationMinutes} phút`, { size: SZ_H })], { before: 0, after: 160 })
  );

  // ── Thông tin chung ───────────────────────────────────────────────────────
  docChildren.push(
    leftPara([
      tr('Tổng số câu hỏi: ', { bold: true, size: SZ_BODY }),
      tr(`${grandTotal} câu`, { size: SZ_BODY }),
      tr('    |    ', { size: SZ_BODY, color: '9CA3AF' }),
      tr('Thang điểm: ', { bold: true, size: SZ_BODY }),
      tr(`${totalScore} điểm`, { size: SZ_BODY }),
      tr('    |    ', { size: SZ_BODY, color: '9CA3AF' }),
      tr('Điểm/câu: ', { bold: true, size: SZ_BODY }),
      tr(`${pointPerQ.toFixed(3)} điểm`, { size: SZ_BODY }),
    ], { before: 0, after: 120 })
  );

  // ── Bảng ma trận nhiều tầng ───────────────────────────────────────────────
  //
  // Cột:  | STT | Nội dung / Dạng bài | CEFR | NB (câu/đ/%) | TH | VD | VD cao | Tổng (câu/đ/%) |
  //
  // Số cột sub cho mỗi mức nhận thức: Câu | Điểm | %  → 3 cột × 4 mức = 12 cột
  // Tổng: 1 + 1 + 1 + 12 + 3 = 18 cột
  //
  // Dùng columnSpan để merge header

  const buildHeaderRows = (): TableRow[] => {
    // Row 1: merged super-headers
    const row1 = new TableRow({
      tableHeader: true,
      children: [
        tcText('STT',             { bold: true, size: SZ_SM, color: COLOR_HEADER_TEXT, bgColor: COLOR_HEADER_BG, span: 1 }),
        tcText('Nội dung / Dạng bài', { bold: true, size: SZ_SM, color: COLOR_HEADER_TEXT, bgColor: COLOR_HEADER_BG, span: 1 }),
        tcText('CEFR',            { bold: true, size: SZ_SM, color: COLOR_HEADER_TEXT, bgColor: COLOR_HEADER_BG, span: 1 }),
        tcText('Nhận biết',       { bold: true, size: SZ_SM, color: COLOR_HEADER_TEXT, bgColor: '1D4ED8', span: 3 }),
        tcText('Thông hiểu',      { bold: true, size: SZ_SM, color: COLOR_HEADER_TEXT, bgColor: '1D4ED8', span: 3 }),
        tcText('Vận dụng',        { bold: true, size: SZ_SM, color: COLOR_HEADER_TEXT, bgColor: '0369A1', span: 3 }),
        tcText('Vận dụng cao',    { bold: true, size: SZ_SM, color: COLOR_HEADER_TEXT, bgColor: '0369A1', span: 3 }),
        tcText('TỔNG CỘNG',      { bold: true, size: SZ_SM, color: COLOR_HEADER_TEXT, bgColor: '047857', span: 3 }),
      ],
    });

    // Row 2: sub-headers Câu | Điểm | % for each cognitive group
    const subCols = ['Câu', 'Điểm', '%'];
    const mkSubCell = (text: string, bg: string) =>
      tcText(text, { bold: true, size: SZ_SM, color: '1E293B', bgColor: bg });

    const row2 = new TableRow({
      tableHeader: true,
      children: [
        cell([new Paragraph({ children: [] })], { bgColor: COLOR_HEADER_BG }), // STT placeholder
        cell([new Paragraph({ children: [] })], { bgColor: COLOR_HEADER_BG }), // Nội dung placeholder
        cell([new Paragraph({ children: [] })], { bgColor: COLOR_HEADER_BG }), // CEFR placeholder
        ...subCols.map(s => mkSubCell(s, 'BFDBFE')),  // Nhận biết
        ...subCols.map(s => mkSubCell(s, 'BAE6FD')),  // Thông hiểu
        ...subCols.map(s => mkSubCell(s, 'A7F3D0')),  // Vận dụng
        ...subCols.map(s => mkSubCell(s, '99F6E4')),  // Vận dụng cao
        ...subCols.map(s => mkSubCell(s, 'D1FAE5')),  // Tổng
      ],
    });

    return [row1, row2];
  };

  const buildDataRow = (row: ExerciseMatrixRow, idx: number): TableRow => {
    const altBg = idx % 2 === 0 ? 'F8FAFC' : 'FFFFFF';
    const fmtN = (n: number) => (n === 0 ? '' : String(n));
    const fmtD = (d: number) => (d === 0 ? '' : d.toFixed(2));
    const fmtP = (p: number) => (p === 0 ? '' : `${p.toFixed(1)}%`);

    return new TableRow({
      children: [
        tcText(String(row.order), { size: SZ_SM, bgColor: altBg }),
        tcText(`${row.title}`, { size: SZ_SM, align: AlignmentType.LEFT, bgColor: altBg }),
        tcText(row.cefrLevel, { size: SZ_SM, bgColor: altBg }),
        ...row.breakdown.flatMap((b) => [
          tcText(fmtN(b.count), { size: SZ_SM, bgColor: altBg }),
          tcText(fmtD(b.point), { size: SZ_SM, bgColor: altBg }),
          tcText(fmtP(b.pct),   { size: SZ_SM, bgColor: altBg }),
        ]),
        tcText(fmtN(row.totalQuestions), { bold: true, size: SZ_SM, bgColor: altBg }),
        tcText(fmtD(row.totalPoint),     { bold: true, size: SZ_SM, bgColor: altBg }),
        tcText(fmtP(row.totalPct),       { bold: true, size: SZ_SM, bgColor: altBg }),
      ],
    });
  };

  const buildTotalRow = (): TableRow => {
    const colTotals: CognitiveBreakdown[] = COGNITIVE_LEVELS.map((lvl) => {
      const count = rows.reduce((s, r) => s + (r.breakdown.find(b => b.level === lvl)?.count ?? 0), 0);
      const point = parseFloat((count * pointPerQ).toFixed(2));
      const pct   = grandTotal > 0 ? parseFloat(((count / grandTotal) * 100).toFixed(1)) : 0;
      return { level: lvl, count, point, pct };
    });
    const totalPt  = parseFloat((grandTotal * pointPerQ).toFixed(2));
    const totalPct = grandTotal > 0 ? 100 : 0;

    const fmtN = (n: number) => (n === 0 ? '' : String(n));
    const fmtD = (d: number) => d.toFixed(2);
    const fmtP = (p: number) => `${p.toFixed(1)}%`;

    return new TableRow({
      children: [
        tcText('TỔNG', { bold: true, size: SZ_SM, bgColor: COLOR_TOTAL_BG, span: 1 }),
        tcText('', { bgColor: COLOR_TOTAL_BG }),
        tcText('', { bgColor: COLOR_TOTAL_BG }),
        ...colTotals.flatMap((c) => [
          tcText(fmtN(c.count), { bold: true, size: SZ_SM, bgColor: COLOR_TOTAL_BG }),
          tcText(fmtD(c.point), { bold: true, size: SZ_SM, bgColor: COLOR_TOTAL_BG }),
          tcText(fmtP(c.pct),   { bold: true, size: SZ_SM, bgColor: COLOR_TOTAL_BG }),
        ]),
        tcText(fmtN(grandTotal), { bold: true, size: SZ_H, bgColor: 'D1FAE5', color: '065F46' }),
        tcText(fmtD(totalPt),   { bold: true, size: SZ_H, bgColor: 'D1FAE5', color: '065F46' }),
        tcText(fmtP(totalPct),  { bold: true, size: SZ_H, bgColor: 'D1FAE5', color: '065F46' }),
      ],
    });
  };

  const matrixTable = new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [
      ...buildHeaderRows(),
      ...rows.map((row, i) => buildDataRow(row, i)),
      buildTotalRow(),
    ],
  });

  docChildren.push(matrixTable);

  // ── Ghi chú cuối ─────────────────────────────────────────────────────────
  docChildren.push(
    leftPara([tr('Ghi chú:', { bold: true, size: SZ_SM })], { before: 160, after: 40 })
  );
  docChildren.push(
    leftPara([tr(`– Điểm mỗi câu = ${totalScore} / ${grandTotal} = ${pointPerQ.toFixed(3)} điểm (làm tròn khi chấm).`, { size: SZ_SM })], { before: 0, after: 20 })
  );
  docChildren.push(
    leftPara([tr('– Tổng số câu và tỷ lệ % theo từng mức tư duy Bloom được tính tự động từ thông tin đề.', { size: SZ_SM })], { before: 0, after: 20 })
  );
  docChildren.push(
    leftPara([tr('– Ma trận được tạo tự động bởi EduGenius. Giáo viên có thể điều chỉnh số liệu trước khi nộp.', { italics: true, size: SZ_SM, color: '6B7280' })], { before: 0, after: 40 })
  );

  // ── Chữ ký ────────────────────────────────────────────────────────────────
  docChildren.push(para([], { spacing: { line: LINE, before: 0, after: 160 } } as any));

  const signTable = new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: {
      top:    { style: BorderStyle.NONE, size: 0, color: 'auto' },
      bottom: { style: BorderStyle.NONE, size: 0, color: 'auto' },
      left:   { style: BorderStyle.NONE, size: 0, color: 'auto' },
      right:  { style: BorderStyle.NONE, size: 0, color: 'auto' },
      insideHorizontal: { style: BorderStyle.NONE, size: 0, color: 'auto' },
      insideVertical:   { style: BorderStyle.NONE, size: 0, color: 'auto' },
    },
    rows: [
      new TableRow({
        children: [
          cell(
            [centeredPara([tr('Tổ trưởng chuyên môn', { bold: true, size: SZ_SM })]),
             centeredPara([tr('(Ký, ghi rõ họ tên)', { italics: true, size: SZ_SM, color: '9CA3AF' })]),
             centeredPara([tr(' ', { size: SZ_SM })]),
             centeredPara([tr('........................', { size: SZ_SM })]),
            ],
            { noBorder: true, width: 50 }
          ),
          cell(
            [centeredPara([tr(`${headerInfo.schoolName ? headerInfo.schoolName.split(' ').slice(-2).join(' ') : 'Nơi soạn đề'}, ngày ... tháng ... năm ...`, { italics: true, size: SZ_SM })]),
             centeredPara([tr('Giáo viên biên soạn', { bold: true, size: SZ_SM })]),
             centeredPara([tr('(Ký, ghi rõ họ tên)', { italics: true, size: SZ_SM, color: '9CA3AF' })]),
             centeredPara([tr(' ', { size: SZ_SM })]),
             centeredPara([tr('........................', { size: SZ_SM })]),
            ],
            { noBorder: true, width: 50 }
          ),
        ],
      }),
    ],
  });
  docChildren.push(signTable);

  // ── Document builder ──────────────────────────────────────────────────────
  const doc = new Document({
    styles: {
      default: {
        document: {
          run: { font: FONT, size: SZ_BODY },
          paragraph: { spacing: { line: LINE } },
        },
      },
    },
    sections: [
      {
        properties: {
          page: {
            size: {
              orientation: PageOrientation.LANDSCAPE,
              width:  convertInchesToTwip(11.69), // A4 landscape width
              height: convertInchesToTwip(8.27),
            },
            margin: {
              top:    convertInchesToTwip(0.75),
              right:  convertInchesToTwip(0.75),
              bottom: convertInchesToTwip(0.75),
              left:   convertInchesToTwip(0.75),
            },
          },
        },
        children: docChildren,
      },
    ],
  });

  return await Packer.toBlob(doc);
}

// Helper used in ExportWordModal to avoid circular import
function para(children: TextRun[], opts: any = {}): Paragraph {
  return new Paragraph({
    children,
    alignment: opts.alignment,
    spacing: opts.spacing ?? { line: LINE },
  });
}
