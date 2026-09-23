import "@fontsource/jetbrains-mono/400.css";
import "@fontsource/jetbrains-mono/500.css";
import "@fontsource/jetbrains-mono/600.css";
import "@fontsource/jetbrains-mono/700.css";
import "./globals.css";

import type { Metadata } from "next";
import { Toaster } from "react-hot-toast";

import QueryProvider from "@/components/providers/QueryProvider";

export const metadata: Metadata = {
  title: "Critiq",
  description:
    "AI-assisted code review — every pull request reviewed before a human reads it.",
};

const RootLayout = ({ children }: { children: React.ReactNode }) => {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="flex min-h-full flex-col">
        <QueryProvider>
          {children}
          <Toaster position="top-right" />
        </QueryProvider>
      </body>
    </html>
  );
};

export default RootLayout;
