
"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import React, { useState, useTransition } from 'react';
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
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { addProblem, triggerProblemUpdateEvent } from '@/lib/problem-store';
import type { LeetCodeProblem, ProblemMetadata } from '@/types/problem';
import { DEFAULT_EASE_FACTOR, AGAIN_INTERVAL } from '@/types/problem'; // Import constants
import { Loader2 } from "lucide-react";

// Define the schema for the individual input fields
const formSchema = z.object({
  title: z.string().optional(),
  url: z.string().url({ message: "Please enter a valid URL." }).optional().or(z.literal('')), // Allow empty string or valid URL
  difficulty: z.enum(['Easy', 'Medium', 'Hard']).optional(),
  dateSolved: z.string().optional(), // Using string for input type="date"
  rating: z.coerce.number().min(1).max(5).optional(), // Coerce to number for input type="number"
  timeComplexity: z.string().optional(),
  spaceComplexity: z.string().optional(),
  algorithm: z.string().optional(),
  notes: z.string().optional(),
  code: z.string().min(1, { message: "Code solution is required." }), // Make code required
}).refine(data => data.url || data.title, { // Ensure at least URL or Title is provided
    message: "Either URL or Title must be provided.",
    path: ["url"], // You can attach the error to a specific field or root
});


export function ProblemInputForm() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      url: "",
      difficulty: undefined,
      dateSolved: new Date().toISOString().split('T')[0], // Default to today's date YYYY-MM-DD
      rating: undefined,
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
       // Directly use the structured data from the form
       const problemMetadata: ProblemMetadata = {
         title: values.title,
         url: values.url || undefined, // Store undefined if empty string
         difficulty: values.difficulty,
         dateSolved: values.dateSolved,
         rating: values.rating,
         timeComplexity: values.timeComplexity,
         spaceComplexity: values.spaceComplexity,
         algorithm: values.algorithm,
         notes: values.notes,
         code: values.code, // Add code field
       };


       // Rating is now optional for initial interval, but helpful
       const initialRating = problemMetadata.rating; // Can be undefined
       const initialInterval = initialRating ?? AGAIN_INTERVAL; // Default to 1 day if no rating provided

       const now = Date.now();
       // Use dateSolved if provided, otherwise default to now
       const solvedTimestamp = values.dateSolved ? new Date(values.dateSolved).getTime() : now;
       const nextReviewDate = solvedTimestamp + (initialInterval * 24 * 60 * 60 * 1000); // First review based on interval

       // Infer title from URL if title is missing and URL is present
       if (!problemMetadata.title && problemMetadata.url) {
         try {
           const urlObject = new URL(problemMetadata.url);
           const urlParts = urlObject.pathname.split('/');
           const slug = urlParts.filter(part => part !== '').pop();
           if (slug) {
             problemMetadata.title = slug.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
           }
         } catch (e) {
           console.warn("Could not parse title from URL:", problemMetadata.url);
         }
       }

        if (!problemMetadata.title && !problemMetadata.url) {
            // This case should be caught by the form validation (refine), but double-check
             toast({
                 variant: "destructive",
                 title: "Missing Information",
                 description: "Please provide either a URL or a Title for the problem.",
             });
             setIsSubmitting(false);
             return;
         }


       const newProblem: LeetCodeProblem = {
         ...problemMetadata,
         id: problemMetadata.url || `${problemMetadata.title}-${now}`, // Use URL as ID if available
         rating: initialRating, // Store the initial rating if provided
         interval: initialInterval,
         easeFactor: DEFAULT_EASE_FACTOR,
         repetitions: 0,
         nextReviewDate: nextReviewDate,
         dateSolved: values.dateSolved || new Date(now).toLocaleDateString(), // Use form value or default
         // lastReviewedDate is initially undefined
       };

       addProblem(newProblem);
       console.log("Problem added, triggering update event...");
       triggerProblemUpdateEvent(); // Dispatch event

       toast({
         title: "Problem Added",
         description: `"${newProblem.title || 'Problem'}" scheduled for review on ${new Date(newProblem.nextReviewDate).toLocaleDateString()}.`,
       });
       form.reset(); // Clear the form
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

  return (
    <Card className="shadow-md">
      <CardHeader>
        <CardTitle>Add New LeetCode Problem</CardTitle>
      </CardHeader>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <CardContent className="space-y-4">
            {/* URL and Title */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="url"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>URL</FormLabel>
                    <FormControl>
                      <Input placeholder="https://leetcode.com/problems/..." {...field} type="url" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
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
              />
            </div>

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
                     <FormLabel>Initial Rating (1-5)</FormLabel>
                      <Select onValueChange={(value) => field.onChange(parseInt(value))} defaultValue={field.value?.toString()}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select rating (sets first review)" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                           {[1, 2, 3, 4, 5].map(r => (
                              <SelectItem key={r} value={r.toString()}>{r}</SelectItem>
                           ))}
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
                      className="min-h-[200px] bg-muted/50 text-sm font-mono" // Monospaced font for code
                      {...field}
                      disabled={isSubmitting}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

          </CardContent>
          <CardFooter>
             <Button type="submit" disabled={isSubmitting} className="w-full bg-primary hover:bg-primary/90">
                 {isSubmitting ? (
                     <>
                         <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                         Adding...
                     </>
                 ) : (
                     'Add and Schedule Review'
                 )}
             </Button>
          </CardFooter>
        </form>
      </Form>
    </Card>
  );
}
