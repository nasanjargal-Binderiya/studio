
"use client"; // Add 'use client' because we need state for the dialog

import React, { useState } from 'react'; // Import useState
import { Header } from "@/components/header";
import { ProblemInputForm } from "@/components/problem-input-form";
import { ReviewList } from "@/components/review-list"; // Import the existing ReviewList component
import { Button } from "@/components/ui/button"; // Import Button
import { PlusCircle } from 'lucide-react'; // Import an icon for the button
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"; // Import Dialog components

// Define the main page component
export default function HomePage() {
  const [isModalOpen, setIsModalOpen] = useState(false); // State to control the dialog

  const handleFormSuccess = () => {
    setIsModalOpen(false); // Close the dialog on successful form submission
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main className="flex-grow container mx-auto px-4 py-8">
        <div className="mb-6 flex justify-end"> {/* Add margin bottom and flex container for the button */}
           <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}> {/* Control dialog state */}
              {/* Add suppressHydrationWarning here as it contains the button causing issues */}
              <DialogTrigger asChild suppressHydrationWarning>
                {/* Remove suppressHydrationWarning from Button, keep it on trigger */}
                <Button>
                  <PlusCircle className="mr-2 h-4 w-4" /> Add New Problem
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto"> {/* Adjust max width and height */}
                <DialogHeader>
                  <DialogTitle>Add New LeetCode Problem</DialogTitle>
                  <DialogDescription>
                    Enter the details of the LeetCode problem you solved.
                  </DialogDescription>
                </DialogHeader>
                {/* Pass onSuccess handler to close the modal */}
                <ProblemInputForm onSuccess={handleFormSuccess} />
              </DialogContent>
            </Dialog>
        </div>

        {/* Review list takes full width now */}
        <ReviewList />

      </main>
    </div>
  );
}
