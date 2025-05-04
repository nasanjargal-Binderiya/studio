import type { LeetCodeProblem } from '@/types/problem';
import { DEFAULT_EASE_FACTOR } from '@/types/problem'; // Import default ease factor

const STORAGE_KEY = 'leetReviewProblems';

// Helper function to safely interact with localStorage
const safeLocalStorage = {
  getItem: (key: string): string | null => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem(key);
    }
    return null;
  },
  setItem: (key: string, value: string): void => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(key, value);
    }
  },
  removeItem: (key: string): void => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(key);
    }
  },
};

export const loadProblems = (): LeetCodeProblem[] => {
  const storedProblems = safeLocalStorage.getItem(STORAGE_KEY);
  if (storedProblems) {
    try {
      const problems: LeetCodeProblem[] = JSON.parse(storedProblems);
      // Ensure dates are numbers (timestamps) and SRS fields have defaults
      return problems.map(p => ({
        ...p,
        nextReviewDate: typeof p.nextReviewDate === 'string' ? parseInt(p.nextReviewDate, 10) : p.nextReviewDate,
        lastReviewedDate: p.lastReviewedDate && typeof p.lastReviewedDate === 'string' ? parseInt(p.lastReviewedDate, 10) : p.lastReviewedDate,
        // Add defaults for SRS fields if they are missing (for backward compatibility)
        interval: typeof p.interval === 'number' ? p.interval : (p.rating ?? 1), // Use rating for initial interval if interval is missing
        easeFactor: typeof p.easeFactor === 'number' ? p.easeFactor : DEFAULT_EASE_FACTOR,
        repetitions: typeof p.repetitions === 'number' ? p.repetitions : 0,
      })).filter(p => typeof p.nextReviewDate === 'number' && !isNaN(p.nextReviewDate)); // Filter out invalid entries
    } catch (e) {
      console.error('Failed to parse problems from localStorage:', e);
      safeLocalStorage.removeItem(STORAGE_KEY); // Clear corrupted data
      return [];
    }
  }
  return [];
};

export const saveProblems = (problems: LeetCodeProblem[]): void => {
  try {
    safeLocalStorage.setItem(STORAGE_KEY, JSON.stringify(problems));
  } catch (e) {
    console.error('Failed to save problems to localStorage:', e);
    // Handle potential storage quota errors if necessary
  }
};

export const addProblem = (problem: LeetCodeProblem): void => {
  const problems = loadProblems();
  // Prevent duplicates based on URL if available, otherwise title+notes might work
  const existingIndex = problem.url
    ? problems.findIndex(p => p.url === problem.url)
    : problems.findIndex(p => p.title === problem.title && p.notes === problem.notes); // Less reliable fallback

  // Ensure new problems have SRS defaults set correctly
  const problemWithDefaults: LeetCodeProblem = {
      ...problem,
      interval: problem.interval ?? (problem.rating ?? 1), // Use rating for initial interval if not set
      easeFactor: problem.easeFactor ?? DEFAULT_EASE_FACTOR,
      repetitions: problem.repetitions ?? 0,
      // Rating might not be needed on the final object unless used elsewhere
      // rating: problem.rating, // Keep if needed, otherwise can be removed after setting initial interval
  };


  if (existingIndex > -1) {
     // Update existing problem instead of adding a duplicate
     // Merge carefully, keeping existing SRS state unless explicitly overwritten
     // For now, let's assume adding always overwrites/resets SRS state for simplicity
     // A more robust merge might be needed depending on desired behavior
     problems[existingIndex] = { ...problems[existingIndex], ...problemWithDefaults };
     console.log("Updating existing problem:", problemWithDefaults.title || problemWithDefaults.url);
  } else {
     problems.push(problemWithDefaults);
     console.log("Adding new problem:", problemWithDefaults.title || problemWithDefaults.url);
  }
  saveProblems(problems);
};


export const updateProblem = (updatedProblem: LeetCodeProblem): void => {
  const problems = loadProblems();
  const index = problems.findIndex(p => p.id === updatedProblem.id);
  if (index !== -1) {
    // Ensure the updated problem also has default SRS fields if somehow missing
    problems[index] = {
        ...problems[index], // Keep existing fields
        ...updatedProblem, // Overwrite with new data
        interval: updatedProblem.interval ?? problems[index].interval ?? 1,
        easeFactor: updatedProblem.easeFactor ?? problems[index].easeFactor ?? DEFAULT_EASE_FACTOR,
        repetitions: updatedProblem.repetitions ?? problems[index].repetitions ?? 0,
    };
    saveProblems(problems);
  } else {
     console.warn(`Problem with ID ${updatedProblem.id} not found for update.`);
     // Optionally add it if not found, or throw an error
     // addProblem(updatedProblem);
  }
};

export const deleteProblem = (id: string): void => {
  const problems = loadProblems();
  const filteredProblems = problems.filter(p => p.id !== id);
  saveProblems(filteredProblems);
};

export const getProblemById = (id: string): LeetCodeProblem | undefined => {
    const problems = loadProblems();
    return problems.find(p => p.id === id);
};

// Function to dispatch event after adding/updating/deleting problem
// Ensures client-side components can react to store changes
export const triggerProblemUpdateEvent = () => {
    if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('problemUpdated'));
    }
};
