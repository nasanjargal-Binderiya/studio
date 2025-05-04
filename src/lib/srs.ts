import type { LeetCodeProblem, ReviewPerformance } from '@/types/problem';
import {
    DEFAULT_EASE_FACTOR,
    MIN_EASE_FACTOR,
    AGAIN_INTERVAL,
    AGAIN_EASE_MODIFIER,
    HARD_EASE_MODIFIER,
    EASY_EASE_MODIFIER,
    HARD_INTERVAL_MULTIPLIER,
    EASY_INTERVAL_BONUS,
} from '@/types/problem';

/**
 * Calculates the next review state based on performance.
 * @param problem The current problem state.
 * @param performance The user's recall performance.
 * @returns Partial<LeetCodeProblem> containing updated SRS fields and nextReviewDate.
 */
export function calculateNextReview(
    problem: LeetCodeProblem,
    performance: ReviewPerformance
): Partial<LeetCodeProblem> {
    const now = Date.now();
    let { interval, easeFactor, repetitions } = problem;

    // Ensure valid initial values if somehow missing (though problem-store should handle this)
    interval = interval ?? 1; // Default to 1 day if missing
    easeFactor = easeFactor ?? DEFAULT_EASE_FACTOR;
    repetitions = repetitions ?? 0;

    let nextInterval: number;
    let nextEaseFactor = easeFactor;
    let nextRepetitions = repetitions;

    switch (performance) {
        case 'Again':
            nextInterval = AGAIN_INTERVAL;
            nextEaseFactor = Math.max(MIN_EASE_FACTOR, easeFactor + AGAIN_EASE_MODIFIER);
            nextRepetitions = 0; // Reset repetitions
            break;
        case 'Hard':
            // Calculate interval before modifying ease factor
            nextInterval = Math.max(AGAIN_INTERVAL, Math.round(interval * HARD_INTERVAL_MULTIPLIER));
            // Ensure Hard interval is slightly longer than previous interval if possible, but not shorter than Again
            if (nextInterval <= interval && interval > AGAIN_INTERVAL) {
                nextInterval = interval + 1;
            }
            nextEaseFactor = Math.max(MIN_EASE_FACTOR, easeFactor + HARD_EASE_MODIFIER);
            nextRepetitions += 1;
            break;
        case 'Good':
             // First review is special case
             if (repetitions === 0) {
                 nextInterval = interval; // Use the initial interval set by rating
             } else {
                 nextInterval = Math.max(interval + 1, Math.round(interval * easeFactor));
             }
            // Ease factor remains unchanged for "Good"
            nextRepetitions += 1;
            break;
        case 'Easy':
             // First review is special case
             if (repetitions === 0) {
                // Use initial interval * bonus, ensure it's at least a few days
                nextInterval = Math.max(interval + 2, Math.round(interval * EASY_INTERVAL_BONUS));
             } else {
                nextInterval = Math.max(interval + 1, Math.round(interval * easeFactor * EASY_INTERVAL_BONUS));
             }
            nextEaseFactor = easeFactor + EASY_EASE_MODIFIER; // Increase ease factor
            nextRepetitions += 1;
            break;
        default:
            throw new Error(`Invalid review performance: ${performance}`);
    }

     // Ensure interval is at least 1 day
     nextInterval = Math.max(1, nextInterval);

    const nextReviewDate = now + nextInterval * 24 * 60 * 60 * 1000;

    return {
        interval: nextInterval,
        easeFactor: nextEaseFactor,
        repetitions: nextRepetitions,
        nextReviewDate: nextReviewDate,
        lastReviewedDate: now, // Update last reviewed date
    };
}
