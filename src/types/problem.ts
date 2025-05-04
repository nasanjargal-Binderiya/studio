// Matches the Zod schema defined in the Genkit flow
export interface ProblemMetadata {
  title?: string;
  url?: string;
  difficulty?: 'Easy' | 'Medium' | 'Hard';
  dateSolved?: string; // Store as string for simplicity, parse when needed
  rating?: number; // 1-5 days until review
  timeComplexity?: string;
  spaceComplexity?: string;
  algorithm?: string;
  notes?: string;
}

export interface LeetCodeProblem extends ProblemMetadata {
  id: string; // Unique identifier (e.g., generated timestamp or hash)
  nextReviewDate: number; // Timestamp (Date.now() + rating * days)
  lastReviewedDate?: number; // Timestamp when last marked as reviewed
}
