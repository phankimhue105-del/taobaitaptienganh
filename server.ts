import express from 'express';
import path from 'path';
import dotenv from 'dotenv';
import {
  extractMaterialsService,
  generateExercisesService,
  adjustExerciseService,
  getGeminiModel,
  parseAndFormatAIError,
} from './src/server/aiService.ts';

dotenv.config();

const app = express();

function getPort(): number {
  const portArgIndex = process.argv.indexOf('--port');
  if (portArgIndex !== -1 && process.argv[portArgIndex + 1]) {
    const parsed = parseInt(process.argv[portArgIndex + 1], 10);
    if (!isNaN(parsed)) return parsed;
  }
  return process.env.NODE_ENV === 'production' ? (Number(process.env.PORT) || 8080) : 3000;
}

const PORT = getPort();

app.use(express.json({ limit: '35mb' }));
app.use(express.urlencoded({ extended: true, limit: '35mb' }));

// Health Check Endpoint
app.get('/api/health', (_req, res) => {
  return res.json({
    status: 'ok',
    service: 'EduGenius API',
    model: getGeminiModel(),
    timestamp: new Date().toISOString(),
    geminiKeyConfigured: Boolean(process.env.GEMINI_API_KEY),
  });
});

// 1. Endpoint: Extract learning material & vocabulary / grammar
app.post('/api/extract-materials', async (req, res) => {
  try {
    const { text, fileBase64, mimeType, fileName } = req.body;
    const result = await extractMaterialsService({ text, fileBase64, mimeType, fileName });
    return res.json(result);
  } catch (error: any) {
    console.error('Error extracting materials:', error);
    const formatted = parseAndFormatAIError(error);
    return res.status(formatted.status).json({
      error: formatted.message,
      code: formatted.code,
      quotaType: formatted.quotaType,
      model: formatted.model,
      isDailyQuotaExhausted: formatted.isDailyQuotaExhausted,
    });
  }
});

// 2. Endpoint: Generate exercises based on 8 parameters
app.post('/api/generate-exercises', async (req, res) => {
  try {
    const { rawMaterial, extractedData, parameters } = req.body;
    const result = await generateExercisesService({ rawMaterial, extractedData, parameters });
    return res.json(result);
  } catch (error: any) {
    console.error('Error generating exercises:', error);
    const formatted = parseAndFormatAIError(error);
    return res.status(formatted.status).json({
      error: formatted.message,
      code: formatted.code,
      quotaType: formatted.quotaType,
      model: formatted.model,
      isDailyQuotaExhausted: formatted.isDailyQuotaExhausted,
    });
  }
});

// 3. Endpoint: Adjust / Refine exercise ("Điều chỉnh" mode)
app.post('/api/adjust-exercise', async (req, res) => {
  try {
    const { currentExercise, adjustmentCommand, targetQuestionNumber, rawMaterial } = req.body;
    const result = await adjustExerciseService({
      currentExercise,
      adjustmentCommand,
      targetQuestionNumber,
      rawMaterial,
    });
    return res.json(result);
  } catch (error: any) {
    console.error('Error adjusting exercise:', error);
    const formatted = parseAndFormatAIError(error);
    return res.status(formatted.status).json({
      error: formatted.message,
      code: formatted.code,
      quotaType: formatted.quotaType,
      model: formatted.model,
      isDailyQuotaExhausted: formatted.isDailyQuotaExhausted,
    });
  }
});

// Setup Vite in Dev or Static files in Prod
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer } = await import('vite');
    const vite = await createServer({
      server: {
        middlewareMode: true,
        hmr: process.env.DISABLE_HMR === 'true' ? false : undefined,
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve('dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`EduGenius Server running on port ${PORT} on 0.0.0.0`);
  });
}

startServer();
