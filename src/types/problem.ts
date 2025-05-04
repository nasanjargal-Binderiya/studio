
import { z } from 'zod';

// Define the output schema for the parsed metadata
// Moved from src/ai/flows/parseProblemMetadata.ts
export const ProblemMetadataSchema = z.object({
  title: z.string().optional().describe('The title of the LeetCode problem'),
  // Removed .url() as it's not supported by the LLM's schema enforcement
  url: z.string().optional().describe('The URL of the LeetCode problem'),
  difficulty: z.enum(['Easy', 'Medium', 'Hard']).optional().describe('The difficulty level of the problem'),
  dateSolved: z.string().optional().describe('The date the problem was solved (e.g., MM/DD or MM/DD/YYYY)'),
  rating: z.number().min(1).max(5).optional().describe('The initial review rating (1-5), determining the first interval in days'),
  timeComplexity: z.string().optional().describe('Time complexity analysis (e.g., O(N), O(NlogN))'),
  spaceComplexity: z.string().optional().describe('Space complexity analysis (e.g., O(1), O(N))'),
  algorithm: z.string().optional().describe('The algorithm or approach used'),
  notes: z.string().optional().describe('Any additional notes or the code solution itself'),
});

export type ProblemMetadata = z.infer<typeof ProblemMetadataSchema>;

// Constants for SRS algorithm
export const DEFAULT_EASE_FACTOR = 2.5; // Anki default: 250%
export const MIN_EASE_FACTOR = 1.3; // Anki default: 130%
export const AGAIN_INTERVAL = 1; // 1 day
export const AGAIN_EASE_MODIFIER = -0.20;
export const HARD_EASE_MODIFIER = -0.15;
export const EASY_EASE_MODIFIER = 0.15;
export const HARD_INTERVAL_MULTIPLIER = 1.2; // Multiplier for "Hard" button
export const EASY_INTERVAL_BONUS = 1.3; // Multiplier for "Easy" button interval

export interface LeetCodeProblem extends ProblemMetadata {
  id: string; // Unique identifier (e.g., URL or generated)
  nextReviewDate: number; // Timestamp for next review
  lastReviewedDate?: number; // Timestamp when last marked as reviewed
  // SRS Fields
  interval: number; // Current interval in days
  easeFactor: number; // Multiplier for interval calculation (starts at DEFAULT_EASE_FACTOR)
  repetitions: number; // Number of successful reviews in a row (resets on "Again")
}

// Type for review performance feedback
export type ReviewPerformance = 'Again' | 'Hard' | 'Good' | 'Easy';

