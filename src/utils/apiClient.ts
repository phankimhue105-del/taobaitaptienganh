/**
 * EduArchitect API Client
 * Cung cấp các hàm gọi API chuẩn hóa với cơ chế bắt lỗi và kiểm tra Content-Type an toàn,
 * ngăn chặn lỗi SyntaxError: Unexpected token '<' hoặc 'T' khi máy chủ trả về HTML thay vì JSON.
 */

export class ApiError extends Error {
  status: number;
  statusText: string;
  data?: any;

  constructor(message: string, status: number, statusText: string, data?: any) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.statusText = statusText;
    this.data = data;
  }
}

async function parseResponse<T = any>(response: Response): Promise<T> {
  const contentType = response.headers.get('content-type') || '';
  const isJson = contentType.includes('application/json');

  if (!response.ok) {
    let errorMessage = `Yêu cầu thất bại với mã lỗi ${response.status} (${response.statusText})`;

    if (isJson) {
      try {
        const errorData = await response.json();
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

    throw new ApiError(errorMessage, response.status, response.statusText);
  }

  if (!isJson) {
    const text = await response.text();
    throw new ApiError(
      `Máy chủ trả về dữ liệu định dạng không phải JSON (${contentType || 'text/html'}). API có thể đang bị rewrite nhầm thành trang HTML.`,
      response.status,
      response.statusText,
      text
    );
  }

  return response.json() as Promise<T>;
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
  const response = await fetch('/api/extract-materials', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify(payload),
  });
  return parseResponse(response);
}

export async function fetchGenerateExercises(payload: {
  rawMaterial?: string;
  extractedData?: any;
  parameters: any[];
}) {
  const response = await fetch('/api/generate-exercises', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify(payload),
  });
  return parseResponse<{ exercises: any[] }>(response);
}

export async function fetchAdjustExercise(payload: {
  currentExercise: any;
  adjustmentCommand: string;
  targetQuestionNumber?: number;
  rawMaterial?: string;
}) {
  const response = await fetch('/api/adjust-exercise', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify(payload),
  });
  return parseResponse<{ updatedExercise: any; adjustmentSummary: string }>(response);
}
