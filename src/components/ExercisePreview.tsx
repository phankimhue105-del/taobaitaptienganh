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
} from 'lucide-react';
import { ExerciseResult, QuestionItem } from '../types';

interface ExercisePreviewProps {
  exercises: ExerciseResult[];
  onComplete: () => void;
  onOpenAdjustment: (exerciseId?: string, questionNumber?: number) => void;
  onUpdateQuestion: (exerciseId: string, questionId: string, updated: Partial<QuestionItem>) => void;
  onExportWord: () => void;
}

export const ExercisePreview: React.FC<ExercisePreviewProps> = ({
  exercises,
  onComplete,
  onOpenAdjustment,
  onUpdateQuestion,
  onExportWord,
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

          {/* Sư phạm: 2 Nút cốt lõi theo System Instruction */}
          <button
            onClick={() => onOpenAdjustment()}
            className="flex items-center space-x-1.5 px-4 py-1.5 rounded-xl text-xs font-semibold bg-amber-50 text-amber-800 hover:bg-amber-100 border border-amber-300 transition shadow-2xs"
            title="Giữ nguyên khung dữ liệu và điều chỉnh tham số"
          >
            <Sliders className="w-3.5 h-3.5 text-amber-700" />
            <span>Điều chỉnh</span>
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

            {/* Reading Passage */}
            {ex.readingPassage && ex.readingPassage.trim() && (
              <div className="p-4 bg-slate-50 rounded-2xl border-l-4 border-blue-500 text-xs sm:text-sm text-slate-800 leading-relaxed space-y-2">
                <span className="font-bold text-blue-900 block flex items-center space-x-1">
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
                    className="p-3.5 rounded-xl hover:bg-slate-50/70 transition border border-transparent hover:border-slate-200 relative group"
                  >
                    {/* Prompt */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start space-x-2 text-xs sm:text-sm text-slate-900 font-medium">
                        <span className="font-bold text-blue-700">{q.number}.</span>
                        {isEditing ? (
                          <input
                            type="text"
                            value={q.prompt}
                            onChange={(e) =>
                              onUpdateQuestion(ex.id, q.id, { prompt: e.target.value })
                            }
                            className="w-full px-2 py-1 text-xs border border-blue-400 rounded-md bg-white"
                          />
                        ) : (
                          <span>{q.prompt}</span>
                        )}
                      </div>

                      {/* Quick Edit Trigger */}
                      <div className="opacity-0 group-hover:opacity-100 transition flex items-center space-x-1">
                        <button
                          onClick={() =>
                            setEditingQuestionId(isEditing ? null : q.id)
                          }
                          className="p-1 rounded text-slate-400 hover:text-blue-600 hover:bg-white text-[11px] flex items-center space-x-1"
                          title="Sửa nhanh câu hỏi"
                        >
                          <Edit3 className="w-3 h-3" />
                          <span>{isEditing ? 'Xong' : 'Sửa'}</span>
                        </button>
                        <button
                          onClick={() => onOpenAdjustment(ex.id, q.number)}
                          className="p-1 rounded text-slate-400 hover:text-amber-600 hover:bg-white text-[11px] flex items-center space-x-1"
                          title="Yêu cầu AI điều chỉnh riêng câu này"
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
          <button
            onClick={() => onOpenAdjustment()}
            className="flex items-center space-x-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-amber-500 hover:bg-amber-600 text-white transition shadow-md"
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>Điều chỉnh</span>
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
