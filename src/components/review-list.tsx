"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { loadProblems, updateProblem } from '@/lib/problem-store';
import type { LeetCodeProblem } from '@/types/problem';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { CheckCircle, Trash2, ExternalLink, Gauge, BrainCircuit, CalendarClock } from 'lucide-react';
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
import { deleteProblem } from '@/lib/problem-store'; // Import deleteProblem
import { useToast } from "@/hooks/use-toast";


const DifficultyBadge = ({ difficulty }: { difficulty: LeetCodeProblem['difficulty'] }) => {
  if (!difficulty) return null;
  let variant: 'default' | 'secondary' | 'destructive' = 'secondary';
  if (difficulty === 'Easy') variant = 'default'; // Use primary (Teal) for Easy
  if (difficulty === 'Medium') variant = 'secondary'; // Use secondary (grayish) for Medium
  if (difficulty === 'Hard') variant = 'destructive'; // Use destructive (red) for Hard

  return <Badge variant={variant} className="capitalize">{difficulty}</Badge>;
};


export function ReviewList() {
  const [problems, setProblems] = useState<LeetCodeProblem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();


  const refreshProblems = useCallback(() => {
     setIsLoading(true);
     // Ensure this runs only on the client
     if (typeof window !== 'undefined') {
         const loaded = loadProblems();
         const now = Date.now();
         // Sort problems: due first, then upcoming, then overdue last (or adjust as needed)
         const sorted = loaded
             .filter(p => p.nextReviewDate) // Ensure nextReviewDate exists
             .sort((a, b) => a.nextReviewDate - b.nextReviewDate);
         setProblems(sorted);
     }
     setIsLoading(false);
 }, []); // Empty dependency array ensures this runs once on mount equivalent

  useEffect(() => {
    refreshProblems();
    // Optional: Set up an interval to refresh periodically or listen for custom events
     const handleStorageChange = (event: StorageEvent) => {
       if (event.key === 'leetReviewProblems') {
         refreshProblems();
       }
     };
     window.addEventListener('storage', handleStorageChange);

     // Custom event listener for when a problem is added/updated
     const handleProblemUpdate = () => {
        refreshProblems();
     };
     window.addEventListener('problemUpdated', handleProblemUpdate);


     return () => {
       window.removeEventListener('storage', handleStorageChange);
        window.removeEventListener('problemUpdated', handleProblemUpdate);
     };
  }, [refreshProblems]);

   // Function to dispatch event after adding/updating problem
   const triggerProblemUpdate = () => {
        window.dispatchEvent(new CustomEvent('problemUpdated'));
    };


 const handleMarkAsReviewed = (id: string) => {
    const problem = problems.find(p => p.id === id);
    if (problem && problem.rating) {
      const now = Date.now();
      const nextReviewDate = now + (problem.rating * 24 * 60 * 60 * 1000);
      const updatedProblem: LeetCodeProblem = {
        ...problem,
        lastReviewedDate: now,
        nextReviewDate: nextReviewDate,
      };
      updateProblem(updatedProblem);
      toast({
          title: "Review Recorded",
          description: `"${problem.title || 'Problem'}" marked as reviewed. Next review on ${new Date(nextReviewDate).toLocaleDateString()}.`,
      });
      triggerProblemUpdate(); // Refresh list via event
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
       triggerProblemUpdate(); // Refresh list via event
   };

  if (isLoading) {
    return <p>Loading review problems...</p>;
  }

  if (problems.length === 0) {
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
    <div className="space-y-6">
       {dueProblems.length > 0 && (
          <div>
              <h3 className="text-xl font-semibold mb-3 text-destructive">Due for Review ({dueProblems.length})</h3>
              <div className="space-y-4">
                  {dueProblems.map((problem) => (
                      <ProblemCard key={problem.id} problem={problem} onMarkReviewed={handleMarkAsReviewed} onDelete={handleDeleteProblem} isDue={true} />
                  ))}
              </div>
          </div>
       )}

       {upcomingProblems.length > 0 && (
           <div>
               <h3 className="text-xl font-semibold mb-3 text-foreground/80">Upcoming Reviews ({upcomingProblems.length})</h3>
               <div className="space-y-4">
                   {upcomingProblems.map((problem) => (
                       <ProblemCard key={problem.id} problem={problem} onMarkReviewed={handleMarkAsReviewed} onDelete={handleDeleteProblem} isDue={false}/>
                   ))}
               </div>
           </div>
       )}
    </div>
  );
}


interface ProblemCardProps {
    problem: LeetCodeProblem;
    onMarkReviewed: (id: string) => void;
    onDelete: (id: string) => void;
    isDue: boolean;
}

function ProblemCard({ problem, onMarkReviewed, onDelete, isDue }: ProblemCardProps) {
    const nextReviewDateStr = new Date(problem.nextReviewDate).toLocaleDateString();
    const lastReviewedDateStr = problem.lastReviewedDate ? new Date(problem.lastReviewedDate).toLocaleDateString() : 'Never';

    return (
         <Card className={`shadow-sm ${isDue ? 'border-destructive border-2' : ''}`}>
            <CardHeader className="pb-3">
              <div className="flex justify-between items-start gap-2">
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
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                           {problem.difficulty && <DifficultyBadge difficulty={problem.difficulty} />}
                           {problem.rating && (
                              <Badge variant="outline" className="flex items-center gap-1">
                                  <CalendarClock className="h-3 w-3" /> Rating: {problem.rating} day{problem.rating > 1 ? 's' : ''}
                              </Badge>
                          )}
                          <span>Next Review: {nextReviewDateStr}</span>
                      </div>
                  </div>
                 <AlertDialog>
                     <AlertDialogTrigger asChild>
                        <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-destructive flex-shrink-0">
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
             <CardContent>
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
                 <Separator className="my-3" />
                 <div className="flex justify-between items-center">
                     <span className="text-xs text-muted-foreground">
                        Last Reviewed: {lastReviewedDateStr}
                     </span>
                     <Button size="sm" variant={isDue ? "default" : "outline"} onClick={() => onMarkReviewed(problem.id)} className={isDue ? "bg-primary hover:bg-primary/90" : ""}>
                         <CheckCircle className="mr-2 h-4 w-4" />
                         Mark as Reviewed
                     </Button>
                 </div>
             </CardContent>
        </Card>
    );
}
