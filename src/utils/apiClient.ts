/**
 * EduGenius API Client
 * Cung cấp các hàm gọi API chuẩn hóa với cơ chế bắt lỗi an toàn, phân biệt lỗi Quota 429
 * và kiểm tra Content-Type an toàn nhằm ngăn chặn lỗi SyntaxError HTML.
 */

import { ExtractedMaterial } from '../types';

export class ApiError extends Error {
  status: number;
  statusText: string;
  code?: string;
  quotaType?: 'daily' | 'minute' | 'other';
  model?: string;
  isDailyQuotaExhausted?: boolean;
  data?: any;

  constructor(
    message: string,
    status: number,
    statusText: string,
    options?: {
      code?: string;
      quotaType?: 'daily' | 'minute' | 'other';
      model?: string;
      isDailyQuotaExhausted?: boolean;
      data?: any;
    }
  ) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.statusText = statusText;
    this.code = options?.code;
    this.quotaType = options?.quotaType;
    this.model = options?.model;
    this.isDailyQuotaExhausted = options?.isDailyQuotaExhausted;
    this.data = options?.data;
  }
}

async function parseResponse<T = any>(response: Response): Promise<T> {
  const contentType = response.headers.get('content-type') || '';
  const isJson = contentType.includes('application/json');

  if (!response.ok) {
    let errorMessage = `Yêu cầu thất bại với mã lỗi ${response.status} (${response.statusText})`;
    let errorData: any = null;

    if (isJson) {
      try {
        errorData = await response.json();
        errorMessage = errorData.error || errorData.message || errorMessage;
      } catch {
        // Fallback to default message
      }
    } else {
      try {
        const text = await response.text();
        if (text.includes('<html') || text.includes('The page cannot be found') || text.includes('NOT_FOUND')) {
          errorMessage = `Không tìm thấy endpoint API (${response.status} ${response.statusText}). Hãy kiểm tra xem Vercel Functions đã được triển khai chính xác chưa.`;
        } else if (text.length > 0) {
          errorMessage = text.slice(0, 200);
        }
      } catch {
        // Fallback to default message
      }
    }

    throw new ApiError(errorMessage, response.status, response.statusText, {
      code: errorData?.code,
      quotaType: errorData?.quotaType,
      model: errorData?.model,
      isDailyQuotaExhausted: errorData?.isDailyQuotaExhausted,
      data: errorData,
    });
  }

  if (!isJson) {
    const text = await response.text();
    throw new ApiError(
      `Máy chủ trả về dữ liệu định dạng không phải JSON (${contentType || 'text/html'}). API có thể đang bị rewrite nhầm thành trang HTML.`,
      response.status,
      response.statusText,
      { data: text }
    );
  }

  return response.json() as Promise<T>;
}

/**
 * Thực hiện gọi API với cơ chế retry có kiểm soát:
 * - TUYỆT ĐỐI KHÔNG RETRY nếu lỗi do hết quota ngày (429 Daily Quota / RESOURCE_EXHAUSTED).
 * - Chỉ retry tối đa 1 lần với exponential backoff + jitter nếu gặp lỗi giới hạn theo phút (RPM) hoặc máy chủ 503 quá tải.
 */
async function fetchWithControlledRetry<T>(
  requestFn: () => Promise<Response>,
  options: { maxRetries?: number } = {}
): Promise<T> {
  const maxRetries = options.maxRetries ?? 1;
  let attempt = 0;

  while (true) {
    try {
      const response = await requestFn();
      return await parseResponse<T>(response);
    } catch (err: any) {
      if (err instanceof ApiError) {
        // Nếu là lỗi hết Quota ngày: Dừng ngay lập tức, không retry để tránh lãng phí
        if (err.isDailyQuotaExhausted || err.quotaType === 'daily' || err.code === 'DAILY_QUOTA_EXHAUSTED') {
          throw err;
        }

        // Chỉ thử lại tối đa maxRetries lần nếu là lỗi giới hạn phút hoặc 503 tạm thời
        const isTransient = err.quotaType === 'minute' || err.status === 503;
        if (isTransient && attempt < maxRetries) {
          attempt++;
          const jitter = Math.random() * 500;
          const delayMs = attempt * 1500 + jitter;
          console.warn(`[EduGenius] Đang thử lại lần ${attempt}/${maxRetries} sau ${Math.round(delayMs)}ms do lỗi tạm thời (${err.status})...`);
          await new Promise((res) => setTimeout(res, delayMs));
          continue;
        }
      }
      throw err;
    }
  }
}

export async function fetchHealthCheck() {
  const response = await fetch('/api/health', {
    method: 'GET',
    headers: {
      Accept: 'application/json',
    },
  });
  return parseResponse<{ status: string; service: string; timestamp: string; geminiKeyConfigured: boolean }>(response);
}

export async function fetchExtractMaterials(payload: {
  text?: string;
  fileBase64?: string;
  mimeType?: string;
  fileName?: string;
}) {
  return fetchWithControlledRetry<ExtractedMaterial & { _rawDocxText?: string }>(() =>
    fetch('/api/extract-materials', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify(payload),
    })
  );
}

export async function fetchGenerateExercises(payload: {
  rawMaterial?: string;
  extractedData?: any;
  parameters: any[];
}) {
  return fetchWithControlledRetry<{ exercises: any[] }>(() =>
    fetch('/api/generate-exercises', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify(payload),
    })
  );
}

export async function fetchAdjustExercise(payload: {
  currentExercise: any;
  adjustmentCommand: string;
  targetQuestionNumber?: number;
  rawMaterial?: string;
}) {
  return fetchWithControlledRetry<{ updatedExercise: any; adjustmentSummary: string }>(() =>
    fetch('/api/adjust-exercise', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify(payload),
    })
  );
}
