import { Metadata } from 'next';
import { ReviewList } from '@/components/review-list';
import { ProblemInputForm } from '@/components/problem-input-form';
import { Header } from '@/components/header';
import { Toaster } from '@/components/ui/toaster';

export const metadata: Metadata = {
  title: 'LeetReview - Your LeetCode Anki',
  description: 'Schedule and review LeetCode problems you have solved.',
};

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <Header />
      <main className="flex-grow container mx-auto px-4 py-8 flex flex-col md:flex-row gap-8">
        <div className="w-full md:w-1/3">
          <h2 className="text-2xl font-semibold mb-4 text-primary">Add New Problem</h2>
          <ProblemInputForm />
        </div>
        <div className="w-full md:w-2/3">
          <h2 className="text-2xl font-semibold mb-4 text-primary">Problems to Review</h2>
          <ReviewList />
        </div>
      </main>
      <Toaster />
    </div>
  );
}
