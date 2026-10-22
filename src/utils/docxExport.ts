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
} from 'docx';
import { ExerciseResult, ExamHeaderInfo } from '../types';

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

  // 1. Header Information Table (School, Class, Student name, Mark)
  const headerTable = new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: {
      top: { style: BorderStyle.NONE, size: 0, color: 'auto' },
      bottom: { style: BorderStyle.SINGLE, size: 12, color: '2563EB' },
      left: { style: BorderStyle.NONE, size: 0, color: 'auto' },
      right: { style: BorderStyle.NONE, size: 0, color: 'auto' },
      insideHorizontal: { style: BorderStyle.NONE, size: 0, color: 'auto' },
      insideVertical: { style: BorderStyle.NONE, size: 0, color: 'auto' },
    },
    rows: [
      new TableRow({
        children: [
          new TableCell({
            width: { size: 55, type: WidthType.PERCENTAGE },
            children: [
              new Paragraph({
                children: [
                  new TextRun({
                    text: (headerInfo.schoolName || 'DEPARTMENT OF EDUCATION').toUpperCase(),
                    bold: true,
                    size: 20,
                    color: '1E3A8A',
                  }),
                ],
              }),
              new Paragraph({
                children: [
                  new TextRun({
                    text: `Subject: ${headerInfo.subject || 'English Language'}`,
                    italics: true,
                    size: 18,
                  }),
                ],
              }),
              new Paragraph({
                children: [
                  new TextRun({
                    text: `Class: ${headerInfo.gradeOrClass || 'Grade 10'} | Year: ${headerInfo.academicYear || '2024-2025'}`,
                    size: 18,
                  }),
                ],
              }),
              new Paragraph({
                children: [
                  new TextRun({
                    text: `Teacher: ${headerInfo.teacherName || 'English Department'}`,
                    size: 18,
                  }),
                ],
              }),
            ],
          }),
          new TableCell({
            width: { size: 45, type: WidthType.PERCENTAGE },
            children: [
              new Paragraph({
                alignment: AlignmentType.RIGHT,
                children: [
                  new TextRun({
                    text: (headerInfo.testTitle || 'ENGLISH PROGRESS TEST').toUpperCase(),
                    bold: true,
                    size: 22,
                    color: '1E3A8A',
                  }),
                ],
              }),
              new Paragraph({
                alignment: AlignmentType.RIGHT,
                children: [
                  new TextRun({
                    text: `Time allowed: ${headerInfo.durationMinutes || 45} minutes`,
                    italics: true,
                    size: 18,
                  }),
                ],
              }),
              new Paragraph({
                alignment: AlignmentType.RIGHT,
                children: [
                  new TextRun({
                    text: 'Student Name: _______________________',
                    size: 18,
                  }),
                ],
              }),
              new Paragraph({
                alignment: AlignmentType.RIGHT,
                children: [
                  new TextRun({
                    text: 'Class: ___________ | Date: ____________',
                    size: 18,
                  }),
                ],
              }),
            ],
          }),
        ],
      }),
    ],
  });

  docChildren.push(headerTable);
  docChildren.push(new Paragraph({ text: '', spacing: { after: 200 } }));

  // 2. Render each Exercise
  exercises.forEach((ex, exIndex) => {
    // Title of exercise
    docChildren.push(
      new Paragraph({
        heading: HeadingLevel.HEADING_2,
        spacing: { before: 240, after: 120 },
        children: [
          new TextRun({
            text: ex.title || `Exercise ${ex.order || exIndex + 1}: ${ex.exerciseType}`,
            bold: true,
            size: 24,
            color: '1E3A8A',
          }),
        ],
      })
    );

    // Meta badges line
    docChildren.push(
      new Paragraph({
        spacing: { after: 120 },
        children: [
          new TextRun({
            text: `[Level: ${ex.cefrLevel} | Bloom: ${ex.cognitiveLevel} | Focus: ${ex.focus}]`,
            italics: true,
            size: 18,
            color: '4B5563',
          }),
        ],
      })
    );

    // Instruction
    docChildren.push(
      new Paragraph({
        spacing: { after: 160 },
        children: [
          new TextRun({
            text: `Instruction: ${ex.instruction}`,
            bold: true,
            size: 20,
          }),
        ],
      })
    );

    // Reading passage if present
    if (ex.readingPassage && ex.readingPassage.trim()) {
      docChildren.push(
        new Paragraph({
          spacing: { before: 100, after: 160 },
          shading: {
            type: ShadingType.CLEAR,
            fill: 'F1F5F9',
          },
          border: {
            left: { style: BorderStyle.SINGLE, size: 24, color: '3B82F6' },
          },
          children: [
            new TextRun({
              text: 'Reading Passage:\n',
              bold: true,
              italics: true,
              size: 20,
            }),
            new TextRun({
              text: ex.readingPassage,
              size: 20,
            }),
          ],
        })
      );
    }

    // Audio script if included and listening type
    if (includeAudioScript && ex.audioScript && ex.audioScript.trim()) {
      docChildren.push(
        new Paragraph({
          spacing: { before: 100, after: 160 },
          shading: {
            type: ShadingType.CLEAR,
            fill: 'FEF3C7',
          },
          border: {
            left: { style: BorderStyle.SINGLE, size: 24, color: 'D97706' },
          },
          children: [
            new TextRun({
              text: '🎧 AUDIO SCRIPT (Teacher Reference):\n',
              bold: true,
              color: '92400E',
              size: 19,
            }),
            new TextRun({
              text: ex.audioScript,
              italics: true,
              size: 19,
            }),
          ],
        })
      );
    }

    // Questions
    ex.questions.forEach((q) => {
      // Question prompt
      docChildren.push(
        new Paragraph({
          spacing: { before: 100, after: 60 },
          children: [
            new TextRun({
              text: `${q.number}. `,
              bold: true,
              size: 21,
            }),
            new TextRun({
              text: q.prompt,
              size: 21,
            }),
          ],
        })
      );

      // Options if multiple choice
      if (q.options && q.options.length > 0) {
        // Render options in 2 columns or lines
        const optionRuns: TextRun[] = [];
        q.options.forEach((opt, oIdx) => {
          optionRuns.push(
            new TextRun({
              text: `   ${opt.key}. ${opt.text}${oIdx < q.options!.length - 1 ? '       ' : ''}`,
              bold: false,
              size: 20,
            })
          );
        });

        docChildren.push(
          new Paragraph({
            spacing: { after: 100 },
            children: optionRuns,
          })
        );
      } else {
        // Open-ended blank response line
        docChildren.push(
          new Paragraph({
            spacing: { after: 120 },
            children: [
              new TextRun({
                text: '   Answer: __________________________________________________________________',
                color: '9CA3AF',
                size: 19,
              }),
            ],
          })
        );
      }
    });

    docChildren.push(new Paragraph({ text: '', spacing: { after: 160 } }));
  });

  // 3. Answer Key & Pedagogical Explanations Section
  if (includeAnswerKey) {
    docChildren.push(
      new Paragraph({
        heading: HeadingLevel.HEADING_1,
        spacing: { before: 300, after: 160 },
        alignment: AlignmentType.CENTER,
        children: [
          new TextRun({
            text: '--- ANSWER KEY & TEACHER NOTES ---',
            bold: true,
            size: 24,
            color: '047857',
            underline: { type: UnderlineType.SINGLE },
          }),
        ],
      })
    );

    exercises.forEach((ex, exIdx) => {
      docChildren.push(
        new Paragraph({
          heading: HeadingLevel.HEADING_3,
          spacing: { before: 160, after: 100 },
          children: [
            new TextRun({
              text: `${ex.title || `Exercise ${ex.order || exIdx + 1}`}:`,
              bold: true,
              size: 21,
              color: '1E3A8A',
            }),
          ],
        })
      );

      // Quick summary table for answers
      const tableCells = ex.questions.map(
        (q) =>
          new TableCell({
            width: { size: Math.max(10, Math.floor(100 / ex.questions.length)), type: WidthType.PERCENTAGE },
            shading: { type: ShadingType.CLEAR, fill: 'ECFDF5' },
            children: [
              new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [
                  new TextRun({ text: `${q.number}`, bold: true, size: 18 }),
                ],
              }),
              new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [
                  new TextRun({ text: `${q.correctAnswer.split('.')[0] || q.correctAnswer}`, bold: true, size: 20, color: '059669' }),
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

      // Detailed explanations if requested
      if (includeExplanations) {
        docChildren.push(new Paragraph({ text: '', spacing: { after: 60 } }));
        ex.questions.forEach((q) => {
          docChildren.push(
            new Paragraph({
              spacing: { before: 40, after: 40 },
              children: [
                new TextRun({
                  text: `Question ${q.number}: `,
                  bold: true,
                  size: 19,
                }),
                new TextRun({
                  text: `${q.correctAnswer} `,
                  bold: true,
                  color: '059669',
                  size: 19,
                }),
                new TextRun({
                  text: `— ${q.explanation}`,
                  italics: true,
                  size: 19,
                  color: '374151',
                }),
              ],
            })
          );
        });
      }

      docChildren.push(new Paragraph({ text: '', spacing: { after: 120 } }));
    });
  }

  // Create docx Document
  const doc = new Document({
    sections: [
      {
        properties: {
          page: {
            margin: {
              top: 1440, // 1 inch
              right: 1440,
              bottom: 1440,
              left: 1440,
            },
          },
        },
        children: docChildren,
      },
    ],
  });

  return await Packer.toBlob(doc);
}
