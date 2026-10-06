import { QuizCategory, QuizQuestion } from "./types";
import { DEPARTMENT_QUIZZES } from "./departments";
import { DEPARTMENT_QUIZZES_2 } from "./departments2";
import { GENERAL_QUIZZES_1 } from "./general1";
import { GENERAL_QUIZZES_2 } from "./general2";
import { GENERAL_QUIZZES_3 } from "./general3";

/** All department-based categories */
export const departmentCategories: QuizCategory[] = [
  ...DEPARTMENT_QUIZZES,
  ...DEPARTMENT_QUIZZES_2,
];

/** All general knowledge categories */
export const generalCategories: QuizCategory[] = [
  ...GENERAL_QUIZZES_1,
  ...GENERAL_QUIZZES_2,
  ...GENERAL_QUIZZES_3,
];

/** Every category combined */
export const allCategories: QuizCategory[] = [
  ...departmentCategories,
  ...generalCategories,
];

/** Total number of questions available across all banks */
export const totalQuestionCount = allCategories.reduce(
  (sum, cat) => sum + cat.questions.length,
  0
);

/** Fisher-Yates shuffle (returns a new array) */
export function shuffle<T>(array: T[]): T[] {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

/**
 * Picks `count` random questions from a category.
 * If `difficulty` is provided only questions of that difficulty are used.
 */
export function getRandomQuestions(
  category: QuizCategory,
  count: number,
  difficulty?: QuizQuestion["d"]
): QuizQuestion[] {
  const pool = difficulty
    ? category.questions.filter((q) => q.d === difficulty)
    : category.questions;

  if (pool.length === 0) return [];
  return shuffle(pool).slice(0, Math.min(count, pool.length));
}

/**
 * Finds a department category by matching the user's department/faculty name.
 * Falls back to the Computer Science category if nothing matches.
 */
export function findDepartmentCategory(
  departmentName?: string | null,
  facultyName?: string | null
): QuizCategory {
  const query = `${departmentName ?? ""} ${facultyName ?? ""}`.toLowerCase();

  const match = departmentCategories.find((cat) => {
    const haystack = `${cat.name} ${cat.departmentId ?? ""}`.toLowerCase();
    return query.includes(haystack) || haystack.includes(query.split(" ")[0]);
  });

  if (match) return match;

  // Loose keyword matching (e.g. "Computer Engineering" -> Computer Science)
  const keywords: Array<[RegExp, string]> = [
    [/comput|software|ict|tech/i, "cs"],
    [/medic|health|dentist/i, "med"],
    [/law|legal/i, "law"],
    [/business|management|admin/i, "bus"],
    [/engineer/i, "eng"],
    [/account|finance/i, "acc"],
    [/econom/i, "econ"],
    [/nurs/i, "nur"],
    [/pharm/i, "pharm"],
    [/mass|communic|journal/i, "mass"],
    [/psych/i, "psych"],
    [/educ|teach/i, "edu"],
  ];

  for (const [regex, id] of keywords) {
    if (regex.test(query)) {
      const found = departmentCategories.find((cat) => cat.departmentId === id);
      if (found) return found;
    }
  }

  return departmentCategories[0];
}
