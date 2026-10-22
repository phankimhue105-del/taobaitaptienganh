import { adjustExerciseService } from '../src/server/aiService.ts';

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
    const { currentExercise, adjustmentCommand, targetQuestionNumber, rawMaterial } = body;

    if (!currentExercise || !adjustmentCommand) {
      return res.status(400).json({
        error: 'Thiếu dữ liệu bài tập hoặc lệnh điều chỉnh.',
      });
    }

    const result = await adjustExerciseService({
      currentExercise,
      adjustmentCommand,
      targetQuestionNumber,
      rawMaterial,
    });
    return res.status(200).json(result);
  } catch (error: any) {
    console.error('Vercel API error in adjust-exercise:', error);
    const status = error.message?.includes('Thiếu dữ liệu') ? 400 : 500;
    return res.status(status).json({
      error: error.message || 'Lỗi khi điều chỉnh bài tập.',
    });
  }
}
