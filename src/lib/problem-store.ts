import type { LeetCodeProblem } from '@/types/problem';

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
      // Ensure dates are numbers (timestamps)
      return problems.map(p => ({
        ...p,
        nextReviewDate: typeof p.nextReviewDate === 'string' ? parseInt(p.nextReviewDate, 10) : p.nextReviewDate,
        lastReviewedDate: p.lastReviewedDate && typeof p.lastReviewedDate === 'string' ? parseInt(p.lastReviewedDate, 10) : p.lastReviewedDate,
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

  if (existingIndex > -1) {
     // Update existing problem instead of adding a duplicate
     problems[existingIndex] = { ...problems[existingIndex], ...problem };
     console.log("Updating existing problem:", problem.title || problem.url);
  } else {
     problems.push(problem);
     console.log("Adding new problem:", problem.title || problem.url);
  }
  saveProblems(problems);
};


export const updateProblem = (updatedProblem: LeetCodeProblem): void => {
  const problems = loadProblems();
  const index = problems.findIndex(p => p.id === updatedProblem.id);
  if (index !== -1) {
    problems[index] = updatedProblem;
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
