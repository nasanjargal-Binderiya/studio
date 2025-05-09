
import { z } from 'zod';

// Define the output schema for the parsed metadata
// Moved from src/ai/flows/parseProblemMetadata.ts
export const ProblemMetadataSchema = z.object({
  title: z.string().optional().describe('The title inferred from the LeetCode problem URL'), // Title is now optional and inferred
  // URL is now required and the primary identifier
  url: z.string().url({ message: "A valid LeetCode problem URL is required." }).describe('The URL of the LeetCode problem'),
  difficulty: z.enum(['Easy', 'Medium', 'Hard']).optional().describe('The difficulty level of the problem'),
  dateSolved: z.string().optional().describe('The date the problem was solved (e.g., MM/DD or MM/DD/YYYY)'),
  rating: z.number().min(1).max(5).optional().describe('The initial review rating (1-5), determining the first interval in days'),
  timeComplexity: z.string().optional().describe('Time complexity analysis (e.g., O(N), O(NlogN))'),
  spaceComplexity: z.string().optional().describe('Space complexity analysis (e.g., O(1), O(N))'),
  algorithm: z.string().optional().describe('The algorithm or approach used'),
  notes: z.string().optional().describe('Any additional notes'),
  code: z.string().optional().describe('The code solution itself'), // Added code field
});


export type ProblemMetadata = z.infer<typeof ProblemMetadataSchema>;

// Constants for SRS algorithm
export const DEFAULT_EASE_FACTOR = 2.5; // Anki default: 250%
export const MIN_EASE_FACTOR = 1.3; // Anki default: 130%
export const AGAIN_INTERVAL = 1; // 1 day (Review tomorrow)
export const AGAIN_EASE_MODIFIER = -0.20; // Decrease ease by 20%
export const HARD_EASE_MODIFIER = -0.15; // Decrease ease by 15%
export const EASY_EASE_MODIFIER = 0.15; // Increase ease by 15%
// Good doesn't change ease factor
export const HARD_INTERVAL_MULTIPLIER = 1.2; // Interval * 1.2 (minimum 1 day)
export const EASY_INTERVAL_BONUS = 1.3; // Interval * Ease * 1.3 (minimum 1 day)

export interface LeetCodeProblem extends ProblemMetadata {
  id: string; // Unique identifier (URL)
  nextReviewDate: number; // Timestamp for next review
  lastReviewedDate?: number; // Timestamp when last marked as reviewed
  // SRS Fields
  interval: number; // Current interval in days (minimum 1)
  easeFactor: number; // Multiplier for interval calculation (starts at DEFAULT_EASE_FACTOR, min MIN_EASE_FACTOR)
  repetitions: number; // Number of successful reviews in a row (resets on "Again")
}

// Type for review performance feedback
export type ReviewPerformance = 'Again' | 'Hard' | 'Good' | 'Easy';
