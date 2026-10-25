import { GoogleGenAI, ThinkingLevel } from '@google/genai';
// @ts-ignore
import mammoth from 'mammoth';

export const SYSTEM_INSTRUCTION = `# Custom System Instruction: Chuyên gia Biên soạn Học liệu Tiếng Anh (English Pedagogical AI Architect)

## 1. Role
Bạn là một Chuyên gia Biên soạn Học liệu Tiếng Anh (English Pedagogical AI Architect) cao cấp. Bạn có kiến thức sâu rộng về ngôn ngữ học, khung tham chiếu trình độ ngôn ngữ chung Châu Âu (CEFR), Thang đo tư duy Bloom và phương pháp giảng dạy tiếng Anh hiện đại (ELT). Nhiệm vụ của bạn là chuyển đổi các nguồn học liệu thô thành các bài tập kiểm tra chuyên nghiệp, bám sát yêu cầu sư phạm và kỹ thuật của giáo viên.

## 2. Objective
Mục tiêu cốt lõi của bạn là:
- Phân tích chính xác dữ liệu đầu vào (từ vựng, cấu trúc ngữ pháp) từ các định dạng văn bản hoặc tệp đính kèm (Word docx, PDF, hình ảnh JPG, PNG).
- Thiết kế nội dung bài tập dựa trên 8 tham số kỹ thuật được cung cấp cho từng phân mục bài tập.
- Đảm bảo tính chính xác về mặt ngôn ngữ, phù hợp về mức độ tư duy và trình độ CEFR.
- Cung cấp đầu ra ở định dạng có cấu trúc chuẩn để hệ thống có thể xuất bản thành file Word chuyên nghiệp.

## 3. Guidelines & Rules
### 3.1. Phân tích Nguồn Học liệu
- Dữ liệu đầu vào: Bám sát tệp tài liệu người dùng tải lên (Word, PDF, JPG, PNG hoặc văn bản thô).
- Xử lý đa phương thức: Nếu đầu vào là hình ảnh (JPG, PNG) hoặc PDF, thực hiện trích xuất nội dung (OCR) một cách cẩn thận để tránh sai sót chính tả. Nếu là Word (.docx), trích xuất văn bản đầy đủ.

### 3.2. Tuân thủ Tham số Kỹ thuật (8 Trường thông tin)
Đối với mỗi bài tập (Exercise), tuân thủ nghiêm ngặt các tham số sau:
1. Số thứ tự bài tập: Hiển thị đúng số thứ tự theo yêu cầu (Exercise 1, 2, ...).
2. Dạng bài: Triển khai đúng dạng bài người dùng tự nhập (VD: Multiple choice, Fill in the blanks, Error identification, Matching, Word formation, Sentence rewrite, Chia động từ, v.v.).
3. Hình thức: Bắt buộc tuân thủ đúng 1 trong 4 hình thức đã chọn:
   - "mcq_3": Trắc nghiệm 3 phương án (A, B, C).
   - "mcq_4": Trắc nghiệm 4 phương án (A, B, C, D).
   - "true_false": Trắc nghiệm True / False (chỉ có True / False, hoặc True/False/Not Given đối với bài đọc).
   - "open_ended": Tự luận (Điền khuyết / Viết lại câu / Cho dạng đúng của từ - không có phương án A, B, C, D).
4. Số lượng câu hỏi: Tạo đúng số lượng câu được yêu cầu.
5. Mức độ tư duy: Điều chỉnh độ lắt léo theo 4 mức (Nhận biết, Thông hiểu, Vận dụng, Vận dụng cao).
6. Trình độ CEFR: Sử dụng từ vựng và cấu trúc phù hợp với thang bậc 12 cấp độ: Pre-A1, A1, A1+, A2, A2+, B1, B1+, B2, B2+, C1, C1+, C2 (trong đó các mức có dấu '+' là mức tham chiếu mở rộng phục vụ phân hóa năng lực học sinh, C2 là trình độ thành thạo cao nhất).
7. Kiến thức trọng tâm: Tập trung xoáy sâu vào nội dung ngữ pháp/từ vựng được chỉ định.
8. Ghi chú riêng: Đặc biệt lưu ý các yêu cầu phụ của giáo viên (VD: "Tránh dùng từ chuyên ngành", "Đặt câu hỏi liên quan đến chủ đề môi trường", "Bẫy ở mạo từ", v.v.).

### 3.3. Quy tắc nội dung đặc thù
- Kỹ năng Nghe (Listening): Bắt buộc cung cấp nội dung câu hỏi và Audio Script (Lời dẫn đầy đủ, tự nhiên, đánh dấu từ khóa dẫn đến câu trả lời).
- Đọc hiểu: Cung cấp đoạn văn ngắn (Reading passage) phù hợp độ dài và CEFR nếu dạng bài là Đọc hiểu (Reading Comprehension).
- Đáp án: Luôn kèm theo bảng đáp án (Answer Key) và giải thích sư phạm chi tiết cho từng câu (chỉ rõ tại sao đáp án này đúng và các phương án nhiễu sai ở điểm nào).`;

export const EXTRACTION_SYSTEM_INSTRUCTION = `# Chuyên gia Ngôn ngữ & Sư phạm Tiếng Anh (ELT Pedagogical Specialist)

## Mục tiêu
Phân tích nguồn học liệu đầu vào (văn bản thô, trích xuất Word DOCX, hoặc OCR hình ảnh/PDF) để chuẩn hóa hồ sơ kiến thức sư phạm:
1. Xác định chính xác chủ đề bài học và tóm tắt nội dung cốt lõi.
2. Nhận diện trình độ năng lực CEFR dự kiến theo đúng 12 mức độ: Pre-A1, A1, A1+, A2, A2+, B1, B1+, B2, B2+, C1, C1+, C2 (dựa trên độ phức tạp từ vựng, cú pháp và yêu cầu nhiệm vụ ngôn ngữ).
3. Trích xuất danh sách từ vựng trọng tâm (từ, từ loại, định nghĩa tiếng Việt ngắn gọn, câu ví dụ ngữ cảnh).
4. Nhận diện các chủ điểm ngữ pháp trọng tâm (tên chủ điểm, công thức nếu có, quy tắc sư phạm, câu ví dụ).
5. Đề xuất các chủ điểm trọng tâm nổi bật để phục vụ thiết kế bài tập.

## Yêu cầu chất lượng
- Tuyệt đối bám sát ngữ liệu cung cấp, không tự ý thêm kiến thức ngoài phạm vi học liệu.
- Giữ nguyên tính chính xác thuật ngữ và chính tả tiếng Anh.
- Trả về kết quả JSON chuẩn xác theo đúng cấu trúc yêu cầu.`;

/**
 * Lấy mã định danh model Gemini được cấu hình cho server.
 * Mặc định: gemini-3.8-flash (có thể ghi đè qua biến môi trường GEMINI_MODEL).
 */
export function getGeminiModel(): string {
  return process.env.GEMINI_MODEL || 'gemini-3.8-flash';
}

export interface FormattedAIError {
  status: number;
  message: string;
  code: string;
  quotaType?: 'daily' | 'minute' | 'other';
  model: string;
  isDailyQuotaExhausted: boolean;
}

/**
 * Chuẩn hóa lỗi từ Gemini API / GoogleGenAI SDK thành thông tin lỗi có cấu trúc,
 * phân biệt chính xác:
 * - Hết hạn mức theo ngày (429 RESOURCE_EXHAUSTED / GenerateRequestsPerDayPerModel)
 * - Vượt giới hạn tốc độ theo phút (429 RPM / Rate limit per minute)
 * - Quá tải tạm thời (503 Service Unavailable)
 * - Thiếu hoặc sai API Key (401)
 */
export function parseAndFormatAIError(error: any): FormattedAIError {
  const model = getGeminiModel();
  const rawMsg = error?.message || (typeof error === 'string' ? error : JSON.stringify(error || ''));
  const status = error?.status || error?.statusCode || 500;

  const is429 = status === 429 || rawMsg.includes('429') || rawMsg.includes('RESOURCE_EXHAUSTED');
  const is503 = status === 503 || rawMsg.includes('503') || rawMsg.includes('UNAVAILABLE') || rawMsg.includes('overloaded');

  if (is429) {
    const isDaily =
      rawMsg.includes('GenerateRequestsPerDay') ||
      rawMsg.includes('PerDayPerModel') ||
      rawMsg.includes('free_tier_requests') ||
      rawMsg.includes('quota metric') ||
      rawMsg.includes('PerDay') ||
      rawMsg.includes('Quota exceeded');

    if (isDaily) {
      return {
        status: 429,
        code: 'DAILY_QUOTA_EXHAUSTED',
        quotaType: 'daily',
        model,
        isDailyQuotaExhausted: true,
        message: `Mô hình "${model}" đã chạm hạn mức yêu cầu tối đa trong ngày của gói Google AI Studio Free Tier (Metric: GenerateRequestsPerDayPerModel). Dữ liệu học liệu và tệp của bạn vẫn được lưu nguyên vẹn trong phiên làm việc. Hạn mức sẽ tự động đặt lại vào lúc 00:00 giờ Thái Bình Dương (PT - khoảng 14:00 - 15:00 giờ Việt Nam). Bạn cũng có thể thiết lập biến môi trường GEMINI_MODEL trên Vercel để chuyển sang model khác mà không làm gián đoạn công việc.`,
      };
    }

    return {
      status: 429,
      code: 'RATE_LIMIT_PER_MINUTE',
      quotaType: 'minute',
      model,
      isDailyQuotaExhausted: false,
      message: `Tốc độ gửi yêu cầu đến mô hình "${model}" đang vượt quá giới hạn theo phút (Rate limit per minute). Dữ liệu của bạn được bảo toàn. Vui lòng đợi khoảng 15-30 giây trước khi bấm thử lại.`,
    };
  }

  if (is503) {
    return {
      status: 503,
      code: 'SERVICE_UNAVAILABLE',
      model,
      isDailyQuotaExhausted: false,
      message: `Dịch vụ Google AI đang tạm thời quá tải hoặc đang bảo trì (503 Service Unavailable). Toàn bộ dữ liệu của bạn vẫn được giữ nguyên. Vui lòng bấm thử lại sau 30-60 giây.`,
    };
  }

  if (rawMsg.includes('API_KEY') || rawMsg.includes('apiKey') || rawMsg.includes('key not valid')) {
    return {
      status: 401,
      code: 'INVALID_API_KEY',
      model,
      isDailyQuotaExhausted: false,
      message: `Khóa GEMINI_API_KEY chưa được cấu hình hoặc không hợp lệ. Vui lòng kiểm tra lại biến môi trường trong Vercel Settings hoặc file .env.`,
    };
  }

  if (
    rawMsg.includes('Vui lòng') ||
    rawMsg.includes('Chưa có bài tập') ||
    rawMsg.includes('Thiếu dữ liệu')
  ) {
    return {
      status: 400,
      code: 'BAD_REQUEST',
      model,
      isDailyQuotaExhausted: false,
      message: rawMsg,
    };
  }

  return {
    status: typeof status === 'number' && status >= 400 && status < 600 ? status : 500,
    code: 'AI_SERVICE_ERROR',
    model,
    isDailyQuotaExhausted: false,
    message: rawMsg || 'Lỗi không xác định khi kết nối với dịch vụ AI.',
  };
}

export function getAIClient(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('Thiếu cấu hình biến môi trường GEMINI_API_KEY trên server.');
  }

  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

export interface ExtractMaterialsParams {
  text?: string;
  fileBase64?: string;
  mimeType?: string;
  fileName?: string;
}

export async function extractMaterialsService(params: ExtractMaterialsParams) {
  const { text, fileBase64, mimeType, fileName } = params;

  if (!text && !fileBase64) {
    throw new Error('Vui lòng cung cấp văn bản học liệu hoặc tệp (Word, PDF, JPG, PNG).');
  }

  const ai = getAIClient();
  const parts: any[] = [];
  let extractedDocxText = '';

  const isWordDoc =
    (fileName && (fileName.endsWith('.docx') || fileName.endsWith('.doc'))) ||
    mimeType?.includes('wordprocessingml') ||
    mimeType?.includes('msword') ||
    mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';

  if (fileBase64 && isWordDoc) {
    try {
      const buffer = Buffer.from(fileBase64, 'base64');
      const docResult = await mammoth.extractRawText({ buffer });
      extractedDocxText = (docResult.value || '').trim();
    } catch (docxErr) {
      console.warn('Mammoth docx parse warning:', docxErr);
    }
  } else if (fileBase64 && mimeType) {
    let resolvedMime = mimeType;
    if (fileName?.endsWith('.pdf') || mimeType === 'application/pdf') {
      resolvedMime = 'application/pdf';
    } else if (fileName?.endsWith('.png') || mimeType === 'image/png') {
      resolvedMime = 'image/png';
    } else if (fileName?.endsWith('.jpg') || fileName?.endsWith('.jpeg') || mimeType === 'image/jpeg') {
      resolvedMime = 'image/jpeg';
    }

    parts.push({
      inlineData: {
        mimeType: resolvedMime,
        data: fileBase64,
      },
    });
    parts.push({
      text: 'Trích xuất OCR toàn bộ nội dung từ tài liệu/hình ảnh đính kèm một cách chính xác tuyệt đối, không bỏ sót từ vựng hoặc ngữ pháp.',
    });
  }

  // Clean and normalize combined text to reduce unnecessary token overhead
  const rawInput = [
    text ? `Nội dung nhập từ văn bản:\n${text.trim()}` : '',
    extractedDocxText ? `Nội dung trích xuất từ tệp Word (.docx):\n${extractedDocxText}` : '',
  ]
    .filter(Boolean)
    .join('\n\n');

  // Collapse multiple empty lines
  const combinedInput = rawInput.replace(/\n\s*\n\s*\n+/g, '\n\n');

  const extractionPrompt = `
Hãy phân tích nguồn học liệu sau và trích xuất thông tin sư phạm theo định dạng JSON chuẩn:
${combinedInput ? `\n"""\n${combinedInput}\n"""` : ''}

Yêu cầu xuất ra JSON với các trường:
{
  "title": "Tên chủ đề hoặc bài học",
  "summary": "Tóm tắt ngắn gọn nội dung học liệu",
  "cefrRecommended": "Pre-A1" | "A1" | "A1+" | "A2" | "A2+" | "B1" | "B1+" | "B2" | "B2+" | "C1" | "C1+" | "C2",
  "vocabulary": [
    {
      "term": "từ hoặc cụm từ tiếng Anh",
      "partOfSpeech": "n/v/adj/adv/phr",
      "definition": "Định nghĩa tiếng Việt ngắn gọn",
      "example": "Câu ví dụ trong ngữ cảnh"
    }
  ],
  "grammarPoints": [
    {
      "topic": "Tên cấu trúc hoặc chủ điểm ngữ pháp",
      "formula": "Công thức nếu có (VD: S + have/has + V3/ed)",
      "rule": "Quy tắc sử dụng sư phạm",
      "examples": ["Ví dụ 1", "Ví dụ 2"]
    }
  ],
  "suggestedFocusTopics": ["Gợi ý trọng tâm 1", "Gợi ý trọng tâm 2", "Gợi ý trọng tâm 3"]
}
`;

  parts.push({ text: extractionPrompt });

  const response = await ai.models.generateContent({
    model: getGeminiModel(),
    contents: { parts },
    config: {
      systemInstruction: EXTRACTION_SYSTEM_INSTRUCTION,
      responseMimeType: 'application/json',
      thinkingConfig: {
        thinkingLevel: ThinkingLevel.LOW,
      },
    },
  });

  const resultText = response.text || '{}';
  const parsedData = JSON.parse(resultText);

  if (extractedDocxText && !text) {
    parsedData._rawDocxText = extractedDocxText;
  }

  return parsedData;
}

/**
 * Trích xuất chuỗi JSON sạch từ phản hồi AI (hỗ trợ markdown fences, văn bản mở đầu/kết thúc...)
 */
export function extractJsonFromText(raw: string): string {
  let text = (raw || '').trim();
  if (!text) return '{}';

  // 1. Nếu có khối code markdown ```json ... ``` hoặc ``` ... ```
  const codeBlockRegex = /```(?:json)?\s*([\s\S]*?)\s*```/gi;
  const matches = [...text.matchAll(codeBlockRegex)];
  if (matches.length > 0) {
    let longestMatch = matches[0][1].trim();
    for (const m of matches) {
      if (m[1].trim().length > longestMatch.length) {
        longestMatch = m[1].trim();
      }
    }
    text = longestMatch;
  } else if (text.startsWith('```')) {
    text = text.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim();
  }

  // 2. Tìm cặp ngoặc { ... } hoặc [ ... ] ngoài cùng
  const firstBrace = text.search(/[{\[]/);
  const lastBrace = Math.max(text.lastIndexOf('}'), text.lastIndexOf(']'));
  if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
    text = text.substring(firstBrace, lastBrace + 1);
  }

  return text.trim() || '{}';
}

/**
 * Chuẩn hóa kết quả bài tập trả về từ Gemini thành cấu trúc đồng nhất { exercises: any[] }.
 * Hỗ trợ các định dạng Gemini có thể sinh ra:
 * - Mảng trực tiếp: [ { id, title, questions } ]
 * - Object chứa key mảng: exercises, data, exam, exerciseList, tests...
 * - Object chứa key theo số đề: de_1, de1, examVariant_1, variant_1...
 * - Object bài tập đơn lẻ chứa mảng questions
 */
export function normalizeExercisesPayload(parsed: any): { exercises: any[] } {
  if (!parsed) {
    return { exercises: [] };
  }

  // 1. Trường hợp AI trả về mảng trực tiếp
  if (Array.isArray(parsed)) {
    return { exercises: parsed };
  }

  // 2. Trường hợp AI trả về object
  if (typeof parsed === 'object') {
    // 2.1. Các key phổ biến chứa danh sách bài tập
    const candidateKeys = ['exercises', 'data', 'exam', 'exerciseList', 'items', 'tests', 'questionsList'];
    for (const key of candidateKeys) {
      if (Array.isArray(parsed[key]) && parsed[key].length > 0) {
        return { exercises: parsed[key] };
      }
    }

    // 2.2. Kiểm tra key động theo số thứ tự đề (de_1, de1, variant_1, exam_1, ...)
    for (const key of Object.keys(parsed)) {
      if (Array.isArray(parsed[key]) && parsed[key].length > 0) {
        const firstItem = parsed[key][0];
        if (firstItem && typeof firstItem === 'object' && (firstItem.questions || firstItem.exerciseType || firstItem.title || firstItem.format)) {
          return { exercises: parsed[key] };
        }
      }
    }

    // 2.3. Trường hợp AI trả về một bài tập đơn lẻ (chứa mảng questions)
    if (Array.isArray(parsed.questions) && parsed.questions.length > 0) {
      return { exercises: [parsed] };
    }

    // 2.4. Nếu object có key exercises nhưng rỗng
    if (Array.isArray(parsed.exercises)) {
      return { exercises: parsed.exercises };
    }
  }

  return { exercises: [] };
}

export interface GenerateExercisesParams {
  rawMaterial?: string;
  extractedData?: any;
  parameters: any[];
  /** Biến thể đề – dùng khi tạo nhiều đề từ cùng nguồn học liệu.
   * Ví dụ: examVariant=1 là đề đầu tiên, examVariant=2 là đề thứ hai với câu hỏi khác nhau. */
  examVariant?: number;
  /** Tổng số đề cần tạo – dùng để AI biết phạm vi cần phân phối câu hỏi. */
  totalExams?: number;
}

export async function generateExercisesService(params: GenerateExercisesParams) {
  const { rawMaterial, extractedData, parameters, examVariant = 1, totalExams = 1 } = params;

  if (!parameters || !Array.isArray(parameters) || parameters.length === 0) {
    throw new Error('Chưa có bài tập nào. Vui lòng cấu hình ít nhất một bài tập.');
  }

  const ai = getAIClient();

  // Tối ưu hóa payload: Loại bỏ _rawDocxText trùng lặp và rút gọn các trường không thiết yếu
  let cleanedExtracted: any = null;
  if (extractedData) {
    const { _rawDocxText, ...rest } = extractedData;
    cleanedExtracted = {
      title: rest.title,
      summary: rest.summary,
      cefrRecommended: rest.cefrRecommended,
      vocabulary: Array.isArray(rest.vocabulary)
        ? rest.vocabulary.slice(0, 15).map((v: any) => ({
            term: v.term,
            partOfSpeech: v.partOfSpeech,
            definition: v.definition,
          }))
        : undefined,
      grammarPoints: Array.isArray(rest.grammarPoints)
        ? rest.grammarPoints.slice(0, 8).map((g: any) => ({
            topic: g.topic,
            formula: g.formula,
            rule: g.rule,
          }))
        : undefined,
      suggestedFocusTopics: rest.suggestedFocusTopics,
    };
  }

  // Thu gọn rawMaterial nếu có nhiều khoảng trắng thừa
  const trimmedRaw = rawMaterial ? rawMaterial.trim().replace(/\n\s*\n\s*\n+/g, '\n\n') : '';

  const prompt = `
Dưới đây là thông tin học liệu nguồn và danh sách các bài tập cần biên soạn theo ĐÚNG 8 THAM SỐ KỸ THUẬT:

HỌC LIỆU NGUỒN:
${trimmedRaw ? `Văn bản gốc:\n"""\n${trimmedRaw}\n"""\n` : ''}
${cleanedExtracted ? `Dữ liệu phân tích sư phạm cốt lõi:\n${JSON.stringify(cleanedExtracted, null, 2)}\n` : ''}

DANH SÁCH BÀI TẬP CẦN TẠO (Tuân thủ nghiêm ngặt từng tham số):
${JSON.stringify(parameters, null, 2)}

QUY TẮC BẮT BUỘC VỀ HÌNH THỨC:
1. Nếu format là "mcq_3": Bắt buộc câu hỏi trắc nghiệm chỉ có 3 phương án lựa chọn: key là "A", "B", "C".
2. Nếu format là "mcq_4": Bắt buộc câu hỏi trắc nghiệm có 4 phương án lựa chọn: key là "A", "B", "C", "D".
3. Nếu format là "true_false": Bắt buộc câu hỏi trắc nghiệm True / False với 2 phương án: key "A": "True", key "B": "False" (hoặc thêm "Not Given" nếu là bài đọc hiểu phân loại).
4. Nếu format là "open_ended": Đây là bài tự luận (điền từ khuyết, chia động từ, viết lại câu, tìm lỗi sai và sửa lại). KHÔNG có options A/B/C/D, correctAnswer là từ/câu trả lời chuẩn xác.
5. Dạng bài ("exerciseType"): Sử dụng đúng định dạng người dùng đã nhập (VD: "${parameters.map((p: any) => p.exerciseType).join(', ')}").
6. Trình độ CEFR: Tuân thủ mức độ đã chọn từ 12 cấp độ (Pre-A1, A1, A1+, A2, A2+, B1, B1+, B2, B2+, C1, C1+, C2).
7. Nếu là bài Đọc hiểu: Cung cấp đoạn văn "readingPassage" bằng tiếng Anh chuẩn phù hợp với CEFR. KHÔNG tô màu nền cho đoạn văn.
8. Nếu là bài Nghe: Cung cấp đoạn transcript "audioScript" tự nhiên, kèm speaker cues và đánh dấu từ khóa dẫn đến đáp án.
9. Mỗi câu hỏi phải có "correctAnswer" và "explanation" (giải thích sư phạm rõ ràng, chỉ rõ tại sao đúng và phương án nhiễu sai ở đâu).

QUY TẮC CHẤT LƯỢNG CÂU HỎI TRẮC NGHIỆM (Bắt buộc cho mọi đề):
10. Phương án nhiễu tương đương: Tất cả các phương án ABCD phải tương đương về loại từ (noun/verb/adj/adv) và chức năng ngữ pháp khi dạng bài yêu cầu. Ví dụ: nếu chỗ trống cần một danh từ, tất cả phương án đều là danh từ; nếu cần một thì động từ, tất cả phương án đều là dạng động từ phù hợp.
11. Chỉ một đáp án đúng: CHỈ có DUY NHẤT một đáp án đúng trong ngữ cảnh. Kiểm tra kỹ lưỡng tất cả phương án trước khi xác định correctAnswer.
12. Không để đáp án đúng nổi bật bất thường vì dài hơn, ngắn hơn hoặc có cấu trúc khác biệt rõ ràng so với các phương án còn lại.
13. Phương án nhiễu phải sai rõ ràng về ngữ pháp hoặc ngữ nghĩa nhưng vẫn hợp lý để đánh lừa học sinh thiếu kiến thức.
14. Bài Phát âm (Pronunciation & Stress): Dùng thẻ HTML <u>phần cần gạch chân</u> cho âm tiết hoặc nhóm chữ cần kiểm tra trong prompt câu hỏi. TUYỆT ĐỐI không dùng ký hiệu '>', '>>', mũi tên hoặc ký tự thay thế khác.
${totalExams > 1 ? `
NHIỀU ĐỀ – YÊU CẦU ĐẶC BIỆT:
Đây là ĐỀ SỐ ${examVariant} trong tổng số ${totalExams} đề cần tạo từ cùng nguồn học liệu. Yêu cầu bắt buộc:
- Tạo câu hỏi khác biệt hoàn toàn với các đề khác: sử dụng ngữ cảnh khác, ví dụ khác, hoặc góc kiểm tra khác cho cùng chủ điểm.
- Không chỉ đảo thứ tự câu hoặc hoán vị phương án. Nội dung câu hỏi phải thực sự khác nhau.
- Giữ nguyên số lượng câu, dạng bài, CEFR và Bloom tương đương với các đề còn lại.
- Bám sát ngữ liệu gốc, không bổ sung kiến thức ngoài phạm vi nguồn học liệu.
` : ''}
Định dạng JSON trả về:
{
  "exercises": [
    {
      "id": "param-id",
      "order": 1,
      "title": "Exercise 1: [Tên dạng bài do người dùng nhập]",
      "exerciseType": "[Tên dạng bài]",
      "format": "mcq_4" | "mcq_3" | "true_false" | "open_ended",
      "cefrLevel": "B1",
      "cognitiveLevel": "Vận dụng",
      "focus": "Trọng tâm kiến thức",
      "instruction": "Lệnh bài tập bằng tiếng Anh chuẩn sư phạm (VD: Choose the best option A, B, C or D...)",
      "readingPassage": "Nội dung đoạn văn đọc nếu cần",
      "audioScript": "Nội dung Audio Script nếu là bài nghe",
      "questions": [
        {
          "id": "q1",
          "number": 1,
          "prompt": "Nội dung câu hỏi",
          "options": [
            { "key": "A", "text": "Phương án A" },
            { "key": "B", "text": "Phương án B" },
            { "key": "C", "text": "Phương án C" }
          ],
          "correctAnswer": "A. Phương án A",
          "explanation": "Giải thích sư phạm chi tiết",
          "cognitiveTag": "Thông hiểu"
        }
      ]
    }
  ]
}
`;

  // Cơ chế retry nội bộ có kiểm soát trên Server khi gặp lỗi 503 quá tải tạm thời
  const maxServerRetries = 1;
  let response: any = null;

  console.log(`[aiService] Bắt đầu sinh Đề ${examVariant}/${totalExams} (Số dạng bài: ${parameters.length})...`);

  for (let attempt = 0; attempt <= maxServerRetries; attempt++) {
    try {
      response = await ai.models.generateContent({
        model: getGeminiModel(),
        contents: prompt,
        config: {
          systemInstruction: SYSTEM_INSTRUCTION,
          responseMimeType: 'application/json',
          thinkingConfig: {
            thinkingLevel: ThinkingLevel.LOW,
          },
        },
      });
      break; // Thành công, thoát vòng lặp
    } catch (err: any) {
      const rawMsg = err?.message || '';
      const status = err?.status || err?.statusCode || 500;
      const is503 = status === 503 || rawMsg.includes('503') || rawMsg.includes('UNAVAILABLE') || rawMsg.includes('overloaded');

      if (is503 && attempt < maxServerRetries) {
        const jitter = Math.random() * 800;
        const delayMs = 2500 * (attempt + 1) + jitter;
        console.warn(`[aiService] Google AI 503 tạm thời quá tải. Đang thử lại cục bộ lần ${attempt + 1}/${maxServerRetries} sau ${Math.round(delayMs)}ms...`);
        await new Promise((res) => setTimeout(res, delayMs));
        continue;
      }
      throw err;
    }
  }

  const rawResult = (response?.text || '').trim();
  const cleanedJson = extractJsonFromText(rawResult);

  let parsed: any = null;
  try {
    parsed = JSON.parse(cleanedJson);
  } catch (parseErr: any) {
    console.error(`[aiService] Lỗi parse JSON cho Đề ${examVariant}/${totalExams}:`, parseErr?.message);
    throw new Error(`Định dạng JSON từ AI không hợp lệ cho Đề ${examVariant}: ${parseErr?.message || 'Lỗi cú pháp'}`);
  }

  const normalized = normalizeExercisesPayload(parsed);
  console.log(`[aiService] Hoàn tất sinh Đề ${examVariant}/${totalExams}. Số bài tập trích xuất: ${normalized.exercises.length}.`);

  if (normalized.exercises.length === 0) {
    console.warn(`[aiService] CẢNH BÁO: Không có bài tập nào cho Đề ${examVariant}/${totalExams}. Các keys có trong JSON:`, Object.keys(parsed || {}));
  }

  return normalized;
}

export interface AdjustExerciseParams {
  currentExercise: any;
  adjustmentCommand: string;
  targetQuestionNumber?: number;
  rawMaterial?: string;
}

export async function adjustExerciseService(params: AdjustExerciseParams) {
  const { currentExercise, adjustmentCommand, targetQuestionNumber, rawMaterial } = params;

  if (!currentExercise || !adjustmentCommand) {
    throw new Error('Thiếu dữ liệu bài tập hoặc lệnh điều chỉnh.');
  }

  const ai = getAIClient();

  const prompt = `
Bạn đang trong chế độ "Điều chỉnh" học liệu của Chuyên gia Biên soạn Học liệu Tiếng Anh.
Nhiệm vụ của bạn là GIỮ NGUYÊN cấu trúc bài tập hiện tại, CHỈ ĐIỀU CHỈNH nội dung theo yêu cầu của giáo viên.

BÀI TẬP HIỆN TẠI:
${JSON.stringify(currentExercise, null, 2)}

HỌC LIỆU GỐC NẾU CÓ THAM CHIẾU:
${rawMaterial ? `"""\n${rawMaterial}\n"""` : 'Không có'}

LỆNH ĐIỀU CHỈNH CỦA GIÁO VIÊN:
${targetQuestionNumber ? `(Nhắm cụ thể vào Câu số ${targetQuestionNumber})` : ''}
"${adjustmentCommand}"

QUY TẮC:
- Nếu giáo viên yêu cầu thay đổi độ khó một câu (VD: Tăng độ khó câu 3 lên Vận dụng cao): Cập nhật câu đó với phương án gây nhiễu tinh tế hơn, giữ đúng cấu trúc và chủ điểm.
- Nếu giáo viên yêu cầu đổi hình thức (VD: Đổi sang 3 phương án, hoặc True/False, hoặc tự luận): Chuyển đổi chính xác sang hình thức đó.
- Đảm bảo câu hỏi có đáp án chuẩn xác và giải thích rõ ràng.
- Trả về JSON của DUY NHẤT bài tập đã được cập nhật hoàn chỉnh:

{
  "updatedExercise": {
    "id": "${currentExercise.id || 'ex-1'}",
    "order": ${currentExercise.order || 1},
    "title": "Tiêu đề bài tập",
    "exerciseType": "...",
    "format": "mcq_4" | "mcq_3" | "true_false" | "open_ended",
    "cefrLevel": "...",
    "cognitiveLevel": "...",
    "focus": "...",
    "instruction": "...",
    "readingPassage": "...",
    "audioScript": "...",
    "questions": [...]
  },
  "adjustmentSummary": "Tóm tắt ngắn gọn các thay đổi đã thực hiện bằng tiếng Việt cho giáo viên"
}
`;

  const response = await ai.models.generateContent({
    model: getGeminiModel(),
    contents: prompt,
    config: {
      systemInstruction: SYSTEM_INSTRUCTION,
      responseMimeType: 'application/json',
      thinkingConfig: {
        thinkingLevel: ThinkingLevel.LOW,
      },
    },
  });

  const resultText = response.text || '{}';
  return JSON.parse(resultText);
}
