import React, { useState } from 'react';
import {
  FileText,
  CheckCircle2,
  Sliders,
  Download,
  Copy,
  Printer,
  Headphones,
  BookOpen,
  Edit3,
  Check,
  ChevronDown,
  ChevronUp,
  Sparkles,
  HelpCircle,
  Eye,
  GraduationCap,
  Save,
  Bookmark,
} from 'lucide-react';
import { ExerciseResult, QuestionItem } from '../types';

/**
 * Chuẩn hóa các dạng đánh dấu gạch chân (<u>, >>word<<, >word<) thành HTML <u> an toàn
 * Loại bỏ ký tự >, >> bị dùng sai mục đích làm gạch chân
 */
function formatUnderlineHtml(str: string): string {
  if (!str) return '';
  return str
    .replace(/>>([^<>\n]+)<</g, '<u>$1</u>')
    .replace(/(?<!<)>([A-Za-z0-9_-]+)<(?!\/)/g, '<u>$1</u>')
    .replace(/&lt;u&gt;(.*?)&lt;\/u&gt;/gi, '<u>$1</u>');
}

export interface ExamVariantItem {
  id: string;
  variantNumber: number;
  title: string;
  exercises: ExerciseResult[];
  status?: 'ready' | 'error';
  errorMessage?: string;
}

interface ExercisePreviewProps {
  exercises: ExerciseResult[];
  onComplete: () => void;
  onOpenAdjustment: (exerciseId?: string, questionNumber?: number) => void;
  onUpdateQuestion: (exerciseId: string, questionId: string, updated: Partial<QuestionItem>) => void;
  onUpdateExercise?: (exerciseId: string, updated: Partial<ExerciseResult>) => void;
  onExportWord: () => void;
  /** Lưu mẫu cấu hình (0 AI calls) */
  onSaveTemplate?: () => void;
  /** Danh sách các đề khi tạo nhiều đề */
  examSets?: ExamVariantItem[];
  activeExamIndex?: number;
  onSelectExamIndex?: (index: number) => void;
}

export const ExercisePreview: React.FC<ExercisePreviewProps> = ({
  exercises,
  onComplete,
  onOpenAdjustment,
  onUpdateQuestion,
  onUpdateExercise,
  onExportWord,
  onSaveTemplate,
  examSets = [],
  activeExamIndex = 0,
  onSelectExamIndex,
}) => {
  const [viewMode, setViewMode] = useState<'student' | 'teacher' | 'script' | 'matrix'>('teacher');
  const [editingQuestionId, setEditingQuestionId] = useState<string | null>(null);
  const [copiedNotification, setCopiedNotification] = useState(false);

  const copyAsPlainText = () => {
    let output = '';
    exercises.forEach((ex) => {
      output += `=====================================\n`;
      output += `${ex.title}\n`;
      output += `Level: ${ex.cefrLevel} | Bloom: ${ex.cognitiveLevel} | Focus: ${ex.focus}\n`;
      output += `Instruction: ${ex.instruction}\n\n`;

      if (ex.readingPassage) {
        output += `[READING PASSAGE]\n${ex.readingPassage}\n\n`;
      }
      if (ex.audioScript) {
        output += `[AUDIO SCRIPT]\n${ex.audioScript}\n\n`;
      }

      ex.questions.forEach((q) => {
        output += `${q.number}. ${q.prompt}\n`;
        if (q.options && q.options.length > 0) {
          q.options.forEach((opt) => {
            output += `   ${opt.key}. ${opt.text}\n`;
          });
        }
        if (viewMode === 'teacher') {
          output += `   >> Answer: ${q.correctAnswer}\n`;
          output += `   >> Explanation: ${q.explanation}\n`;
        }
        output += `\n`;
      });
    });

    navigator.clipboard.writeText(output);
    setCopiedNotification(true);
    setTimeout(() => setCopiedNotification(false), 2500);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Selector danh sách đề khi tạo nhiều đề (1-5 đề) */}
      {examSets && examSets.length > 1 && (
        <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 rounded-2xl p-4 text-white shadow-lg flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center space-x-3">
            <span className="text-xs font-bold text-blue-200 flex items-center space-x-1.5 uppercase tracking-wider">
              <Layers className="w-4 h-4 text-blue-400" />
              <span>Các biến thể đề ({examSets.length} đề):</span>
            </span>
            <div className="flex items-center space-x-1.5">
              {examSets.map((exam, idx) => {
                const isActive = idx === activeExamIndex;
                const totalQ = exam.exercises.reduce((s, e) => s + (e.questions?.length || 0), 0);
                return (
                  <button
                    key={exam.id || idx}
                    onClick={() => onSelectExamIndex && onSelectExamIndex(idx)}
                    className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                      isActive
                        ? 'bg-blue-500 text-white shadow-md shadow-blue-500/30 ring-2 ring-white/40'
                        : 'bg-white/10 text-slate-300 hover:bg-white/20 hover:text-white'
                    }`}
                  >
                    <span>{exam.title || `Đề ${idx + 1}`}</span>
                    <span
                      className={`text-[10px] px-1.5 py-0.2 rounded-full font-medium ${
                        isActive ? 'bg-black/20 text-white' : 'bg-white/10 text-slate-300'
                      }`}
                    >
                      {totalQ} câu
                    </span>
                    {exam.status === 'error' && (
                      <span className="w-2 h-2 rounded-full bg-rose-400" title={exam.errorMessage || 'Lỗi'} />
                    )}
                  </button>
                );
              })}
            </div>
          </div>
          <div className="text-[11px] text-blue-200/80 italic">
            Mỗi đề có câu hỏi độc lập, cùng tuân thủ CEFR, Bloom &amp; cấu hình học liệu
          </div>
        </div>
      )}

      {/* Top View Mode Bar & Quick Actions */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-3">
        {/* View Mode Pills */}
        <div className="flex items-center space-x-1 bg-slate-100 p-1 rounded-xl">
          <button
            onClick={() => setViewMode('teacher')}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
              viewMode === 'teacher'
                ? 'bg-white text-blue-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <GraduationCap className="w-3.5 h-3.5" />
            <span>Bản giáo viên (Kèm Lời giải)</span>
          </button>
          <button
            onClick={() => setViewMode('student')}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
              viewMode === 'student'
                ? 'bg-white text-blue-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Eye className="w-3.5 h-3.5" />
            <span>Bản học sinh (Đề thi sạch)</span>
          </button>
          <button
            onClick={() => setViewMode('script')}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
              viewMode === 'script'
                ? 'bg-white text-blue-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Headphones className="w-3.5 h-3.5 text-amber-600" />
            <span>Audio Script (Bài nghe)</span>
          </button>
          <button
            onClick={() => setViewMode('matrix')}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
              viewMode === 'matrix'
                ? 'bg-white text-blue-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            <span>Bảng đáp án tổng hợp</span>
          </button>
        </div>

        {/* Action Controls */}
        <div className="flex items-center space-x-2">
          <button
            onClick={copyAsPlainText}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-medium text-slate-700 hover:bg-slate-50 transition"
            title="Sao chép toàn bộ văn bản đề thi"
          >
            {copiedNotification ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-600" />
                <span className="text-emerald-600 font-semibold">Đã chép!</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5 text-slate-500" />
                <span>Sao chép text</span>
              </>
            )}
          </button>

          <button
            onClick={handlePrint}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-medium text-slate-700 hover:bg-slate-50 transition"
            title="In đề thi"
          >
            <Printer className="w-3.5 h-3.5 text-slate-500" />
            <span>In ấn</span>
          </button>

          {/* Lưu mẫu cấu hình (0 AI calls) */}
          {onSaveTemplate && (
            <button
              onClick={onSaveTemplate}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-200 transition shadow-2xs"
              title="Lưu cấu hình bài tập thành mẫu để tái sử dụng (0 AI calls)"
            >
              <Bookmark className="w-3.5 h-3.5 text-indigo-600" />
              <span>Lưu mẫu</span>
            </button>
          )}

          <button
            onClick={() => onOpenAdjustment()}
            className="flex items-center space-x-1.5 px-4 py-1.5 rounded-xl text-xs font-semibold bg-amber-50 text-amber-800 hover:bg-amber-100 border border-amber-300 transition shadow-2xs"
            title="Giữ nguyên khung dữ liệu và điều chỉnh tham số bằng AI"
          >
            <Sliders className="w-3.5 h-3.5 text-amber-700" />
            <span>AI Điều chỉnh</span>
          </button>

          <button
            onClick={onComplete}
            className="flex items-center space-x-2 px-5 py-1.5 rounded-xl text-xs font-bold bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white shadow-md shadow-emerald-600/25 transition"
            title="Xác nhận hoàn tất và mở trích xuất Word .docx"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>Hoàn tất & Xuất Word</span>
          </button>
        </div>
      </div>

      {/* Main Exercises Paper Sheet */}
      <div className="bg-white rounded-3xl p-6 sm:p-10 border border-slate-200/80 shadow-md max-w-4xl mx-auto space-y-8 font-sans print:shadow-none print:border-none print:p-0">
        {/* Mock Exam Header (for preview and print) */}
        <div className="border-b-2 border-slate-800 pb-5 mb-6">
          <div className="flex justify-between items-start text-xs text-slate-600 uppercase">
            <div>
              <p className="font-extrabold text-slate-900 text-sm">DEPARTMENT OF EDUCATION & TRAINING</p>
              <p>English Language Assessment</p>
              <p className="mt-1">Class: ____________ | Date: ____________</p>
            </div>
            <div className="text-right">
              <p className="font-extrabold text-blue-900 text-sm">ENGLISH PROGRESS EXAMINATION</p>
              <p>Time allowed: 45 minutes</p>
              <p className="mt-1">Student's Name: _______________________</p>
            </div>
          </div>
        </div>

        {/* Exercises Content */}
        {exercises.map((ex, exIndex) => (
          <div key={ex.id || exIndex} className="space-y-4">
            {/* Exercise Title & Meta */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-2 border-b border-slate-200 gap-2">
              <div className="flex items-center space-x-2">
                <span className="w-6 h-6 rounded-full bg-blue-100 text-blue-800 font-extrabold text-xs flex items-center justify-center">
                  {ex.order || exIndex + 1}
                </span>
                <h3 className="font-extrabold text-slate-900 text-base">
                  {ex.title || `Exercise ${ex.order || exIndex + 1}: ${ex.exerciseType}`}
                </h3>
              </div>

              <div className="flex items-center space-x-2">
                <span className="text-[11px] font-semibold px-2 py-0.5 rounded-md bg-slate-100 text-slate-700">
                  {ex.cefrLevel}
                </span>
                <span className="text-[11px] font-semibold px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 border border-blue-200">
                  Bloom: {ex.cognitiveLevel}
                </span>
                <button
                  onClick={() => onOpenAdjustment(ex.id)}
                  className="text-[11px] text-amber-700 hover:text-amber-900 hover:underline flex items-center space-x-1"
                >
                  <Sliders className="w-3 h-3" />
                  <span>Chỉnh bài này</span>
                </button>
              </div>
            </div>

            {/* Instruction */}
            <p className="text-xs sm:text-sm font-semibold text-slate-700 italic">
              Instruction: {ex.instruction}
            </p>

            {/* Reading Passage – nền trắng, không tô màu theme */}
            {ex.readingPassage && ex.readingPassage.trim() && (
              <div className="py-3 px-4 bg-white rounded-xl border border-slate-200 text-xs sm:text-sm text-slate-800 leading-relaxed space-y-2">
                <span className="font-bold text-slate-800 block flex items-center space-x-1">
                  <BookOpen className="w-4 h-4 text-blue-600" />
                  <span>Reading Passage:</span>
                </span>
                <p className="whitespace-pre-line">{ex.readingPassage}</p>
              </div>
            )}

            {/* Audio Script (shown in script mode or teacher mode if listening) */}
            {(viewMode === 'script' || viewMode === 'teacher') &&
              ex.audioScript &&
              ex.audioScript.trim() && (
                <div className="p-4 bg-amber-50/70 rounded-2xl border-l-4 border-amber-500 text-xs sm:text-sm text-amber-950 leading-relaxed space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-amber-900 flex items-center space-x-1.5">
                      <Headphones className="w-4 h-4 text-amber-600" />
                      <span>Audio Script (Lời dẫn nghe sư phạm & từ khóa):</span>
                    </span>
                    <span className="text-[11px] text-amber-700 bg-amber-100/70 px-2 py-0.5 rounded-md">
                      Dành cho Giáo viên & Kỹ năng Nghe
                    </span>
                  </div>
                  <p className="whitespace-pre-line italic font-serif leading-relaxed">
                    {ex.audioScript}
                  </p>
                </div>
              )}

            {/* Questions List */}
            <div className="space-y-4 pt-1">
              {ex.questions.map((q) => {
                const isEditing = editingQuestionId === q.id;

                return (
                  <div
                    key={q.id || q.number}
                    className={`p-3.5 rounded-2xl transition border ${
                      isEditing
                        ? 'bg-blue-50/50 border-blue-300 shadow-xs'
                        : 'hover:bg-slate-50/70 border-transparent hover:border-slate-200'
                    } relative group`}
                  >
                    {isEditing ? (
                      /* Full Direct Inline Editor (0 AI calls - 0đ) */
                      <div className="space-y-3 animate-in fade-in duration-150">
                        <div className="flex items-center justify-between text-xs font-bold text-blue-900 border-b border-blue-200/80 pb-2">
                          <span className="flex items-center space-x-1.5">
                            <Edit3 className="w-4 h-4 text-blue-600" />
                            <span>Chỉnh sửa thủ công Câu {q.number} (Lưu trực tiếp • 0 token AI)</span>
                          </span>
                          <button
                            onClick={() => setEditingQuestionId(null)}
                            className="text-[11px] bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded-lg font-semibold transition shadow-xs"
                          >
                            Xong & Đóng
                          </button>
                        </div>

                        {/* Prompt Input */}
                        <div>
                          <label className="text-[11px] font-semibold text-slate-700 block mb-1">
                            Nội dung câu hỏi (Prompt):
                          </label>
                          <textarea
                            rows={2}
                            value={q.prompt}
                            onChange={(e) =>
                              onUpdateQuestion(ex.id, q.id, { prompt: e.target.value })
                            }
                            className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                          />
                        </div>

                        {/* Options if Multiple Choice */}
                        {q.options && q.options.length > 0 && (
                          <div className="space-y-1.5">
                            <label className="text-[11px] font-semibold text-slate-700 block">
                              Các phương án lựa chọn:
                            </label>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                              {q.options.map((opt) => (
                                <div key={opt.key} className="flex items-center space-x-1.5">
                                  <span className="font-bold text-xs text-blue-800 w-5 text-right shrink-0">
                                    {opt.key}.
                                  </span>
                                  <input
                                    type="text"
                                    value={opt.text}
                                    onChange={(e) => {
                                      const updatedOpts = q.options!.map((o) =>
                                        o.key === opt.key ? { ...o, text: e.target.value } : o
                                      );
                                      onUpdateQuestion(ex.id, q.id, { options: updatedOpts });
                                    }}
                                    className="flex-1 px-2.5 py-1 text-xs border border-slate-300 rounded-md bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                                  />
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Correct Answer & Bloom Tag */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div>
                            <label className="text-[11px] font-semibold text-slate-700 block mb-1">
                              Đáp án đúng:
                            </label>
                            <input
                              type="text"
                              value={q.correctAnswer}
                              onChange={(e) =>
                                onUpdateQuestion(ex.id, q.id, { correctAnswer: e.target.value })
                              }
                              placeholder="VD: A. Phương án đúng"
                              className="w-full px-2.5 py-1 text-xs border border-slate-300 rounded-md bg-white font-medium text-emerald-800 focus:outline-none focus:ring-1 focus:ring-blue-500"
                            />
                          </div>

                          <div>
                            <label className="text-[11px] font-semibold text-slate-700 block mb-1">
                              Mức độ Bloom:
                            </label>
                            <input
                              type="text"
                              value={q.cognitiveTag || ''}
                              onChange={(e) =>
                                onUpdateQuestion(ex.id, q.id, { cognitiveTag: e.target.value as any })
                              }
                              placeholder="Nhận biết / Thông hiểu / Vận dụng"
                              className="w-full px-2.5 py-1 text-xs border border-slate-300 rounded-md bg-white text-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-500"
                            />
                          </div>
                        </div>

                        {/* Explanation */}
                        <div>
                          <label className="text-[11px] font-semibold text-slate-700 block mb-1">
                            Giải thích sư phạm:
                          </label>
                          <textarea
                            rows={2}
                            value={q.explanation}
                            onChange={(e) =>
                              onUpdateQuestion(ex.id, q.id, { explanation: e.target.value })
                            }
                            className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                          />
                        </div>
                      </div>
                    ) : (
                      /* Normal Display Mode */
                      <>
                        {/* Prompt – render HTML để hiển thị gạch chân <u> từ AI */}
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-start space-x-2 text-xs sm:text-sm text-slate-900 font-medium">
                            <span className="font-bold text-blue-700 shrink-0">{q.number}.</span>
                            <span
                              dangerouslySetInnerHTML={{
                                __html: (q.prompt || '').replace(
                                  /&lt;u&gt;(.*?)&lt;\/u&gt;/g,
                                  '<u>$1</u>'
                                ),
                              }}
                            />
                          </div>

                          {/* Quick Edit Trigger */}
                          <div className="opacity-0 group-hover:opacity-100 transition flex items-center space-x-1">
                            <button
                              onClick={() => setEditingQuestionId(q.id)}
                              className="px-2 py-0.8 rounded-lg text-slate-600 hover:text-blue-700 hover:bg-blue-50 text-[11px] font-semibold flex items-center space-x-1 border border-slate-200 bg-white shadow-2xs"
                              title="Chỉnh sửa câu hỏi, đáp án, giải thích trực tiếp (0 token AI)"
                            >
                              <Edit3 className="w-3 h-3 text-blue-600" />
                              <span>Sửa trực tiếp (0đ)</span>
                            </button>
                            <button
                              onClick={() => onOpenAdjustment(ex.id, q.number)}
                              className="px-2 py-0.8 rounded-lg text-slate-600 hover:text-amber-700 hover:bg-amber-50 text-[11px] font-semibold flex items-center space-x-1 border border-slate-200 bg-white shadow-2xs"
                              title="Yêu cầu AI viết lại hoặc nâng độ khó câu này"
                            >
                              <Sparkles className="w-3 h-3 text-amber-500" />
                              <span>AI chỉnh câu</span>
                            </button>
                          </div>
                        </div>

                        {/* Options if Multiple Choice */}
                        {q.options && q.options.length > 0 && (
                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 mt-2.5 text-xs text-slate-700 pl-5">
                            {q.options.map((opt) => {
                              const isCorrect =
                                viewMode === 'teacher' &&
                                (q.correctAnswer.startsWith(opt.key) ||
                                  q.correctAnswer.includes(` ${opt.key}.`) ||
                                  q.correctAnswer === opt.key);

                              return (
                                <div
                                  key={opt.key}
                                  className={`p-2 rounded-lg border transition ${
                                    isCorrect
                                      ? 'bg-emerald-50 border-emerald-300 font-bold text-emerald-800'
                                      : 'bg-white border-slate-200'
                                  }`}
                                >
                                  <span className="font-bold mr-1">{opt.key}.</span>
                                  <span>{opt.text}</span>
                                </div>
                              );
                            })}
                          </div>
                        )}

                        {/* Open Ended response line for student view */}
                        {(!q.options || q.options.length === 0) && viewMode === 'student' && (
                          <div className="mt-2 text-xs text-slate-400 italic pl-5">
                            Answer: __________________________________________________________________
                          </div>
                        )}

                        {/* Teacher Explanation & Correct Answer */}
                        {viewMode === 'teacher' && (
                          <div className="mt-2.5 p-2.5 rounded-lg bg-emerald-50/70 border border-emerald-200/80 text-xs space-y-1">
                            <div className="flex items-center space-x-2">
                              <span className="font-extrabold text-emerald-800">
                                Đáp án: {q.correctAnswer}
                              </span>
                              {q.cognitiveTag && (
                                <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 font-semibold">
                                  Bloom: {q.cognitiveTag}
                                </span>
                              )}
                            </div>
                            <p className="text-slate-700 text-[11px] leading-relaxed">
                              <strong className="text-slate-900">Giải thích:</strong> {q.explanation}
                            </p>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ))}

        {/* Matrix Answer Key Summary Table */}
        {(viewMode === 'matrix' || viewMode === 'teacher') && (
          <div className="pt-6 border-t-2 border-slate-200 space-y-4">
            <h4 className="font-extrabold text-slate-900 text-sm flex items-center space-x-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>BẢNG ĐÁP ÁN TỔNG HỢP (ANSWER KEY MATRIX)</span>
            </h4>

            {exercises.map((ex) => (
              <div key={ex.id} className="space-y-1.5">
                <span className="text-xs font-bold text-slate-700">
                  {ex.title}:
                </span>
                <div className="grid grid-cols-5 sm:grid-cols-10 gap-1.5">
                  {ex.questions.map((q) => (
                    <div
                      key={q.number}
                      className="text-center p-1.5 rounded-lg bg-slate-50 border border-slate-200 text-xs"
                    >
                      <span className="text-[10px] text-slate-500 block font-semibold">
                        C.{q.number}
                      </span>
                      <span className="font-bold text-emerald-700 block truncate">
                        {q.correctAnswer.split('.')[0] || q.correctAnswer}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Floating Bottom Action Bar */}
      <div className="sticky bottom-4 max-w-4xl mx-auto bg-slate-900/95 backdrop-blur-md text-white p-4 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-3 shadow-2xl border border-slate-800">
        <div>
          <span className="text-xs font-semibold text-slate-300 block">
            Cơ chế phản hồi sư phạm:
          </span>
          <span className="text-[11px] text-slate-400">
            Chọn <strong>"Điều chỉnh"</strong> để đổi độ khó/dạng bài, hoặc <strong>"Hoàn tất"</strong> để tải file Word .docx chuẩn.
          </span>
        </div>

        <div className="flex items-center space-x-2">
          {onSaveTemplate && (
            <button
              onClick={onSaveTemplate}
              className="flex items-center space-x-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-white/10 hover:bg-white/20 text-white transition border border-white/20"
              title="Lưu cấu hình bài tập thành mẫu (0 AI calls)"
            >
              <Bookmark className="w-3.5 h-3.5 text-indigo-300" />
              <span>Lưu mẫu</span>
            </button>
          )}
          <button
            onClick={() => onOpenAdjustment()}
            className="flex items-center space-x-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-amber-500 hover:bg-amber-600 text-white transition shadow-md"
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>AI Điều chỉnh</span>
          </button>
          <button
            onClick={onExportWord}
            className="flex items-center space-x-2 px-6 py-2 rounded-xl text-xs font-extrabold bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white transition shadow-lg shadow-emerald-500/30"
          >
            <Download className="w-4 h-4" />
            <span>Hoàn tất & Tải file Word (.docx)</span>
          </button>
        </div>
      </div>
    </div>
  );
};
