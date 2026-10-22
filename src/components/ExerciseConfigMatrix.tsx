import React from 'react';
import {
  Plus,
  Trash2,
  Copy,
  Layers,
  Sparkles,
  ArrowRight,
  Wand2,
  Loader2,
  ListPlus,
  Edit2,
} from 'lucide-react';
import {
  ExerciseParameter,
  ExerciseFormat,
  CefrLevel,
  CognitiveLevel,
  FORMAT_LABELS,
} from '../types';

interface ExerciseConfigMatrixProps {
  parameters: ExerciseParameter[];
  setParameters: React.Dispatch<React.SetStateAction<ExerciseParameter[]>>;
  onGenerate: () => void;
  isGenerating: boolean;
  onBackToInput: () => void;
}

const CEFR_LEVELS: CefrLevel[] = ['Pre-A1', 'A1', 'A2', 'B1', 'B2', 'C1'];

const COGNITIVE_LEVELS: { level: CognitiveLevel; desc: string; color: string }[] = [
  { level: 'Nhận biết', desc: 'Nhớ định nghĩa, nhận diện ngữ pháp, phát âm cơ bản', color: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  { level: 'Thông hiểu', desc: 'Hiểu ngữ cảnh, dịch nghĩa, giải thích cấu trúc', color: 'bg-blue-50 text-blue-700 border-blue-200' },
  { level: 'Vận dụng', desc: 'Áp dụng vào câu mới, chia thì, biến đổi từ', color: 'bg-amber-50 text-amber-700 border-amber-200' },
  { level: 'Vận dụng cao', desc: 'Phân tích suy luận, viết câu phức, bẫy tinh vi', color: 'bg-rose-50 text-rose-700 border-rose-200' },
];

const SUGGESTED_EXERCISE_TYPES = [
  'Multiple Choice',
  'Fill in the blanks (Điền từ khuyết)',
  'Error Identification (Tìm lỗi sai)',
  'Sentence Transformation (Viết lại câu)',
  'Word Formation (Cho dạng đúng của từ)',
  'Matching (Nối câu / từ với định nghĩa)',
  'Reading Comprehension (Đọc hiểu)',
  'Listening with Script (Kỹ năng Nghe)',
  'Pronunciation & Stress (Ngữ âm & Trọng âm)',
  'Sentence Scramble (Sắp xếp từ thành câu)',
];

export const ExerciseConfigMatrix: React.FC<ExerciseConfigMatrixProps> = ({
  parameters,
  setParameters,
  onGenerate,
  isGenerating,
  onBackToInput,
}) => {
  const addExercise = () => {
    const newOrder = parameters.length + 1;
    const newParam: ExerciseParameter = {
      id: `param-${Date.now()}`,
      order: newOrder,
      exerciseType: 'Multiple Choice',
      format: 'mcq_4',
      questionCount: 5,
      cognitiveLevel: 'Vận dụng',
      cefrLevel: 'B1',
      focus: 'Kiến thức trọng tâm bài học',
      customNotes: 'Đặt câu hỏi phân loại học sinh tốt, ngữ cảnh tự nhiên.',
    };
    setParameters([...parameters, newParam]);
  };

  const removeExercise = (id: string) => {
    const filtered = parameters.filter((p) => p.id !== id);
    // Re-index order
    const updated = filtered.map((p, idx) => ({ ...p, order: idx + 1 }));
    setParameters(updated);
  };

  const duplicateExercise = (param: ExerciseParameter) => {
    const newParam: ExerciseParameter = {
      ...param,
      id: `param-${Date.now()}`,
      order: parameters.length + 1,
      customNotes: param.customNotes ? `${param.customNotes} (Bản sao)` : '(Bản sao)',
    };
    setParameters([...parameters, newParam]);
  };

  const updateParameter = (id: string, field: keyof ExerciseParameter, value: any) => {
    setParameters((prev) =>
      prev.map((item) => {
        if (item.id === id) {
          return { ...item, [field]: value };
        }
        return item;
      })
    );
  };

  const totalQuestions = parameters.reduce(
    (acc, curr) => acc + (Number(curr.questionCount) || 0),
    0
  );

  return (
    <div className="space-y-6">
      {/* Top Header Bar */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="p-1.5 rounded-lg bg-blue-100 text-blue-700">
              <Layers className="w-5 h-5" />
            </span>
            <h2 className="text-lg font-bold text-slate-900">
              Cấu Hình Tham Số Kỹ Thuật (8 Trường Thông Tin)
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Nhấn vào thanh <strong>"+ Thêm bài tập"</strong> để thêm từng bài tập theo nhu cầu. Mỗi bài tập gồm 8 trường thông tin chi tiết.
          </p>
        </div>

        {parameters.length > 0 && (
          <button
            onClick={onGenerate}
            disabled={isGenerating}
            className={`flex items-center space-x-2 px-5 py-2.5 rounded-xl text-xs font-bold text-white shadow-md transition ${
              isGenerating
                ? 'bg-slate-300 cursor-not-allowed shadow-none'
                : 'bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600 hover:from-blue-700 hover:to-violet-700 shadow-blue-500/25'
            }`}
          >
            {isGenerating ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Đang biên soạn ({totalQuestions} câu)...</span>
              </>
            ) : (
              <>
                <Wand2 className="w-4 h-4" />
                <span>Biên soạn Học liệu ({parameters.length} bài • {totalQuestions} câu)</span>
              </>
            )}
          </button>
        )}
      </div>

      {/* Exercise Cards List */}
      <div className="space-y-4">
        {parameters.length === 0 ? (
          <div className="bg-white rounded-2xl border-2 border-dashed border-slate-300 p-8 text-center space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto">
              <ListPlus className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-slate-800">
              Chưa có bài tập nào được tạo
            </h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              Nhấn vào thanh <strong>"+ Thêm bài tập"</strong> dưới đây để tạo bài tập đầu tiên và cấu hình 8 trường thông tin kỹ thuật theo ý bạn.
            </p>
          </div>
        ) : (
          parameters.map((param) => {
            const cognitiveInfo =
              COGNITIVE_LEVELS.find((c) => c.level === param.cognitiveLevel) || COGNITIVE_LEVELS[2];

            return (
              <div
                key={param.id}
                className="bg-white rounded-2xl border border-slate-200 shadow-xs hover:border-slate-300 transition-all overflow-hidden"
              >
                {/* Exercise Header */}
                <div className="bg-slate-50/90 px-5 py-3 border-b border-slate-100 flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center space-x-3">
                    <span className="w-7 h-7 rounded-lg bg-blue-600 text-white font-extrabold text-xs flex items-center justify-center shadow-xs">
                      {param.order}
                    </span>
                    <div>
                      <h3 className="font-bold text-slate-800 text-sm">
                        Exercise {param.order}: {param.exerciseType || 'Bài tập mới'}
                      </h3>
                      <span className="text-[11px] text-slate-500">
                        {FORMAT_LABELS[param.format] || param.format}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <span
                      className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full border ${cognitiveInfo.color}`}
                    >
                      Bloom: {param.cognitiveLevel}
                    </span>
                    <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
                      CEFR: {param.cefrLevel}
                    </span>
                    <div className="h-4 w-px bg-slate-200 mx-1"></div>
                    <button
                      onClick={() => duplicateExercise(param)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
                      title="Sao chép cấu hình bài tập này"
                    >
                      <Copy className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => removeExercise(param.id)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition"
                      title="Xóa bài tập này"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* 8 Parameters Form Grid */}
                <div className="p-5 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
                  {/* 1. Số thứ tự bài tập */}
                  <div>
                    <label className="font-semibold text-slate-700 block mb-1">
                      1. Số thứ tự bài tập
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="50"
                      value={param.order}
                      onChange={(e) =>
                        updateParameter(param.id, 'order', parseInt(e.target.value) || 1)
                      }
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/30 text-slate-800 font-medium"
                    />
                  </div>

                  {/* 2. Dạng bài (Khung cho người dùng tự gõ vào) */}
                  <div className="lg:col-span-2">
                    <label className="font-semibold text-slate-700 block mb-1 flex items-center justify-between">
                      <span>2. Dạng bài (Tự nhập nội dung)</span>
                      <span className="text-[10px] text-blue-600 font-normal">
                        Có thể gõ tự do
                      </span>
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        list={`suggested-types-${param.id}`}
                        value={param.exerciseType}
                        onChange={(e) => updateParameter(param.id, 'exerciseType', e.target.value)}
                        placeholder="VD: Multiple Choice, Chia động từ, Viết lại câu, Tìm lỗi sai..."
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/30 text-slate-800 font-medium"
                      />
                      <datalist id={`suggested-types-${param.id}`}>
                        {SUGGESTED_EXERCISE_TYPES.map((t) => (
                          <option key={t} value={t} />
                        ))}
                      </datalist>
                    </div>
                  </div>

                  {/* 3. Hình thức (4 Lựa chọn chuẩn) */}
                  <div>
                    <label className="font-semibold text-slate-700 block mb-1">
                      3. Hình thức
                    </label>
                    <select
                      value={param.format}
                      onChange={(e) =>
                        updateParameter(param.id, 'format', e.target.value as ExerciseFormat)
                      }
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/30 text-slate-800 font-medium"
                    >
                      <option value="mcq_4">Trắc nghiệm 4 phương án (A, B, C, D)</option>
                      <option value="mcq_3">Trắc nghiệm 3 phương án (A, B, C)</option>
                      <option value="true_false">Trắc nghiệm True / False</option>
                      <option value="open_ended">Tự luận (Điền khuyết / Viết câu)</option>
                    </select>
                  </div>

                  {/* 4. Số lượng câu hỏi */}
                  <div>
                    <label className="font-semibold text-slate-700 block mb-1">
                      4. Số lượng câu hỏi
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="30"
                      value={param.questionCount}
                      onChange={(e) =>
                        updateParameter(
                          param.id,
                          'questionCount',
                          Math.max(1, parseInt(e.target.value) || 1)
                        )
                      }
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/30 text-slate-800 font-medium"
                    />
                  </div>

                  {/* 5. Mức độ tư duy (Bloom) */}
                  <div>
                    <label className="font-semibold text-slate-700 block mb-1">
                      5. Mức độ tư duy (Bloom)
                    </label>
                    <select
                      value={param.cognitiveLevel}
                      onChange={(e) =>
                        updateParameter(param.id, 'cognitiveLevel', e.target.value as CognitiveLevel)
                      }
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/30 text-slate-800 font-medium"
                    >
                      {COGNITIVE_LEVELS.map((c) => (
                        <option key={c.level} value={c.level}>
                          {c.level}
                        </option>
                      ))}
                    </select>
                    <span className="text-[10px] text-slate-500 mt-1 block truncate">
                      {cognitiveInfo.desc}
                    </span>
                  </div>

                  {/* 6. Trình độ CEFR */}
                  <div>
                    <label className="font-semibold text-slate-700 block mb-1">
                      6. Trình độ CEFR
                    </label>
                    <select
                      value={param.cefrLevel}
                      onChange={(e) =>
                        updateParameter(param.id, 'cefrLevel', e.target.value as CefrLevel)
                      }
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/30 text-slate-800 font-medium"
                    >
                      {CEFR_LEVELS.map((lvl) => (
                        <option key={lvl} value={lvl}>
                          Khung {lvl}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* 7. Kiến thức trọng tâm */}
                  <div>
                    <label className="font-semibold text-slate-700 block mb-1">
                      7. Kiến thức trọng tâm
                    </label>
                    <input
                      type="text"
                      value={param.focus}
                      onChange={(e) => updateParameter(param.id, 'focus', e.target.value)}
                      placeholder="VD: Past Simple vs Present Perfect..."
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/30 text-slate-800 font-medium"
                    />
                  </div>

                  {/* 8. Ghi chú riêng */}
                  <div className="lg:col-span-4">
                    <label className="font-semibold text-slate-700 block mb-1">
                      8. Ghi chú riêng của giáo viên
                    </label>
                    <input
                      type="text"
                      value={param.customNotes}
                      onChange={(e) => updateParameter(param.id, 'customNotes', e.target.value)}
                      placeholder="VD: Tránh dùng từ chuyên ngành; Đặt câu hỏi chủ đề môi trường; Bẫy ở mạo từ..."
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/30 text-slate-800"
                    />
                  </div>
                </div>
              </div>
            );
          })
        )}

        {/* The single prominent "+ Thêm bài tập" bar as requested */}
        <button
          onClick={addExercise}
          className="w-full py-4 px-6 rounded-2xl border-2 border-dashed border-blue-400/80 bg-blue-50/50 hover:bg-blue-50 hover:border-blue-500 text-blue-700 font-bold text-sm transition-all flex items-center justify-center space-x-2 shadow-xs group"
        >
          <div className="w-7 h-7 rounded-full bg-blue-600 text-white flex items-center justify-center group-hover:scale-110 transition shadow-xs">
            <Plus className="w-4 h-4" />
          </div>
          <span>+ Thêm bài tập (Exercise {parameters.length + 1})</span>
        </button>
      </div>

      {/* Bottom Action Bar */}
      <div className="bg-slate-900 text-white p-4 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-3 shadow-lg">
        <div className="flex items-center space-x-3">
          <button
            onClick={onBackToInput}
            className="text-xs text-slate-300 hover:text-white underline transition"
          >
            ← Quay lại nguồn học liệu
          </button>
          <span className="text-slate-600">|</span>
          <span className="text-xs text-slate-300">
            Tổng cộng: <strong className="text-white">{parameters.length}</strong> bài tập,{' '}
            <strong className="text-blue-400">{totalQuestions}</strong> câu hỏi
          </span>
        </div>

        <button
          onClick={onGenerate}
          disabled={isGenerating || parameters.length === 0}
          className={`flex items-center space-x-2 px-6 py-2.5 rounded-xl text-xs font-bold transition shadow-lg ${
            isGenerating || parameters.length === 0
              ? 'bg-slate-700 text-slate-400 cursor-not-allowed'
              : 'bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 text-white shadow-blue-500/30'
          }`}
        >
          {isGenerating ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>AI đang xây dựng đề thi...</span>
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4" />
              <span>Tiến hành Biên soạn Học liệu ({totalQuestions} câu)</span>
              <ArrowRight className="w-4 h-4 ml-1" />
            </>
          )}
        </button>
      </div>
    </div>
  );
};
