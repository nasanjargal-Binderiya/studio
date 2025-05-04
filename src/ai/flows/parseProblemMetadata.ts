
'use server';
/**
 * @fileOverview Parses LeetCode problem details from raw text using AI.
 *
 * Exports:
 * - parseProblemMetadata: Async function to parse text and return structured metadata.
 */

import { z } from 'zod';
import { ai } from '../ai-instance';
// Import the schema and type from the types file
import { ProblemMetadataSchema, type ProblemMetadata } from '@/types/problem';

// Define the input schema explicitly for clarity and type safety with ai.defineFlow
const ProblemInputSchema = z.string().describe('Raw text input containing LeetCode problem metadata and solution');


// Define the internal flow using ai.defineFlow
// Note: This flow itself is not exported directly.
const parseProblemMetadataFlow = ai.defineFlow(
  {
    name: 'parseProblemMetadataFlow',
    inputSchema: ProblemInputSchema,
    outputSchema: ProblemMetadataSchema, // Use the imported schema
    description: 'Parses raw text containing LeetCode problem details and extracts structured metadata.'
  },
  async (inputText) => {
    // The prompt now implicitly uses the updated ProblemMetadataSchema (without .url())
    // for its output structure validation by the LLM.
    const prompt = ai.definePrompt({
        name: 'parseProblemMetadataPrompt',
        input: { schema: ProblemInputSchema },
        output: { schema: ProblemMetadataSchema }, // Reference the updated schema
        prompt: `
        Parse the following LeetCode problem information and extract the specified metadata.
        The rating is a number from 1 to 5, often indicated in parentheses like 'Rating: hard(2)' or just '(2)'.
        If the difficulty is mentioned as 'easy', 'medium', or 'hard', use those exact terms, case-insensitive, and map to 'Easy', 'Medium', 'Hard'.
        The date should be extracted if present (e.g., 5/4, 12/25/2023).
        Extract Time Complexity, Space Complexity, Algorithm/Approach used, and any remaining text as notes/solution.
        The URL usually starts with 'https://leetcode.com/problems/'. Extract the full URL if found.
        Infer the title from the URL path if possible by taking the last path segment, otherwise leave it blank.

        Input Text:
        ---
        {{{inputText}}}
        ---

        Extract the following fields according to the provided output schema descriptions. Return the result as JSON.

        Example Input:
        '''
        Time: O(NlogN) cause of sort
        Space(1)
        https://leetcode.com/problems/kth-largest-element-in-an-array
        Algrotihm: brute force (I even solved this question in 10 seconds wtf!)
        Date: 5/4
        Rating: hard(2)
        '''
        class Solution:
            def findKthLargest(self, nums: List[int], k: int) -> int:
                nums.sort()
                return nums[len(nums) - k]

        Example Output (JSON):
        {
          "title": "kth-largest-element-in-an-array",
          "url": "https://leetcode.com/problems/kth-largest-element-in-an-array",
          "timeComplexity": "O(NlogN)",
          "spaceComplexity": "O(1)",
          "algorithm": "brute force",
          "dateSolved": "5/4",
          "rating": 2,
          "difficulty": "Hard",
          "notes": "cause of sort\\n(I even solved this question in 10 seconds wtf!)\\nclass Solution:\\n    def findKthLargest(self, nums: List[int], k: int) -> int:\\n        nums.sort()\\n        return nums[len(nums) - k]"
        }

        Please parse the provided Input Text and return the JSON object. If a field cannot be found or reasonably inferred, omit it or return null/empty string as appropriate for the schema.
        Ensure the rating is extracted as a number between 1 and 5 if mentioned.
        If the difficulty is mentioned (like 'hard' in 'Rating: hard(2)' or standalone like 'Difficulty: Hard'), extract it as 'Easy', 'Medium', or 'Hard'.
        `,
        config: {
            temperature: 0.1, // Lower temperature for more deterministic parsing
        },
    });


    const llmResponse = await prompt(inputText);

    let parsedData = llmResponse.output;

    // Post-processing logic remains largely the same
     if (parsedData) {
       // Infer title from URL if title is missing
       if (!parsedData.title && parsedData.url) {
         try {
           // Basic URL validation can happen here if needed, although Zod's .url() was removed from schema
           const urlObject = new URL(parsedData.url); // Attempt to parse to check validity
           const urlParts = urlObject.pathname.split('/');
           const slug = urlParts.filter(part => part !== '').pop(); // Get last non-empty path segment
           if (slug) {
               // Convert slug to title case
                parsedData.title = slug.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
           }
         } catch (e) {
           console.warn("Could not parse title from potentially invalid URL:", parsedData.url);
           // Optionally clear the URL if it's invalid and causing issues
           // parsedData.url = undefined;
         }
       }

        // Infer difficulty if missing and mentioned in text
         if (!parsedData.difficulty && inputText) {
             const difficultyMatch = inputText.match(/(?:Rating:\s*|Difficulty:\s*)?\b(easy|medium|hard)\b(?:\s*\(\d+\))?/i);
             if (difficultyMatch && difficultyMatch[1]) {
                  const difficultyStr = difficultyMatch[1].toLowerCase();
                  if (difficultyStr === 'easy') parsedData.difficulty = 'Easy';
                  else if (difficultyStr === 'medium') parsedData.difficulty = 'Medium';
                  else if (difficultyStr === 'hard') parsedData.difficulty = 'Hard';
             }
         }
          // Infer rating if missing and mentioned like (3) or Rating: 4
         if (parsedData.rating === undefined && inputText) { // Check for undefined specifically
              const ratingMatch = inputText.match(/(?:Rating:\s*)?\((\d)\)/i) ?? inputText.match(/Rating:\s*(\d)/i);
              if (ratingMatch && ratingMatch[1]) {
                  const ratingVal = parseInt(ratingMatch[1], 10);
                  if (ratingVal >= 1 && ratingVal <= 5) {
                      parsedData.rating = ratingVal;
                  }
              }
         }
      }


    if (!parsedData) {
       throw new Error("Failed to parse metadata from the provided text.");
    }

     // Final validation against the schema before returning (optional but good practice)
     const validationResult = ProblemMetadataSchema.safeParse(parsedData);
     if (!validationResult.success) {
         console.error("Post-processed data failed final Zod validation:", validationResult.error);
         // Depending on strictness, either throw or return potentially partial data
         // For now, let's return what we have, but log the error
         // throw new Error("Parsed data failed final validation.");
     }

    // Return the potentially modified parsedData
    return parsedData;
  },
);

/**
 * Parses raw text containing LeetCode problem details and extracts structured metadata.
 * This is the function that should be imported and called by client components.
 * @param inputText The raw text input.
 * @returns A promise resolving to the parsed ProblemMetadata object.
 */
export async function parseProblemMetadata(inputText: string): Promise<ProblemMetadata> {
    // Call the internal flow function
    return parseProblemMetadataFlow(inputText);
}
