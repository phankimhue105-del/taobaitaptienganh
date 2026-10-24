import { generateExercisesService, parseAndFormatAIError } from '../src/server/aiService.ts';

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
    const { rawMaterial, extractedData, parameters, examVariant, totalExams } = body;

    if (!parameters || !Array.isArray(parameters) || parameters.length === 0) {
      return res.status(400).json({
        error: 'Chưa có bài tập nào. Vui lòng cấu hình ít nhất một bài tập.',
      });
    }

    const result = await generateExercisesService({ rawMaterial, extractedData, parameters, examVariant, totalExams });
    return res.status(200).json(result);
  } catch (error: any) {
    console.error('Vercel API error in generate-exercises:', error);
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
