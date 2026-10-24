import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  HeadingLevel,
  AlignmentType,
  BorderStyle,
  Table,
  TableRow,
  TableCell,
  WidthType,
  ShadingType,
  UnderlineType,
  convertInchesToTwip,
} from 'docx';
import { ExerciseResult, ExamHeaderInfo } from '../types';

// ─────────────────────────────────────────────────────────────────────────────
// Constants – chuẩn định dạng Bộ GD&ĐT
// ─────────────────────────────────────────────────────────────────────────────
const FONT = 'Times New Roman';
const SIZE_BODY   = 24;  // 12pt  (half-points)
const SIZE_SMALL  = 20;  // 10pt
const SIZE_TITLE  = 28;  // 14pt
const SIZE_H2     = 26;  // 13pt
const LINE_SPACING = 276; // ≈ 1.15 × 240 twips

/** Spacing preset cho Paragraph thân bài */
const BODY_SPACING = { line: LINE_SPACING, before: 0, after: 80 };

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

/** TextRun mặc định Times New Roman 12pt */
function tr(
  text: string,
  opts: {
    bold?: boolean;
    italics?: boolean;
    color?: string;
    size?: number;
    underline?: boolean;
  } = {}
): TextRun {
  return new TextRun({
    text,
    font: FONT,
    size: opts.size ?? SIZE_BODY,
    bold: opts.bold,
    italics: opts.italics,
    color: opts.color,
    underline: opts.underline ? { type: UnderlineType.SINGLE } : undefined,
  });
}

/**
 * Phân tích chuỗi có chứa đánh dấu gạch chân (<u>...</u> hoặc ký tự đánh dấu sai >>word<<, >word<)
 * thành mảng TextRun của docx với định dạng UnderlineType.SINGLE thực sự.
 * Đồng thời loại bỏ dấu >, >> dùng sai mục đích mà không làm ảnh hưởng văn bản hợp lệ.
 */
export function parseUnderlineToRuns(
  rawText: string,
  opts: {
    bold?: boolean;
    italics?: boolean;
    color?: string;
    size?: number;
    underline?: boolean;
  } = {}
): TextRun[] {
  if (!rawText) return [];

  // Chuẩn hóa:
  // 1. Chuyển >>word<< thành <u>word</u>
  let normalized = rawText.replace(/>>([^<>\n]+)<</g, '<u>$1</u>');
  // 2. Chuyển >word< (không chứa khoảng trắng, là âm tiết/từ) thành <u>word</u>
  normalized = normalized.replace(/(?<!<)>([A-Za-z0-9_-]+)<(?!\/)/g, '<u>$1</u>');
  // 3. Chuyển dạng HTML bị escape &lt;u&gt;...&lt;/u&gt;
  normalized = normalized.replace(/&lt;u&gt;(.*?)&lt;\/u&gt;/gi, '<u>$1</u>');

  // Nếu không có thẻ <u>, trả về 1 TextRun thông thường
  if (!normalized.includes('<u>')) {
    return [tr(normalized, opts)];
  }

  const runs: TextRun[] = [];
  const parts = normalized.split(/(<u>.*?<\/u>)/gi);

  for (const part of parts) {
    if (!part) continue;
    if (part.toLowerCase().startsWith('<u>') && part.toLowerCase().endsWith('</u>')) {
      const cleanContent = part.replace(/<\/?u>/gi, '');
      runs.push(
        tr(cleanContent, {
          ...opts,
          underline: true,
        })
      );
    } else {
      const textOnly = part.replace(/<[^>]+>/g, '');
      if (textOnly) {
        runs.push(tr(textOnly, opts));
      }
    }
  }

  return runs.length > 0 ? runs : [tr(rawText, opts)];
}

/** Paragraph mặc định với giãn dòng 1.15 */
function para(
  children: TextRun[],
  opts: {
    spacing?: { line?: number; before?: number; after?: number };
    alignment?: AlignmentType;
    indent?: { left?: number; firstLine?: number };
    heading?: HeadingLevel;
    shading?: { fill: string };
    borderLeft?: { color: string; size: number };
  } = {}
): Paragraph {
  return new Paragraph({
    children,
    spacing: { ...BODY_SPACING, ...opts.spacing },
    alignment: opts.alignment,
    indent: opts.indent,
    heading: opts.heading,
    shading: opts.shading
      ? { type: ShadingType.CLEAR, fill: opts.shading.fill, color: 'auto' }
      : undefined,
    border: opts.borderLeft
      ? { left: { style: BorderStyle.SINGLE, size: opts.borderLeft.size, color: opts.borderLeft.color } }
      : undefined,
  });
}

/**
 * Xác định layout hiển thị A/B/C/D dựa trên độ dài trung bình các phương án.
 * - Ngắn  (avg ≤ 15 ký tự): 4 cột trên 1 dòng
 * - Vừa   (avg ≤ 35 ký tự): 2 cột trên 1 dòng (A-B rồi C-D)
 * - Dài   (avg > 35 ký tự): 1 phương án / dòng
 */
function getOptionLayout(
  options: { key: string; text: string }[]
): 'inline4' | 'inline2' | 'stacked' {
  if (!options || options.length === 0) return 'stacked';
  const avg = options.reduce((s, o) => s + o.text.length, 0) / options.length;
  if (avg <= 15) return 'inline4';
  if (avg <= 35) return 'inline2';
  return 'stacked';
}

/** Indent trái khoảng cách phù hợp cho phương án */
const OPTION_INDENT = { left: convertInchesToTwip(0.4) };

// ─────────────────────────────────────────────────────────────────────────────
// Main export
// ─────────────────────────────────────────────────────────────────────────────

export interface DocxExportOptions {
  includeAnswerKey: boolean;
  includeExplanations: boolean;
  includeAudioScript: boolean;
  headerInfo: ExamHeaderInfo;
}

export async function generateWordDocument(
  exercises: ExerciseResult[],
  options: DocxExportOptions
): Promise<Blob> {
  const { headerInfo, includeAnswerKey, includeExplanations, includeAudioScript } = options;

  const docChildren: any[] = [];

  // ───────────────────────────────────────────────────────────────────────────
  // 1. Khung tiêu đề đề thi (2 cột)
  // ───────────────────────────────────────────────────────────────────────────
  const headerTable = new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: {
      top:              { style: BorderStyle.NONE, size: 0, color: 'auto' },
      bottom:           { style: BorderStyle.SINGLE, size: 12, color: '2563EB' },
      left:             { style: BorderStyle.NONE, size: 0, color: 'auto' },
      right:            { style: BorderStyle.NONE, size: 0, color: 'auto' },
      insideHorizontal: { style: BorderStyle.NONE, size: 0, color: 'auto' },
      insideVertical:   { style: BorderStyle.NONE, size: 0, color: 'auto' },
    },
    rows: [
      new TableRow({
        children: [
          // Cột trái: trường, môn, lớp, GV
          new TableCell({
            width: { size: 55, type: WidthType.PERCENTAGE },
            children: [
              para([tr((headerInfo.schoolName || 'DEPARTMENT OF EDUCATION').toUpperCase(), { bold: true, size: SIZE_H2, color: '1E3A8A' })]),
              para([tr(`Môn: ${headerInfo.subject || 'Tiếng Anh'}`, { italics: true, size: SIZE_SMALL })]),
              para([tr(`Lớp: ${headerInfo.gradeOrClass || '10'} | Năm học: ${headerInfo.academicYear || '2024-2025'}`, { size: SIZE_SMALL })]),
              para([tr(`Giáo viên: ${headerInfo.teacherName || 'Tổ Ngoại Ngữ'}`, { size: SIZE_SMALL })]),
            ],
          }),
          // Cột phải: tiêu đề, thời gian, tên HS
          new TableCell({
            width: { size: 45, type: WidthType.PERCENTAGE },
            children: [
              para([tr((headerInfo.testTitle || 'BÀI KIỂM TRA TIẾNG ANH').toUpperCase(), { bold: true, size: SIZE_H2, color: '1E3A8A' })], { alignment: AlignmentType.RIGHT }),
              para([tr(`Thời gian: ${headerInfo.durationMinutes || 45} phút (không tính phát đề)`, { italics: true, size: SIZE_SMALL })], { alignment: AlignmentType.RIGHT }),
              para([tr('Họ và tên: _______________________________', { size: SIZE_SMALL })], { alignment: AlignmentType.RIGHT }),
              para([tr('Lớp: ____________ | Ngày thi: ____________', { size: SIZE_SMALL })], { alignment: AlignmentType.RIGHT }),
            ],
          }),
        ],
      }),
    ],
  });

  docChildren.push(headerTable);
  docChildren.push(para([], { spacing: { after: 240 } }));

  // ───────────────────────────────────────────────────────────────────────────
  // 2. Nội dung từng bài tập
  // ───────────────────────────────────────────────────────────────────────────
  exercises.forEach((ex, exIndex) => {
    // Tiêu đề bài tập
    docChildren.push(
      para(
        [tr(ex.title || `Bài ${ex.order ?? exIndex + 1}: ${ex.exerciseType}`, { bold: true, size: SIZE_TITLE, color: '1E3A8A' })],
        { spacing: { line: LINE_SPACING, before: 280, after: 100 } }
      )
    );

    // Meta badges
    docChildren.push(
      para(
        [tr(`[CEFR: ${ex.cefrLevel} | Bloom: ${ex.cognitiveLevel} | Trọng tâm: ${ex.focus}]`, { italics: true, size: SIZE_SMALL, color: '6B7280' })],
        { spacing: { line: LINE_SPACING, before: 0, after: 80 } }
      )
    );

    // Lệnh bài tập
    docChildren.push(
      para(
        [tr(`Hướng dẫn: ${ex.instruction}`, { bold: true, size: SIZE_BODY })],
        { spacing: { line: LINE_SPACING, before: 60, after: 140 } }
      )
    );

    // Reading Passage (nếu có) – nền trắng, không tô màu theme
    if (ex.readingPassage && ex.readingPassage.trim()) {
      const passageLines = ex.readingPassage.split('\n');
      // Strip HTML tags (<u>, etc.) for plain Word text
      const stripHtml = (s: string) => s.replace(/<[^>]+>/g, '');
      passageLines.forEach((line, i) => {
        docChildren.push(
          para(
            [tr(i === 0 ? `Reading Passage: ${stripHtml(line)}` : stripHtml(line), {
              bold: i === 0,
              italics: i === 0,
              size: SIZE_BODY,
            })],
            {
              // Nền trắng, không shading màu
              borderLeft: { color: 'CBD5E1', size: 12 },
              spacing: { line: LINE_SPACING, before: i === 0 ? 100 : 0, after: i === passageLines.length - 1 ? 140 : 0 },
              indent: { left: convertInchesToTwip(0.15) },
            }
          )
        );
      });
    }

    // Audio Script (nếu có và được bật)
    if (includeAudioScript && ex.audioScript && ex.audioScript.trim()) {
      const audioLines = ex.audioScript.split('\n');
      audioLines.forEach((line, i) => {
        docChildren.push(
          para(
            [tr(i === 0 ? `AUDIO SCRIPT (Tham khảo GV): ${line}` : line, {
              bold: i === 0,
              italics: true,
              color: '92400E',
              size: SIZE_SMALL,
            })],
            {
              shading: { fill: 'FEF9C3' },
              borderLeft: { color: 'D97706', size: 24 },
              spacing: { line: LINE_SPACING, before: i === 0 ? 100 : 0, after: i === audioLines.length - 1 ? 140 : 0 },
              indent: { left: convertInchesToTwip(0.15) },
            }
          )
        );
      });
    }

    // ─── Câu hỏi ───
    ex.questions.forEach((q) => {
      // Prompt câu hỏi – parse gạch chân thực sự
      docChildren.push(
        para(
          [
            tr(`${q.number}. `, { bold: true, size: SIZE_BODY }),
            ...parseUnderlineToRuns(q.prompt, { size: SIZE_BODY }),
          ],
          { spacing: { line: LINE_SPACING, before: 140, after: 60 } }
        )
      );

      // Phương án
      if (q.options && q.options.length > 0) {
        const layout = getOptionLayout(q.options);

        if (layout === 'inline4' && q.options.length === 4) {
          // 4 phương án trên 1 dòng
          const runs: TextRun[] = [];
          q.options.forEach((opt, i) => {
            runs.push(tr(`${opt.key}. `, { bold: true, size: SIZE_BODY }));
            runs.push(...parseUnderlineToRuns(opt.text, { size: SIZE_BODY }));
            if (i < q.options!.length - 1) {
              runs.push(tr('          ', { size: SIZE_BODY }));
            }
          });
          docChildren.push(
            para(runs, { indent: OPTION_INDENT, spacing: { line: LINE_SPACING, before: 0, after: 80 } })
          );
        } else if (layout === 'inline2' && q.options.length === 4) {
          // 2 phương án / dòng: A-B rồi C-D
          const [a, b, c, d] = q.options;
          docChildren.push(
            para(
              [
                tr(`${a.key}. `, { bold: true, size: SIZE_BODY }),
                ...parseUnderlineToRuns(a.text, { size: SIZE_BODY }),
                tr('          ', { size: SIZE_BODY }),
                tr(`${b.key}. `, { bold: true, size: SIZE_BODY }),
                ...parseUnderlineToRuns(b.text, { size: SIZE_BODY }),
              ],
              { indent: OPTION_INDENT, spacing: { line: LINE_SPACING, before: 0, after: 40 } }
            )
          );
          if (c && d) {
            docChildren.push(
              para(
                [
                  tr(`${c.key}. `, { bold: true, size: SIZE_BODY }),
                  ...parseUnderlineToRuns(c.text, { size: SIZE_BODY }),
                  tr('          ', { size: SIZE_BODY }),
                  tr(`${d.key}. `, { bold: true, size: SIZE_BODY }),
                  ...parseUnderlineToRuns(d.text, { size: SIZE_BODY }),
                ],
                { indent: OPTION_INDENT, spacing: { line: LINE_SPACING, before: 0, after: 80 } }
              )
            );
          }
        } else {
          // 1 phương án / dòng (stacked hoặc mcq_3 / true_false)
          q.options.forEach((opt, i) => {
            docChildren.push(
              para(
                [
                  tr(`${opt.key}. `, { bold: true, size: SIZE_BODY }),
                  ...parseUnderlineToRuns(opt.text, { size: SIZE_BODY }),
                ],
                { indent: OPTION_INDENT, spacing: { line: LINE_SPACING, before: 0, after: i < q.options!.length - 1 ? 40 : 80 } }
              )
            );
          });
        }
      } else {
        // Tự luận – dòng điền chỗ trống
        docChildren.push(
          para(
            [tr('Answer: __________________________________________________________________', { color: '9CA3AF', size: SIZE_BODY })],
            { indent: OPTION_INDENT, spacing: { line: LINE_SPACING, before: 0, after: 100 } }
          )
        );
      }
    });

    docChildren.push(para([], { spacing: { line: LINE_SPACING, before: 0, after: 200 } }));
  });

  // ───────────────────────────────────────────────────────────────────────────
  // 3. Đáp án & Giải thích sư phạm
  // ───────────────────────────────────────────────────────────────────────────
  if (includeAnswerKey) {
    docChildren.push(
      para(
        [tr('--- BẢNG ĐÁP ÁN & HƯỚNG DẪN CHẤM ---', { bold: true, size: SIZE_H2, color: '047857', underline: true })],
        { alignment: AlignmentType.CENTER, spacing: { line: LINE_SPACING, before: 360, after: 160 } }
      )
    );

    exercises.forEach((ex, exIdx) => {
      docChildren.push(
        para(
          [tr(`${ex.title || `Bài ${ex.order ?? exIdx + 1}`}:`, { bold: true, size: SIZE_H2, color: '1E3A8A' })],
          { spacing: { line: LINE_SPACING, before: 200, after: 100 } }
        )
      );

      // Bảng tóm tắt đáp án
      const tableCells = ex.questions.map(
        (q) =>
          new TableCell({
            width: { size: Math.max(8, Math.floor(100 / ex.questions.length)), type: WidthType.PERCENTAGE },
            shading: { type: ShadingType.CLEAR, fill: 'ECFDF5', color: 'auto' },
            children: [
              new Paragraph({
                alignment: AlignmentType.CENTER,
                spacing: { line: LINE_SPACING },
                children: [tr(`${q.number}`, { bold: true, size: SIZE_SMALL })],
              }),
              new Paragraph({
                alignment: AlignmentType.CENTER,
                spacing: { line: LINE_SPACING },
                children: [
                  tr(
                    `${q.correctAnswer.includes('.') ? q.correctAnswer.split('.')[0] : q.correctAnswer}`,
                    { bold: true, size: SIZE_BODY, color: '059669' }
                  ),
                ],
              }),
            ],
          })
      );

      if (tableCells.length > 0) {
        docChildren.push(
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: [new TableRow({ children: tableCells })],
          })
        );
      }

      // Giải thích chi tiết
      if (includeExplanations) {
        docChildren.push(para([], { spacing: { line: LINE_SPACING, before: 0, after: 80 } }));
        ex.questions.forEach((q) => {
          docChildren.push(
            para(
              [
                tr(`Câu ${q.number}: `, { bold: true, size: SIZE_BODY }),
                tr(`${q.correctAnswer} `, { bold: true, color: '059669', size: SIZE_BODY }),
                tr(`— ${q.explanation}`, { italics: true, size: SIZE_BODY, color: '374151' }),
              ],
              { spacing: { line: LINE_SPACING, before: 40, after: 40 } }
            )
          );
        });
      }

      docChildren.push(para([], { spacing: { line: LINE_SPACING, before: 0, after: 140 } }));
    });
  }

  // ───────────────────────────────────────────────────────────────────────────
  // 4. Build Document
  // ───────────────────────────────────────────────────────────────────────────
  const doc = new Document({
    styles: {
      default: {
        document: {
          run: {
            font: FONT,
            size: SIZE_BODY,
          },
          paragraph: {
            spacing: { line: LINE_SPACING },
          },
        },
      },
    },
    sections: [
      {
        properties: {
          page: {
            margin: {
              top:    convertInchesToTwip(1),
              right:  convertInchesToTwip(1),
              bottom: convertInchesToTwip(1),
              left:   convertInchesToTwip(1.25),
            },
          },
        },
        children: docChildren,
      },
    ],
  });

  return await Packer.toBlob(doc);
}
