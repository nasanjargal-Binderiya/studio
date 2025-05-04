
"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { loadProblems, updateProblem, deleteProblem, triggerProblemUpdateEvent } from '@/lib/problem-store'; // Import storage functions and trigger event
import type { LeetCodeProblem, ReviewPerformance } from '@/types/problem';
import { calculateNextReview } from '@/lib/srs'; // Import SRS calculation logic
// Import constants used in ProblemCard tooltips calculation
import { AGAIN_INTERVAL, HARD_INTERVAL_MULTIPLIER, DEFAULT_EASE_FACTOR, EASY_INTERVAL_BONUS } from '@/types/problem';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Trash2, ExternalLink, Gauge, BrainCircuit, CalendarClock, Smile, Frown, Meh, SmilePlus, Info, Loader2 } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";


const DifficultyBadge = ({ difficulty }: { difficulty: LeetCodeProblem['difficulty'] }) => {
  if (!difficulty) return null;
  let variant: 'default' | 'secondary' | 'destructive' = 'secondary';
  if (difficulty === 'Easy') variant = 'default'; // Use primary (Teal) for Easy
  if (difficulty === 'Medium') variant = 'secondary'; // Use secondary (grayish) for Medium
  if (difficulty === 'Hard') variant = 'destructive'; // Use destructive (red) for Hard

  return <Badge variant={variant} className="capitalize">{difficulty}</Badge>;
};

const formatDays = (days: number): string => {
    // Handle potential NaN or undefined inputs gracefully
    if (isNaN(days) || days === undefined || days === null) return "N/A";
    if (days < 1) return "<1 day";
    if (days < 30) return `${Math.round(days)} day${days >= 1.5 ? 's' : ''}`;
    if (days < 365) return `${(days / 30).toFixed(1)} month${days >= 45 ? 's' : ''}`;
    return `${(days / 365).toFixed(1)} year${days >= 548 ? 's' : ''}`;
};

export function ReviewList() {
  const [problems, setProblems] = useState<LeetCodeProblem[]>([]);
  const [isLoading, setIsLoading] = useState(true); // Ensure initial state is true
  const { toast } = useToast();

 const refreshProblems = useCallback(() => {
    setIsLoading(true); // Set loading true at the start
    try {
      // Ensure this runs only on the client
      if (typeof window !== 'undefined') {
        const loaded = loadProblems();
        const now = Date.now();
        // Sort problems: due first, then upcoming, ordered by next review date
        const sorted = loaded
          .filter(p => p.nextReviewDate && typeof p.nextReviewDate === 'number') // Ensure nextReviewDate exists and is a number
          .sort((a, b) => a.nextReviewDate - b.nextReviewDate);
        setProblems(sorted);
      }
    } catch (error) {
        console.error("Failed to load problems:", error);
        toast({
            variant: "destructive",
            title: "Error Loading Problems",
            description: "Could not load review list. Please try refreshing the page.",
        });
        setProblems([]); // Set to empty array on error
    } finally {
        setIsLoading(false); // Set loading false after try/catch/finally block
    }
 }, [toast]); // Include toast in dependencies

  useEffect(() => {
    // Initial load
    refreshProblems();

    // Listener for updates
    const handleProblemUpdate = () => {
       console.log("problemUpdated event received, refreshing list..."); // Add console log
       refreshProblems();
    };
    window.addEventListener('problemUpdated', handleProblemUpdate);

    // Cleanup listener on unmount
     return () => {
        window.removeEventListener('problemUpdated', handleProblemUpdate);
     };
  }, [refreshProblems]); // Dependency array includes refreshProblems


 const handleReview = (id: string, performance: ReviewPerformance) => {
    const problem = problems.find(p => p.id === id);
    if (problem) {
      const updates = calculateNextReview(problem, performance);
      const updatedProblem: LeetCodeProblem = {
        ...problem,
        ...updates,
      };
      updateProblem(updatedProblem);
      const nextReviewIntervalFormatted = formatDays(updatedProblem.interval);
      toast({
          title: "Review Recorded",
          description: `"${problem.title || 'Problem'}" reviewed as ${performance}. Next review in ${nextReviewIntervalFormatted}.`,
      });
      triggerProblemUpdateEvent(); // Refresh list via event
    }
  };

   const handleDeleteProblem = (id: string) => {
       const problemToDelete = problems.find(p => p.id === id);
       deleteProblem(id);
       toast({
           variant: "destructive",
           title: "Problem Deleted",
           description: `"${problemToDelete?.title || 'Problem'}" has been removed.`,
       });
       triggerProblemUpdateEvent(); // Refresh list via event
   };

  if (isLoading) {
     return (
        <div className="flex justify-center items-center py-10">
             <Loader2 className="h-8 w-8 animate-spin text-primary" />
             <span className="ml-3 text-muted-foreground">Loading review problems...</span>
         </div>
     );
  }

  if (!isLoading && problems.length === 0) {
    return (
      <Alert>
         <BrainCircuit className="h-4 w-4" />
        <AlertTitle>No Problems Yet!</AlertTitle>
        <AlertDescription>
          Add your first solved LeetCode problem using the form on the left to start scheduling reviews.
        </AlertDescription>
      </Alert>
    );
  }

  const now = Date.now();
  const dueProblems = problems.filter(p => p.nextReviewDate <= now);
  const upcomingProblems = problems.filter(p => p.nextReviewDate > now);


  return (
    <TooltipProvider>
        <div className="space-y-6">
           {dueProblems.length > 0 && (
              <div>
                  <h3 className="text-xl font-semibold mb-3 text-destructive">Due for Review ({dueProblems.length})</h3>
                  <div className="space-y-4">
                      {dueProblems.map((problem) => (
                          <ProblemCard key={problem.id} problem={problem} onReview={handleReview} onDelete={handleDeleteProblem} isDue={true} />
                      ))}
                  </div>
              </div>
           )}

           {upcomingProblems.length > 0 && (
               <div>
                   <h3 className="text-xl font-semibold mb-3 text-foreground/80">Upcoming Reviews ({upcomingProblems.length})</h3>
                   <div className="space-y-4">
                       {upcomingProblems.map((problem) => (
                           <ProblemCard key={problem.id} problem={problem} onReview={handleReview} onDelete={handleDeleteProblem} isDue={false}/>
                       ))}
                   </div>
               </div>
           )}
           {/* Show message if there are problems but none are due or upcoming (edge case) */}
           {dueProblems.length === 0 && upcomingProblems.length === 0 && problems.length > 0 && (
                 <Alert>
                    <Info className="h-4 w-4" />
                    <AlertTitle>All Caught Up!</AlertTitle>
                    <AlertDescription>
                        You have problems stored, but none are currently due or upcoming.
                    </AlertDescription>
                </Alert>
           )}
        </div>
     </TooltipProvider>
  );
}


interface ProblemCardProps {
    problem: LeetCodeProblem;
    onReview: (id: string, performance: ReviewPerformance) => void;
    onDelete: (id: string) => void;
    isDue: boolean;
}

function ProblemCard({ problem, onReview, onDelete, isDue }: ProblemCardProps) {
    const nextReviewDateStr = problem.nextReviewDate ? new Date(problem.nextReviewDate).toLocaleDateString() : 'N/A';
    const lastReviewedDateStr = problem.lastReviewedDate ? new Date(problem.lastReviewedDate).toLocaleDateString() : 'Never';
    const currentIntervalStr = formatDays(problem.interval);
    const easeFactorPercent = problem.easeFactor ? Math.round(problem.easeFactor * 100) : 'N/A';

    // Calculate approximate next intervals for display in tooltips
    // Handle cases where calculateNextReview might return partial data without interval
    const nextAgainInterval = formatDays(calculateNextReview(problem, 'Again').interval ?? AGAIN_INTERVAL);
    const nextHardInterval = formatDays(calculateNextReview(problem, 'Hard').interval ?? problem.interval * HARD_INTERVAL_MULTIPLIER);
    const nextGoodInterval = formatDays(calculateNextReview(problem, 'Good').interval ?? problem.interval * (problem.easeFactor || DEFAULT_EASE_FACTOR));
    const nextEasyInterval = formatDays(calculateNextReview(problem, 'Easy').interval ?? problem.interval * (problem.easeFactor || DEFAULT_EASE_FACTOR) * EASY_INTERVAL_BONUS);


    return (
         <Card className={`shadow-sm ${isDue ? 'border-destructive border-2' : 'border-border'}`}>
            <CardHeader className="pb-3">
              <div className="flex justify-between items-start gap-2">
                  {/* Title, URL, Difficulty, SRS Info */}
                  <div>
                      <CardTitle className="text-lg mb-1">
                         {problem.url ? (
                              <a href={problem.url} target="_blank" rel="noopener noreferrer" className="hover:underline hover:text-primary inline-flex items-center gap-1">
                                  {problem.title || 'Unnamed Problem'} <ExternalLink className="h-4 w-4" />
                              </a>
                          ) : (
                              problem.title || 'Unnamed Problem'
                          )}
                      </CardTitle>
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground">
                           {problem.difficulty && <DifficultyBadge difficulty={problem.difficulty} />}
                           <Tooltip delayDuration={100}>
                                <TooltipTrigger asChild>
                                    <Badge variant="outline" className="flex items-center gap-1 cursor-default">
                                        <CalendarClock className="h-3 w-3" /> Interval: {currentIntervalStr}
                                    </Badge>
                                </TooltipTrigger>
                                <TooltipContent>Current review interval</TooltipContent>
                            </Tooltip>
                             <Tooltip delayDuration={100}>
                                <TooltipTrigger asChild>
                                    <Badge variant="outline" className="flex items-center gap-1 cursor-default">
                                        <Info className="h-3 w-3" /> Ease: {easeFactorPercent}%
                                    </Badge>
                                </TooltipTrigger>
                                <TooltipContent>Current ease factor</TooltipContent>
                            </Tooltip>
                           {isDue ? (
                              <span className="text-destructive font-medium">Due now</span>
                            ) : (
                               <span>Next: {nextReviewDateStr}</span>
                            )}
                          <span>Last: {lastReviewedDateStr}</span>
                      </div>
                  </div>
                  {/* Delete Button */}
                 <AlertDialog>
                     <AlertDialogTrigger asChild>
                        <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-destructive flex-shrink-0 ml-auto">
                           <Trash2 className="h-4 w-4" />
                           <span className="sr-only">Delete Problem</span>
                       </Button>
                     </AlertDialogTrigger>
                     <AlertDialogContent>
                         <AlertDialogHeader>
                             <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                             <AlertDialogDescription>
                                This action cannot be undone. This will permanently delete the problem
                                "{problem.title || 'Unnamed Problem'}" and its review schedule.
                             </AlertDialogDescription>
                         </AlertDialogHeader>
                         <AlertDialogFooter>
                             <AlertDialogCancel>Cancel</AlertDialogCancel>
                             <AlertDialogAction
                                 onClick={() => onDelete(problem.id)}
                                 className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                             >
                                Delete
                             </AlertDialogAction>
                         </AlertDialogFooter>
                     </AlertDialogContent>
                 </AlertDialog>
              </div>
            </CardHeader>
             <CardContent className="pt-0">
                 {/* Details: Complexity, Algorithm, Notes */}
                 {(problem.timeComplexity || problem.spaceComplexity || problem.algorithm || problem.notes) && (
                    <div className="space-y-2 text-sm text-muted-foreground mb-4">
                        {problem.timeComplexity && <p><Gauge className="inline h-4 w-4 mr-1" /> Time: <code className="bg-muted px-1 rounded">{problem.timeComplexity}</code></p>}
                        {problem.spaceComplexity && <p><Gauge className="inline h-4 w-4 mr-1" /> Space: <code className="bg-muted px-1 rounded">{problem.spaceComplexity}</code></p>}
                        {problem.algorithm && <p><BrainCircuit className="inline h-4 w-4 mr-1" /> Algorithm: {problem.algorithm}</p>}
                        {problem.notes && (
                            <div>
                                <p className="font-medium text-foreground/80">Notes/Code:</p>
                                <pre className="mt-1 p-2 bg-muted rounded text-xs whitespace-pre-wrap break-words max-h-40 overflow-y-auto">
                                    <code>{problem.notes}</code>
                                </pre>
                            </div>
                        )}
                    </div>
                 )}
                 <Separator className="my-4" />
                 {/* Review Action Buttons - Only show for Due items */}
                 {isDue && (
                     <div className="flex justify-center items-center gap-2 sm:gap-3 flex-wrap">
                         <Tooltip delayDuration={100}>
                             <TooltipTrigger asChild>
                                 <Button size="sm" variant="destructive" onClick={() => onReview(problem.id, 'Again')} className="flex-1 sm:flex-none">
                                     <Frown className="mr-1 h-4 w-4" /> Again
                                 </Button>
                             </TooltipTrigger>
                             <TooltipContent>Forgot. Review in {nextAgainInterval}</TooltipContent>
                         </Tooltip>
                         <Tooltip delayDuration={100}>
                             <TooltipTrigger asChild>
                                 <Button size="sm" variant="secondary" onClick={() => onReview(problem.id, 'Hard')} className="flex-1 sm:flex-none">
                                     <Meh className="mr-1 h-4 w-4" /> Hard
                                 </Button>
                             </TooltipTrigger>
                             <TooltipContent>Recalled with difficulty. Review in {nextHardInterval}</TooltipContent>
                         </Tooltip>
                          <Tooltip delayDuration={100}>
                             <TooltipTrigger asChild>
                                 <Button size="sm" variant="default" onClick={() => onReview(problem.id, 'Good')} className="flex-1 sm:flex-none bg-primary hover:bg-primary/90">
                                     <Smile className="mr-1 h-4 w-4" /> Good
                                 </Button>
                             </TooltipTrigger>
                             <TooltipContent>Recalled correctly. Review in {nextGoodInterval}</TooltipContent>
                         </Tooltip>
                         <Tooltip delayDuration={100}>
                             <TooltipTrigger asChild>
                                 <Button size="sm" variant="outline" onClick={() => onReview(problem.id, 'Easy')} className="flex-1 sm:flex-none">
                                     <SmilePlus className="mr-1 h-4 w-4" /> Easy
                                 </Button>
                             </TooltipTrigger>
                             <TooltipContent>Recalled easily. Review in {nextEasyInterval}</TooltipContent>
                         </Tooltip>
                     </div>
                 )}
                 {/* Placeholder/Info for upcoming reviews */}
                 {!isDue && (
                      <div className="text-center text-sm text-muted-foreground italic py-2">
                          Review scheduled for {nextReviewDateStr}.
                      </div>
                 )}
             </CardContent>
        </Card>
    );
}
