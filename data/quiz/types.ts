/** Shared types for the quiz & millionaire games. */

export type Difficulty = 1 | 2 | 3; // 1 = easy, 2 = medium, 3 = hard

export interface QuizQuestion {
  /** Question text */
  q: string;
  /** Exactly 4 options */
  o: [string, string, string, string];
  /** Index of the correct option (0-3) */
  a: number;
  /** Difficulty 1 (easy) - 3 (hard) */
  d: Difficulty;
}

export interface QuizCategory {
  id: string;
  name: string;
  icon: string;
  /** Optional link to a department id (for department-based quizzes) */
  departmentId?: string;
  questions: QuizQuestion[];
}

export type QuizMode = "department" | "general";
