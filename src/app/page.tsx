
import { Header } from "@/components/header";
import { ProblemInputForm } from "@/components/problem-input-form";
import { ReviewList } from "@/components/review-list"; // Import the existing ReviewList component

// Define the main page component
export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main className="flex-grow container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Left column for input form */}
          <div className="md:col-span-1">
            <ProblemInputForm />
          </div>
          {/* Right column for review list */}
          <div className="md:col-span-2">
             <ReviewList />
          </div>
        </div>
      </main>
    </div>
  );
}
