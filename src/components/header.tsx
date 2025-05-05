import { Code } from 'lucide-react';

export function Header() {
  return (
    <header className="bg-primary text-primary-foreground shadow-md">
      {/* Add suppressHydrationWarning here */}
      <div className="container mx-auto px-4 py-4 flex items-center" suppressHydrationWarning>
        {/* Add suppressHydrationWarning to the icon itself */}
        <Code className="h-8 w-8 mr-3 text-background" suppressHydrationWarning />
        <h1 className="text-2xl font-bold">LeetReview</h1>
        <span className="ml-2 text-sm opacity-80">Your LeetCode Anki</span>
      </div>
    </header>
  );
}
