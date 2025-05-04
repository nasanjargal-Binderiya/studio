import {defineFlow} from 'genkit';
import {z} from 'zod';
import {ai} from '../ai-instance';

// Define the output schema for the parsed metadata
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

export const parseProblemMetadataFlow = defineFlow(
  {
    name: 'parseProblemMetadataFlow',
    inputSchema: z.string().describe('Raw text input containing LeetCode problem metadata and solution'),
    outputSchema: ProblemMetadataSchema,
    // Add description for better context
    description: 'Parses raw text containing LeetCode problem details and extracts structured metadata.'
  },
  async (inputText) => {
    const prompt = `
Parse the following LeetCode problem information and extract the specified metadata.
The rating is a number from 1 to 5, often indicated in parentheses like 'Rating: hard(2)' or just '(2)'.
If the difficulty is mentioned as 'easy', 'medium', or 'hard', use those exact terms, case-insensitive, and map to 'Easy', 'Medium', 'Hard'.
The date should be extracted if present (e.g., 5/4, 12/25/2023).
Extract Time Complexity, Space Complexity, Algorithm/Approach used, and any remaining text as notes/solution.
The URL usually starts with 'https://leetcode.com/problems/'.
Infer the title from the URL if possible, otherwise leave it blank.

Input Text:
---
${inputText}
---

Extract the following fields in JSON format:
- title (string, optional): Problem title
- url (string, optional, valid URL format): LeetCode problem URL
- difficulty (enum['Easy', 'Medium', 'Hard'], optional): Difficulty level
- dateSolved (string, optional): Date solved
- rating (number, 1-5, optional): Review rating (days until review)
- timeComplexity (string, optional): Time complexity
- spaceComplexity (string, optional): Space complexity
- algorithm (string, optional): Algorithm/Approach
- notes (string, optional): Remaining text/code/notes

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
  "notes": "cause of sort\n(I even solved this question in 10 seconds wtf!)\nclass Solution:\n    def findKthLargest(self, nums: List[int], k: int) -> int:\n        nums.sort()\n        return nums[len(nums) - k]"
}

Please parse the provided Input Text and return the JSON object. If a field cannot be found or reasonably inferred, omit it or set it to null.
Ensure the rating is extracted as a number between 1 and 5.
If the difficulty is mentioned (like 'hard' in 'Rating: hard(2)'), use it.
`;

    const llmResponse = await ai().generate({
      prompt: prompt,
      model: 'googleai/gemini-2.0-flash', // Specify the model if not default
      output: {
        format: 'json',
        schema: ProblemMetadataSchema,
      },
      config: {
        temperature: 0.1, // Lower temperature for more deterministic parsing
      },
    });

    const parsedData = llmResponse.output();

    // Attempt to extract title from URL if not explicitly found
    if (parsedData && !parsedData.title && parsedData.url) {
      try {
        const urlParts = parsedData.url.split('/');
        const slug = urlParts.filter(part => part !== '').pop();
        if (slug) {
          parsedData.title = slug.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
        }
      } catch (e) {
        // Ignore URL parsing errors
        console.warn("Could not parse title from URL:", parsedData.url);
      }
    }


    // Try to parse difficulty from text like "Rating: hard(2)"
     if (parsedData && !parsedData.difficulty && inputText) {
        const difficultyMatch = inputText.match(/Rating:\s*(easy|medium|hard)\s*\(\d+\)/i);
        if (difficultyMatch && difficultyMatch[1]) {
             const difficultyStr = difficultyMatch[1].toLowerCase();
             if (difficultyStr === 'easy') parsedData.difficulty = 'Easy';
             else if (difficultyStr === 'medium') parsedData.difficulty = 'Medium';
             else if (difficultyStr === 'hard') parsedData.difficulty = 'Hard';
        }
     }


    if (!parsedData) {
       throw new Error("Failed to parse metadata from the provided text.");
    }


    return parsedData;
  },
);
