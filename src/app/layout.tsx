import type {Metadata} from 'next';
import { Inter } from 'next/font/google'; // Use Inter font for a modern look
import './globals.css';
import { Toaster } from "@/components/ui/toaster"; // Import Toaster

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' }); // Configure Inter font

export const metadata: Metadata = {
  title: 'LeetReview - Your LeetCode Anki', // Update default title
  description: 'Schedule and review LeetCode problems using spaced repetition.', // Update description
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning={true}>
      {/* Ensure no whitespace or comments between <html> and <body> */}
      <body className={`${inter.variable} font-sans antialiased`}>
        {children}
        <Toaster /> {/* Add Toaster here to make it available globally */}
      </body>
    </html>
  );
}
