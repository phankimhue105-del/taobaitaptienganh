import { extractMaterialsService, parseAndFormatAIError } from '../src/server/aiService.ts';

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '4.5mb',
    },
  },
};

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed. Vui lòng sử dụng phương thức POST.' });
  }

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body || {};
    const { text, fileBase64, mimeType, fileName } = body;

    if (!text && !fileBase64) {
      return res.status(400).json({
        error: 'Vui lòng cung cấp văn bản học liệu hoặc tải lên tệp (Word, PDF, JPG, PNG).',
      });
    }

    if (fileBase64 && typeof fileBase64 === 'string' && fileBase64.length > 5 * 1024 * 1024) {
      return res.status(413).json({
        error: 'Dung lượng tệp quá lớn (> 4MB). Vui lòng chọn tệp nhỏ hơn để đảm bảo giới hạn Serverless.',
      });
    }

    const result = await extractMaterialsService({ text, fileBase64, mimeType, fileName });
    return res.status(200).json(result);
  } catch (error: any) {
    console.error('Vercel API error in extract-materials:', error);
    const formatted = parseAndFormatAIError(error);
    return res.status(formatted.status).json({
      error: formatted.message,
      code: formatted.code,
      quotaType: formatted.quotaType,
      model: formatted.model,
      isDailyQuotaExhausted: formatted.isDailyQuotaExhausted,
    });
  }
}
