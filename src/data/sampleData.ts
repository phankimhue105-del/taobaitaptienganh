import { ExerciseParameter } from '../types';

export const SAMPLE_MATERIALS = [
  {
    id: 'sample-1',
    name: 'Unit 4: For a Better Community (Tiếng Anh 10)',
    level: 'B1',
    rawText: `Unit 4: For a Better Community - Vocabulary & Grammar
Vocabulary:
- volunteer (v, n): to offer to do something without being forced or paid / tình nguyện viên
- community service (n): work that people do to help others without payment / dịch vụ cộng đồng
- donate (v): to give money, food, or clothes to help a person or organization / quyên góp
- generous (adj): willing to give more money, time, etc., than is expected / hào phóng
- disadvantaged (adj): not having the standard of living or advantages that other people have / có hoàn cảnh khó khăn
- non-governmental organization (NGO) (n): tổ chức phi chính phủ
- benefit (v, n): an advantage that something gives you / lợi ích

Grammar Focus:
- Past Simple vs Past Continuous with WHEN and WHILE:
  + While S + was/were + V-ing, S + was/were + V-ing (hành động song song diễn ra trong quá khứ)
  + When S + V2/ed, S + was/were + V-ing (hành động đang diễn ra thì hành động khác cắt ngang)
  + S + was/were + V-ing when S + V2/ed
- Adjectives ending in -ed and -ing (interested / interesting, excited / exciting, bored / boring).`,
    suggestedParams: [
      {
        id: 'param-1',
        order: 1,
        exerciseType: 'Multiple Choice',
        format: 'mcq_4',
        questionCount: 5,
        cognitiveLevel: 'Thông hiểu',
        cefrLevel: 'B1',
        focus: 'Past Simple vs Past Continuous with When/While & Vocabulary Unit 4',
        customNotes: 'Đặt các câu hỏi ngữ cảnh hoạt động tình nguyện giúp đỡ trẻ em nghèo.',
      },
      {
        id: 'param-2',
        order: 2,
        exerciseType: 'Word Formation',
        format: 'open_ended',
        questionCount: 5,
        cognitiveLevel: 'Vận dụng',
        cefrLevel: 'B1',
        focus: 'Word formation (-ed / -ing adjectives, noun/verb forms of donate, volunteer)',
        customNotes: 'Tập trung vào phân biệt tính từ chỉ cảm xúc (-ed) và tính chất (-ing).',
      },
    ] as ExerciseParameter[],
  },
  {
    id: 'sample-2',
    name: 'Environmental Protection & Green Living (CEFR B2)',
    level: 'B2',
    rawText: `Topic: Environmental Protection & Sustainable Living
Key Vocabulary:
- carbon footprint (n): the amount of carbon dioxide released into the atmosphere as a result of the activities of a particular individual or organization
- biodiversity (n): the variety of plant and animal life in a particular habitat
- renewable energy (n): energy from a source that is not depleted when used, such as wind or solar power
- deplete (v): to reduce the amount of something so that there is not much left
- ecosystem (n): all the living things in an area and the way they affect each other and the environment
- sustainable (adj): causing little or no damage to the environment and therefore able to continue for a long time
- single-use plastics (n): disposable plastics designed for one-time use

Grammar:
- Passive Voice with modal verbs (must be protected, should be reduced, can be recycled)
- Conditional Sentences Type 2 & 3 / Mixed Conditionals for environmental consequences.`,
    suggestedParams: [
      {
        id: 'param-b2-1',
        order: 1,
        exerciseType: 'Error Identification',
        format: 'mcq_4',
        questionCount: 5,
        cognitiveLevel: 'Vận dụng cao',
        cefrLevel: 'B2',
        focus: 'Conditionals Type 2 & 3, Passive modals in environmental issues',
        customNotes: 'Gạch chân 4 phương án A, B, C, D để học sinh tìm lỗi sai ngữ pháp tinh tế.',
      },
      {
        id: 'param-b2-2',
        order: 2,
        exerciseType: 'Sentence Transformation',
        format: 'open_ended',
        questionCount: 5,
        cognitiveLevel: 'Vận dụng cao',
        cefrLevel: 'B2',
        focus: 'Rewriting sentences using Inversion, Mixed Conditionals, or Passive voice',
        customNotes: 'Cung cấp từ gợi ý trong ngoặc (VD: HAD, UNLESS, SHOULD).',
      },
    ] as ExerciseParameter[],
  },
  {
    id: 'sample-3',
    name: 'Daily Routines & Hobbies (CEFR A1 - A2 Starter)',
    level: 'A2',
    rawText: `Theme: Everyday Life and Leisure
Vocabulary:
- get up, take a shower, have breakfast, catch the bus, surf the internet
- leisure activities: play badminton, hang out with friends, read comics, listen to music
- frequency adverbs: always, usually, often, sometimes, rarely, never

Grammar:
- Present Simple tense (affirmative, negative, questions)
- Third-person singular -s/-es rules (e.g. washes, watches, goes, plays, studies)
- Adverbs of frequency position (before main verb, after verb 'to be').`,
    suggestedParams: [
      {
        id: 'param-a2-1',
        order: 1,
        exerciseType: 'Multiple Choice',
        format: 'mcq_3',
        questionCount: 5,
        cognitiveLevel: 'Nhận biết',
        cefrLevel: 'A2',
        focus: 'Present simple third person -s/-es and adverbs of frequency',
        customNotes: 'Câu ngắn gọn, 3 phương án lựa chọn thân thiện với học sinh lớp 6.',
      },
      {
        id: 'param-a2-2',
        order: 2,
        exerciseType: 'Fill in the blanks',
        format: 'open_ended',
        questionCount: 5,
        cognitiveLevel: 'Thông hiểu',
        cefrLevel: 'A2',
        focus: 'Correct verb form in Present Simple',
        customNotes: 'Cho động từ nguyên mẫu trong ngoặc đơn ở mỗi câu.',
      },
    ] as ExerciseParameter[],
  },
];
