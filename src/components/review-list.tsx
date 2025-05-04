
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
import { Trash2, ExternalLink, Gauge, BrainCircuit, CalendarClock, Smile, Frown, Meh, SmilePlus, Info, Loader2, Code } from 'lucide-react'; // Added Code icon
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
  const [isLoading, setIsLoading] = useState(true); // Start as loading
  const [dueProblems, setDueProblems] = useState<LeetCodeProblem[]>([]);
  const [upcomingProblems, setUpcomingProblems] = useState<LeetCodeProblem[]>([]);
  const { toast } = useToast();

  const refreshProblems = useCallback(() => {
    console.log("Refreshing problems..."); // Log refresh start
    setIsLoading(true);
    // Wrap localStorage access and Date.now() dependent logic in try/catch/finally
    try {
      // This logic relies on localStorage and Date.now(), so it should run client-side.
      // The useEffect hook ensures it runs after mount.
      const loaded = loadProblems();
      const now = Date.now(); // Get current time *after* mount

      // Filter and sort problems
      const sorted = loaded
        .filter(p => p.nextReviewDate && typeof p.nextReviewDate === 'number')
        .sort((a, b) => a.nextReviewDate - b.nextReviewDate);

      const due = sorted.filter(p => p.nextReviewDate <= now);
      const upcoming = sorted.filter(p => p.nextReviewDate > now);

      setProblems(sorted); // Keep the full sorted list if needed elsewhere
      setDueProblems(due);
      setUpcomingProblems(upcoming);
      console.log(`Refreshed: ${due.length} due, ${upcoming.length} upcoming`);

    } catch (error) {
        console.error("Failed to load or process problems:", error);
        toast({
            variant: "destructive",
            title: "Error Loading Problems",
            description: "Could not load review list. Please try refreshing the page.",
        });
        setProblems([]); // Reset state on error
        setDueProblems([]);
        setUpcomingProblems([]);
    } finally {
        setIsLoading(false); // Ensure loading is set to false
        console.log("Finished refreshing problems."); // Log refresh end
    }
 }, [toast]); // Include toast in dependencies

  // Effect for initial load and event listener setup
  useEffect(() => {
    // Initial load happens here, after component mounts
    refreshProblems();

    // Listener for updates triggered by adding/deleting problems
    const handleProblemUpdate = () => {
       console.log("problemUpdated event received, refreshing list...");
       refreshProblems();
    };
    window.addEventListener('problemUpdated', handleProblemUpdate);

    // Cleanup listener on unmount
     return () => {
        window.removeEventListener('problemUpdated', handleProblemUpdate);
     };
    // Run only once on mount by including the stable refreshProblems callback
  }, [refreshProblems]);


 const handleReview = (id: string, performance: ReviewPerformance) => {
    const problem = problems.find(p => p.id === id); // Find from the main list
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
      triggerProblemUpdateEvent(); // Refresh list via event - will call refreshProblems
    }
  };

   const handleDeleteProblem = (id: string) => {
       const problemToDelete = problems.find(p => p.id === id); // Find from the main list
       deleteProblem(id);
       toast({
           variant: "destructive",
           title: "Problem Deleted",
           description: `"${problemToDelete?.title || 'Problem'}" has been removed.`,
       });
       triggerProblemUpdateEvent(); // Refresh list via event - will call refreshProblems
   };

  // Display loading indicator while fetching/processing
  if (isLoading) {
     return (
        // Add suppressHydrationWarning here
        <div className="flex justify-center items-center py-10" suppressHydrationWarning>
             <Loader2 className="h-8 w-8 animate-spin text-primary" />
             <span className="ml-3 text-muted-foreground">Loading review problems...</span>
         </div>
     );
  }

  // Display message if no problems exist after loading
  if (!isLoading && problems.length === 0) {
    return (
      <Alert>
         <BrainCircuit className="h-4 w-4" />
        <AlertTitle>No Problems Yet!</AlertTitle>
        <AlertDescription>
          Add your first solved LeetCode problem using the "Add New Problem" button to start scheduling reviews.
        </AlertDescription>
      </Alert>
    );
  }

  // Render the lists based on the state variables populated by useEffect/refreshProblems
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
           {/* Show message if there are problems but none are due or upcoming (e.g., after reviewing all due items) */}
           {dueProblems.length === 0 && upcomingProblems.length === 0 && problems.length > 0 && (
                 <Alert>
                    <Info className="h-4 w-4" />
                    <AlertTitle>All Caught Up!</AlertTitle>
                    <AlertDescription>
                        You have problems stored, but none are currently due or upcoming for review. Add more or check back later!
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
    // State to hold formatted dates/intervals calculated client-side
    const [displayData, setDisplayData] = useState<{
        nextReviewDateStr: string;
        lastReviewedDateStr: string;
        currentIntervalStr: string;
        easeFactorPercent: string | number;
        nextAgainInterval: string;
        nextHardInterval: string;
        nextGoodInterval: string;
        nextEasyInterval: string;
    } | null>(null);

    // Calculate display strings in useEffect to avoid hydration issues
    useEffect(() => {
        const nextDateStr = problem.nextReviewDate ? new Date(problem.nextReviewDate).toLocaleDateString() : 'N/A';
        const lastDateStr = problem.lastReviewedDate ? new Date(problem.lastReviewedDate).toLocaleDateString() : 'Never';
        const intervalStr = formatDays(problem.interval);
        const easePercent = problem.easeFactor ? Math.round(problem.easeFactor * 100) : 'N/A';

        // Calculate approximate next intervals safely client-side
        const againInt = formatDays(calculateNextReview(problem, 'Again').interval ?? AGAIN_INTERVAL);
        const hardInt = formatDays(calculateNextReview(problem, 'Hard').interval ?? problem.interval * HARD_INTERVAL_MULTIPLIER);
        const goodInt = formatDays(calculateNextReview(problem, 'Good').interval ?? problem.interval * (problem.easeFactor || DEFAULT_EASE_FACTOR));
        const easyInt = formatDays(calculateNextReview(problem, 'Easy').interval ?? problem.interval * (problem.easeFactor || DEFAULT_EASE_FACTOR) * EASY_INTERVAL_BONUS);

        setDisplayData({
            nextReviewDateStr: nextDateStr,
            lastReviewedDateStr: lastDateStr,
            currentIntervalStr: intervalStr,
            easeFactorPercent: easePercent,
            nextAgainInterval: againInt,
            nextHardInterval: hardInt,
            nextGoodInterval: goodInt,
            nextEasyInterval: easyInt,
        });
    }, [problem]); // Recalculate when the problem data changes

    // Render placeholders or loading state until displayData is ready
    if (!displayData) {
        // You might want a more sophisticated Skeleton loader here
         return (
            <Card className={`shadow-sm ${isDue ? 'border-destructive border-2' : 'border-border'} p-4 min-h-[150px]`}>
                {/* Add suppressHydrationWarning here as well for consistency */}
                <div className="flex justify-center items-center h-full" suppressHydrationWarning>
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
            </Card>
         );
    }


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
                      {/* Wrap potentially hydrating elements in a div with suppressHydrationWarning */}
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground" suppressHydrationWarning>
                           {problem.difficulty && <DifficultyBadge difficulty={problem.difficulty} />}
                           <Tooltip delayDuration={100}>
                                <TooltipTrigger asChild>
                                    <Badge variant="outline" className="flex items-center gap-1 cursor-default">
                                        <CalendarClock className="h-3 w-3" /> Interval: {displayData.currentIntervalStr}
                                    </Badge>
                                </TooltipTrigger>
                                <TooltipContent>Current review interval</TooltipContent>
                            </Tooltip>
                             <Tooltip delayDuration={100}>
                                <TooltipTrigger asChild>
                                    <Badge variant="outline" className="flex items-center gap-1 cursor-default">
                                        <Info className="h-3 w-3" /> Ease: {displayData.easeFactorPercent}%
                                    </Badge>
                                </TooltipTrigger>
                                <TooltipContent>Current ease factor</TooltipContent>
                            </Tooltip>
                           {isDue ? (
                              <span className="text-destructive font-medium">Due now</span>
                            ) : (
                               <span>Next: {displayData.nextReviewDateStr}</span>
                            )}
                          <span>Last: {displayData.lastReviewedDateStr}</span>
                          {problem.dateSolved && <span>Solved: {new Date(problem.dateSolved).toLocaleDateString()}</span>}
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
                 {(problem.timeComplexity || problem.spaceComplexity || problem.algorithm || problem.notes || problem.code) && (
                     <div className="space-y-3 mb-4">
                         <div className="grid grid-cols-1 md:grid-cols-3 gap-x-4 gap-y-2 text-sm text-muted-foreground">
                             {problem.timeComplexity && <p><Gauge className="inline h-4 w-4 mr-1" /> Time: <code className="bg-muted px-1 rounded">{problem.timeComplexity}</code></p>}
                             {problem.spaceComplexity && <p><Gauge className="inline h-4 w-4 mr-1" /> Space: <code className="bg-muted px-1 rounded">{problem.spaceComplexity}</code></p>}
                             {problem.algorithm && <p><BrainCircuit className="inline h-4 w-4 mr-1" /> Algorithm: {problem.algorithm}</p>}
                         </div>
                         {problem.notes && (
                             <div>
                                 <p className="font-medium text-foreground/80 text-sm mb-1">Notes:</p>
                                 <p className="text-sm text-muted-foreground whitespace-pre-wrap break-words">{problem.notes}</p>
                             </div>
                         )}
                         {problem.code && (
                            <div>
                                <p className="font-medium text-foreground/80 text-sm mb-1 flex items-center gap-1"><Code className="h-4 w-4"/>Code:</p>
                                {/* Use pre and code tags for semantic meaning. Add styling for code block appearance */}
                                {/* Updated background to bg-muted for better contrast */}
                                <pre className="mt-1 p-3 bg-muted border border-border rounded-md text-sm whitespace-pre-wrap break-words max-h-60 overflow-y-auto font-mono shadow-inner">
                                    <code className="block">{problem.code}</code>
                                </pre>
                            </div>
                        )}
                    </div>
                 )}
                 <Separator className="my-4" />
                 {/* Review Action Buttons - Only show for Due items */}
                 {/* Wrap potentially hydrating elements in a div with suppressHydrationWarning */}
                 {isDue && (
                     <div className="flex justify-center items-center gap-2 sm:gap-3 flex-wrap" suppressHydrationWarning>
                         <Tooltip delayDuration={100}>
                             <TooltipTrigger asChild>
                                 <Button size="sm" variant="destructive" onClick={() => onReview(problem.id, 'Again')} className="flex-1 sm:flex-none">
                                     <Frown className="mr-1 h-4 w-4" /> Again
                                 </Button>
                             </TooltipTrigger>
                             <TooltipContent>Forgot. Review in {displayData.nextAgainInterval}</TooltipContent>
                         </Tooltip>
                         <Tooltip delayDuration={100}>
                             <TooltipTrigger asChild>
                                 <Button size="sm" variant="secondary" onClick={() => onReview(problem.id, 'Hard')} className="flex-1 sm:flex-none">
                                     <Meh className="mr-1 h-4 w-4" /> Hard
                                 </Button>
                             </TooltipTrigger>
                             <TooltipContent>Recalled with difficulty. Review in {displayData.nextHardInterval}</TooltipContent>
                         </Tooltip>
                          <Tooltip delayDuration={100}>
                             <TooltipTrigger asChild>
                                 <Button size="sm" variant="default" onClick={() => onReview(problem.id, 'Good')} className="flex-1 sm:flex-none bg-primary hover:bg-primary/90">
                                     <Smile className="mr-1 h-4 w-4" /> Good
                                 </Button>
                             </TooltipTrigger>
                             <TooltipContent>Recalled correctly. Review in {displayData.nextGoodInterval}</TooltipContent>
                         </Tooltip>
                         <Tooltip delayDuration={100}>
                             <TooltipTrigger asChild>
                                 <Button size="sm" variant="outline" onClick={() => onReview(problem.id, 'Easy')} className="flex-1 sm:flex-none">
                                     <SmilePlus className="mr-1 h-4 w-4" /> Easy
                                 </Button>
                             </TooltipTrigger>
                             <TooltipContent>Recalled easily. Review in {displayData.nextEasyInterval}</TooltipContent>
                         </Tooltip>
                     </div>
                 )}
                 {/* Placeholder/Info for upcoming reviews */}
                 {/* Wrap potentially hydrating elements in a div with suppressHydrationWarning */}
                 {!isDue && (
                      <div className="text-center text-sm text-muted-foreground italic py-2" suppressHydrationWarning>
                          Review scheduled for {displayData.nextReviewDateStr}.
                      </div>
                 )}
             </CardContent>
        </Card>
    );
}
