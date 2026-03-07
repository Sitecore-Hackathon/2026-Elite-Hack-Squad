"use client";

import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { PerformanceReport, TopAction } from "@/types/performance-report";
import { Target, TrendingUp } from "lucide-react";

interface PerformanceReportViewerProps {
  report: PerformanceReport;
}

const getScoreColor = (score: number): string => {
  if (score >= 90) return "text-green-600 dark:text-green-400";
  if (score >= 50) return "text-yellow-600 dark:text-yellow-400";
  return "text-red-600 dark:text-red-400";
};

const getScoreBg = (score: number): string => {
  if (score >= 90) return "bg-green-100 dark:bg-green-900/30";
  if (score >= 50) return "bg-yellow-100 dark:bg-yellow-900/30";
  return "bg-red-100 dark:bg-red-900/30";
};

function ScoreCircle({ score }: { score: number }) {
  return (
    <div className="flex flex-col items-center gap-2">
      <div
        className={`w-24 h-24 rounded-full flex items-center justify-center font-bold text-3xl ${getScoreBg(score)} ${getScoreColor(score)}`}
      >
        {score}
      </div>
      <span className="text-sm text-muted-foreground">Performance Score</span>
    </div>
  );
}

function ActionCard({ action, index }: { action: TopAction; index: number }) {
  const priorityColor = action.priority <= 2 ? "danger" : action.priority <= 4 ? "warning" : "neutral";
  
  return (
    <Card style="outline" padding="md" className="mb-3">
      <CardContent className="space-y-2">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3 flex-1">
            <div className={`flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold ${
              action.priority <= 2 ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' :
              action.priority <= 4 ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400' :
              'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400'
            }`}>
              {action.priority}
            </div>
            <div className="flex-1">
              <div className="font-medium text-sm">{action.title}</div>
              {action.lineNumber && (
                <p className="text-xs text-muted-foreground mt-1">
                  <span className="font-medium">Line ~{action.lineNumber}</span>
                </p>
              )}
              <p className="text-xs text-muted-foreground mt-1">
                <span className="font-medium">Impact: </span>
                {action.impact}
              </p>
              {action.codeSnippet && (
                <div className="mt-2 bg-muted p-2 rounded">
                  <div className="text-xs font-medium mb-1 text-muted-foreground">Code to improve:</div>
                  <pre className="text-xs overflow-x-auto max-w-full whitespace-pre-wrap break-all">
                    <code>{action.codeSnippet}</code>
                  </pre>
                </div>
              )}
              <div className="mt-2 bg-muted/50 p-2 rounded text-xs">
                <span className="font-medium">How to fix: </span>
                <span className="text-muted-foreground">{action.fix}</span>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function PerformanceReportViewer({ report }: PerformanceReportViewerProps) {
  return (
    <div className="space-y-6">
      {/* Overall Score */}
      <Card style="filled" padding="lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            Performance Analysis Report
          </CardTitle>
          <CardDescription>
            Pre-publication audit focusing on high-impact performance improvements
          </CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center py-4">
          <ScoreCircle score={report.overallScore || 0} />
        </CardContent>
      </Card>

      {/* Top Priority Actions */}
      <Card style="outline" padding="lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-blue-500" />
            Top Priority Actions
          </CardTitle>
          <CardDescription>
            Most impactful improvements ordered by priority
          </CardDescription>
        </CardHeader>
        <CardContent>
          {report.topActions && report.topActions.length > 0 ? (
            report.topActions.map((action, index) => (
              <ActionCard key={index} action={action} index={index} />
            ))
          ) : (
            <p className="text-sm text-muted-foreground text-center py-4">
              No specific actions recommended. Your page looks good!
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
