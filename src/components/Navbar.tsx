import React from 'react';
import { GraduationCap, FileText, Sparkles, BookOpen, Layers, Bookmark, RotateCcw } from 'lucide-react';

interface NavbarProps {
  onLoadSample: (sampleId: string) => void;
  onReset: () => void;
  activeStep: number;
  setActiveStep: (step: number) => void;
  hasExercises: boolean;
  onOpenTemplates?: () => void;
  templateCount?: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  onLoadSample,
  onReset,
  activeStep,
  setActiveStep,
  hasExercises,
  onOpenTemplates,
  templateCount = 0,
}) => {
  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-40 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Title */}
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-700 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-blue-500/20">
              <GraduationCap className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-extrabold text-lg tracking-tight text-slate-900">
                  EduGenius
                </span>
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                  ELT AI Architect
                </span>
              </div>
              <p className="text-[11px] sm:text-xs text-slate-500 hidden sm:block">
                Thiết kế đề thi và học liệu tiếng Anh với AI · Tham chiếu CEFR &amp; Bloom
              </p>
            </div>
          </div>

          {/* Stepper Navigation */}
          <div className="hidden md:flex items-center space-x-1 bg-slate-100 p-1 rounded-xl border border-slate-200/80">
            <button
              onClick={() => setActiveStep(1)}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                activeStep === 1
                  ? 'bg-white text-blue-700 shadow-xs font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>1. Nguồn học liệu</span>
            </button>
            <button
              onClick={() => setActiveStep(2)}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                activeStep === 2
                  ? 'bg-white text-blue-700 shadow-xs font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>2. Tham số kỹ thuật (8 mục)</span>
            </button>
            <button
              onClick={() => setActiveStep(3)}
              disabled={!hasExercises}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                activeStep === 3
                  ? 'bg-white text-blue-700 shadow-xs font-semibold'
                  : hasExercises
                  ? 'text-slate-600 hover:text-slate-900'
                  : 'text-slate-400 cursor-not-allowed opacity-60'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>3. Xem trước &amp; Tinh chỉnh</span>
              {hasExercises && (
                <span className="w-2 h-2 rounded-full bg-emerald-500 ml-1"></span>
              )}
            </button>
          </div>

          {/* Actions */}
          <div className="flex items-center space-x-2">
            {/* Mẫu đề đã lưu – thay thế cho "Đề đã lưu" cũ */}
            {onOpenTemplates && (
              <button
                onClick={onOpenTemplates}
                className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg border border-slate-300 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 transition shadow-2xs relative"
                title="Mở thư viện mẫu cấu hình bài tập đã lưu (0 lượt gọi AI)"
              >
                <Bookmark className="w-3.5 h-3.5 text-indigo-600" />
                <span>Mẫu đề đã lưu</span>
                {templateCount > 0 && (
                  <span className="ml-0.5 px-1.5 py-0.2 bg-indigo-100 text-indigo-700 rounded-full text-[10px] font-bold">
                    {templateCount}
                  </span>
                )}
              </button>
            )}

            {/* Mẫu đề có sẵn (hệ thống) – giữ nguyên, chỉ đổi nhãn */}
            <div className="relative group">
              <button className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg border border-slate-300 text-xs font-medium text-slate-700 bg-white hover:bg-slate-50 transition shadow-2xs">
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                <span>Mẫu tài liệu thử nghiệm</span>
              </button>
              <div className="absolute right-0 mt-1 w-64 bg-white rounded-xl shadow-xl border border-slate-200 py-1.5 z-50 hidden group-hover:block transition-all animate-in fade-in slide-in-from-top-1 duration-150">
                <div className="px-3 py-1 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                  Chọn mẫu tài liệu thử nghiệm
                </div>
                <button
                  onClick={() => onLoadSample('sample-1')}
                  className="w-full text-left px-3 py-2 text-xs hover:bg-blue-50 text-slate-700 hover:text-blue-700 flex flex-col"
                >
                  <span className="font-semibold">Unit 4: Community (Lớp 10)</span>
                  <span className="text-[11px] text-slate-500">CEFR B1 • Past Simple/Cont • 3 bài tập</span>
                </button>
                <button
                  onClick={() => onLoadSample('sample-2')}
                  className="w-full text-left px-3 py-2 text-xs hover:bg-blue-50 text-slate-700 hover:text-blue-700 flex flex-col"
                >
                  <span className="font-semibold">Environment &amp; Green Living</span>
                  <span className="text-[11px] text-slate-500">CEFR B2 • Conditionals &amp; Passive • 2 bài tập</span>
                </button>
                <button
                  onClick={() => onLoadSample('sample-3')}
                  className="w-full text-left px-3 py-2 text-xs hover:bg-blue-50 text-slate-700 hover:text-blue-700 flex flex-col"
                >
                  <span className="font-semibold">Daily Routines &amp; Hobbies</span>
                  <span className="text-[11px] text-slate-500">CEFR A2 • Present Simple • 2 bài tập</span>
                </button>
              </div>
            </div>

            <button
              onClick={onReset}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg border border-slate-300 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 hover:text-slate-900 transition shadow-2xs"
              title="Đặt lại tất cả"
            >
              <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
              <span>Làm mới</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
