/**
 * EduGenius Storage & Client Caching Engine
 * Quản lý bộ nhớ đệm và lưu trữ cục bộ (localStorage) nhằm tối ưu chi phí 0đ:
 * 1. Tái sử dụng kết quả phân tích tài liệu khi nội dung không đổi (0 lượt gọi AI).
 * 2. Tái sử dụng bài tập đã sinh nếu cùng tham số kỹ thuật (0 lượt gọi AI).
 * 3. Cho phép giáo viên lưu, mở lại, xuất file JSON bài thi đã tạo (0 lượt gọi AI).
 */

import { ExtractedMaterial, ExerciseResult, ExerciseParameter, SavedExam } from '../types';

const STORAGE_KEYS = {
  MATERIAL_CACHE: 'edugenius_material_cache_v2',
  EXERCISE_CACHE: 'edugenius_exercise_cache_v2',
  SAVED_EXAMS: 'edugenius_saved_exams_v1',
};

function getStorage(): Storage | null {
  if (typeof window !== 'undefined' && window.localStorage) {
    return window.localStorage;
  }
  if (typeof globalThis !== 'undefined' && (globalThis as any).localStorage) {
    return (globalThis as any).localStorage;
  }
  return null;
}

// Hàm băm đơn giản tạo chữ ký ngắn gọn cho chuỗi
export function computeStringHash(str: string): string {
  let hash = 0;
  const normalized = str.trim().replace(/\s+/g, ' ');
  for (let i = 0; i < normalized.length; i++) {
    const char = normalized.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0; // Convert to 32bit integer
  }
  return `h_${Math.abs(hash)}_${normalized.length}`;
}

// ----------------------------------------------------
// 1. Quản lý Cache Phân tích Ngữ liệu (Material Analysis Cache)
// ----------------------------------------------------

export function getCachedMaterial(signature: string): ExtractedMaterial | null {
  const storage = getStorage();
  if (!storage) return null;
  try {
    const raw = storage.getItem(STORAGE_KEYS.MATERIAL_CACHE);
    if (!raw) return null;
    const store = JSON.parse(raw);
    return store[signature] || null;
  } catch (err) {
    console.warn('Lỗi đọc Material Cache:', err);
    return null;
  }
}

export function setCachedMaterial(signature: string, data: ExtractedMaterial): void {
  const storage = getStorage();
  if (!storage) return;
  try {
    const raw = storage.getItem(STORAGE_KEYS.MATERIAL_CACHE);
    const store = raw ? JSON.parse(raw) : {};
    store[signature] = data;

    // Giới hạn tối đa 30 mục gần nhất để tránh tràn localStorage
    const keys = Object.keys(store);
    if (keys.length > 30) {
      delete store[keys[0]];
    }
    storage.setItem(STORAGE_KEYS.MATERIAL_CACHE, JSON.stringify(store));
  } catch (err) {
    console.warn('Lỗi ghi Material Cache:', err);
  }
}

// ----------------------------------------------------
// 2. Quản lý Cache Bài tập đã sinh (Exercise Generation Cache)
// ----------------------------------------------------

export function computeExerciseSignature(
  materialSignature: string,
  parameters: ExerciseParameter[]
): string {
  const paramsSig = parameters
    .map((p) => `${p.order}_${p.exerciseType}_${p.format}_${p.questionCount}_${p.cognitiveLevel}_${p.cefrLevel}_${p.focus}`)
    .join('|');
  return `ex_${computeStringHash(materialSignature + '__' + paramsSig)}`;
}

export function getCachedExercises(signature: string): ExerciseResult[] | null {
  const storage = getStorage();
  if (!storage) return null;
  try {
    const raw = storage.getItem(STORAGE_KEYS.EXERCISE_CACHE);
    if (!raw) return null;
    const store = JSON.parse(raw);
    return store[signature] || null;
  } catch (err) {
    console.warn('Lỗi đọc Exercise Cache:', err);
    return null;
  }
}

export function setCachedExercises(signature: string, exercises: ExerciseResult[]): void {
  const storage = getStorage();
  if (!storage) return;
  try {
    const raw = storage.getItem(STORAGE_KEYS.EXERCISE_CACHE);
    const store = raw ? JSON.parse(raw) : {};
    store[signature] = exercises;

    const keys = Object.keys(store);
    if (keys.length > 20) {
      delete store[keys[0]];
    }
    storage.setItem(STORAGE_KEYS.EXERCISE_CACHE, JSON.stringify(store));
  } catch (err) {
    console.warn('Lỗi ghi Exercise Cache:', err);
  }
}

// ----------------------------------------------------
// 3. Quản lý Danh sách Đề thi đã lưu (Saved Exams Management)
// ----------------------------------------------------

export function getSavedExams(): SavedExam[] {
  const storage = getStorage();
  if (!storage) return [];
  try {
    const raw = storage.getItem(STORAGE_KEYS.SAVED_EXAMS);
    if (!raw) return [];
    const list: SavedExam[] = JSON.parse(raw);
    return Array.isArray(list) ? list : [];
  } catch (err) {
    console.warn('Lỗi đọc Saved Exams:', err);
    return [];
  }
}

export function saveExamToStorage(params: {
  title?: string;
  rawText: string;
  extractedMaterial: ExtractedMaterial | null;
  parameters: ExerciseParameter[];
  exercises: ExerciseResult[];
}): SavedExam {
  const storage = getStorage();
  const list = getSavedExams();
  const now = new Date().toISOString();
  const totalQuestions = params.exercises.reduce((acc, ex) => acc + (ex.questions?.length || 0), 0);
  const cefrLevels = Array.from(new Set(params.exercises.map((e) => e.cefrLevel)));

  const defaultTitle =
    params.title ||
    params.extractedMaterial?.title ||
    params.exercises[0]?.title ||
    `Bài thi Tiếng Anh (${new Date().toLocaleDateString('vi-VN')})`;

  const newExam: SavedExam = {
    id: `exam-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    title: defaultTitle,
    createdAt: now,
    updatedAt: now,
    rawText: params.rawText,
    extractedMaterial: params.extractedMaterial,
    parameters: params.parameters,
    exercises: params.exercises,
    totalQuestions,
    cefrLevels,
  };

  list.unshift(newExam); // Đưa lên đầu danh sách
  // Lưu tối đa 50 bài thi
  if (list.length > 50) {
    list.pop();
  }
  if (storage) {
    storage.setItem(STORAGE_KEYS.SAVED_EXAMS, JSON.stringify(list));
  }
  return newExam;
}

export function deleteSavedExam(id: string): void {
  const storage = getStorage();
  const list = getSavedExams().filter((item) => item.id !== id);
  if (storage) {
    storage.setItem(STORAGE_KEYS.SAVED_EXAMS, JSON.stringify(list));
  }
}

export function exportExamToJsonFile(exam: SavedExam): void {
  const jsonStr = JSON.stringify(exam, null, 2);
  const blob = new Blob([jsonStr], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  const safeTitle = (exam.title || 'EduGenius_Exam').replace(/[^a-zA-Z0-9_\u00C0-\u024F\u1E00-\u1EFF]/g, '_');
  a.href = url;
  a.download = `${safeTitle}.edugenius.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export async function importExamFromJsonFile(file: File): Promise<SavedExam> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const text = reader.result as string;
        const parsed = JSON.parse(text);
        if (!parsed.exercises || !Array.isArray(parsed.exercises)) {
          throw new Error('Tệp không đúng định dạng đề thi EduGenius hợp lệ (thiếu exercises).');
        }

        const importedExam: SavedExam = {
          id: `exam-imported-${Date.now()}`,
          title: parsed.title || file.name.replace(/\.edugenius\.json$/i, ''),
          createdAt: parsed.createdAt || new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          rawText: parsed.rawText || '',
          extractedMaterial: parsed.extractedMaterial || null,
          parameters: parsed.parameters || [],
          exercises: parsed.exercises,
          totalQuestions: parsed.exercises.reduce((acc: number, ex: any) => acc + (ex.questions?.length || 0), 0),
          cefrLevels: Array.from(new Set(parsed.exercises.map((e: any) => e.cefrLevel))),
        };

        // Lưu vào danh sách đề hiện tại
        const list = getSavedExams();
        list.unshift(importedExam);
        localStorage.setItem(STORAGE_KEYS.SAVED_EXAMS, JSON.stringify(list));

        resolve(importedExam);
      } catch (err: any) {
        reject(new Error(err.message || 'Không thể đọc tệp đề thi JSON.'));
      }
    };
    reader.onerror = () => reject(new Error('Lỗi khi đọc tệp.'));
    reader.readAsText(file);
  });
}
