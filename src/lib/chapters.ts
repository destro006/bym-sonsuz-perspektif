import chapters from '../../data/chapters.json';
export type Chapter = (typeof chapters)[number];
export const CHAPTERS = chapters;
export function chapterAt(progress: number) {
  return CHAPTERS.findIndex((chapter, index) => progress >= chapter.start && (progress < chapter.end || index === CHAPTERS.length - 1));
}
