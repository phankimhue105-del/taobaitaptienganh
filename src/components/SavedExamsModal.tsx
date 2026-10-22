import React, { useState, useRef } from 'react';
import {
  X,
  FolderOpen,
  FileText,
  Download,
  Upload,
  Trash2,
  Calendar,
  CheckCircle2,
  BookOpen,
  Layers,
  ArrowRight,
  Sparkles,
} from 'lucide-react';
import { SavedExam } from '../types';
import {
  getSavedExams,
  deleteSavedExam,
  exportExamToJsonFile,
  importExamFromJsonFile,
} from '../utils/storage';

interface SavedExamsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoadExam: (exam: SavedExam) => void;
}

export const SavedExamsModal: React.FC<SavedExamsModalProps> = ({
  isOpen,
  onClose,
  onLoadExam,
}) => {
  const [exams, setExams] = useState<SavedExam[]>(getSavedExams());
  const [importError, setImportError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const refreshList = () => {
    setExams(getSavedExams());
  };

  const handleDelete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm('Bạn có chắc muốn xóa đề thi này khỏi danh sách lưu trữ?')) {
      deleteSavedExam(id);
      refreshList();
    }
  };

  const handleExport = (exam: SavedExam, e: React.MouseEvent) => {
    e.stopPropagation();
    exportExamToJsonFile(exam);
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setImportError(null);
      const imported = await importExamFromJsonFile(file);
      refreshList();
      if (confirm(`Đã nhập đề thi "${imported.title}" thành công. Bạn có muốn mở ngay bây giờ không?`)) {
        onLoadExam(imported);
        onClose();
      }
    } catch (err: any) {
      setImportError(err.message || 'Lỗi khi nhập tệp JSON.');
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white rounded-3xl max-w-2xl w-full border border-slate-200 shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-700 via-indigo-700 to-slate-800 px-6 py-4 text-white flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <span className="p-2 rounded-xl bg-white/10">
              <FolderOpen className="w-5 h-5 text-blue-200" />
            </span>
            <div>
              <h3 className="font-extrabold text-sm sm:text-base">
                Kho Đề Thi Đã Lưu (Tiết kiệm 100% Quota AI)
              </h3>
              <p className="text-[11px] text-blue-100/80">
                Mở lại, chỉnh sửa hoặc xuất Word các đề đã tạo mà <strong>không tiêu tốn lượt gọi AI nào</strong>.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl hover:bg-white/20 transition text-white/80 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Action bar for Import */}
        <div className="px-6 py-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between text-xs">
          <span className="text-slate-600 font-medium">
            Tổng cộng: <strong>{exams.length}</strong> đề thi đã lưu trong trình duyệt
          </span>
          <div className="flex items-center space-x-2">
            <input
              ref={fileInputRef}
              type="file"
              accept=".json"
              onChange={handleFileChange}
              className="hidden"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-100 text-slate-700 font-semibold transition"
              title="Nhập đề thi từ tệp .edugenius.json"
            >
              <Upload className="w-3.5 h-3.5 text-blue-600" />
              <span>Nhập file JSON</span>
            </button>
          </div>
        </div>

        {importError && (
          <div className="mx-6 mt-3 p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700">
            {importError}
          </div>
        )}

        {/* Exams List */}
        <div className="flex-1 overflow-y-auto p-6 space-y-3">
          {exams.length === 0 ? (
            <div className="text-center py-12 text-slate-400 space-y-3">
              <FileText className="w-12 h-12 mx-auto text-slate-300" />
              <p className="text-xs text-slate-500 font-medium">
                Chưa có đề thi nào được lưu trên máy của bạn.
              </p>
              <p className="text-[11px] text-slate-400 max-w-sm mx-auto">
                Sau khi tạo đề ở Bước 3, bạn hãy bấm nút <strong>"Lưu đề vào máy"</strong> để có thể mở lại bất cứ lúc nào mà không cần gọi lại AI.
              </p>
            </div>
          ) : (
            exams.map((exam) => (
              <div
                key={exam.id}
                onClick={() => {
                  onLoadExam(exam);
                  onClose();
                }}
                className="p-4 rounded-2xl border border-slate-200 hover:border-blue-400 hover:shadow-md transition bg-white cursor-pointer group flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              >
                <div className="space-y-1.5 flex-1 min-w-0">
                  <div className="flex items-center space-x-2">
                    <h4 className="font-extrabold text-xs sm:text-sm text-slate-900 group-hover:text-blue-700 transition truncate">
                      {exam.title}
                    </h4>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-500">
                    <span className="flex items-center space-x-1">
                      <Calendar className="w-3 h-3 text-slate-400" />
                      <span>
                        {new Date(exam.createdAt).toLocaleDateString('vi-VN', {
                          day: '2-digit',
                          month: '2-digit',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </span>
                    <span>•</span>
                    <span className="font-medium text-slate-700">
                      {exam.exercises.length} bài tập ({exam.totalQuestions} câu hỏi)
                    </span>
                    {exam.cefrLevels.length > 0 && (
                      <>
                        <span>•</span>
                        <div className="flex items-center space-x-1">
                          {exam.cefrLevels.map((lvl) => (
                            <span
                              key={lvl}
                              className="px-1.5 py-0.2 rounded bg-indigo-50 text-indigo-700 font-bold text-[10px]"
                            >
                              {lvl}
                            </span>
                          ))}
                        </div>
                      </>
                    )}
                  </div>
                </div>

                <div className="flex items-center space-x-1.5 self-end sm:self-center">
                  <button
                    onClick={(e) => handleExport(exam, e)}
                    className="p-2 rounded-xl text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition"
                    title="Tải tệp JSON để sao lưu"
                  >
                    <Download className="w-4 h-4" />
                  </button>
                  <button
                    onClick={(e) => handleDelete(exam.id, e)}
                    className="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition"
                    title="Xóa đề thi"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                  <button
                    className="flex items-center space-x-1 px-3 py-1.5 rounded-xl bg-blue-50 text-blue-700 font-bold text-xs group-hover:bg-blue-600 group-hover:text-white transition ml-1"
                    title="Mở đề thi này"
                  >
                    <span>Mở đề</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
          <span className="flex items-center space-x-1.5 text-emerald-700 font-medium">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>Mở đề từ kho lưu trữ hoàn toàn miễn phí (0 token AI).</span>
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-700 font-semibold transition"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
};
