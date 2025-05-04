import { z } from 'zod';

// Define the output schema for the parsed metadata
// Moved from src/ai/flows/parseProblemMetadata.ts
export const ProblemMetadataSchema = z.object({
  title: z.string().optional().describe('The title of the LeetCode problem'),
  url: z.string().url().optional().describe('The URL of the LeetCode problem'),
  difficulty: z.enum(['Easy', 'Medium', 'Hard']).optional().describe('The difficulty level of the problem'),
  dateSolved: z.string().optional().describe('The date the problem was solved (e.g., MM/DD or MM/DD/YYYY)'),
  rating: z.number().min(1).max(5).optional().describe('The review rating (1-5), representing days until next review'),
  timeComplexity: z.string().optional().describe('Time complexity analysis (e.g., O(N), O(NlogN))'),
  spaceComplexity: z.string().optional().describe('Space complexity analysis (e.g., O(1), O(N))'),
  algorithm: z.string().optional().describe('The algorithm or approach used'),
  notes: z.string().optional().describe('Any additional notes or the code solution itself'),
});

export type ProblemMetadata = z.infer<typeof ProblemMetadataSchema>;

export interface LeetCodeProblem extends ProblemMetadata {
  id: string; // Unique identifier (e.g., URL or generated)
  nextReviewDate: number; // Timestamp (Date.now() + rating * days)
  lastReviewedDate?: number; // Timestamp when last marked as reviewed
}
