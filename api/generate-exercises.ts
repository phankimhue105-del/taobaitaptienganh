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

  const startTime = Date.now();
  let variantNum = 1;
  let totalNum = 1;

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body || {};
    const { rawMaterial, extractedData, parameters, examVariant = 1, totalExams = 1 } = body;
    variantNum = Number(examVariant) || 1;
    totalNum = Number(totalExams) || 1;

    console.log(`[api/generate-exercises] Nhận yêu cầu: Đề ${variantNum}/${totalNum}, Số dạng bài: ${parameters?.length || 0}`);

    if (!parameters || !Array.isArray(parameters) || parameters.length === 0) {
      return res.status(400).json({
        error: 'Chưa có bài tập nào. Vui lòng cấu hình ít nhất một bài tập.',
      });
    }

    const result = await generateExercisesService({ rawMaterial, extractedData, parameters, examVariant: variantNum, totalExams: totalNum });
    const duration = ((Date.now() - startTime) / 1000).toFixed(1);
    console.log(`[api/generate-exercises] Thành công: Đề ${variantNum}/${totalNum} hoàn thành trong ${duration}s, trích xuất ${result.exercises?.length || 0} bài tập.`);
    return res.status(200).json(result);
  } catch (error: any) {
    const duration = ((Date.now() - startTime) / 1000).toFixed(1);
    console.error(`[api/generate-exercises] Thất bại cho Đề ${variantNum}/${totalNum} sau ${duration}s:`, error?.message || error);
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
