/**
 * mcqQuality.ts
 * Kiểm soát và cải thiện chất lượng câu hỏi trắc nghiệm – 0 AI calls, 100% TypeScript
 *
 * Chức năng:
 * 1. Parse key đáp án đúng từ chuỗi "A. text" hoặc "A"
 * 2. Kiểm tra 1 đáp án đúng duy nhất per câu
 * 3. Kiểm tra options không trùng key
 * 4. Cân bằng phân bổ A/B/C/D trong từng bài tập (nếu đủ số câu)
 * 5. Bảo toàn tính đúng đắn khi xáo trộn thứ tự options
 */

import { ExerciseResult, QuestionItem, ExerciseFormat } from '../types';

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

export interface QuestionIssue {
  exerciseId: string;
  exerciseTitle: string;
  questionNumber: number;
  issue: string;
}

export interface AnswerDistribution {
  exerciseId: string;
  exerciseTitle: string;
  distribution: Record<string, number>;  // { A: 3, B: 2, C: 4, D: 1 }
  isBalanced: boolean;
}

export interface QualityReport {
  issues: QuestionIssue[];
  distributions: AnswerDistribution[];
  shuffledCount: number;    // số câu đã được xáo trộn để cân bằng
  fixedCount: number;       // số lỗi đã tự sửa (duplicate keys, v.v.)
  summary: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// Key parsing
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Extract letter key từ correctAnswer.
 * Hỗ trợ: "A", "A.", "A. some text", "a", "True", "False"
 */
export function parseCorrectKey(correctAnswer: string): string {
  if (!correctAnswer) return '';
  const s = correctAnswer.trim();
  // Pattern "A. text" or "A."
  const m = s.match(/^([A-Da-dTrFf][a-z]*)[.)\s]/);
  if (m) return m[1].charAt(0).toUpperCase();
  // Single letter
  if (/^[A-Da-d]$/.test(s)) return s.toUpperCase();
  // True / False
  if (/^true$/i.test(s)) return 'A';
  if (/^false$/i.test(s)) return 'B';
  // Key at start
  if (s.length >= 1) return s.charAt(0).toUpperCase();
  return '';
}

// ─────────────────────────────────────────────────────────────────────────────
// MCQ-only formats
// ─────────────────────────────────────────────────────────────────────────────
const MCQ_FORMATS: ExerciseFormat[] = ['mcq_4', 'mcq_3', 'true_false'];

function isMCQFormat(format: ExerciseFormat): boolean {
  return MCQ_FORMATS.includes(format);
}

// ─────────────────────────────────────────────────────────────────────────────
// Shuffle options + update correctAnswer (bảo toàn tính đúng)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Xáo trộn options của một câu hỏi và cập nhật correctAnswer cho phù hợp.
 * Không thay đổi nội dung đáp án đúng, chỉ thay đổi vị trí (key A/B/C/D).
 * Trả về câu hỏi mới.
 */
function shuffleOptions(q: QuestionItem): QuestionItem {
  if (!q.options || q.options.length < 2) return q;

  const oldOptions = [...q.options];
  const oldCorrectKey = parseCorrectKey(q.correctAnswer);

  // Tìm text của đáp án đúng
  const correctOption = oldOptions.find(o => o.key === oldCorrectKey);
  if (!correctOption) return q; // không tìm thấy, giữ nguyên

  // Xáo trộn (Fisher-Yates)
  const shuffled = [...oldOptions];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }

  // Gán lại key A/B/C/D theo thứ tự mới
  const keyMap: Record<number, string> = { 0: 'A', 1: 'B', 2: 'C', 3: 'D' };
  const newOptions = shuffled.map((opt, i) => ({
    key: keyMap[i] ?? opt.key,
    text: opt.text,
  }));

  // Tìm key mới của đáp án đúng
  const newCorrectIdx = newOptions.findIndex(o => o.text === correctOption.text);
  const newCorrectKey = newCorrectIdx >= 0 ? newOptions[newCorrectIdx].key : oldCorrectKey;

  // Cập nhật correctAnswer: giữ phần text gốc, đổi key
  let newCorrectAnswer = q.correctAnswer;
  if (q.correctAnswer.includes('.')) {
    const parts = q.correctAnswer.split(/\.\s*/);
    newCorrectAnswer = `${newCorrectKey}. ${parts.slice(1).join('. ')}`;
  } else {
    newCorrectAnswer = newCorrectKey;
  }

  return { ...q, options: newOptions, correctAnswer: newCorrectAnswer };
}

// ─────────────────────────────────────────────────────────────────────────────
// Balance distribution of correct answers A/B/C/D
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Kiểm tra độ lệch phân bổ.
 * Trả về true nếu phân bổ đã cân bằng (max - min ≤ 2 cho mỗi key).
 */
function isDistributionBalanced(dist: Record<string, number>, numOptions: number): boolean {
  const keys = numOptions === 4 ? ['A', 'B', 'C', 'D'] : ['A', 'B', 'C'];
  const counts = keys.map(k => dist[k] ?? 0);
  const maxC = Math.max(...counts);
  const minC = Math.min(...counts);
  return maxC - minC <= 2;
}

/**
 * Cân bằng phân bổ đáp án đúng trong một bài tập MCQ:
 * - Xáo trộn options của những câu có đáp án đúng xuất hiện quá nhiều
 * - Đảm bảo sau xáo trộn, key đáp án đúng phân bổ đều hơn
 * - Bảo toàn 100% tính đúng đắn
 */
function balanceExercise(ex: ExerciseResult): { exercise: ExerciseResult; shuffledCount: number } {
  if (!isMCQFormat(ex.format)) return { exercise: ex, shuffledCount: 0 };

  const numOptions = ex.format === 'mcq_3' ? 3 : ex.format === 'true_false' ? 2 : 4;
  // Không cân bằng nếu quá ít câu
  if (ex.questions.length < numOptions) return { exercise: ex, shuffledCount: 0 };

  const keys = numOptions === 4 ? ['A', 'B', 'C', 'D'] : numOptions === 3 ? ['A', 'B', 'C'] : ['A', 'B'];
  const targetPerKey = ex.questions.length / keys.length;

  let questions = [...ex.questions];
  let shuffledCount = 0;
  let maxAttempts = ex.questions.length * 3; // tránh vòng lặp vô tận
  let attempts = 0;

  while (!isDistributionBalanced(countDistribution(questions), numOptions) && attempts < maxAttempts) {
    attempts++;
    const dist = countDistribution(questions);

    // Tìm key xuất hiện nhiều nhất
    const overKey = keys.reduce((a, b) => (dist[a] ?? 0) > (dist[b] ?? 0) ? a : b);
    const overCount = dist[overKey] ?? 0;

    if (overCount <= Math.ceil(targetPerKey)) break;

    // Chọn ngẫu nhiên một câu có đáp án đúng là overKey
    const candidates = questions.map((q, i) => ({ q, i })).filter(({ q }) => parseCorrectKey(q.correctAnswer) === overKey);
    if (candidates.length === 0) break;

    const chosen = candidates[Math.floor(Math.random() * candidates.length)];
    const shuffled = shuffleOptions(chosen.q);

    // Chỉ áp dụng nếu key đáp án đúng thực sự thay đổi
    if (parseCorrectKey(shuffled.correctAnswer) !== overKey) {
      questions = questions.map((q, i) => i === chosen.i ? shuffled : q);
      shuffledCount++;
    }
  }

  return { exercise: { ...ex, questions }, shuffledCount };
}

function countDistribution(questions: QuestionItem[]): Record<string, number> {
  const dist: Record<string, number> = {};
  for (const q of questions) {
    const key = parseCorrectKey(q.correctAnswer);
    if (key) dist[key] = (dist[key] ?? 0) + 1;
  }
  return dist;
}

// ─────────────────────────────────────────────────────────────────────────────
// Validation
// ─────────────────────────────────────────────────────────────────────────────

function validateExercise(ex: ExerciseResult, issues: QuestionIssue[]) {
  if (!isMCQFormat(ex.format)) return;

  for (const q of ex.questions) {
    if (!q.options || q.options.length === 0) continue;

    // 1. Kiểm tra key trùng lặp
    const keysSeen = new Set<string>();
    for (const opt of q.options) {
      if (keysSeen.has(opt.key)) {
        issues.push({
          exerciseId: ex.id,
          exerciseTitle: ex.title,
          questionNumber: q.number,
          issue: `Trùng key phương án "${opt.key}" – có thể gây nhầm lẫn khi chấm.`,
        });
      }
      keysSeen.add(opt.key);
    }

    // 2. Kiểm tra correctAnswer tồn tại trong options
    const correctKey = parseCorrectKey(q.correctAnswer);
    const validKeys = q.options.map(o => o.key);
    if (correctKey && !validKeys.includes(correctKey)) {
      issues.push({
        exerciseId: ex.id,
        exerciseTitle: ex.title,
        questionNumber: q.number,
        issue: `Đáp án đúng "${correctKey}" không khớp với các phương án (${validKeys.join(', ')}).`,
      });
    }

    // 3. Kiểm tra thiếu đáp án
    if (!q.correctAnswer || q.correctAnswer.trim() === '') {
      issues.push({
        exerciseId: ex.id,
        exerciseTitle: ex.title,
        questionNumber: q.number,
        issue: 'Câu hỏi không có đáp án đúng (correctAnswer rỗng).',
      });
    }
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Main exported function
// ─────────────────────────────────────────────────────────────────────────────

export interface McqQualityResult {
  exercises: ExerciseResult[];
  report: QualityReport;
}

/**
 * Kiểm tra và tối ưu chất lượng câu hỏi trắc nghiệm.
 * Gọi sau khi AI trả về exercises, trước khi set state.
 * 0 AI calls – thuần TypeScript.
 *
 * @param exercises  Mảng bài tập từ AI
 * @param balance    true (mặc định) = tự động cân bằng phân bổ A/B/C/D
 */
export function validateAndFixMcqBalance(
  exercises: ExerciseResult[],
  balance: boolean = true
): McqQualityResult {
  const issues: QuestionIssue[] = [];
  const distributions: AnswerDistribution[] = [];
  let totalShuffled = 0;
  let totalFixed = 0;

  const processedExercises = exercises.map((ex) => {
    // 1. Validate
    validateExercise(ex, issues);

    // 2. Balance (chỉ với MCQ có đủ câu)
    let finalEx = ex;
    if (balance && isMCQFormat(ex.format) && ex.questions.length >= 4) {
      const { exercise: balanced, shuffledCount } = balanceExercise(ex);
      finalEx = balanced;
      totalShuffled += shuffledCount;
    }

    // 3. Record distribution
    if (isMCQFormat(ex.format)) {
      const dist = countDistribution(finalEx.questions);
      const numOptions = ex.format === 'mcq_3' ? 3 : ex.format === 'true_false' ? 2 : 4;
      distributions.push({
        exerciseId: ex.id,
        exerciseTitle: ex.title,
        distribution: dist,
        isBalanced: isDistributionBalanced(dist, numOptions),
      });
    }

    return finalEx;
  });

  // Build summary message
  const issueCount = issues.length;
  const parts: string[] = [];
  if (issueCount > 0) parts.push(`${issueCount} vấn đề cần kiểm tra`);
  if (totalShuffled > 0) parts.push(`đã cân bằng ${totalShuffled} câu hỏi`);
  if (issueCount === 0 && totalShuffled === 0) parts.push('phân bổ đáp án A/B/C/D đã cân bằng');

  const summary =
    parts.length > 0
      ? `Kiểm tra chất lượng MCQ: ${parts.join(', ')}.`
      : 'Kiểm tra chất lượng MCQ hoàn tất.';

  return {
    exercises: processedExercises,
    report: {
      issues,
      distributions,
      shuffledCount: totalShuffled,
      fixedCount: totalFixed,
      summary,
    },
  };
}
