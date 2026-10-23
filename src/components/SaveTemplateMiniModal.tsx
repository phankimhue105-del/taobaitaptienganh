import React, { useState, useEffect, useRef } from 'react';
import { X, BookmarkPlus, AlertCircle, CheckCircle2 } from 'lucide-react';
import { ExerciseParameter } from '../types';
import { isTemplateNameDuplicate, saveTemplate } from '../utils/storage';

interface SaveTemplateMiniModalProps {
  isOpen: boolean;
  onClose: () => void;
  parameters: ExerciseParameter[];
  onSaved: (templateName: string) => void;
}

export const SaveTemplateMiniModal: React.FC<SaveTemplateMiniModalProps> = ({
  isOpen,
  onClose,
  parameters,
  onSaved,
}) => {
  const [name, setName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isDuplicate, setIsDuplicate] = useState(false);
  const [confirmOverwrite, setConfirmOverwrite] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setName('');
      setError(null);
      setIsDuplicate(false);
      setConfirmOverwrite(false);
      setTimeout(() => inputRef.current?.focus(), 80);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleNameChange = (val: string) => {
    setName(val);
    setError(null);
    setIsDuplicate(false);
    setConfirmOverwrite(false);
  };

  const handleSave = () => {
    const trimmed = name.trim();

    // Validation: không để trống
    if (!trimmed) {
      setError('Tên mẫu không được để trống.');
      inputRef.current?.focus();
      return;
    }

    // Validation: trùng tên
    if (!confirmOverwrite && isTemplateNameDuplicate(trimmed)) {
      setIsDuplicate(true);
      setError(`Tên mẫu "${trimmed}" đã tồn tại trong thư viện. Bạn có muốn lưu thêm một bản mới với cùng tên không?`);
      setConfirmOverwrite(true);
      return;
    }

    // Lưu mẫu (0 AI calls)
    try {
      saveTemplate({ name: trimmed, parameters });
      onSaved(trimmed);
      onClose();
    } catch (err: any) {
      setError('Không thể lưu mẫu. Vui lòng kiểm tra bộ nhớ trình duyệt.');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSave();
    if (e.key === 'Escape') onClose();
  };

  const summary = `${parameters.length} bài tập · ${Array.from(new Set(parameters.map(p => p.cefrLevel))).join(', ')}`;

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-150"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-white rounded-2xl w-full max-w-sm shadow-2xl border border-slate-200 overflow-hidden animate-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="bg-gradient-to-r from-indigo-600 to-blue-700 px-5 py-3.5 text-white flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <BookmarkPlus className="w-4.5 h-4.5" />
            <div>
              <p className="font-bold text-sm">Lưu mẫu cấu hình</p>
              <p className="text-[11px] text-indigo-100">Chỉ lưu tham số · Không lưu nội dung AI · 0đ</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-white/20 transition text-white/80 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="px-5 py-4 space-y-3">
          {/* Tóm tắt mẫu */}
          <div className="p-2.5 bg-indigo-50 rounded-xl border border-indigo-100 text-[11px] text-indigo-700">
            <span className="font-semibold">Mẫu sẽ lưu: </span>{summary}
          </div>

          {/* Input tên mẫu */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Tên mẫu <span className="text-rose-500">*</span>
            </label>
            <input
              ref={inputRef}
              type="text"
              value={name}
              onChange={(e) => handleNameChange(e.target.value)}
              onKeyDown={handleKeyDown}
              maxLength={80}
              placeholder="VD: Kiểm tra 45 phút - B1 Grammar"
              className={`w-full px-3 py-2 text-sm rounded-xl border focus:outline-none focus:ring-2 transition ${
                error
                  ? 'border-rose-300 focus:ring-rose-400/30 bg-rose-50'
                  : 'border-slate-200 focus:ring-indigo-400/30 bg-slate-50 focus:bg-white'
              } text-slate-800`}
            />
            <div className="flex justify-between mt-0.5">
              {error ? (
                <p className="text-[11px] text-rose-600 flex items-start space-x-1">
                  <AlertCircle className="w-3 h-3 mt-0.5 shrink-0" />
                  <span>{error}</span>
                </p>
              ) : (
                <span />
              )}
              <span className="text-[10px] text-slate-400 ml-auto shrink-0">{name.length}/80</span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 pb-4 flex items-center justify-end space-x-2">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition"
          >
            Hủy
          </button>

          {confirmOverwrite && isDuplicate ? (
            <button
              onClick={handleSave}
              className="px-4 py-2 rounded-xl text-xs font-bold bg-amber-500 hover:bg-amber-600 text-white transition shadow-sm"
            >
              Xác nhận lưu thêm
            </button>
          ) : (
            <button
              onClick={handleSave}
              disabled={!name.trim()}
              className={`flex items-center space-x-1.5 px-4 py-2 rounded-xl text-xs font-bold transition shadow-sm ${
                name.trim()
                  ? 'bg-indigo-600 hover:bg-indigo-700 text-white'
                  : 'bg-slate-200 text-slate-400 cursor-not-allowed'
              }`}
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Lưu mẫu</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
