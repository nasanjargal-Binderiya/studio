"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import React, { useState, useTransition } from 'react';
// Import the exported wrapper function
import { parseProblemMetadata } from '@/ai/flows/parseProblemMetadata';
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { addProblem, triggerProblemUpdateEvent } from '@/lib/problem-store'; // Import trigger event
// Update import path for types and SRS defaults
import type { LeetCodeProblem, ProblemMetadata } from '@/types/problem';
import { DEFAULT_EASE_FACTOR, AGAIN_INTERVAL } from '@/types/problem';
import { Loader2 } from "lucide-react";

const formSchema = z.object({
  problemText: z.string().min(10, {
    message: "Problem details must be at least 10 characters.",
  }),
});

export function ProblemInputForm() {
  const [isPending, startTransition] = useTransition();
  const [isParsing, setIsParsing] = useState(false);
  const { toast } = useToast();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      problemText: "",
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
     setIsParsing(true);
     startTransition(async () => {
         try {
         // Call the exported wrapper function
         const parsedMetadata: ProblemMetadata = await parseProblemMetadata(values.problemText);

         // Rating is now optional for initial interval, but helpful
         const initialRating = parsedMetadata.rating; // Can be undefined
         const initialInterval = initialRating ?? AGAIN_INTERVAL; // Default to 1 day if no rating provided

          if (!parsedMetadata.url && !parsedMetadata.title) {
             toast({
                 variant: "destructive",
                 title: "Parsing Error",
                 description: "Could not find a title or URL for the problem.",
             });
             setIsParsing(false);
             return;
         }


         const now = Date.now();
         const nextReviewDate = now + (initialInterval * 24 * 60 * 60 * 1000); // First review based on interval

         const newProblem: LeetCodeProblem = {
           ...parsedMetadata,
           id: parsedMetadata.url || `${parsedMetadata.title}-${now}`, // Use URL as ID if available, otherwise combine title and timestamp
           // Rating is optional on the stored object itself now
           rating: initialRating, // Store the initial rating if provided, might be useful later
           // Initialize SRS fields
           interval: initialInterval,
           easeFactor: DEFAULT_EASE_FACTOR,
           repetitions: 0, // Start with 0 repetitions
           nextReviewDate: nextReviewDate,
           dateSolved: parsedMetadata.dateSolved || new Date(now).toLocaleDateString(), // Default to today if not parsed
           // lastReviewedDate is initially undefined
         };

         addProblem(newProblem);
         triggerProblemUpdateEvent(); // Dispatch event

         toast({
           title: "Problem Added",
           description: `"${newProblem.title || 'Problem'}" scheduled for review on ${new Date(newProblem.nextReviewDate).toLocaleDateString()}.`,
         });
         form.reset(); // Clear the form
       } catch (error) {
         console.error("Error parsing or adding problem:", error);
         toast({
           variant: "destructive",
           title: "Error",
           description: `Failed to process the problem details. ${error instanceof Error ? error.message : 'Please check the format and try again.'}`,
         });
       } finally {
          setIsParsing(false);
       }
     });
  }

  return (
    <Card className="shadow-md">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <CardContent className="pt-6">
            <FormField
              control={form.control}
              name="problemText"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Paste Problem Details & Code</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder={`Paste your LeetCode notes here, including:\n- URL (e.g., https://leetcode.com/...)\n- Rating (1-5, optional, e.g., Rating: (3) or just (3)) - Sets initial review interval in days\n- Date Solved (e.g., Date: 5/4)\n- Difficulty (e.g., hard, medium)\n- Complexity (e.g., Time: O(N))\n- Algorithm/Notes\n- Your code solution`}
                      className="min-h-[250px] bg-card text-sm font-mono" // Monospaced font for code
                      {...field}
                      disabled={isPending || isParsing}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
          <CardFooter>
             <Button type="submit" disabled={isPending || isParsing} className="w-full bg-primary hover:bg-primary/90">
                 {isPending || isParsing ? (
                     <>
                         <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                         Processing...
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
