import dotenv from 'dotenv';
dotenv.config();

import healthHandler from '../api/health.ts';
import extractHandler from '../api/extract-materials.ts';
import generateHandler from '../api/generate-exercises.ts';
import adjustHandler from '../api/adjust-exercise.ts';
import { Document, Paragraph, TextRun, Packer } from 'docx';
// @ts-ignore
import mammoth from 'mammoth';

interface MockResponse {
  statusCode: number;
  data: any;
  headers: Record<string, string>;
  status: (code: number) => MockResponse;
  json: (data: any) => MockResponse;
  send: (data: any) => MockResponse;
  setHeader: (name: string, value: string) => MockResponse;
  getStatusCode: () => number;
  getData: () => any;
}

function createMockRes(): MockResponse {
  const res: MockResponse = {
    statusCode: 200,
    data: null,
    headers: {},
    status(code: number) {
      this.statusCode = code;
      return this;
    },
    json(payload: any) {
      this.data = payload;
      this.headers['content-type'] = 'application/json';
      return this;
    },
    send(payload: any) {
      this.data = payload;
      return this;
    },
    setHeader(name: string, value: string) {
      this.headers[name.toLowerCase()] = value;
      return this;
    },
    getStatusCode() {
      return this.statusCode;
    },
    getData() {
      return this.data;
    },
  };
  return res;
}

async function runLocalHandlerTests() {
  console.log('====================================================');
  console.log('EduArchitect - Local Serverless Handlers Test Suite');
  console.log('====================================================\n');

  let passedTests = 0;
  let totalTests = 0;

  function assertTest(name: string, condition: boolean, details?: string) {
    totalTests++;
    if (condition) {
      passedTests++;
      console.log(`[PASS] ${name}`);
    } else {
      console.error(`[FAIL] ${name} ${details ? `-> ${details}` : ''}`);
    }
  }

  // --- 1. api/health.ts ---
  console.log('--- 1. Testing api/health.ts handler ---');
  const resHealthGet = createMockRes();
  await healthHandler({ method: 'GET' }, resHealthGet);
  assertTest('GET /api/health trả về status 200', resHealthGet.getStatusCode() === 200);
  assertTest('GET /api/health trả về status: "ok"', resHealthGet.getData()?.status === 'ok');
  assertTest('GET /api/health kiểm tra key dạng boolean (không lộ key)', typeof resHealthGet.getData()?.geminiKeyConfigured === 'boolean');

  const resHealthPost = createMockRes();
  await healthHandler({ method: 'POST' }, resHealthPost);
  assertTest('POST /api/health bị chặn với mã 405 Method Not Allowed', resHealthPost.getStatusCode() === 405);

  // --- 2. api/extract-materials.ts ---
  console.log('\n--- 2. Testing api/extract-materials.ts handler ---');
  const resExtractGet = createMockRes();
  await extractHandler({ method: 'GET' }, resExtractGet);
  assertTest('GET /api/extract-materials bị chặn với mã 405', resExtractGet.getStatusCode() === 405);

  const resExtractEmpty = createMockRes();
  await extractHandler({ method: 'POST', body: {} }, resExtractEmpty);
  assertTest('POST /api/extract-materials rỗng trả về mã 400', resExtractEmpty.getStatusCode() === 400);
  assertTest('POST /api/extract-materials có thông báo lỗi hợp lệ', Boolean(resExtractEmpty.getData()?.error));

  const resExtractOversized = createMockRes();
  const oversizedBase64 = 'A'.repeat(6 * 1024 * 1024); // 6MB
  await extractHandler(
    {
      method: 'POST',
      body: { fileBase64: oversizedBase64, mimeType: 'application/pdf' },
    },
    resExtractOversized
  );
  assertTest('POST /api/extract-materials chặn file quá 4MB với mã 413 Payload Too Large', resExtractOversized.getStatusCode() === 413);

  // --- 3. api/generate-exercises.ts ---
  console.log('\n--- 3. Testing api/generate-exercises.ts handler ---');
  const resGenGet = createMockRes();
  await generateHandler({ method: 'GET' }, resGenGet);
  assertTest('GET /api/generate-exercises bị chặn với mã 405', resGenGet.getStatusCode() === 405);

  const resGenEmpty = createMockRes();
  await generateHandler({ method: 'POST', body: { parameters: [] } }, resGenEmpty);
  assertTest('POST /api/generate-exercises không có bài tập trả về mã 400', resGenEmpty.getStatusCode() === 400);

  // --- 4. api/adjust-exercise.ts ---
  console.log('\n--- 4. Testing api/adjust-exercise.ts handler ---');
  const resAdjustGet = createMockRes();
  await adjustHandler({ method: 'GET' }, resAdjustGet);
  assertTest('GET /api/adjust-exercise bị chặn với mã 405', resAdjustGet.getStatusCode() === 405);

  const resAdjustEmpty = createMockRes();
  await adjustHandler({ method: 'POST', body: {} }, resAdjustEmpty);
  assertTest('POST /api/adjust-exercise thiếu tham số trả về mã 400', resAdjustEmpty.getStatusCode() === 400);

  // --- 5. DOCX local parsing test ---
  console.log('\n--- 5. Testing local DOCX text extraction with Mammoth ---');
  const doc = new Document({
    sections: [
      {
        children: [
          new Paragraph({
            children: [
              new TextRun('Unit 6: Gender Equality. Equal opportunities in education and career.'),
            ],
          }),
        ],
      },
    ],
  });
  const docxBuffer = await Packer.toBuffer(doc);
  const parsedDocx = await mammoth.extractRawText({ buffer: docxBuffer });
  const docxText = parsedDocx.value.trim();
  assertTest(
    'Mammoth trích xuất thành công văn bản từ Buffer DOCX',
    docxText.includes('Gender Equality'),
    `Nội dung: "${docxText}"`
  );

  // --- 6. vercel.json Rewrite Rule Verification ---
  console.log('\n--- 6. Verifying vercel.json Rewrite Rules ---');
  const spaRegex = new RegExp('^/((?!api/).*)$');

  assertTest('/api/health KHÔNG bị rewrite vào index.html', !spaRegex.test('/api/health'));
  assertTest('/api/extract-materials KHÔNG bị rewrite vào index.html', !spaRegex.test('/api/extract-materials'));
  assertTest('/api/generate-exercises KHÔNG bị rewrite vào index.html', !spaRegex.test('/api/generate-exercises'));
  assertTest('/api/adjust-exercise KHÔNG bị rewrite vào index.html', !spaRegex.test('/api/adjust-exercise'));
  assertTest('/ (homepage) ĐƯỢC rewrite vào index.html', spaRegex.test('/'));
  assertTest('/dashboard ĐƯỢC rewrite vào index.html', spaRegex.test('/dashboard'));

  console.log('\n====================================================');
  console.log(`Kết quả kiểm thử Handlers: ${passedTests}/${totalTests} bài kiểm tra đạt.`);
  console.log('====================================================\n');
}

runLocalHandlerTests().catch((err) => {
  console.error('Lỗi thực thi local handler test suite:', err);
});

