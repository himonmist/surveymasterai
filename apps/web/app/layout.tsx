import type { Metadata } from "next";
import { AuthSessionProvider } from "@/components/session-provider";
import "./globals.css";

export const metadata: Metadata = {
  title: "SurveyMasterAI — Create Smarter Surveys. Discover Better Insights.",
  description:
    "SurveyMasterAI is an AI-powered survey, research and analytics platform. Create, publish, analyze and understand every survey with AI.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-gray-50 font-sans antialiased">
        <AuthSessionProvider>{children}</AuthSessionProvider>
      </body>
    </html>
  );
}
