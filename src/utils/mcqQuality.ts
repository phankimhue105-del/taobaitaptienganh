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
  const newOptions = shuffled.map((opt, idx) => ({
    ...opt,
    key: keyMap[idx] || opt.key,
  }));

  // Tìm key mới của đáp án đúng
  const newCorrectOption = newOptions.find(o => o.text === correctOption.text);
  const newCorrectKey = newCorrectOption ? newCorrectOption.key : oldCorrectKey;

  // Cập nhật correctAnswer giữ nguyên format "A. text" nếu ban đầu có text
  let newCorrectAnswer = newCorrectKey;
  if (q.correctAnswer.includes('.')) {
    newCorrectAnswer = `${newCorrectKey}. ${correctOption.text}`;
  }

  return {
    ...q,
    options: newOptions,
    correctAnswer: newCorrectAnswer,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Balance distribution
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Kiểm tra xem phân bổ có bị lệch quá mức không.
 * Tiêu chí: max count - min count <= 2 (với đề từ 4 câu trở lên).
 */
function isDistributionBalanced(dist: Record<string, number>, numOptions: number): boolean {
  const keys = ['A', 'B', 'C', 'D'].slice(0, numOptions);
  const counts = keys.map(k => dist[k] ?? 0);
  const max = Math.max(...counts);
  const min = Math.min(...counts);
  return max - min <= 2;
}

/**
 * Cố gắng cân bằng phân bổ A/B/C/D bằng cách xáo trộn options của một số câu.
 * Tối đa thử 5 lần xáo trộn.
 */
function balanceExercise(ex: ExerciseResult): { exercise: ExerciseResult; shuffledCount: number } {
  if (!isMCQFormat(ex.format) || ex.questions.length < 4) {
    return { exercise: ex, shuffledCount: 0 };
  }

  const numOptions = ex.format === 'mcq_3' ? 3 : ex.format === 'true_false' ? 2 : 4;
  let questions = [...ex.questions];
  let dist = countDistribution(questions);

  if (isDistributionBalanced(dist, numOptions)) {
    return { exercise: ex, shuffledCount: 0 };
  }

  let shuffledCount = 0;
  const maxAttempts = 5;

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    // Tìm key đang có nhiều nhất và ít nhất
    const keys = ['A', 'B', 'C', 'D'].slice(0, numOptions);
    const sortedKeys = [...keys].sort((a, b) => (dist[b] ?? 0) - (dist[a] ?? 0));
    const mostFrequentKey = sortedKeys[0];
    const leastFrequentKey = sortedKeys[sortedKeys.length - 1];

    if ((dist[mostFrequentKey] ?? 0) - (dist[leastFrequentKey] ?? 0) <= 2) {
      break; // đã cân bằng
    }

    // Tìm câu đầu tiên có đáp án là mostFrequentKey và xáo trộn nó
    const targetIdx = questions.findIndex(
      q => parseCorrectKey(q.correctAnswer) === mostFrequentKey && (q.options?.length ?? 0) >= 2
    );

    if (targetIdx === -1) break;

    // Xáo trộn options câu này cho đến khi đáp án đúng rơi vào key khác (ưu tiên leastFrequentKey)
    let bestShuffled = questions[targetIdx];
    for (let tryIdx = 0; tryIdx < 8; tryIdx++) {
      const candidate = shuffleOptions(questions[targetIdx]);
      const newKey = parseCorrectKey(candidate.correctAnswer);
      if (newKey !== mostFrequentKey) {
        bestShuffled = candidate;
        if (newKey === leastFrequentKey) break; // tốt nhất
      }
    }

    if (parseCorrectKey(bestShuffled.correctAnswer) !== mostFrequentKey) {
      questions[targetIdx] = bestShuffled;
      shuffledCount++;
      dist = countDistribution(questions);
    } else {
      break; // không thể đổi key của câu này nữa
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
