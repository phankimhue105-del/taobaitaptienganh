import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { MaterialInputSection } from './components/MaterialInputSection';
import { ExerciseConfigMatrix } from './components/ExerciseConfigMatrix';
import { ExercisePreview } from './components/ExercisePreview';
import { AdjustmentModal } from './components/AdjustmentModal';
import { ExportWordModal } from './components/ExportWordModal';
import { SavedExamsModal } from './components/SavedExamsModal';
import { SAMPLE_MATERIALS } from './data/sampleData';
import {
  ExerciseParameter,
  ExerciseResult,
  ExtractedMaterial,
  QuestionItem,
  CefrLevel,
  SavedExam,
} from './types';
import { CheckCircle2, AlertCircle, AlertTriangle } from 'lucide-react';
import { fetchGenerateExercises } from './utils/apiClient';
import {
  computeStringHash,
  computeExerciseSignature,
  getCachedExercises,
  setCachedExercises,
  saveExamToStorage,
  getSavedExams,
} from './utils/storage';

export default function App() {
  const [activeStep, setActiveStep] = useState<number>(1);
  const [rawText, setRawText] = useState<string>('');
  const [extractedMaterial, setExtractedMaterial] = useState<ExtractedMaterial | null>(null);
  const [parameters, setParameters] = useState<ExerciseParameter[]>([]);
  const [exercises, setExercises] = useState<ExerciseResult[]>([]);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [generateError, setGenerateError] = useState<{
    message: string;
    isQuota?: boolean;
    model?: string;
  } | string | null>(null);

  // Modals state
  const [isAdjustmentModalOpen, setIsAdjustmentModalOpen] = useState(false);
  const [adjustmentTarget, setAdjustmentTarget] = useState<{
    exerciseId?: string;
    questionNumber?: number;
  }>({});
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [isSavedExamsOpen, setIsSavedExamsOpen] = useState(false);
  const [savedExamsCount, setSavedExamsCount] = useState<number>(0);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  useEffect(() => {
    setSavedExamsCount(getSavedExams().length);
  }, []);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleLoadSample = (sampleId: string) => {
    const sample = SAMPLE_MATERIALS.find((s) => s.id === sampleId);
    if (!sample) return;
    setRawText(sample.rawText);
    setParameters(sample.suggestedParams);
    setExtractedMaterial(null);
    setActiveStep(1);
    showToast(`Đã tải mẫu: ${sample.name}`);
  };

  const handleResetAll = () => {
    if (confirm('Bạn có chắc chắn muốn làm mới và xóa dữ liệu hiện tại không?')) {
      setRawText('');
      setExtractedMaterial(null);
      setParameters([]);
      setExercises([]);
      setActiveStep(1);
      showToast('Đã làm mới dữ liệu.');
    }
  };

  const handleApplySuggestedFocus = (focus: string, cefr?: CefrLevel) => {
    if (parameters.length === 0) {
      setParameters([
        {
          id: `param-${Date.now()}`,
          order: 1,
          exerciseType: 'Multiple Choice',
          format: 'mcq_4',
          questionCount: 5,
          cognitiveLevel: 'Vận dụng',
          cefrLevel: cefr || 'B1',
          focus,
          customNotes: 'Đặt câu hỏi xoáy sâu vào chủ điểm này.',
        },
      ]);
    } else {
      setParameters((prev) =>
        prev.map((p, idx) =>
          idx === 0
            ? {
                ...p,
                focus,
                cefrLevel: cefr || p.cefrLevel,
              }
            : p
        )
      );
    }
    showToast(`Đã áp dụng chủ điểm: "${focus}" vào Bài tập 1`);
    setActiveStep(2);
  };

  const handleGenerateExercises = async () => {
    if (isGenerating) return; // Prevent duplicate concurrent requests
    setIsGenerating(true);
    setGenerateError(null);

    // Tính toán chữ ký bài tập để kiểm tra cache (Tối ưu 0đ)
    const materialSig = computeStringHash(
      `${rawText.trim()}__${extractedMaterial?.title || ''}__${extractedMaterial?.vocabulary?.length || 0}`
    );
    const exerciseSig = computeExerciseSignature(materialSig, parameters);

    // 1. Kiểm tra cache đề thi đã sinh trước đó
    const cached = getCachedExercises(exerciseSig);
    if (cached && cached.length > 0) {
      setExercises(cached);
      setActiveStep(3);
      setIsGenerating(false);
      showToast('Đã nạp lại đề thi từ bộ nhớ đệm (0 lượt gọi AI)!');
      return;
    }

    try {
      const data = await fetchGenerateExercises({
        rawMaterial: rawText,
        extractedData: extractedMaterial,
        parameters: parameters,
      });

      if (!data.exercises || data.exercises.length === 0) {
        throw new Error('AI không thể tạo danh sách bài tập. Vui lòng kiểm tra lại tham số.');
      }

      setExercises(data.exercises);
      setCachedExercises(exerciseSig, data.exercises);
      setActiveStep(3);
      showToast('Đã biên soạn học liệu thành công!');
    } catch (err: any) {
      console.error(err);
      const isQuota =
        err.status === 429 ||
        err.isDailyQuotaExhausted ||
        err.quotaType === 'daily' ||
        err.code === 'DAILY_QUOTA_EXHAUSTED' ||
        err.message?.includes('hạn mức') ||
        err.message?.includes('429');

      setGenerateError({
        message: err.message || 'Lỗi không xác định khi biên soạn.',
        isQuota: Boolean(isQuota),
        model: err.model,
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSaveExam = () => {
    if (exercises.length === 0) return;
    const saved = saveExamToStorage({
      title: extractedMaterial?.title,
      rawText,
      extractedMaterial,
      parameters,
      exercises,
    });
    setSavedExamsCount(getSavedExams().length);
    showToast(`Đã lưu "${saved.title}" vào kho đề thi (0đ)!`);
  };

  const handleLoadExam = (exam: SavedExam) => {
    setRawText(exam.rawText || '');
    setExtractedMaterial(exam.extractedMaterial);
    setParameters(exam.parameters || []);
    setExercises(exam.exercises || []);
    setActiveStep(3);
    showToast(`Đã mở đề thi "${exam.title}" (0 lượt gọi AI - 0đ)`);
  };

  const handleUpdateExercise = (
    exerciseId: string,
    updated: Partial<ExerciseResult>
  ) => {
    setExercises((prev) =>
      prev.map((ex) => (ex.id === exerciseId ? { ...ex, ...updated } : ex))
    );
    showToast('Đã lưu thay đổi bài tập.');
  };

  const handleOpenAdjustment = (exerciseId?: string, questionNumber?: number) => {
    setAdjustmentTarget({ exerciseId, questionNumber });
    setIsAdjustmentModalOpen(true);
  };

  const handleExerciseUpdated = (updatedExercise: ExerciseResult, summary: string) => {
    setExercises((prev) =>
      prev.map((e) => (e.id === updatedExercise.id ? updatedExercise : e))
    );
    showToast(`Đã cập nhật: ${summary}`);
  };

  const handleUpdateQuestion = (
    exerciseId: string,
    questionId: string,
    updated: Partial<QuestionItem>
  ) => {
    setExercises((prev) =>
      prev.map((ex) => {
        if (ex.id === exerciseId) {
          return {
            ...ex,
            questions: ex.questions.map((q) =>
              q.id === questionId ? { ...q, ...updated } : q
            ),
          };
        }
        return ex;
      })
    );
    showToast('Đã lưu thay đổi câu hỏi.');
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      {/* Toast message */}
      {toastMessage && (
        <div className="fixed top-20 right-6 z-50 bg-slate-900 text-white px-4 py-2.5 rounded-2xl shadow-xl flex items-center space-x-2 text-xs animate-in slide-in-from-top-2 duration-200">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Navigation */}
      <Navbar
        onLoadSample={handleLoadSample}
        onReset={handleResetAll}
        activeStep={activeStep}
        setActiveStep={setActiveStep}
        hasExercises={exercises.length > 0}
        onOpenSavedExams={() => setIsSavedExamsOpen(true)}
        savedCount={savedExamsCount}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {generateError && (
          typeof generateError === 'string' ? (
            <div className="mb-6 p-4 bg-rose-50 border border-rose-200 rounded-2xl text-xs text-rose-800 flex items-start space-x-2.5 shadow-xs">
              <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold block">Đã xảy ra lỗi khi tạo học liệu:</span>
                <span>{generateError}</span>
              </div>
            </div>
          ) : generateError.isQuota ? (
            <div className="mb-6 p-4 bg-amber-50/95 border border-amber-300 rounded-2xl text-xs text-amber-900 shadow-xs space-y-2 animate-in fade-in duration-200">
              <div className="flex items-center space-x-2 font-bold text-amber-900">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                <span>Hạn mức Gemini API Free Tier (429 RESOURCE_EXHAUSTED)</span>
              </div>
              <p className="text-amber-800 leading-relaxed text-[11.5px]">
                {generateError.message}
              </p>
              <div className="pt-2 border-t border-amber-200 flex flex-col sm:flex-row items-start sm:items-center justify-between text-[11px] gap-2 font-medium">
                <span className="flex items-center space-x-1.5 text-emerald-800">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>Cấu hình 8 tham số bài tập của bạn vẫn được lưu nguyên vẹn.</span>
                </span>
                <span className="text-amber-800 bg-amber-100 px-2 py-0.5 rounded-md font-mono text-[10.5px]">
                  Model: {generateError.model || 'gemini-3.8-flash'}
                </span>
              </div>
            </div>
          ) : (
            <div className="mb-6 p-4 bg-rose-50 border border-rose-200 rounded-2xl text-xs text-rose-800 flex items-start space-x-2.5 shadow-xs">
              <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold block">Đã xảy ra lỗi khi tạo học liệu:</span>
                <span>{generateError.message}</span>
              </div>
            </div>
          )
        )}

        {/* Step 1: Nguồn học liệu */}
        {activeStep === 1 && (
          <MaterialInputSection
            rawText={rawText}
            setRawText={setRawText}
            extractedMaterial={extractedMaterial}
            setExtractedMaterial={setExtractedMaterial}
            onProceedToParams={() => setActiveStep(2)}
            onApplySuggestedFocus={handleApplySuggestedFocus}
          />
        )}

        {/* Step 2: Tham số kỹ thuật 8 trường */}
        {activeStep === 2 && (
          <ExerciseConfigMatrix
            parameters={parameters}
            setParameters={setParameters}
            onGenerate={handleGenerateExercises}
            isGenerating={isGenerating}
            onBackToInput={() => setActiveStep(1)}
          />
        )}

        {/* Step 3: Xem trước Sư phạm & Tinh chỉnh */}
        {activeStep === 3 && (
          <ExercisePreview
            exercises={exercises}
            onComplete={() => setIsExportModalOpen(true)}
            onOpenAdjustment={handleOpenAdjustment}
            onUpdateQuestion={handleUpdateQuestion}
            onUpdateExercise={handleUpdateExercise}
            onExportWord={() => setIsExportModalOpen(true)}
            onSaveExam={handleSaveExam}
          />
        )}
      </main>

      {/* Saved Exams Modal (Mở đề đã lưu & Nhập file JSON - 0 AI calls) */}
      <SavedExamsModal
        isOpen={isSavedExamsOpen}
        onClose={() => {
          setIsSavedExamsOpen(false);
          setSavedExamsCount(getSavedExams().length);
        }}
        onLoadExam={handleLoadExam}
      />

      {/* Adjustment Modal ("Điều chỉnh" mechanism) */}
      <AdjustmentModal
        isOpen={isAdjustmentModalOpen}
        onClose={() => setIsAdjustmentModalOpen(false)}
        exercises={exercises}
        selectedExerciseId={adjustmentTarget.exerciseId}
        targetQuestionNumber={adjustmentTarget.questionNumber}
        rawMaterialText={rawText}
        onExerciseUpdated={handleExerciseUpdated}
      />

      {/* Export Word Modal ("Hoàn tất" mechanism) */}
      <ExportWordModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        exercises={exercises}
      />

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200/80 py-6 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <p>© {new Date().getFullYear()} EduGenius • Thiết kế đề thi và học liệu tiếng Anh với AI · Tham chiếu CEFR & Bloom</p>
          <div className="flex items-center space-x-4 text-slate-400">
            <span>Khung CEFR Pre-A1 - C2</span>
            <span>•</span>
            <span>Bloom's Revised Taxonomy</span>
            <span>•</span>
            <span>Microsoft Word .docx Export</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
