
'use client'; // Add 'use client' because useEffect runs client-side

import type { Metadata } from 'next';
import { Inter } from 'next/font/google'; // Use Inter font for a modern look
import './globals.css';
import { Toaster } from "@/components/ui/toaster"; // Import Toaster
import React, { useEffect } from 'react'; // Import useEffect
import { getFirebaseAnalytics } from '@/lib/firebase'; // Import Firebase Analytics initializer

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' }); // Configure Inter font

// Metadata can still be defined in client components, but won't be statically optimized
// export const metadata: Metadata = {
//   title: 'LeetReview - Your LeetCode Anki', // Update default title
//   description: 'Schedule and review LeetCode problems using spaced repetition.', // Update description
// };

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {

  // Initialize Firebase Analytics on component mount (client-side)
  useEffect(() => {
    getFirebaseAnalytics();
  }, []);


  return (
    <html lang="en" suppressHydrationWarning={true}>
      {/* Ensure no whitespace or comments between <html> and <body> */}
      <body className={`${inter.variable} font-sans antialiased`} suppressHydrationWarning={true}>
        {children}
        <Toaster /> {/* Add Toaster here to make it available globally */}
      </body>
    </html>
  );
}
