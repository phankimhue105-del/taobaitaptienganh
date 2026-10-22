export default async function handler(req: any, res: any) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method Not Allowed. Vui lòng sử dụng phương thức GET.' });
  }

  return res.status(200).json({
    status: 'ok',
    service: 'EduArchitect Vercel API',
    timestamp: new Date().toISOString(),
    geminiKeyConfigured: Boolean(process.env.GEMINI_API_KEY),
  });
}
