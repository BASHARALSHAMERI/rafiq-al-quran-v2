export type EvaluationQuestion = {
  id: number;
  orderIndex: number;
  fromSurah: number;
  fromAyah: number;
  toSurah: number;
  toAyah: number;
  prompting: number;
  reminding: number;
  tajweed: number;
  evaluated?: boolean;
};
