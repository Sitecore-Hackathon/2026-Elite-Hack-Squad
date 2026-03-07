"use client";

import { PageHtmlViewer } from "@/components/examples/built-in-auth/page-html-viewer";

function PerformanceAnalyzer() {
  return (
    <div className="container mx-auto p-6 space-y-8 max-w-4xl">
      <div className="space-y-4">
        <h1 className="text-3xl font-semibold tracking-tight">
          Performance Analyzer
        </h1>
        <p className="text-muted-foreground">
          Analyze your Sitecore page performance by inspecting the rendered HTML.
        </p>
      </div>

      <PageHtmlViewer />
    </div>
  );
}

export default PerformanceAnalyzer;
