import React, { useState } from 'react';
import {
  X,
  Sliders,
  Sparkles,
  Loader2,
  CheckCircle2,
  HelpCircle,
  ArrowRight,
  TrendingUp,
  RefreshCw,
  Edit,
} from 'lucide-react';
import { ExerciseResult } from '../types';
import { fetchAdjustExercise } from '../utils/apiClient';

interface AdjustmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  exercises: ExerciseResult[];
  selectedExerciseId?: string;
  targetQuestionNumber?: number;
  rawMaterialText?: string;
  onExerciseUpdated: (updatedExercise: ExerciseResult, summary: string) => void;
}

export const AdjustmentModal: React.FC<AdjustmentModalProps> = ({
  isOpen,
  onClose,
  exercises,
  selectedExerciseId,
  targetQuestionNumber: initialQuestionNumber,
  rawMaterialText,
  onExerciseUpdated,
}) => {
  const [exerciseId, setExerciseId] = useState<string>(
    selectedExerciseId || (exercises[0]?.id || '')
  );
  const [questionNum, setQuestionNum] = useState<string>(
    initialQuestionNumber ? String(initialQuestionNumber) : 'all'
  );
  const [command, setCommand] = useState('');
  const [isAdjusting, setIsAdjusting] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const activeExercise = exercises.find((e) => e.id === exerciseId) || exercises[0];

  const quickPresets = [
    questionNum !== 'all'
      ? `Tăng độ khó câu ${questionNum} lên mức Vận dụng cao với phương án nhiễu tinh tế hơn`
      : 'Tăng mức độ tư duy toàn bộ bài tập lên một bậc',
    questionNum !== 'all'
      ? `Đổi câu ${questionNum} sang ngữ cảnh thực tế về lối sống xanh hoặc thanh thiếu niên`
      : 'Chuyển đổi hình thức sang Tự luận (Điền khuyết / Viết câu)',
    'Chuyển đổi hình thức sang Trắc nghiệm 3 phương án (A, B, C)',
    'Chuyển đổi hình thức sang Trắc nghiệm True / False',
    'Tạo thêm phương án gây nhiễu (distractors) lắt léo hơn để phân loại học sinh',
    'Thêm bẫy ngữ pháp thường gặp của học sinh Việt Nam',
  ];

  const handleApplyAdjustment = async () => {
    if (!command.trim() || !activeExercise) return;

    setIsAdjusting(true);
    setError(null);
    setFeedback(null);

    try {
      const data = await fetchAdjustExercise({
        currentExercise: activeExercise,
        adjustmentCommand: command,
        targetQuestionNumber: questionNum !== 'all' ? parseInt(questionNum) : undefined,
        rawMaterial: rawMaterialText,
      });

      if (data.updatedExercise) {
        onExerciseUpdated(data.updatedExercise, data.adjustmentSummary || 'Đã điều chỉnh thành công.');
        setFeedback(data.adjustmentSummary || 'Đã cập nhật bài tập.');
        setTimeout(() => {
          onClose();
        }, 1500);
      }
    } catch (err: any) {
      setError(err.message || 'Không thể thực hiện điều chỉnh.');
    } finally {
      setIsAdjusting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white rounded-3xl max-w-xl w-full border border-slate-200 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-amber-500 to-amber-600 px-6 py-4 text-white flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <span className="p-1.5 rounded-xl bg-white/20">
              <Sliders className="w-5 h-5 text-white" />
            </span>
            <div>
              <h3 className="font-extrabold text-base">Điều Chỉnh & Tinh Chỉnh Sư Phạm</h3>
              <p className="text-xs text-amber-100">
                Giữ nguyên toàn bộ khung dữ liệu và thay đổi tham số theo yêu cầu
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
          {/* Quota Saving Notice */}
          <div className="p-3 bg-blue-50/80 border border-blue-200 rounded-xl flex items-start space-x-2 text-[11.5px] text-blue-900 leading-relaxed">
            <Sparkles className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
            <div>
              <strong>Mẹo tiết kiệm Quota:</strong> Nếu chỉ cần sửa chính tả, đổi đáp án hoặc thay nội dung các phương án A/B/C/D, bạn có thể bấm <strong>"Sửa trực tiếp (0đ)"</strong> ngay trên màn hình xem trước đề thi mà <strong>không tốn lượt gọi AI nào</strong>. Chỉ dùng AI khi bạn cần sinh ngữ cảnh mới hoặc tạo phương án gây nhiễu tự động.
            </div>
          </div>

          {/* Target Selectors */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-bold text-slate-700 block mb-1">
                Chọn bài tập cần điều chỉnh:
              </label>
              <select
                value={exerciseId}
                onChange={(e) => {
                  setExerciseId(e.target.value);
                  setQuestionNum('all');
                }}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500/30 text-slate-800 font-medium"
              >
                {exercises.map((ex, idx) => (
                  <option key={ex.id || idx} value={ex.id}>
                    {ex.title || `Exercise ${ex.order || idx + 1}`}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1">
                Phạm vi câu hỏi:
              </label>
              <select
                value={questionNum}
                onChange={(e) => setQuestionNum(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500/30 text-slate-800 font-medium"
              >
                <option value="all">Toàn bộ bài tập</option>
                {activeExercise?.questions?.map((q) => (
                  <option key={q.number} value={String(q.number)}>
                    Câu {q.number}: {q.prompt.slice(0, 32)}...
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Quick presets */}
          <div>
            <label className="font-bold text-slate-700 block mb-1.5 flex items-center space-x-1">
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              <span>Gợi ý lệnh điều chỉnh nhanh:</span>
            </label>
            <div className="space-y-1.5">
              {quickPresets.map((preset, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setCommand(preset)}
                  className="w-full text-left p-2 rounded-xl bg-amber-50/60 hover:bg-amber-100/80 border border-amber-200/60 text-amber-900 transition flex items-center justify-between text-[11px]"
                >
                  <span className="line-clamp-1">{preset}</span>
                  <ArrowRight className="w-3 h-3 text-amber-600 shrink-0 ml-2" />
                </button>
              ))}
            </div>
          </div>

          {/* Command Input Area */}
          <div>
            <label className="font-bold text-slate-700 block mb-1">
              Lệnh điều chỉnh cụ thể của bạn:
            </label>
            <textarea
              value={command}
              onChange={(e) => setCommand(e.target.value)}
              placeholder="Ví dụ: 'Tăng độ khó câu 3 lên mức Vận dụng cao, thêm bẫy ở thì hiện tại hoàn thành', hoặc 'Đổi dạng bài trắc nghiệm sang tự luận điền từ', v.v."
              rows={3}
              className="w-full p-3 rounded-xl border border-slate-200 bg-slate-50/60 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500/30 text-slate-800 text-xs"
            />
          </div>

          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs">
              {error}
            </div>
          )}

          {feedback && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs flex items-center space-x-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{feedback}</span>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-200 transition"
          >
            Hủy bỏ
          </button>
          <button
            onClick={handleApplyAdjustment}
            disabled={isAdjusting || !command.trim()}
            className={`flex items-center space-x-2 px-5 py-2 rounded-xl text-xs font-bold text-white shadow-md transition ${
              isAdjusting || !command.trim()
                ? 'bg-slate-300 cursor-not-allowed shadow-none'
                : 'bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 shadow-amber-500/25'
            }`}
          >
            {isAdjusting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>AI đang điều chỉnh...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                <span>Thực hiện Điều chỉnh</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
