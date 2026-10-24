import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { MaterialInputSection } from './components/MaterialInputSection';
import { ExerciseConfigMatrix } from './components/ExerciseConfigMatrix';
import { ExercisePreview, ExamVariantItem } from './components/ExercisePreview';
import { AdjustmentModal } from './components/AdjustmentModal';
import { ExportWordModal } from './components/ExportWordModal';
import { SavedTemplatesModal } from './components/SavedTemplatesModal';
import { SaveTemplateMiniModal } from './components/SaveTemplateMiniModal';
import {
  ExerciseParameter,
  ExerciseResult,
  ExtractedMaterial,
  QuestionItem,
  CefrLevel,
} from './types';
import { CheckCircle2, AlertCircle, AlertTriangle, Loader2, RotateCcw } from 'lucide-react';
import { fetchGenerateExercises } from './utils/apiClient';
import {
  computeStringHash,
  computeExerciseSignature,
  getCachedExercises,
  setCachedExercises,
  getSavedTemplates,
} from './utils/storage';
import { validateAndFixMcqBalance } from './utils/mcqQuality';

export default function App() {
  const [activeStep, setActiveStep] = useState<number>(1);
  const [rawText, setRawText] = useState<string>('');
  const [extractedMaterial, setExtractedMaterial] = useState<ExtractedMaterial | null>(null);
  const [parameters, setParameters] = useState<ExerciseParameter[]>([]);
  const [exercises, setExercises] = useState<ExerciseResult[]>([]);

  // Quản lý nhiều đề (1-5 đề)
  const [examCount, setExamCount] = useState<number>(1);
  const [examSets, setExamSets] = useState<ExamVariantItem[]>([]);
  const [activeExamIndex, setActiveExamIndex] = useState<number>(0);
  const [generatingStatus, setGeneratingStatus] = useState<string | null>(null);

  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [generateError, setGenerateError] = useState<{
    message: string;
    isQuota?: boolean;
    is503?: boolean;
    model?: string;
  } | string | null>(null);

  // Modals state
  const [isAdjustmentModalOpen, setIsAdjustmentModalOpen] = useState(false);
  const [adjustmentTarget, setAdjustmentTarget] = useState<{
    exerciseId?: string;
    questionNumber?: number;
  }>({});
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);

  // Template modals
  const [isTemplatesModalOpen, setIsTemplatesModalOpen] = useState(false);
  const [isSaveTemplateModalOpen, setIsSaveTemplateModalOpen] = useState(false);
  const [templateCount, setTemplateCount] = useState<number>(0);

  const [toastMessage, setToastMessage] = useState<string | null>(null);

  useEffect(() => {
    setTemplateCount(getSavedTemplates().length);
  }, []);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const refreshTemplateCount = () => setTemplateCount(getSavedTemplates().length);

  const handleResetAll = () => {
    if (confirm('Bạn có chắc chắn muốn làm mới và xóa dữ liệu hiện tại không?')) {
      setRawText('');
      setExtractedMaterial(null);
      setParameters([]);
      setExercises([]);
      setExamSets([]);
      setActiveExamIndex(0);
      setExamCount(1);
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

  /**
   * Tạo đề thi – hỗ trợ tạo từ 1 đến 5 đề độc lập
   */
  const handleGenerateExercises = async () => {
    if (isGenerating) return;
    setIsGenerating(true);
    setGenerateError(null);
    setGeneratingStatus(null);

    const materialSig = computeStringHash(
      `${rawText.trim()}__${extractedMaterial?.title || ''}__${extractedMaterial?.vocabulary?.length || 0}`
    );
    const exerciseSig = computeExerciseSignature(materialSig, parameters);

    const targetCount = Math.max(1, Math.min(5, examCount || 1));
    const newSets: ExamVariantItem[] = [];
    let firstFailedError: any = null;

    for (let variant = 1; variant <= targetCount; variant++) {
      setGeneratingStatus(
        targetCount > 1
          ? `Đang biên soạn Đề ${variant}/${targetCount}...`
          : 'Đang biên soạn đề thi...'
      );

      // Cache signature riêng cho từng đề
      const variantSig = `${exerciseSig}__var_${variant}_of_${targetCount}`;
      const cached = getCachedExercises(variantSig);

      if (cached && cached.length > 0) {
        newSets.push({
          id: `exam-${variant}`,
          variantNumber: variant,
          title: `Đề ${variant}`,
          exercises: cached,
          status: 'ready',
        });
        continue;
      }

      try {
        const data = await fetchGenerateExercises({
          rawMaterial: rawText,
          extractedData: extractedMaterial,
          parameters: parameters,
          examVariant: variant,
          totalExams: targetCount,
        });

        if (!data.exercises || data.exercises.length === 0) {
          throw new Error(`AI không thể tạo câu hỏi cho Đề ${variant}.`);
        }

        // Cân bằng phân bổ đáp án & format (0 AI calls)
        const { exercises: validatedExercises } = validateAndFixMcqBalance(data.exercises);

        // Lưu cache cho đề này
        setCachedExercises(variantSig, validatedExercises);

        newSets.push({
          id: `exam-${variant}`,
          variantNumber: variant,
          title: `Đề ${variant}`,
          exercises: validatedExercises,
          status: 'ready',
        });
      } catch (err: any) {
        console.error(`Lỗi tạo Đề ${variant}:`, err);
        firstFailedError = err;

        newSets.push({
          id: `exam-${variant}`,
          variantNumber: variant,
          title: `Đề ${variant}`,
          exercises: [],
          status: 'error',
          errorMessage: err.message || 'Lỗi khi gọi API tạo đề.',
        });

        // Nếu là lỗi Quota 429 hoặc daily exhausted, dừng tạo các đề tiếp theo để tránh spam
        const isQuota =
          err.status === 429 ||
          err.isDailyQuotaExhausted ||
          err.quotaType === 'daily' ||
          err.code === 'DAILY_QUOTA_EXHAUSTED' ||
          err.message?.includes('hạn mức') ||
          err.message?.includes('429');

        if (isQuota) {
          // Ghi nhận các đề còn lại vào danh sách chưa tạo
          for (let rem = variant + 1; rem <= targetCount; rem++) {
            newSets.push({
              id: `exam-${rem}`,
              variantNumber: rem,
              title: `Đề ${rem}`,
              exercises: [],
              status: 'error',
              errorMessage: 'Chưa tạo do đã hết hạn mức Gemini API ở lượt trước.',
            });
          }
          break;
        }
      }
    }

    setIsGenerating(false);
    setGeneratingStatus(null);

    const successSets = newSets.filter((s) => s.status === 'ready' && s.exercises.length > 0);

    if (successSets.length > 0) {
      setExamSets(newSets);
      const firstSuccessIdx = newSets.findIndex((s) => s.status === 'ready');
      const chosenIdx = firstSuccessIdx >= 0 ? firstSuccessIdx : 0;
      setActiveExamIndex(chosenIdx);
      setExercises(newSets[chosenIdx].exercises);
      setActiveStep(3);

      if (successSets.length === targetCount) {
        showToast(
          targetCount > 1
            ? `Đã biên soạn thành công toàn bộ ${targetCount} đề!`
            : 'Đã biên soạn xong đề thi!'
        );
      } else {
        showToast(
          `Đã tạo thành công ${successSets.length}/${targetCount} đề. Đã giữ nguyên các đề thành công.`
        );
      }
    } else {
      // Không đề nào thành công
      const err = firstFailedError || new Error('Không thể tạo đề thi.');
      const status = err.status || 500;
      const isQuota =
        status === 429 ||
        err.isDailyQuotaExhausted ||
        err.quotaType === 'daily' ||
        err.code === 'DAILY_QUOTA_EXHAUSTED' ||
        err.message?.includes('hạn mức') ||
        err.message?.includes('429');

      const is503 =
        status === 503 ||
        err.code === 'SERVICE_UNAVAILABLE' ||
        err.message?.includes('503') ||
        err.message?.includes('quá tải') ||
        err.message?.includes('UNAVAILABLE');

      setGenerateError({
        message: err.message || 'Lỗi không xác định khi biên soạn.',
        isQuota: Boolean(isQuota),
        is503: Boolean(is503),
        model: err.model,
      });
    }
  };

  // ── Template handlers (0 AI calls) ────────────────────────────────────────

  /** Mở modal "Lưu mẫu" – chỉ khi đang ở bước 2 hoặc 3 và có parameters */
  const handleOpenSaveTemplate = () => {
    if (parameters.length === 0) {
      showToast('Chưa có cấu hình bài tập nào để lưu. Hãy thêm bài tập ở Bước 2.');
      return;
    }
    setIsSaveTemplateModalOpen(true);
  };

  /** Callback sau khi lưu mẫu thành công */
  const handleTemplateSaved = (templateName: string) => {
    refreshTemplateCount();
    showToast(`Đã lưu mẫu "${templateName}" vào thư viện (0đ)!`);
  };

  /** Áp dụng mẫu: điền parameters vào bước 2, không gọi AI */
  const handleUseTemplate = (freshParams: ExerciseParameter[]) => {
    setParameters(freshParams);
    setActiveStep(2);
    showToast(`Đã áp dụng mẫu vào Bước 2. Kiểm tra lại tham số và nhấn "Biên soạn đề" khi sẵn sàng.`);
  };

  // ── Exercise editing (độc lập cho từng đề) ──────────────────────────────────

  const handleRetrySingleExam = async (variantNumber: number) => {
    if (isGenerating) return;
    setIsGenerating(true);
    setGeneratingStatus(`Đang thử tạo lại Đề ${variantNumber}...`);
    setGenerateError(null);

    try {
      const data = await fetchGenerateExercises({
        rawMaterial: rawText,
        extractedData: extractedMaterial,
        parameters: parameters,
        examVariant: variantNumber,
        totalExams: examSets.length,
      });

      if (!data.exercises || data.exercises.length === 0) {
        throw new Error(`AI không thể tạo danh sách câu hỏi cho Đề ${variantNumber}.`);
      }

      const { exercises: validatedExercises } = validateAndFixMcqBalance(data.exercises);

      setExamSets((prev) =>
        prev.map((exam) =>
          exam.variantNumber === variantNumber
            ? {
                ...exam,
                exercises: validatedExercises,
                status: 'ready',
                errorMessage: undefined,
              }
            : exam
        )
      );

      const targetIdx = examSets.findIndex((e) => e.variantNumber === variantNumber);
      if (targetIdx === activeExamIndex) {
        setExercises(validatedExercises);
      }

      showToast(`Đã tạo thành công Đề ${variantNumber}!`);
    } catch (err: any) {
      const is503 = err.status === 503 || err.code === 'SERVICE_UNAVAILABLE';
      showToast(
        is503
          ? `Máy chủ AI vẫn đang quá tải (503). Dữ liệu được bảo toàn, vui lòng thử lại sau giây lát.`
          : `Không thể tạo Đề ${variantNumber}: ${err.message || 'Lỗi kết nối'}`
      );
    } finally {
      setIsGenerating(false);
      setGeneratingStatus(null);
    }
  };

  const handleSelectExamIndex = (idx: number) => {
    setActiveExamIndex(idx);
    if (examSets[idx]?.exercises) {
      setExercises(examSets[idx].exercises);
    }
  };

  const handleUpdateExercise = (
    exerciseId: string,
    updated: Partial<ExerciseResult>
  ) => {
    if (examSets.length > 0) {
      setExamSets((prev) =>
        prev.map((exam, idx) => {
          if (idx !== activeExamIndex) return exam;
          return {
            ...exam,
            exercises: exam.exercises.map((ex) =>
              ex.id === exerciseId ? { ...ex, ...updated } : ex
            ),
          };
        })
      );
    }
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
    if (examSets.length > 0) {
      setExamSets((prev) =>
        prev.map((exam, idx) => {
          if (idx !== activeExamIndex) return exam;
          return {
            ...exam,
            exercises: exam.exercises.map((e) =>
              e.id === updatedExercise.id ? updatedExercise : e
            ),
          };
        })
      );
    }
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
    if (examSets.length > 0) {
      setExamSets((prev) =>
        prev.map((exam, idx) => {
          if (idx !== activeExamIndex) return exam;
          return {
            ...exam,
            exercises: exam.exercises.map((ex) => {
              if (ex.id === exerciseId) {
                return {
                  ...ex,
                  questions: ex.questions.map((q) =>
                    q.id === questionId ? { ...q, ...updated } : q
                  ),
                };
              }
              return ex;
            }),
          };
        })
      );
    }
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

  // Đề hiện tại đang xem
  const currentDisplayExercises =
    examSets.length > 0 && examSets[activeExamIndex]?.exercises?.length > 0
      ? examSets[activeExamIndex].exercises
      : exercises;

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
        onReset={handleResetAll}
        activeStep={activeStep}
        setActiveStep={setActiveStep}
        hasExercises={exercises.length > 0 || examSets.some((e) => e.exercises?.length > 0)}
        onOpenTemplates={() => setIsTemplatesModalOpen(true)}
        templateCount={templateCount}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {/* Generating progress alert */}
        {isGenerating && generatingStatus && (
          <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-2xl text-xs text-blue-900 flex items-center space-x-3 shadow-xs animate-pulse">
            <Loader2 className="w-5 h-5 text-blue-600 animate-spin shrink-0" />
            <div className="font-semibold">{generatingStatus}</div>
          </div>
        )}

        {generateError && (
          typeof generateError === 'string' ? (
            <div className="mb-6 p-4 bg-rose-50
