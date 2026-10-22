export type CefrLevel = 
  | 'Pre-A1'
  | 'A1'
  | 'A1+'
  | 'A2'
  | 'A2+'
  | 'B1'
  | 'B1+'
  | 'B2'
  | 'B2+'
  | 'C1'
  | 'C1+'
  | 'C2';

export const CEFR_LEVELS: CefrLevel[] = [
  'Pre-A1',
  'A1',
  'A1+',
  'A2',
  'A2+',
  'B1',
  'B1+',
  'B2',
  'B2+',
  'C1',
  'C1+',
  'C2',
];

export type CognitiveLevel = 'Nhận biết' | 'Thông hiểu' | 'Vận dụng' | 'Vận dụng cao';

export type ExerciseFormat = 
  | 'mcq_4'       // Trắc nghiệm 4 phương án (A, B, C, D)
  | 'mcq_3'       // Trắc nghiệm 3 phương án (A, B, C)
  | 'true_false'   // Trắc nghiệm True / False
  | 'open_ended';  // Tự luận (Điền khuyết / Viết câu)

export const FORMAT_LABELS: Record<ExerciseFormat, string> = {
  mcq_4: 'Trắc nghiệm 4 phương án (A, B, C, D)',
  mcq_3: 'Trắc nghiệm 3 phương án (A, B, C)',
  true_false: 'Trắc nghiệm True / False',
  open_ended: 'Tự luận (Điền khuyết / Viết câu)',
};

export interface ExerciseParameter {
  id: string;
  order: number;
  exerciseType: string; // Khung cho người dùng tự gõ vào
  format: ExerciseFormat; // Trắc nghiệm 3, 4, True/False, Tự luận
  questionCount: number;
  cognitiveLevel: CognitiveLevel;
  cefrLevel: CefrLevel;
  focus: string;
  customNotes: string;
}

export interface QuestionItem {
  id: string;
  number: number;
  prompt: string;
  options?: { key: string; text: string }[];
  correctAnswer: string;
  explanation: string;
  cognitiveTag?: CognitiveLevel;
}

export interface ExerciseResult {
  id: string;
  order: number;
  title: string;
  exerciseType: string;
  format: ExerciseFormat;
  cefrLevel: CefrLevel;
  cognitiveLevel: CognitiveLevel;
  focus: string;
  instruction: string;
  readingPassage?: string;
  audioScript?: string;
  questions: QuestionItem[];
}

export interface ExtractedMaterial {
  title: string;
  summary: string;
  cefrRecommended: CefrLevel;
  vocabulary: {
    term: string;
    partOfSpeech: string;
    definition: string;
    example: string;
  }[];
  grammarPoints: {
    topic: string;
    formula?: string;
    rule: string;
    examples: string[];
  }[];
  suggestedFocusTopics: string[];
  _rawDocxText?: string;
}

export interface ExamHeaderInfo {
  schoolName: string;
  subject: string;
  testTitle: string;
  gradeOrClass: string;
  durationMinutes: number;
  academicYear: string;
  teacherName: string;
}

export interface SavedExam {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  rawText: string;
  extractedMaterial: ExtractedMaterial | null;
  parameters: ExerciseParameter[];
  exercises: ExerciseResult[];
  totalQuestions: number;
  cefrLevels: CefrLevel[];
}
