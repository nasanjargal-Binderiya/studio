
"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
// Removed Card imports as it's now in a Dialog
import { useToast } from "@/hooks/use-toast";
import { addProblem, triggerProblemUpdateEvent } from '@/lib/problem-store';
import type { LeetCodeProblem, ProblemMetadata } from '@/types/problem';
import { DEFAULT_EASE_FACTOR, AGAIN_INTERVAL } from '@/types/problem'; // Import constants
import { Loader2 } from "lucide-react";
import { DialogFooter, DialogClose } from "@/components/ui/dialog"; // Import DialogFooter and DialogClose

// Define the schema for the individual input fields
// Removed title field and updated refine validation
const formSchema = z.object({
  // title: z.string().optional(), // REMOVED TITLE
  url: z.string().url({ message: "Please enter a valid LeetCode problem URL." }), // Make URL required and validated
  difficulty: z.enum(['Easy', 'Medium', 'Hard']).optional(),
  dateSolved: z.string().optional(), // Using string for input type="date"
  // Rating description updated
  rating: z.coerce.number().min(1).max(5).optional().describe('Initial recall difficulty (1: Hardest, 5: Easiest)'),
  timeComplexity: z.string().optional(),
  spaceComplexity: z.string().optional(),
  algorithm: z.string().optional(),
  notes: z.string().optional(),
  code: z.string().min(1, { message: "Code solution is required." }), // Make code required
}); // Removed refine for title/url combo

// Add onSuccess prop to the component props
interface ProblemInputFormProps {
  onSuccess?: () => void;
}

// Helper function to extract a sensible title from URL
const inferTitleFromUrl = (url?: string): string | undefined => {
    if (!url) return undefined;
    try {
        const urlObject = new URL(url);
        // Handle paths like /problems/two-sum/ or /problems/two-sum
        const pathSegments = urlObject.pathname.split('/').filter(Boolean); // Remove empty strings
        const slug = pathSegments.pop(); // Get the last non-empty segment

        if (slug && slug !== 'description' && slug !== 'solutions') { // Avoid generic segments
            return slug.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
        }
        // Fallback if no good slug found
        return urlObject.hostname; // e.g., leetcode.com
    } catch (e) {
        console.warn("Could not parse title from URL:", url);
        return undefined;
    }
};


export function ProblemInputForm({ onSuccess }: ProblemInputFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      // title: "", // REMOVED TITLE
      url: "",
      difficulty: undefined,
      dateSolved: new Date().toISOString().split('T')[0], // Default to today's date YYYY-MM-DD
      rating: 3, // Default rating to 'Good' (3)
      timeComplexity: "",
      spaceComplexity: "",
      algorithm: "",
      notes: "",
      code: "",
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
     setIsSubmitting(true);
     try {

       const inferredTitle = inferTitleFromUrl(values.url);

       // Directly use the structured data from the form
       const problemMetadata: ProblemMetadata = {
         title: inferredTitle, // Use inferred title
         url: values.url || undefined, // Store undefined if empty string (shouldn't happen due to validation)
         difficulty: values.difficulty,
         dateSolved: values.dateSolved,
         rating: values.rating, // Store the raw rating (1-5)
         timeComplexity: values.timeComplexity,
         spaceComplexity: values.spaceComplexity,
         algorithm: values.algorithm,
         notes: values.notes,
         code: values.code, // Add code field
       };

        // Map the 1-5 rating to an initial interval (in days)
       const ratingToInitialInterval = (rating?: number): number => {
         switch (rating) {
           case 5: return 4; // Easiest -> review in 4 days
           case 4: return 3; // -> review in 3 days
           case 3: return 2; // Good -> review in 2 days
           case 2: return 1; // -> review in 1 day
           case 1: return 1; // Hardest -> review in 1 day
           default: return AGAIN_INTERVAL; // Default to 1 day if no rating
         }
       };

       const initialInterval = ratingToInitialInterval(problemMetadata.rating);

       const now = Date.now();
       // Use dateSolved if provided, otherwise default to now
       const solvedTimestamp = values.dateSolved ? new Date(values.dateSolved).getTime() : now;
        // Next review date is based *only* on the initial interval from rating
       const nextReviewDate = solvedTimestamp + (initialInterval * 24 * 60 * 60 * 1000);


       const newProblem: LeetCodeProblem = {
         ...problemMetadata,
         id: problemMetadata.url, // Use validated URL as the unique ID
         title: inferredTitle || problemMetadata.url, // Ensure title is set
         rating: problemMetadata.rating, // Store the initial rating (1-5)
         interval: initialInterval, // Store the calculated initial interval
         easeFactor: DEFAULT_EASE_FACTOR, // Start with default ease
         repetitions: 0, // Start with 0 repetitions
         nextReviewDate: nextReviewDate,
         dateSolved: values.dateSolved || new Date(now).toLocaleDateString('en-CA'), // Use YYYY-MM-DD format
         // lastReviewedDate is initially undefined
       };

       addProblem(newProblem);
       console.log("Problem added, triggering update event...");
       triggerProblemUpdateEvent(); // Dispatch event

       toast({
         title: "Problem Added",
         // Use inferred title or URL in toast
         description: `"${newProblem.title}" scheduled for review on ${new Date(newProblem.nextReviewDate).toLocaleDateString()}.`,
       });
       form.reset(); // Clear the form
       onSuccess?.(); // Call the success callback to close the modal

     } catch (error) {
       console.error("Error adding problem:", error);
       toast({
         variant: "destructive",
         title: "Error",
         description: `Failed to add the problem. ${error instanceof Error ? error.message : 'Please try again.'}`,
       });
     } finally {
       setIsSubmitting(false);
     }
  }

  // Remove Card wrappers, use Dialog structure provided by the parent
  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-4"> {/* Add padding top */}
        {/* Form Content - Removed CardContent wrapper */}
        <div className="space-y-4 px-1 max-h-[calc(90vh-200px)] overflow-y-auto pr-3"> {/* Scrollable area for content */}
          {/* URL - Now the primary identifier */}
          <FormField
            control={form.control}
            name="url"
            render={({ field }) => (
              <FormItem>
                <FormLabel>LeetCode Problem URL</FormLabel>
                <FormControl>
                  <Input placeholder="https://leetcode.com/problems/..." {...field} type="url" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          {/* REMOVED TITLE FIELD */}
          {/* <FormField
            control={form.control}
            name="title"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Title</FormLabel>
                <FormControl>
                  <Input placeholder="Two Sum" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          /> */}


          {/* Difficulty, Rating, Date Solved */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
             <FormField
              control={form.control}
              name="difficulty"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Difficulty</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select difficulty" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="Easy">Easy</SelectItem>
                      <SelectItem value="Medium">Medium</SelectItem>
                      <SelectItem value="Hard">Hard</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
             <FormField
               control={form.control}
               name="rating"
               render={({ field }) => (
                 <FormItem>
                   <FormLabel>Initial Difficulty Rating</FormLabel>
                    <Select onValueChange={(value) => field.onChange(parseInt(value))} defaultValue={field.value?.toString()}>
                      <FormControl>
                        <SelectTrigger>
                          {/* Updated placeholder */}
                          <SelectValue placeholder="Rate initial recall (1=Hard, 5=Easy)" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                         {/* Clarify rating meaning */}
                         <SelectItem value="1">1 (Very Hard)</SelectItem>
                         <SelectItem value="2">2 (Hard)</SelectItem>
                         <SelectItem value="3">3 (Good)</SelectItem>
                         <SelectItem value="4">4 (Easy)</SelectItem>
                         <SelectItem value="5">5 (Very Easy)</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                 </FormItem>
               )}
             />
            <FormField
              control={form.control}
              name="dateSolved"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Date Solved</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

           {/* Time Complexity, Space Complexity, Algorithm */}
           <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
             <FormField
               control={form.control}
               name="timeComplexity"
               render={({ field }) => (
                 <FormItem>
                   <FormLabel>Time Complexity</FormLabel>
                   <FormControl>
                     <Input placeholder="e.g., O(N)" {...field} />
                   </FormControl>
                   <FormMessage />
                 </FormItem>
               )}
             />
              <FormField
               control={form.control}
               name="spaceComplexity"
               render={({ field }) => (
                 <FormItem>
                   <FormLabel>Space Complexity</FormLabel>
                   <FormControl>
                     <Input placeholder="e.g., O(1)" {...field} />
                   </FormControl>
                   <FormMessage />
                 </FormItem>
               )}
             />
             <FormField
               control={form.control}
               name="algorithm"
               render={({ field }) => (
                 <FormItem>
                   <FormLabel>Algorithm/Approach</FormLabel>
                   <FormControl>
                     <Input placeholder="e.g., Two Pointers, DP" {...field} />
                   </FormControl>
                   <FormMessage />
                 </FormItem>
               )}
             />
           </div>

           {/* Notes */}
           <FormField
             control={form.control}
             name="notes"
             render={({ field }) => (
               <FormItem>
                 <FormLabel>Notes</FormLabel>
                 <FormControl>
                   <Textarea
                     placeholder="Any additional thoughts, observations, or hints..."
                     className="min-h-[100px]"
                     {...field}
                     disabled={isSubmitting}
                   />
                 </FormControl>
                 <FormMessage />
               </FormItem>
             )}
           />

          {/* Code Solution */}
          <FormField
            control={form.control}
            name="code"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Code Solution</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="Paste your code solution here..."
                    className="min-h-[150px] bg-muted/50 text-sm font-mono" // Slightly smaller min-height for modal
                    {...field}
                    disabled={isSubmitting}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div> {/* End scrollable content */}

        {/* Dialog Footer - Removed CardFooter */}
         <DialogFooter className="pt-4 border-t"> {/* Add padding top and border */}
             <DialogClose asChild>
                <Button type="button" variant="outline" disabled={isSubmitting}>
                   Cancel
                </Button>
             </DialogClose>
            <Button type="submit" disabled={isSubmitting} className="bg-primary hover:bg-primary/90">
                {isSubmitting ? (
                    <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Adding...
                    </>
                ) : (
                    'Add and Schedule Review'
                )}
            </Button>
         </DialogFooter>
      </form>
    </Form>
  );
}
