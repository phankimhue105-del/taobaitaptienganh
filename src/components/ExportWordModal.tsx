import React, { useState } from 'react';
import {
  X,
  Download,
  FileText,
  CheckCircle2,
  Settings2,
  Copy,
  Check,
  Loader2,
  GraduationCap,
  Table2,
} from 'lucide-react';
import { ExerciseResult, ExamHeaderInfo, ExerciseParameter } from '../types';
import { generateWordDocument } from '../utils/docxExport';
import { generateMatrixDocument } from '../utils/matrixExport';

interface ExportWordModalProps {
  isOpen: boolean;
  onClose: () => void;
  exercises: ExerciseResult[];
  parameters?: ExerciseParameter[];
  examTitle?: string;
}

export const ExportWordModal: React.FC<ExportWordModalProps> = ({
  isOpen,
  onClose,
  exercises,
  parameters = [],
  examTitle,
}) => {
  const [headerInfo, setHeaderInfo] = useState<ExamHeaderInfo>({
    schoolName: 'TRƯỜNG THPT CHUYÊN HÀ NỘI - AMSTERDAM',
    subject: 'TIẾNG ANH (ENGLISH LANGUAGE)',
    testTitle: examTitle ? `BÀI KIỂM TRA ĐỊNH KỲ - ${examTitle.toUpperCase()}` : 'BÀI KIỂM TRA ĐỊNH KỲ - 45 PHÚT',
    gradeOrClass: 'Lớp 10A1',
    durationMinutes: 45,
    academicYear: '2024 - 2025',
    teacherName: 'Tổ Ngoại Ngữ',
  });

  React.useEffect(() => {
    if (examTitle) {
      setHeaderInfo((prev) => ({
        ...prev,
        testTitle: `BÀI KIỂM TRA ĐỊNH KỲ - ${examTitle.toUpperCase()}`,
      }));
    }
  }, [examTitle]);

  const [includeAnswerKey, setIncludeAnswerKey] = useState(true);
  const [includeExplanations, setIncludeExplanations] = useState(true);
  const [includeAudioScript, setIncludeAudioScript] = useState(true);
  const [isExporting, setIsExporting] = useState(false);
  const [isExportingMatrix, setIsExportingMatrix] = useState(false);
  const [copiedSuccess, setCopiedSuccess] = useState(false);

  if (!isOpen) return null;

  const handleDownloadDocx = async () => {
    setIsExporting(true);
    try {
      const blob = await generateWordDocument(exercises, {
        headerInfo,
        includeAnswerKey,
        includeExplanations,
        includeAudioScript,
      });

      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      const cleanTitle = (headerInfo.testTitle || 'English_Test')
        .replace(/\s+/g, '_')
        .replace(/[^a-zA-Z0-9_]/g, '');
      a.download = `${cleanTitle}_EduGenius.docx`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      console.error('Error exporting DOCX:', err);
      alert('Có lỗi khi tạo file Word. Vui lòng thử lại.');
    } finally {
      setIsExporting(false);
    }
  };

  const handleDownloadMatrix = async () => {
    setIsExportingMatrix(true);
    try {
      const blob = await generateMatrixDocument(exercises, parameters, headerInfo);

      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      const cleanTitle = (headerInfo.testTitle || 'Ma_Tran')
        .replace(/\s+/g, '_')
        .replace(/[^a-zA-Z0-9_]/g, '');
      a.download = `MaTran_${cleanTitle}_EduGenius.docx`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      console.error('Error exporting Matrix DOCX:', err);
      alert('Có lỗi khi tạo file Ma trận. Vui lòng thử lại.');
    } finally {
      setIsExportingMatrix(false);
    }
  };

  const handleCopyHtml = () => {
    // Generate clean HTML string suitable for clipboard pasting into Word
    let html = `<html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
    <head><meta charset='utf-8'><title>${headerInfo.testTitle}</title>
    <style>
      body { font-family: 'Times New Roman', serif; font-size: 12pt; line-height: 1.15; }
      h2 { color: #1e3a8a; font-size: 14pt; margin-top: 15pt; }
      .meta { font-style: italic; color: #4b5563; }
      .box { background: #f8fafc; border-left: 3pt solid #3b82f6; padding: 6pt; margin: 6pt 0; }
      table { border-collapse: collapse; width: 100%; margin-top: 10pt; }
      th, td { border: 1pt solid #cbd5e1; padding: 4pt 8pt; text-align: center; }
    </style>
    </head><body>`;

    html += `<div style="display:flex; justify-content:space-between; border-bottom: 2pt solid #2563eb; padding-bottom: 6pt; margin-bottom: 12pt;">
      <div>
        <strong>${headerInfo.schoolName.toUpperCase()}</strong><br/>
        Môn: ${headerInfo.subject}<br/>
        Lớp: ${headerInfo.gradeOrClass} | Năm học: ${headerInfo.academicYear}<br/>
        Giáo viên: ${headerInfo.teacherName}
      </div>
      <div style="text-align:right;">
        <strong>${headerInfo.testTitle.toUpperCase()}</strong><br/>
        Thời gian: ${headerInfo.durationMinutes} phút<br/>
        Họ và tên: _______________________<br/>
        Lớp: ___________ | Ngày: ____________
      </div>
    </div>`;

    exercises.forEach((ex) => {
      html += `<h2>${ex.title}</h2>`;
      html += `<p class="meta">[CEFR: ${ex.cefrLevel} | Bloom: ${ex.cognitiveLevel} | Trọng tâm: ${ex.focus}]</p>`;
      html += `<p><strong>Hướng dẫn:</strong> ${ex.instruction}</p>`;

      if (ex.readingPassage) {
        html += `<div class="box"><strong>Reading Passage:</strong><br/>${ex.readingPassage.replace(/\n/g, '<br/>')}</div>`;
      }
      if (includeAudioScript && ex.audioScript) {
        html += `<div class="box" style="border-left-color: #d97706; background: #fffbeb;"><strong>AUDIO SCRIPT:</strong><br/><em>${ex.audioScript.replace(/\n/g, '<br/>')}</em></div>`;
      }

      ex.questions.forEach((q) => {
        html += `<p><strong>${q.number}.</strong> ${q.prompt}</p>`;
        if (q.options && q.options.length > 0) {
          html += `<p style="padding-left: 15pt;">`;
          q.options.forEach((opt) => {
            html += `<strong>${opt.key}.</strong> ${opt.text}&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;`;
          });
          html += `</p>`;
        } else {
          html += `<p style="color:#9ca3af; padding-left: 15pt;">Answer: __________________________________________________</p>`;
        }
      });
    });

    if (includeAnswerKey) {
      html += `<h2 style="color: #047857; text-align: center; border-top: 2pt dashed #10b981; padding-top: 15pt; margin-top: 25pt;">BẢNG ĐÁP ÁN & HƯỚNG DẪN CHẤM</h2>`;
      exercises.forEach((ex) => {
        html += `<h3>${ex.title}</h3><table><tr>`;
        ex.questions.forEach((q) => {
          html += `<td><strong>${q.number}</strong><br/><span style="color:#059669; font-weight:bold;">${q.correctAnswer.split('.')[0] || q.correctAnswer}</span></td>`;
        });
        html += `</tr></table>`;

        if (includeExplanations) {
          ex.questions.forEach((q) => {
            html += `<p><strong>Câu ${q.number}:</strong> <span style="color:#059669; font-weight:bold;">${q.correctAnswer}</span> — <em>${q.explanation}</em></p>`;
          });
        }
      });
    }

    html += `</body></html>`;

    const blob = new Blob([html], { type: 'text/html' });
    const item = new ClipboardItem({
      'text/html': blob,
      'text/plain': new Blob([html], { type: 'text/plain' }),
    });

    navigator.clipboard.write([item]).then(() => {
      setCopiedSuccess(true);
      setTimeout(() => setCopiedSuccess(false), 2500);
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white rounded-3xl max-w-xl w-full border border-slate-200 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-emerald-600 to-teal-700 px-6 py-4 text-white flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <span className="p-1.5 rounded-xl bg-white/20">
              <GraduationCap className="w-5 h-5 text-white" />
            </span>
            <div>
              <h3 className="font-extrabold text-base">Xuất Bản Học Liệu Word (.docx)</h3>
              <p className="text-xs text-emerald-100">
                Tạo tệp Word chuẩn Bộ GD&ĐT · Times New Roman 12pt · Giãn dòng 1.15
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-4 overflow-y-auto flex-1 text-xs">
          {/* Header Configuration */}
          <div className="space-y-3">
            <h4 className="font-bold text-slate-800 flex items-center space-x-1.5 text-xs uppercase tracking-wider">
              <Settings2 className="w-4 h-4 text-emerald-600" />
              <span>Thông tin Khung Tiêu Đề Bài Thi</span>
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">
                  Đơn vị / Trường học:
                </label>
                <input
                  type="text"
                  value={headerInfo.schoolName}
                  onChange={(e) =>
                    setHeaderInfo({ ...headerInfo, schoolName: e.target.value })
                  }
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/30 text-slate-800"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">
                  Tiêu đề bài kiểm tra:
                </label>
                <input
                  type="text"
                  value={headerInfo.testTitle}
                  onChange={(e) =>
                    setHeaderInfo({ ...headerInfo, testTitle: e.target.value })
                  }
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/30 text-slate-800"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">
                  Môn học:
                </label>
                <input
                  type="text"
                  value={headerInfo.subject}
                  onChange={(e) =>
                    setHeaderInfo({ ...headerInfo, subject: e.target.value })
                  }
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/30 text-slate-800"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">
                  Lớp / Khối:
                </label>
                <input
                  type="text"
                  value={headerInfo.gradeOrClass}
                  onChange={(e) =>
                    setHeaderInfo({ ...headerInfo, gradeOrClass: e.target.value })
                  }
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/30 text-slate-800"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">
                  Thời gian làm bài (Phút):
                </label>
                <input
                  type="number"
                  min="5"
                  max="180"
                  value={headerInfo.durationMinutes}
                  onChange={(e) =>
                    setHeaderInfo({
                      ...headerInfo,
                      durationMinutes: parseInt(e.target.value) || 45,
                    })
                  }
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/30 text-slate-800"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">
                  Giáo viên / Tổ bộ môn:
                </label>
                <input
                  type="text"
                  value={headerInfo.teacherName}
                  onChange={(e) =>
                    setHeaderInfo({ ...headerInfo, teacherName: e.target.value })
                  }
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/30 text-slate-800"
                />
              </div>
            </div>
          </div>

          {/* Export Options Toggles */}
          <div className="pt-3 border-t border-slate-100 space-y-2">
            <h4 className="font-bold text-slate-800 text-xs uppercase tracking-wider mb-2">
              Tùy chọn Nội dung Tệp xuất
            </h4>

            <label className="flex items-center space-x-2.5 p-2 rounded-xl hover:bg-slate-50 cursor-pointer transition">
              <input
                type="checkbox"
                checked={includeAnswerKey}
                onChange={(e) => setIncludeAnswerKey(e.target.checked)}
                className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 w-4 h-4"
              />
              <span className="font-semibold text-slate-700">
                Kèm bảng Đáp án tổng hợp (Answer Key Table) ở cuối trang
              </span>
            </label>

            <label className="flex items-center space-x-2.5 p-2 rounded-xl hover:bg-slate-50 cursor-pointer transition">
              <input
                type="checkbox"
                checked={includeExplanations}
                disabled={!includeAnswerKey}
                onChange={(e) => setIncludeExplanations(e.target.checked)}
                className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 w-4 h-4 disabled:opacity-50"
              />
              <span className="font-semibold text-slate-700">
                Kèm Lời giải sư phạm chi tiết cho từng câu hỏi
              </span>
            </label>

            <label className="flex items-center space-x-2.5 p-2 rounded-xl hover:bg-slate-50 cursor-pointer transition">
              <input
                type="checkbox"
                checked={includeAudioScript}
                onChange={(e) => setIncludeAudioScript(e.target.checked)}
                className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 w-4 h-4"
              />
              <span className="font-semibold text-slate-700">
                Kèm hộp Audio Script cho các bài tập Kỹ năng Nghe
              </span>
            </label>
          </div>

          {/* Matrix info box */}
          <div className="pt-3 border-t border-slate-100">
            <div className="flex items-start space-x-2 p-3 bg-blue-50 rounded-xl border border-blue-100">
              <Table2 className="w-4 h-4 text-blue-600 mt-0.5 shrink-0" />
              <div>
                <p className="font-bold text-blue-800 text-xs">Ma trận đề thi (A4 ngang)</p>
                <p className="text-blue-700 text-[11px] mt-0.5">
                  Bảng nhiều tầng theo mức Bloom · Số câu, điểm, tỷ lệ % tự động · Ký tên GV &amp; Tổ trưởng
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-100 flex flex-col gap-3">
          {/* Row 1: Copy + Matrix */}
          <div className="flex items-center gap-2">
            <button
              onClick={handleCopyHtml}
              className="flex-1 flex items-center justify-center space-x-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-700 bg-white hover:bg-slate-100 border border-slate-200 transition"
            >
              {copiedSuccess ? (
                <>
                  <Check className="w-4 h-4 text-emerald-600" />
                  <span className="text-emerald-700">Đã chép mã Word!</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4 text-slate-500" />
                  <span>Sao chép định dạng Word</span>
                </>
              )}
            </button>

            <button
              onClick={handleDownloadMatrix}
              disabled={isExportingMatrix || exercises.length === 0}
              className={`flex-1 flex items-center justify-center space-x-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold border transition ${
                isExportingMatrix || exercises.length === 0
                  ? 'bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed'
                  : 'bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100'
              }`}
            >
              {isExportingMatrix ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Đang tạo ma trận...</span>
                </>
              ) : (
                <>
                  <Table2 className="w-4 h-4" />
                  <span>Xuất ma trận đề thi</span>
                </>
              )}
            </button>
          </div>

          {/* Row 2: Close + Download exam */}
          <div className="flex items-center space-x-2 justify-end">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-200 transition"
            >
              Đóng
            </button>
            <button
              onClick={handleDownloadDocx}
              disabled={isExporting}
              className={`flex items-center justify-center space-x-2 px-6 py-2.5 rounded-xl text-xs font-bold text-white shadow-lg transition ${
                isExporting
                  ? 'bg-slate-300 cursor-not-allowed shadow-none'
                  : 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 shadow-emerald-600/30'
              }`}
            >
              {isExporting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Đang xuất tệp Word...</span>
                </>
              ) : (
                <>
                  <Download className="w-4 h-4" />
                  <span>Tải file Word (.docx)</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
