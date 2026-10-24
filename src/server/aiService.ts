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
      grammarPoints: Array.isArray(rest.grammar
