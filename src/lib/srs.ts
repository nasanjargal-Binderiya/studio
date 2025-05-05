
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
    interval = typeof interval === 'number' && interval > 0 ? interval : 1; // Ensure interval is positive
    easeFactor = typeof easeFactor === 'number' && easeFactor >= MIN_EASE_FACTOR ? easeFactor : DEFAULT_EASE_FACTOR;
    repetitions = typeof repetitions === 'number' && repetitions >= 0 ? repetitions : 0;

    let nextInterval: number;
    let nextEaseFactor = easeFactor; // Start with current ease factor
    let nextRepetitions = repetitions;

    switch (performance) {
        case 'Again':
            nextInterval = AGAIN_INTERVAL;
            // Decrease ease factor, but not below minimum
            nextEaseFactor = Math.max(MIN_EASE_FACTOR, easeFactor + AGAIN_EASE_MODIFIER);
            nextRepetitions = 0; // Reset repetitions count
            break;
        case 'Hard':
            // Calculate interval based on current interval and multiplier
            nextInterval = Math.round(interval * HARD_INTERVAL_MULTIPLIER);
            // Ensure Hard interval is at least slightly longer than previous, but not shorter than Again
            if (nextInterval <= interval) {
                nextInterval = interval + 1; // Ensure it grows by at least 1 day
            }
             nextInterval = Math.max(AGAIN_INTERVAL, nextInterval); // Must be at least 'Again' interval

            // Decrease ease factor, but not below minimum
            nextEaseFactor = Math.max(MIN_EASE_FACTOR, easeFactor + HARD_EASE_MODIFIER);
            nextRepetitions += 1; // Increment repetitions
            break;
        case 'Good':
             // First successful review uses the initial interval from rating or default
             if (repetitions === 0) {
                 nextInterval = interval; // Use the interval set during creation
             } else {
                 // Subsequent reviews multiply by ease factor
                 nextInterval = Math.round(interval * easeFactor);
             }
            // Ensure interval increases by at least 1 day after the first review
            if (repetitions > 0 && nextInterval <= interval) {
                nextInterval = interval + 1;
            }
            nextInterval = Math.max(AGAIN_INTERVAL, nextInterval); // Must be at least 'Again' interval

            // Ease factor remains unchanged for "Good"
            nextRepetitions += 1; // Increment repetitions
            break;
        case 'Easy':
             // First successful review uses initial interval times bonus
             if (repetitions === 0) {
                 nextInterval = Math.round(interval * EASY_INTERVAL_BONUS);
             } else {
                 // Subsequent easy reviews multiply by ease factor and bonus
                 nextInterval = Math.round(interval * easeFactor * EASY_INTERVAL_BONUS);
             }
             // Ensure interval increases by at least 1 day
            if (nextInterval <= interval) {
                 nextInterval = interval + 1;
            }
            nextInterval = Math.max(AGAIN_INTERVAL, nextInterval); // Must be at least 'Again' interval

            // Increase ease factor
            nextEaseFactor = easeFactor + EASY_EASE_MODIFIER;
            nextRepetitions += 1; // Increment repetitions
            break;
        default:
            // Should not happen with TypeScript, but defensively handle it
            console.error(`Invalid review performance: ${performance}`);
            // Keep current state as fallback
            nextInterval = interval;
            nextEaseFactor = easeFactor;
            nextRepetitions = repetitions;
            break; // Exit switch
    }

     // Ensure interval is at least 1 day after all calculations
     nextInterval = Math.max(1, nextInterval);

    // Calculate the absolute timestamp for the next review
    // Use Math.ceil to ensure it's always at least the full interval duration away
    const nextReviewTimestamp = now + Math.ceil(nextInterval) * 24 * 60 * 60 * 1000;

    console.log(`Review Performance: ${performance}`);
    console.log(`Previous State: interval=${interval}, easeFactor=${easeFactor}, repetitions=${repetitions}`);
    console.log(`Next State: interval=${nextInterval}, easeFactor=${nextEaseFactor}, repetitions=${nextRepetitions}`);
    console.log(`Next Review Date: ${new Date(nextReviewTimestamp).toLocaleDateString()}`);


    return {
        interval: nextInterval,
        easeFactor: nextEaseFactor, // Return the updated ease factor
        repetitions: nextRepetitions,
        nextReviewDate: nextReviewTimestamp, // Use the calculated timestamp
        lastReviewedDate: now, // Update last reviewed date to current time
    };
}
