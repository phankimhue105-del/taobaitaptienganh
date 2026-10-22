import React, { useState } from 'react';
import { Navbar } from './components/Navbar';
import { MaterialInputSection } from './components/MaterialInputSection';
import { ExerciseConfigMatrix } from './components/ExerciseConfigMatrix';
import { ExercisePreview } from './components/ExercisePreview';
import { AdjustmentModal } from './components/AdjustmentModal';
import { ExportWordModal } from './components/ExportWordModal';
import { SAMPLE_MATERIALS } from './data/sampleData';
import {
  ExerciseParameter,
  ExerciseResult,
  ExtractedMaterial,
  QuestionItem,
  CefrLevel,
} from './types';
import { CheckCircle2, AlertCircle } from 'lucide-react';
import { fetchGenerateExercises } from './utils/apiClient';

export default function App() {
  const [activeStep, setActiveStep] = useState<number>(1);
  const [rawText, setRawText] = useState<string>('');
  const [extractedMaterial, setExtractedMaterial] = useState<ExtractedMaterial | null>(null);
  const [parameters, setParameters] = useState<ExerciseParameter[]>([]);
  const [exercises, setExercises] = useState<ExerciseResult[]>([]);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [generateError, setGenerateError] = useState<string | null>(null);

  // Modals state
  const [isAdjustmentModalOpen, setIsAdjustmentModalOpen] = useState(false);
  const [adjustmentTarget, setAdjustmentTarget] = useState<{
    exerciseId?: string;
    questionNumber?: number;
  }>({});
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

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
    setIsGenerating(true);
    setGenerateError(null);

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
      setActiveStep(3);
      showToast('Đã biên soạn học liệu thành công!');
    } catch (err: any) {
      console.error(err);
      setGenerateError(err.message || 'Lỗi không xác định khi biên soạn.');
    } finally {
      setIsGenerating(false);
    }
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
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {generateError && (
          <div className="mb-6 p-4 bg-rose-50 border border-rose-200 rounded-2xl text-xs text-rose-800 flex items-start space-x-2.5 shadow-xs">
            <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold block">Đã xảy ra lỗi khi tạo học liệu:</span>
              <span>{generateError}</span>
            </div>
          </div>
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
            onExportWord={() => setIsExportModalOpen(true)}
          />
        )}
      </main>

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
