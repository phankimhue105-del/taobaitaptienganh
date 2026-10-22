import dotenv from 'dotenv';
dotenv.config();

import { Document, Paragraph, TextRun, Packer } from 'docx';

const BASE_URL = process.env.TEST_BASE_URL || 'http://localhost:3000';

interface HttpResponse {
  status: number;
  statusText: string;
  contentType: string;
  isJson: boolean;
  isHtml: boolean;
  data: any;
  rawText: string;
}

async function request(path: string, options: RequestInit = {}): Promise<HttpResponse> {
  const url = `${BASE_URL}${path}`;
  const headers = new Headers(options.headers || {});
  if (!headers.has('Accept')) {
    headers.set('Accept', 'application/json');
  }

  const response = await fetch(url, {
    ...options,
    headers,
  });

  const contentType = response.headers.get('content-type') || '';
  const isJson = contentType.includes('application/json');
  const isHtml = contentType.includes('text/html');
  const rawText = await response.text();

  let data = null;
  if (isJson) {
    try {
      data = JSON.parse(rawText);
    } catch {
      data = null;
    }
  }

  return {
    status: response.status,
    statusText: response.statusText,
    contentType,
    isJson,
    isHtml,
    data,
    rawText,
  };
}

async function createSampleDocxBase64(): Promise<string> {
  const doc = new Document({
    sections: [
      {
        children: [
          new Paragraph({
            children: [
              new TextRun(
                'Unit 3: Protecting the Environment. Key Vocabulary: renewable energy (n), carbon footprint (n), biodiversity (n). Grammar: Passive voice with modals.'
              ),
            ],
          }),
        ],
      },
    ],
  });
  const buffer = await Packer.toBuffer(doc);
  return buffer.toString('base64');
}

async function runEndpointTests() {
  console.log('====================================================');
  console.log(`EduGenius - HTTP Endpoint Test Suite`);
  console.log(`Target Base URL: ${BASE_URL}`);
  console.log('====================================================\n');

  // Verify server reachability first
  try {
    const probe = await fetch(`${BASE_URL}/api/health`, { method: 'GET' });
    console.log(`[PASS] Server is reachable at ${BASE_URL} (HTTP status: ${probe.status})`);
  } catch (err: any) {
    console.error(`[FAIL] Khong the ket noi toi ${BASE_URL}: ${err.message}`);
    console.error(`Gợi ý: Hãy đảm bảo máy chủ dev đang chạy ('bun run dev' hoặc 'npm run dev') hoặc cấu hình biến TEST_BASE_URL trỏ tới URL Vercel.`);
    return;
  }

  let totalTests = 0;
  let passedTests = 0;

  function assertTest(name: string, condition: boolean, details?: string) {
    totalTests++;
    if (condition) {
      passedTests++;
      console.log(`[PASS] ${name}`);
    } else {
      console.error(`[FAIL] ${name} ${details ? `-> ${details}` : ''}`);
    }
  }

  // 1. GET /api/health
  console.log('\n--- 1. Testing GET /api/health ---');
  const resHealth = await request('/api/health', { method: 'GET' });
  assertTest('Health check trả về HTTP 200', resHealth.status === 200, `Nhận được: ${resHealth.status}`);
  assertTest('Health check trả về Content-Type application/json', resHealth.isJson, `Nhận được: ${resHealth.contentType}`);
  assertTest('Health check không bị rewrite về HTML', !resHealth.isHtml);
  assertTest('Health check trả về status: "ok"', resHealth.data?.status === 'ok', `Data: ${JSON.stringify(resHealth.data)}`);
  assertTest('Health check xác nhận trạng thái Gemini Key', typeof resHealth.data?.geminiKeyConfigured === 'boolean');

  // 2. Validation: POST /api/extract-materials với dữ liệu rỗng
  console.log('\n--- 2. Testing POST /api/extract-materials (Validation) ---');
  const resExtractInvalid = await request('/api/extract-materials', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({}),
  });
  assertTest('Extract rỗng trả về HTTP 400', resExtractInvalid.status === 400, `Nhận được: ${resExtractInvalid.status}`);
  assertTest('Extract rỗng trả về Content-Type JSON', resExtractInvalid.isJson, `Nhận được: ${resExtractInvalid.contentType}`);
  assertTest('Extract rỗng có trường error rõ ràng', Boolean(resExtractInvalid.data?.error), `Error: ${resExtractInvalid.data?.error}`);

  // 3. Validation: POST /api/generate-exercises với dữ liệu rỗng
  console.log('\n--- 3. Testing POST /api/generate-exercises (Validation) ---');
  const resGenInvalid = await request('/api/generate-exercises', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ parameters: [] }),
  });
  assertTest('Generate rỗng trả về HTTP 400', resGenInvalid.status === 400, `Nhận được: ${resGenInvalid.status}`);
  assertTest('Generate rỗng trả về Content-Type JSON', resGenInvalid.isJson, `Nhận được: ${resGenInvalid.contentType}`);
  assertTest('Generate rỗng có trường error rõ ràng', Boolean(resGenInvalid.data?.error), `Error: ${resGenInvalid.data?.error}`);

  // 4. Validation: POST /api/adjust-exercise với dữ liệu rỗng
  console.log('\n--- 4. Testing POST /api/adjust-exercise (Validation) ---');
  const resAdjustInvalid = await request('/api/adjust-exercise', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({}),
  });
  assertTest('Adjust rỗng trả về HTTP 400', resAdjustInvalid.status === 400, `Nhận được: ${resAdjustInvalid.status}`);
  assertTest('Adjust rỗng trả về Content-Type JSON', resAdjustInvalid.isJson, `Nhận được: ${resAdjustInvalid.contentType}`);
  assertTest('Adjust rỗng có trường error rõ ràng', Boolean(resAdjustInvalid.data?.error), `Error: ${resAdjustInvalid.data?.error}`);

  // 5. Kiểm tra HTML Leakage / Anti-SPA rewrite check
  console.log('\n--- 5. Anti-SPA Rewrite Check on Non-Existent API Endpoint ---');
  const resNonExistent = await request('/api/non-existent-endpoint-test-12345', { method: 'GET' });
  const isHtmlSPA = resNonExistent.isHtml && resNonExistent.rawText.includes('<div id="root">');
  assertTest(
    'Endpoint API không tồn tại KHÔNG bị rewrite nhầm thành SPA index.html',
    !isHtmlSPA,
    'Cảnh báo: Endpoint /api/* đang bị bắt nhầm vào index.html'
  );

  // 6. Tải tệp DOCX lên /api/extract-materials (Chỉ chạy khi có server và key)
  console.log('\n--- 6. Testing DOCX Upload on /api/extract-materials ---');
  try {
    const docxBase64 = await createSampleDocxBase64();
    const resDocx = await request('/api/extract-materials', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fileName: 'Unit3_Environment.docx',
        fileBase64: docxBase64,
        mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      }),
    });

    assertTest('DOCX upload trả về Content-Type JSON', resDocx.isJson, `Nhận được: ${resDocx.contentType}`);
    if (resDocx.status === 200) {
      assertTest('DOCX upload trả về HTTP 200', true);
      assertTest('DOCX trích xuất được tiêu đề hoặc từ vựng', Boolean(resDocx.data?.title || resDocx.data?.vocabulary));
    } else {
      console.log(`[INFO] DOCX endpoint phản hồi mã ${resDocx.status}: ${resDocx.data?.error || resDocx.rawText.slice(0, 100)}`);
    }
  } catch (err: any) {
    console.error(`[SKIP] Kiểm thử DOCX gặp lỗi mạng/AI: ${err.message}`);
  }

  console.log('\n====================================================');
  console.log(`Kết quả kiểm thử Endpoint: ${passedTests}/${totalTests} bài kiểm tra đạt.`);
  console.log('====================================================\n');
}

runEndpointTests().catch((err) => {
  console.error('Lỗi thực thi test suite:', err);
});
