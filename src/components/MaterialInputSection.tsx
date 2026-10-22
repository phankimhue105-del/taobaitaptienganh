import React, { useState, useRef } from 'react';
import {
  UploadCloud,
  FileText,
  Sparkles,
  BookOpen,
  Image as ImageIcon,
  X,
  CheckCircle2,
  ArrowRight,
  Loader2,
  Lightbulb,
  ListPlus,
  FileType,
  AlertTriangle,
} from 'lucide-react';
import { ExtractedMaterial, CefrLevel } from '../types';
import { fetchExtractMaterials } from '../utils/apiClient';

interface MaterialInputSectionProps {
  rawText: string;
  setRawText: (text: string) => void;
  extractedMaterial: ExtractedMaterial | null;
  setExtractedMaterial: (mat: ExtractedMaterial | null) => void;
  onProceedToParams: () => void;
  onApplySuggestedFocus: (focus: string, cefr?: CefrLevel) => void;
}

export const MaterialInputSection: React.FC<MaterialInputSectionProps> = ({
  rawText,
  setRawText,
  extractedMaterial,
  setExtractedMaterial,
  onProceedToParams,
  onApplySuggestedFocus,
}) => {
  const [selectedFile, setSelectedFile] = useState<{
    name: string;
    type: string;
    base64: string;
    previewUrl?: string;
    formatCategory: 'word' | 'pdf' | 'image';
  } | null>(null);
  const [isExtracting, setIsExtracting] = useState(false);
  const [extractError, setExtractError] = useState<{
    message: string;
    isQuota?: boolean;
    model?: string;
  } | string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const lowerName = file.name.toLowerCase();
    let formatCategory: 'word' | 'pdf' | 'image' = 'image';

    if (lowerName.endsWith('.docx') || lowerName.endsWith('.doc') || file.type.includes('word')) {
      formatCategory = 'word';
    } else if (lowerName.endsWith('.pdf') || file.type === 'application/pdf') {
      formatCategory = 'pdf';
    } else if (
      lowerName.endsWith('.jpg') ||
      lowerName.endsWith('.jpeg') ||
      lowerName.endsWith('.png') ||
      lowerName.endsWith('.webp') ||
      file.type.startsWith('image/')
    ) {
      formatCategory = 'image';
    } else {
      setExtractError('Định dạng tệp không được hỗ trợ. Vui lòng chọn tệp Word (.docx, .doc), PDF, hoặc ảnh (JPG, PNG).');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      const base64Data = result.split(',')[1];
      setSelectedFile({
        name: file.name,
        type: file.type || (formatCategory === 'word' ? 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' : formatCategory === 'pdf' ? 'application/pdf' : 'image/jpeg'),
        base64: base64Data,
        previewUrl: formatCategory === 'image' ? result : undefined,
        formatCategory,
      });
      setExtractError(null);
    };
    reader.readAsDataURL(file);
  };

  const lastAnalyzedKeyRef = useRef<string>('');
  const lastAnalyzedDataRef = useRef<ExtractedMaterial | null>(null);

  const removeFile = () => {
    setSelectedFile(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
    lastAnalyzedKeyRef.current = '';
  };

  const handleExtract = async () => {
    if (isExtracting) return; // Prevent duplicate concurrent requests

    const cleanedText = rawText.trim().replace(/\n\s*\n\s*\n+/g, '\n\n');
    if (!cleanedText && !selectedFile) {
      setExtractError('Vui lòng nhập văn bản học liệu hoặc tải lên tệp Word, PDF, hoặc ảnh JPG/PNG.');
      return;
    }

    // Generate input signature to avoid redundant AI calls on unchanged input
    const inputSignature = `${cleanedText}__${selectedFile?.name || ''}__${selectedFile?.base64?.length || 0}`;
    if (inputSignature === lastAnalyzedKeyRef.current && lastAnalyzedDataRef.current) {
      setExtractedMaterial(lastAnalyzedDataRef.current);
      setExtractError(null);
      return;
    }

    setIsExtracting(true);
    setExtractError(null);

    try {
      const data = await fetchExtractMaterials({
        text: cleanedText,
        fileBase64: selectedFile?.base64,
        mimeType: selectedFile?.type,
        fileName: selectedFile?.name,
      });

      if (data._rawDocxText && !rawText.trim()) {
        setRawText(data._rawDocxText);
      }
      setExtractedMaterial(data);
      lastAnalyzedKeyRef.current = inputSignature;
      lastAnalyzedDataRef.current = data;
    } catch (err: any) {
      const isQuota =
        err.status === 429 ||
        err.isDailyQuotaExhausted ||
        err.quotaType === 'daily' ||
        err.code === 'DAILY_QUOTA_EXHAUSTED' ||
        err.message?.includes('hạn mức') ||
        err.message?.includes('429');

      setExtractError({
        message: err.message || 'Không thể kết nối đến máy chủ.',
        isQuota: Boolean(isQuota),
        model: err.model,
      });
    } finally {
      setIsExtracting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Intro Banner */}
      <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 rounded-2xl p-6 text-white shadow-lg relative overflow-hidden">
        <div className="relative z-10 max-w-3xl">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-blue-500/20 text-blue-200 border border-blue-400/30 text-xs font-semibold mb-3">
            <Sparkles className="w-3.5 h-3.5 text-blue-300" />
            <span>Nguồn Học Liệu Sư Phạm • Bước 1</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Nguồn Học Liệu Đa Định Dạng (Word, PDF, JPG, PNG)
          </h1>
          <p className="mt-2 text-sm text-blue-100/90 leading-relaxed">
            Hệ thống hỗ trợ nạp học liệu qua văn bản thô hoặc tải lên các tệp tài liệu thông dụng (<strong>Word .docx</strong>, <strong>PDF</strong>, ảnh chụp <strong>JPG, PNG</strong>). AI sẽ phân tích chuyên sâu từ vựng, ngữ pháp và gợi ý trình độ CEFR.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Input text & Multi-format File Upload */}
        <div className="lg:col-span-7 space-y-4">
          <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs">
            <div className="flex items-center justify-between mb-3">
              <label className="text-sm font-bold text-slate-800 flex items-center space-x-2">
                <FileText className="w-4 h-4 text-blue-600" />
                <span>Nội dung học liệu (Gõ văn bản trực tiếp)</span>
              </label>
              <span className="text-xs text-slate-400">
                {rawText.length > 0 ? `${rawText.length} ký tự` : 'Tùy chọn'}
              </span>
            </div>

            <textarea
              value={rawText}
              onChange={(e) => setRawText(e.target.value)}
              placeholder="Dán nội dung bài học, danh sách từ vựng, ngữ pháp hoặc đoạn văn đọc tại đây...
Ví dụ:
Unit 3: Music - Key Vocabulary:
- melody (n): giai điệu
- phenomenal (adj): ấn tượng, phi thường
- release an album (collocation)

Grammar:
- Compound sentences with coordinating conjunctions: and, or, but, so
- To-infinitive vs Bare infinitive..."
              rows={8}
              className="w-full text-sm font-sans p-3.5 rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition resize-y text-slate-800 placeholder-slate-400 leading-relaxed"
            />

            {/* Multi-format File Upload Box: Word, PDF, JPG, PNG */}
            <div className="mt-4 pt-4 border-t border-slate-100">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-slate-700 flex items-center space-x-1.5">
                  <UploadCloud className="w-4 h-4 text-indigo-600" />
                  <span>Hoặc tải tệp học liệu (Hỗ trợ: Word, PDF, JPG, PNG)</span>
                </span>
                <span className="text-[11px] text-blue-600 font-medium">
                  .docx • .pdf • .jpg • .png
                </span>
              </div>

              {!selectedFile ? (
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-slate-200 hover:border-blue-400 hover:bg-blue-50/30 rounded-xl p-5 text-center cursor-pointer transition flex flex-col items-center justify-center space-y-2"
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".docx,.doc,.pdf,image/png,image/jpeg,image/jpg,image/webp"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                  <div className="flex items-center space-x-2 text-slate-500">
                    <span className="p-2 rounded-lg bg-blue-50 text-blue-600 font-bold text-xs flex items-center space-x-1">
                      <FileType className="w-4 h-4" />
                      <span>Word .docx</span>
                    </span>
                    <span className="p-2 rounded-lg bg-rose-50 text-rose-600 font-bold text-xs flex items-center space-x-1">
                      <FileText className="w-4 h-4" />
                      <span>PDF</span>
                    </span>
                    <span className="p-2 rounded-lg bg-emerald-50 text-emerald-600 font-bold text-xs flex items-center space-x-1">
                      <ImageIcon className="w-4 h-4" />
                      <span>JPG / PNG</span>
                    </span>
                  </div>
                  <span className="text-xs font-medium text-slate-700">
                    Bấm vào đây để chọn tệp từ máy tính
                  </span>
                  <span className="text-[11px] text-slate-400">
                    Hệ thống sẽ tự động trích xuất văn bản từ Word hoặc thực hiện OCR với PDF và ảnh
                  </span>
                </div>
              ) : (
                <div className="flex items-center justify-between p-3.5 bg-blue-50/70 rounded-xl border border-blue-200">
                  <div className="flex items-center space-x-3">
                    {selectedFile.formatCategory === 'image' && selectedFile.previewUrl ? (
                      <img
                        src={selectedFile.previewUrl}
                        alt="preview"
                        className="w-12 h-12 rounded-lg object-cover border border-blue-200"
                      />
                    ) : selectedFile.formatCategory === 'word' ? (
                      <div className="w-12 h-12 rounded-lg bg-blue-600 flex items-center justify-center text-white font-extrabold text-xs shadow-xs">
                        DOCX
                      </div>
                    ) : (
                      <div className="w-12 h-12 rounded-lg bg-rose-600 flex items-center justify-center text-white font-extrabold text-xs shadow-xs">
                        PDF
                      </div>
                    )}
                    <div>
                      <p className="text-xs font-bold text-slate-800 line-clamp-1">
                        {selectedFile.name}
                      </p>
                      <p className="text-[11px] text-emerald-700 flex items-center space-x-1 font-medium mt-0.5">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        <span>
                          Đã nạp tệp {selectedFile.formatCategory.toUpperCase()} • Sẵn sàng phân tích
                        </span>
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={removeFile}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-white transition"
                    title="Xóa tệp đã chọn"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>

            {extractError && (
              typeof extractError === 'string' ? (
                <div className="mt-3 p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-start space-x-2">
                  <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                  <span>{extractError}</span>
                </div>
              ) : extractError.isQuota ? (
                <div className="mt-3 p-4 bg-amber-50/95 border border-amber-300 rounded-2xl text-xs text-amber-900 shadow-xs space-y-2.5 animate-in fade-in duration-200">
                  <div className="flex items-center space-x-2 font-bold text-amber-900">
                    <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                    <span>Hạn mức Gemini API Free Tier (429 RESOURCE_EXHAUSTED)</span>
                  </div>
                  <p className="text-amber-800 leading-relaxed text-[11.5px]">
                    {extractError.message}
                  </p>
                  <div className="pt-2 border-t border-amber-200 flex flex-col sm:flex-row items-start sm:items-center justify-between text-[11px] gap-2 font-medium">
                    <span className="flex items-center space-x-1.5 text-emerald-800">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      <span>Dữ liệu học liệu và tệp của bạn vẫn được giữ nguyên vẹn.</span>
                    </span>
                    <span className="text-amber-800 bg-amber-100 px-2 py-0.5 rounded-md font-mono text-[10.5px]">
                      Model: {extractError.model || 'gemini-3.8-flash'}
                    </span>
                  </div>
                </div>
              ) : (
                <div className="mt-3 p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-start space-x-2">
                  <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                  <span>{extractError.message}</span>
                </div>
              )
            )}

            {/* Action Button */}
            <div className="mt-4 flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
              <span className="text-xs text-slate-500">
                Nhấn phân tích để AI rút trích từ vựng và khung ngữ pháp.
              </span>
              <button
                onClick={handleExtract}
                disabled={isExtracting || (!rawText.trim() && !selectedFile)}
                className={`w-full sm:w-auto flex items-center justify-center space-x-2 px-5 py-2.5 rounded-xl text-xs font-semibold text-white shadow-md transition ${
                  isExtracting || (!rawText.trim() && !selectedFile)
                    ? 'bg-slate-300 cursor-not-allowed shadow-none'
                    : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-blue-500/25'
                }`}
              >
                {isExtracting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Đang xử lý tệp & phân tích...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    <span>Phân tích Học liệu (AI Analysis)</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Right Column: Extracted Pedagogical Knowledge Profile */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs h-full flex flex-col">
            <div className="flex items-center justify-between mb-3 pb-3 border-b border-slate-100">
              <h3 className="text-sm font-bold text-slate-800 flex items-center space-x-2">
                <BookOpen className="w-4 h-4 text-emerald-600" />
                <span>Hồ sơ Sư phạm Trích xuất</span>
              </h3>
              {extractedMaterial && (
                <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                  Chuẩn CEFR: {extractedMaterial.cefrRecommended}
                </span>
              )}
            </div>

            {!extractedMaterial ? (
              <div className="flex-1 flex flex-col items-center justify-center text-center p-6 text-slate-400 space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-center text-slate-300">
                  <Lightbulb className="w-6 h-6" />
                </div>
                <p className="text-xs text-slate-500 max-w-xs leading-relaxed">
                  Chưa có dữ liệu phân tích. Hãy nhập văn bản hoặc tải tệp <strong>Word, PDF, JPG, PNG</strong> bên trái rồi nhấn <strong>Phân tích Học liệu</strong>, hoặc nhấn <strong>"Mẫu đề có sẵn"</strong> trên thanh điều hướng.
                </p>
                <button
                  onClick={onProceedToParams}
                  className="mt-2 text-xs text-blue-600 hover:text-blue-800 font-semibold underline"
                >
                  Hoặc bỏ qua và đi thẳng đến bước Cấu hình Tham số →
                </button>
              </div>
            ) : (
              <div className="space-y-4 text-xs overflow-y-auto max-h-[500px] pr-1">
                {/* Title & Summary */}
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/70">
                  <span className="font-bold text-slate-800 text-sm block">
                    {extractedMaterial.title || 'Chủ đề bài học'}
                  </span>
                  <p className="text-slate-600 mt-1 leading-relaxed">
                    {extractedMaterial.summary}
                  </p>
                </div>

                {/* Suggested Focus Points */}
                {extractedMaterial.suggestedFocusTopics &&
                  extractedMaterial.suggestedFocusTopics.length > 0 && (
                    <div>
                      <span className="font-semibold text-slate-700 block mb-1.5 flex items-center space-x-1">
                        <Lightbulb className="w-3.5 h-3.5 text-amber-500" />
                        <span>Gợi ý chủ điểm trọng tâm (Bấm để áp dụng):</span>
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {extractedMaterial.suggestedFocusTopics.map((topic, i) => (
                          <button
                            key={i}
                            onClick={() =>
                              onApplySuggestedFocus(topic, extractedMaterial.cefrRecommended)
                            }
                            className="text-left px-2.5 py-1 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200/80 transition flex items-center space-x-1 text-[11px]"
                            title="Bấm để đưa vào bài tập"
                          >
                            <ListPlus className="w-3 h-3 text-blue-500" />
                            <span>{topic}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                {/* Vocabulary preview */}
                {extractedMaterial.vocabulary && extractedMaterial.vocabulary.length > 0 && (
                  <div>
                    <span className="font-semibold text-slate-700 block mb-1.5">
                      Từ vựng trọng tâm ({extractedMaterial.vocabulary.length} từ):
                    </span>
                    <div className="space-y-1.5">
                      {extractedMaterial.vocabulary.slice(0, 6).map((v, i) => (
                        <div
                          key={i}
                          className="p-2 rounded-lg bg-slate-50/80 border border-slate-100 flex flex-col"
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-slate-800">
                              {v.term}{' '}
                              <span className="text-[10px] text-slate-400 font-normal">
                                ({v.partOfSpeech})
                              </span>
                            </span>
                            <span className="text-[11px] text-slate-600">{v.definition}</span>
                          </div>
                          {v.example && (
                            <span className="text-[11px] text-slate-500 italic mt-0.5">
                              "{v.example}"
                            </span>
                          )}
                        </div>
                      ))}
                      {extractedMaterial.vocabulary.length > 6 && (
                        <div className="text-[11px] text-slate-400 text-center pt-1">
                          + và {extractedMaterial.vocabulary.length - 6} từ vựng khác
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Grammar preview */}
                {extractedMaterial.grammarPoints &&
                  extractedMaterial.grammarPoints.length > 0 && (
                    <div>
                      <span className="font-semibold text-slate-700 block mb-1.5">
                        Điểm ngữ pháp quan trọng:
                      </span>
                      <div className="space-y-1.5">
                        {extractedMaterial.grammarPoints.map((g, i) => (
                          <div
                            key={i}
                            className="p-2 rounded-lg bg-indigo-50/50 border border-indigo-100"
                          >
                            <span className="font-bold text-indigo-900 block">{g.topic}</span>
                            {g.formula && (
                              <code className="text-[10px] text-indigo-600 bg-white px-1.5 py-0.5 rounded border border-indigo-200 inline-block my-1 font-mono">
                                {g.formula}
                              </code>
                            )}
                            <p className="text-[11px] text-slate-600">{g.rule}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                {/* Continue to Step 2 Button */}
                <div className="pt-2">
                  <button
                    onClick={onProceedToParams}
                    className="w-full flex items-center justify-center space-x-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold shadow-md shadow-emerald-600/20 transition"
                  >
                    <span>Tiếp tục sang bước Cấu hình 8 Tham số</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
