/* Examples demonstrate scope; they are prompts, never claims of available evidence. */
export const EVERGREEN_SUBJECTS = [
  "the weather in Tuscany in August",
  "silent mechanical keyboards",
  "overnight trains in Japan",
  "growing tomatoes on a balcony",
  "film cameras for beginners",
  "living in Melbourne without a car",
];

export interface NewsSubject {
  subject: string;
  headline: string;
  url: string;
  publishedAt: string;
}

export interface SuggestionsResponse {
  subjects: string[];
  news: NewsSubject[];
  day: string;
  mode: "news-mix" | "evergreen";
}

export function mixSubjects(news: NewsSubject[]): string[] {
  const result: string[] = [];
  const seen = new Set<string>();
  const add = (subject: string | undefined) => {
    const key = subject?.trim().toLowerCase();
    if (subject && key && !seen.has(key)) { seen.add(key); result.push(subject); }
  };
  for (let index = 0; index < EVERGREEN_SUBJECTS.length; index++) {
    add(news[index]?.subject);
    add(EVERGREEN_SUBJECTS[index]);
  }
  return result;
}
