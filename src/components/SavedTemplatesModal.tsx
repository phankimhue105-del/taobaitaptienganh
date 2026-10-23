import React, { useState, useEffect } from 'react';
import {
  X,
  BookOpen,
  Bookmark,
  Calendar,
  Layers,
  ArrowRight,
  Trash2,
  Edit3,
  Check,
  X as XIcon,
  Sparkles,
  AlertCircle,
  Info,
} from 'lucide-react';
import { ExerciseTemplate, ExerciseParameter } from '../types';
import {
  getSavedTemplates,
  deleteTemplate,
  renameTemplate,
  isTemplateNameDuplicate,
} from '../utils/storage';

interface SavedTemplatesModalProps {
  isOpen: boolean;
  onClose: () => void;
  /** Áp dụng mẫu: điền parameters vào bước 2 (0 AI calls) */
  onUseTemplate: (parameters: ExerciseParameter[]) => void;
}

/**
 * Danh sách mẫu cấu hình mặc định của hệ thống.
 * Không lưu trong localStorage, luôn hiển thị.
 */
const SYSTEM_TEMPLATES: ExerciseTemplate[] = [
  {
    id: 'sys-1',
    name: 'Kiểm tra 1 tiết – B1 Ngữ pháp & Từ vựng',
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
    exerciseCount: 3,
    cefrSummary: 'B1',
    isSystem: true,
    parameters: [
      { id: 'sys1-p1', order: 1, exerciseType: 'Multiple Choice', format: 'mcq_4', questionCount: 10, cognitiveLevel: 'Nhận biết', cefrLevel: 'B1', focus: 'Grammar – Tenses', customNotes: '' },
      { id: 'sys1-p2', order: 2, exerciseType: 'Fill in the blanks', format: 'open_ended', questionCount: 5, cognitiveLevel: 'Thông hiểu', cefrLevel: 'B1', focus: 'Vocabulary in context', customNotes: '' },
      { id: 'sys1-p3', order: 3, exerciseType: 'True/False', format: 'true_false', questionCount: 5, cognitiveLevel: 'Thông hiểu', cefrLevel: 'B1', focus: 'Reading comprehension', customNotes: '' },
    ],
  },
  {
    id: 'sys-2',
    name: 'Kiểm tra 45 phút – A2 Kỹ năng tổng hợp',
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
    exerciseCount: 2,
    cefrSummary: 'A2',
    isSystem: true,
    parameters: [
      { id: 'sys2-p1', order: 1, exerciseType: 'Multiple Choice', format: 'mcq_3', questionCount: 8, cognitiveLevel: 'Nhận biết', cefrLevel: 'A2', focus: 'Vocabulary – Daily life', customNotes: '' },
      { id: 'sys2-p2', order: 2, exerciseType: 'Sentence writing', format: 'open_ended', questionCount: 4, cognitiveLevel: 'Vận dụng', cefrLevel: 'A2', focus: 'Present Simple & Habits', customNotes: '' },
    ],
  },
  {
    id: 'sys-3',
    name: 'Đề thi cuối kỳ – B2 nâng cao',
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
    exerciseCount: 4,
    cefrSummary: 'B2',
    isSystem: true,
    parameters: [
      { id: 'sys3-p1', order: 1, exerciseType: 'Multiple Choice', format: 'mcq_4', questionCount: 12, cognitiveLevel: 'Vận dụng', cefrLevel: 'B2', focus: 'Grammar – Advanced Structures', customNotes: '' },
      { id: 'sys3-p2', order: 2, exerciseType: 'Reading Comprehension', format: 'mcq_4', questionCount: 8, cognitiveLevel: 'Thông hiểu', cefrLevel: 'B2', focus: 'Main idea & Details', customNotes: '' },
      { id: 'sys3-p3', order: 3, exerciseType: 'Error Identification', format: 'mcq_4', questionCount: 5, cognitiveLevel: 'Vận dụng cao', cefrLevel: 'B2', focus: 'Grammar accuracy', customNotes: '' },
      { id: 'sys3-p4', order: 4, exerciseType: 'Sentence Rewriting', format: 'open_ended', questionCount: 5, cognitiveLevel: 'Vận dụng cao', cefrLevel: 'B2', focus: 'Paraphrasing & Structures', customNotes: '' },
    ],
  },
];

export const SavedTemplatesModal: React.FC<SavedTemplatesModalProps> = ({
  isOpen,
  onClose,
  onUseTemplate,
}) => {
  const [userTemplates, setUserTemplates] = useState<ExerciseTemplate[]>([]);
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState('');
  const [renameError, setRenameError] = useState<string | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setUserTemplates(getSavedTemplates());
      setRenamingId(null);
      setDeleteConfirmId(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const refresh = () => setUserTemplates(getSavedTemplates());

  // ── Rename ────────────────────────────────────────────────────────────────
  const startRename = (tpl: ExerciseTemplate, e: React.MouseEvent) => {
    e.stopPropagation();
    setRenamingId(tpl.id);
    setRenameValue(tpl.name);
    setRenameError(null);
    setDeleteConfirmId(null);
  };

  const commitRename = (id: string) => {
    const trimmed = renameValue.trim();
    if (!trimmed) { setRenameError('Tên không được để trống.'); return; }
    if (isTemplateNameDuplicate(trimmed, id)) {
      setRenameError(`Tên "${trimmed}" đã tồn tại.`);
      return;
    }
    renameTemplate(id, trimmed);
    refresh();
    setRenamingId(null);
    setRenameError(null);
  };

  // ── Delete ────────────────────────────────────────────────────────────────
  const handleDeleteClick = (tpl: ExerciseTemplate, e: React.MouseEvent) => {
    e.stopPropagation();
    if (tpl.isSystem) return;
    setDeleteConfirmId(tpl.id);
    setRenamingId(null);
  };

  const confirmDelete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    deleteTemplate(id);
    refresh();
    setDeleteConfirmId(null);
  };

  // ── Use template ──────────────────────────────────────────────────────────
  const handleUse = (tpl: ExerciseTemplate) => {
    // Deep copy params với id mới để không liên kết với mẫu gốc
    const freshParams: ExerciseParameter[] = tpl.parameters.map((p, i) => ({
      ...p,
      id: `param-${Date.now()}-${i}`,
    }));
    onUseTemplate(freshParams);
    onClose();
  };

  const allTemplates = [...SYSTEM_TEMPLATES, ...userTemplates];

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString('vi-VN', {
      day: '2-digit', month: '2-digit', year: 'numeric',
    });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white rounded-3xl max-w-2xl w-full border border-slate-200 shadow-2xl overflow-hidden flex flex-col max-h-[88vh]">

        {/* Header */}
        <div className="bg-gradient-to-r from-indigo-700 via-blue-700 to-slate-800 px-6 py-4 text-white flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <span className="p-2 rounded-xl bg-white/10">
              <Bookmark className="w-5 h-5 text-indigo-200" />
            </span>
            <div>
              <h3 className="font-extrabold text-sm sm:text-base">Mẫu đề đã lưu</h3>
              <p className="text-[11px] text-indigo-100/80">
                Thư viện cấu hình bài tập · Áp dụng và biên soạn lại <strong>không tiêu tốn quota AI</strong>
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

        {/* Info bar */}
        <div className="px-5 py-2.5 bg-indigo-50 border-b border-indigo-100 flex items-center justify-between text-[11px]">
          <span className="flex items-center space-x-1.5 text-indigo-700">
            <Info className="w-3.5 h-3.5 text-indigo-500" />
            <span>
              <strong>{userTemplates.length}</strong> mẫu của bạn · <strong>{SYSTEM_TEMPLATES.length}</strong> mẫu hệ thống
            </span>
          </span>
          <span className="text-slate-500">Mẫu hệ thống không thể xóa hoặc đổi tên</span>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto p-5 space-y-2.5">
          {allTemplates.length === 0 ? (
            <div className="text-center py-14 text-slate-400 space-y-3">
              <Bookmark className="w-12 h-12 mx-auto text-slate-300" />
              <p className="text-xs text-slate-500 font-medium">Chưa có mẫu nào.</p>
            </div>
          ) : (
            allTemplates.map((tpl) => {
              const isRenaming = renamingId === tpl.id;
              const isConfirmingDelete = deleteConfirmId === tpl.id;

              return (
                <div
                  key={tpl.id}
                  className={`rounded-2xl border transition p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                    tpl.isSystem
                      ? 'bg-slate-50 border-slate-200'
                      : 'bg-white border-slate-200 hover:border-indigo-300 hover:shadow-sm'
                  }`}
                >
                  {/* Info */}
                  <div className="flex-1 min-w-0 space-y-1.5">
                    {/* Tên (hoặc input đổi tên) */}
                    {isRenaming ? (
                      <div className="space-y-1">
                        <div className="flex items-center space-x-2">
                          <input
                            autoFocus
                            value={renameValue}
                            onChange={(e) => { setRenameValue(e.target.value); setRenameError(null); }}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') commitRename(tpl.id);
                              if (e.key === 'Escape') setRenamingId(null);
                            }}
                            maxLength={80}
                            className="flex-1 text-xs px-2.5 py-1.5 border border-indigo-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-400/30 bg-white"
                            onClick={(e) => e.stopPropagation()}
                          />
                          <button onClick={() => commitRename(tpl.id)} className="p-1.5 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 transition">
                            <Check className="w-3.5 h-3.5" />
                          </button>
                          <button onClick={(e) => { e.stopPropagation(); setRenamingId(null); }} className="p-1.5 rounded-lg bg-slate-200 text-slate-600 hover:bg-slate-300 transition">
                            <XIcon className="w-3.5 h-3.5" />
                          </button>
                        </div>
                        {renameError && (
                          <p className="text-[11px] text-rose-600 flex items-center space-x-1">
                            <AlertCircle className="w-3 h-3" /><span>{renameError}</span>
                          </p>
                        )}
                      </div>
                    ) : (
                      <div className="flex items-center space-x-2">
                        <h4 className="font-bold text-xs sm:text-sm text-slate-900 truncate">
                          {tpl.name}
                        </h4>
                        {tpl.isSystem && (
                          <span className="shrink-0 px-1.5 py-0.5 rounded-md bg-amber-100 text-amber-700 text-[10px] font-bold">
                            Hệ thống
                          </span>
                        )}
                      </div>
                    )}

                    {/* Meta */}
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-slate-500">
                      <span className="flex items-center space-x-1">
                        <Layers className="w-3 h-3 text-slate-400" />
                        <span>{tpl.exerciseCount} bài tập</span>
                      </span>
                      {tpl.cefrSummary && (
                        <span className="px-1.5 py-0.5 rounded bg-indigo-50 text-indigo-700 font-bold text-[10px]">
                          CEFR: {tpl.cefrSummary}
                        </span>
                      )}
                      <span className="flex items-center space-x-1">
                        <Calendar className="w-3 h-3 text-slate-400" />
                        <span>{tpl.isSystem ? 'Mẫu mặc định' : `Lưu: ${formatDate(tpl.createdAt)}`}</span>
                      </span>
                    </div>

                    {/* Detail parameters preview */}
                    <div className="flex flex-wrap gap-1 mt-0.5">
                      {tpl.parameters.map((p, i) => (
                        <span key={i} className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 text-[10px]">
                          Bài {p.order}: {p.exerciseType} ({p.questionCount}Q · {p.format.replace('mcq_', 'MCQ-').replace('true_false', 'T/F').replace('open_ended', 'Tự luận')})
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center space-x-1.5 self-end sm:self-center shrink-0">
                    {/* Rename (chỉ user templates) */}
                    {!tpl.isSystem && !isConfirmingDelete && !isRenaming && (
                      <button
                        onClick={(e) => startRename(tpl, e)}
                        className="p-2 rounded-xl text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition"
                        title="Đổi tên mẫu"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                    )}

                    {/* Delete (chỉ user templates) */}
                    {!tpl.isSystem && !isRenaming && (
                      isConfirmingDelete ? (
                        <div className="flex items-center space-x-1 bg-rose-50 border border-rose-200 rounded-xl px-2 py-1.5" onClick={(e) => e.stopPropagation()}>
                          <span className="text-[11px] text-rose-700 font-medium">Xóa?</span>
                          <button onClick={(e) => confirmDelete(tpl.id, e)} className="px-2 py-0.5 rounded-lg bg-rose-600 text-white text-[11px] font-bold hover:bg-rose-700 transition">
                            Xóa
                          </button>
                          <button onClick={(e) => { e.stopPropagation(); setDeleteConfirmId(null); }} className="px-2 py-0.5 rounded-lg bg-slate-200 text-slate-700 text-[11px] font-bold hover:bg-slate-300 transition">
                            Hủy
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={(e) => handleDeleteClick(tpl, e)}
                          className="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition"
                          title="Xóa mẫu (có xác nhận)"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )
                    )}

                    {/* Use template */}
                    {!isRenaming && (
                      <button
                        onClick={() => handleUse(tpl)}
                        className="flex items-center space-x-1 px-3 py-1.5 rounded-xl bg-indigo-50 text-indigo-700 font-bold text-xs hover:bg-indigo-600 hover:text-white transition ml-1"
                        title="Sử dụng mẫu này – điền vào Bước 2 (0 lượt gọi AI)"
                      >
                        <span>Sử dụng</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
          <span className="flex items-center space-x-1.5 text-emerald-700 font-medium">
            <Sparkles className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
            <span>Áp dụng mẫu không gọi AI · Chỉ điền tham số vào Bước 2.</span>
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
