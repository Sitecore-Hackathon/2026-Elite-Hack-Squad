"use client";

import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { PerformanceReport, Issue, QuickWin, CriticalImage, StrategicRecommendation } from "@/types/performance-report";
import { AlertCircle, AlertTriangle, CheckCircle, ChevronDown, ChevronRight, Image, Lightbulb, Map, Target, Zap } from "lucide-react";
import { useState } from "react";

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

const getStatusBadge = (status: string) => {
  const statusLower = status?.toLowerCase() || "";
  if (statusLower.includes("good") || statusLower.includes("pass")) {
    return <Badge colorScheme="success">{status}</Badge>;
  }
  if (statusLower.includes("needs improvement") || statusLower.includes("warning")) {
    return <Badge colorScheme="warning">{status}</Badge>;
  }
  return <Badge colorScheme="danger">{status}</Badge>;
};

const getSeverityBadge = (severity: string) => {
  const sevLower = severity?.toLowerCase() || "";
  if (sevLower === "critical" || sevLower === "high") {
    return <Badge colorScheme="danger">{severity}</Badge>;
  }
  if (sevLower === "medium" || sevLower === "moderate") {
    return <Badge colorScheme="warning">{severity}</Badge>;
  }
  return <Badge colorScheme="neutral">{severity}</Badge>;
};

const getPriorityBadge = (priority: string) => {
  if (priority === "P1") return <Badge colorScheme="danger">P1</Badge>;
  if (priority === "P2") return <Badge colorScheme="warning">P2</Badge>;
  return <Badge colorScheme="neutral">P3</Badge>;
};

function ScoreCircle({ score, label }: { score: number; label: string }) {
  return (
    <div className="flex flex-col items-center gap-2">
      <div
        className={`w-16 h-16 rounded-full flex items-center justify-center font-bold text-xl ${getScoreBg(score)} ${getScoreColor(score)}`}
      >
        {score}
      </div>
      <span className="text-sm text-muted-foreground">{label}</span>
    </div>
  );
}

function SectionCollapsible({
  title,
  icon,
  children,
  defaultOpen = true,
  badge,
}: {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  defaultOpen?: boolean;
  badge?: React.ReactNode;
}) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <CollapsibleTrigger asChild>
        <div className="flex items-center justify-between cursor-pointer hover:bg-muted/50 p-3 rounded-lg transition-colors">
          <div className="flex items-center gap-2">
            {icon}
            <span className="font-semibold">{title}</span>
            {badge}
          </div>
          {isOpen ? (
            <ChevronDown className="h-4 w-4" />
          ) : (
            <ChevronRight className="h-4 w-4" />
          )}
        </div>
      </CollapsibleTrigger>
      <CollapsibleContent className="px-3 pb-4">{children}</CollapsibleContent>
    </Collapsible>
  );
}

function IssueCard({ issue }: { issue: Issue }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <Card style="outline" padding="md" className="mb-3">
      <CardHeader>
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1">
            <CardTitle className="text-sm flex items-center gap-2">
              {getSeverityBadge(issue.severity)}
              {getPriorityBadge(issue.priority)}
              {issue.title}
            </CardTitle>
            <CardDescription className="mt-1">
              Line ~{issue.markupLineApprox} | {issue.selectorHint}
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <Collapsible open={expanded} onOpenChange={setExpanded}>
          <div className="space-y-2 text-sm">
            <div>
              <span className="font-medium">Problem: </span>
              <span className="text-muted-foreground">{issue.problem}</span>
            </div>
            <CollapsibleTrigger className="text-primary hover:underline text-sm">
              {expanded ? "Show less" : "Show details"}
            </CollapsibleTrigger>
          </div>
          <CollapsibleContent className="mt-3 space-y-3 text-sm">
            <div>
              <span className="font-medium">Why it matters: </span>
              <span className="text-muted-foreground">{issue.whyItMatters}</span>
            </div>
            <div>
              <span className="font-medium">Evidence: </span>
              <pre className="bg-muted p-2 rounded text-xs overflow-auto mt-1">
                {issue.evidenceSnippet}
              </pre>
            </div>
            <div>
              <span className="font-medium">Suggested fix: </span>
              <span className="text-muted-foreground">{issue.suggestedFix}</span>
            </div>
            {issue.fixExample && (
              <div>
                <span className="font-medium">Fix example: </span>
                <pre className="bg-muted p-2 rounded text-xs overflow-auto mt-1">
                  {issue.fixExample}
                </pre>
              </div>
            )}
            <div className="flex gap-2 flex-wrap">
              {issue.metricImpact?.map((impact, i) => (
                <Badge key={i} colorScheme="blue" size="sm">
                  {impact}
                </Badge>
              ))}
            </div>
          </CollapsibleContent>
        </Collapsible>
      </CardContent>
    </Card>
  );
}

function ImageCard({ image }: { image: CriticalImage }) {
  return (
    <Card style="outline" padding="sm" className="mb-2">
      <CardContent className="space-y-2 text-sm">
        <div className="flex items-center justify-between">
          <span className="font-medium">{image.id}</span>
          <Badge colorScheme={image.risk?.toLowerCase().includes("high") ? "danger" : "warning"}>
            {image.risk}
          </Badge>
        </div>
        <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
          <span className="text-muted-foreground">Role:</span>
          <span>{image.role}</span>
          <span className="text-muted-foreground">Format (path):</span>
          <span>{image.declaredFormatFromPath}</span>
          <span className="text-muted-foreground">Likely served:</span>
          <span>{image.likelyServedFormat}</span>
          <span className="text-muted-foreground">Dimensions:</span>
          <span>
            {image.declaredDimensions?.width || "?"} x {image.declaredDimensions?.height || "?"}
          </span>
          <span className="text-muted-foreground">Loading:</span>
          <span>{image.loading || "N/A"}</span>
          <span className="text-muted-foreground">fetchPriority:</span>
          <span>{image.fetchPriority || "N/A"}</span>
          <span className="text-muted-foreground">Weight:</span>
          <span>
            {image.weightBytes ? `${(image.weightBytes / 1024).toFixed(1)} KB` : image.weightStatus}
          </span>
        </div>
        <div className="text-xs text-muted-foreground mt-2">
          <span className="font-medium">Analysis: </span>
          {image.analysis}
        </div>
        <div className="text-xs">
          <span className="font-medium">Suggested fix: </span>
          <span className="text-muted-foreground">{image.suggestedFix}</span>
        </div>
      </CardContent>
    </Card>
  );
}

function QuickWinCard({ quickWin }: { quickWin: QuickWin }) {
  return (
    <div className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg">
      <Zap className="h-5 w-5 text-yellow-500 shrink-0 mt-0.5" />
      <div className="flex-1">
        <div className="font-medium text-sm">{quickWin.title}</div>
        <div className="text-xs text-muted-foreground mt-1">
          Effort: {quickWin.effort} | Line ~{quickWin.relatedLineApprox}
        </div>
        <div className="flex gap-1 mt-2 flex-wrap">
          {quickWin.impact?.map((imp, i) => (
            <Badge key={i} colorScheme="success" size="sm">
              {imp}
            </Badge>
          ))}
        </div>
      </div>
    </div>
  );
}

function StrategicRecommendationCard({ rec }: { rec: StrategicRecommendation }) {
  return (
    <Card style="outline" padding="sm" className="mb-2">
      <CardContent className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="font-medium text-sm">{rec.title}</span>
          {getPriorityBadge(rec.priority)}
        </div>
        <p className="text-xs text-muted-foreground">{rec.description}</p>
        <div className="flex gap-1 flex-wrap">
          {rec.expectedImpact?.map((impact, i) => (
            <Badge key={i} colorScheme="primary" size="sm">
              {impact}
            </Badge>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

export function PerformanceReportViewer({ report }: PerformanceReportViewerProps) {
  const scores = report.estimatedScores;
  const cwv = report.coreWebVitalsAssessment;

  return (
    <div className="space-y-6">
      {/* Report Meta */}
      <Card style="filled" padding="md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            Performance Analysis Report
          </CardTitle>
          <CardDescription>
            {report.reportMeta?.reportType} | {report.reportMeta?.scope} | {report.reportMeta?.analysisMode}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-xs text-muted-foreground space-y-1">
            <div>Confidence: {report.reportMeta?.confidence}</div>
            <div>Generated from: {report.reportMeta?.generatedFrom}</div>
            {report.reportMeta?.limitations && (
              <div className="mt-2">
                <span className="font-medium">Limitations: </span>
                <ul className="list-disc list-inside">
                  {report.reportMeta.limitations.map((lim, i) => (
                    <li key={i}>{lim}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Estimated Scores */}
      <Card style="outline" padding="lg">
        <CardHeader>
          <CardTitle>Estimated Scores</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex justify-around flex-wrap gap-4">
            <ScoreCircle score={scores?.performance || 0} label="Performance" />
            <ScoreCircle score={scores?.accessibility || 0} label="Accessibility" />
            <ScoreCircle score={scores?.bestPractices || 0} label="Best Practices" />
            <ScoreCircle score={scores?.seo || 0} label="SEO" />
          </div>
          {scores?.coreWebVitalsReadiness && (
            <div className="mt-6 pt-4 border-t">
              <h4 className="text-sm font-medium mb-3">Core Web Vitals Readiness</h4>
              <div className="flex justify-around flex-wrap gap-4">
                <ScoreCircle score={scores.coreWebVitalsReadiness.lcp || 0} label="LCP" />
                <ScoreCircle score={scores.coreWebVitalsReadiness.cls || 0} label="CLS" />
                <ScoreCircle score={scores.coreWebVitalsReadiness.inp || 0} label="INP" />
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Core Web Vitals Assessment */}
      <Card style="outline" padding="lg">
        <SectionCollapsible
          title="Core Web Vitals Assessment"
          icon={<Zap className="h-5 w-5 text-yellow-500" />}
        >
          <div className="space-y-4">
            {/* LCP */}
            {cwv?.lcp && (
              <div className="p-4 bg-muted/50 rounded-lg space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-semibold">LCP (Largest Contentful Paint)</span>
                  {getStatusBadge(cwv.lcp.status)}
                </div>
                <p className="text-sm text-muted-foreground">{cwv.lcp.summary}</p>
                {cwv.lcp.likelyDrivers?.length > 0 && (
                  <div>
                    <span className="text-xs font-medium">Likely drivers:</span>
                    <ul className="list-disc list-inside text-xs text-muted-foreground">
                      {cwv.lcp.likelyDrivers.map((d, i) => (
                        <li key={i}>{d}</li>
                      ))}
                    </ul>
                  </div>
                )}
                {cwv.lcp.recommendedActions?.length > 0 && (
                  <div>
                    <span className="text-xs font-medium">Recommended actions:</span>
                    <ul className="list-disc list-inside text-xs text-muted-foreground">
                      {cwv.lcp.recommendedActions.map((a, i) => (
                        <li key={i}>{a}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}

            {/* CLS */}
            {cwv?.cls && (
              <div className="p-4 bg-muted/50 rounded-lg space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-semibold">CLS (Cumulative Layout Shift)</span>
                  {getStatusBadge(cwv.cls.status)}
                </div>
                <p className="text-sm text-muted-foreground">{cwv.cls.summary}</p>
                {cwv.cls.likelyDrivers?.length > 0 && (
                  <div>
                    <span className="text-xs font-medium">Likely drivers:</span>
                    <ul className="list-disc list-inside text-xs text-muted-foreground">
                      {cwv.cls.likelyDrivers.map((d, i) => (
                        <li key={i}>{d}</li>
                      ))}
                    </ul>
                  </div>
                )}
                {cwv.cls.recommendedActions?.length > 0 && (
                  <div>
                    <span className="text-xs font-medium">Recommended actions:</span>
                    <ul className="list-disc list-inside text-xs text-muted-foreground">
                      {cwv.cls.recommendedActions.map((a, i) => (
                        <li key={i}>{a}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}

            {/* INP */}
            {cwv?.inp && (
              <div className="p-4 bg-muted/50 rounded-lg space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-semibold">INP (Interaction to Next Paint)</span>
                  {getStatusBadge(cwv.inp.status)}
                </div>
                <p className="text-sm text-muted-foreground">{cwv.inp.summary}</p>
                {cwv.inp.likelyDrivers?.length > 0 && (
                  <div>
                    <span className="text-xs font-medium">Likely drivers:</span>
                    <ul className="list-disc list-inside text-xs text-muted-foreground">
                      {cwv.inp.likelyDrivers.map((d, i) => (
                        <li key={i}>{d}</li>
                      ))}
                    </ul>
                  </div>
                )}
                {cwv.inp.recommendedActions?.length > 0 && (
                  <div>
                    <span className="text-xs font-medium">Recommended actions:</span>
                    <ul className="list-disc list-inside text-xs text-muted-foreground">
                      {cwv.inp.recommendedActions.map((a, i) => (
                        <li key={i}>{a}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </div>
        </SectionCollapsible>
      </Card>

      {/* Image Analysis */}
      {report.imageAnalysis && (
        <Card style="outline" padding="lg">
          <SectionCollapsible
            title="Image Analysis"
            icon={<Image className="h-5 w-5 text-blue-500" />}
            badge={
              <Badge colorScheme="blue">
                {report.imageAnalysis.criticalImages?.length || 0} critical
              </Badge>
            }
          >
            <div className="space-y-4">
              {/* Summary */}
              {report.imageAnalysis.summary && (
                <div className="p-4 bg-muted/50 rounded-lg space-y-2 text-sm">
                  <div className="grid grid-cols-2 gap-2">
                    <span className="text-muted-foreground">Total images:</span>
                    <span>{report.imageAnalysis.summary.totalImagePattern}</span>
                    <span className="text-muted-foreground">Above-the-fold critical:</span>
                    <span>{report.imageAnalysis.summary.aboveTheFoldCriticalImages}</span>
                    <span className="text-muted-foreground">Below-the-fold:</span>
                    <span>{report.imageAnalysis.summary.belowTheFoldImages}</span>
                    <span className="text-muted-foreground">Modern formats likely:</span>
                    <span>{report.imageAnalysis.summary.likelyServedModernFormats ? "Yes" : "No"}</span>
                  </div>
                  {report.imageAnalysis.summary.formatAssessment && (
                    <div className="mt-2 space-y-1">
                      {report.imageAnalysis.summary.formatAssessment.good?.length > 0 && (
                        <div className="flex items-start gap-2">
                          <CheckCircle className="h-4 w-4 text-green-500 shrink-0 mt-0.5" />
                          <span className="text-xs">{report.imageAnalysis.summary.formatAssessment.good.join(", ")}</span>
                        </div>
                      )}
                      {report.imageAnalysis.summary.formatAssessment.concerns?.length > 0 && (
                        <div className="flex items-start gap-2">
                          <AlertTriangle className="h-4 w-4 text-yellow-500 shrink-0 mt-0.5" />
                          <span className="text-xs">{report.imageAnalysis.summary.formatAssessment.concerns.join(", ")}</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Critical Images */}
              {report.imageAnalysis.criticalImages?.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium mb-2">Critical Images</h4>
                  {report.imageAnalysis.criticalImages.map((img, i) => (
                    <ImageCard key={i} image={img} />
                  ))}
                </div>
              )}

              {/* Format Recommendations */}
              {report.imageAnalysis.formatRecommendations?.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium mb-2">Format Recommendations</h4>
                  <div className="space-y-2">
                    {report.imageAnalysis.formatRecommendations.map((rec, i) => (
                      <div key={i} className="p-3 bg-muted/50 rounded text-sm">
                        <div className="font-medium">{rec.issue}</div>
                        <div className="text-muted-foreground text-xs mt-1">{rec.recommendation}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </SectionCollapsible>
        </Card>
      )}

      {/* Issues */}
      {report.issues?.length > 0 && (
        <Card style="outline" padding="lg">
          <SectionCollapsible
            title="Issues Detected"
            icon={<AlertCircle className="h-5 w-5 text-red-500" />}
            badge={<Badge colorScheme="danger">{report.issues.length}</Badge>}
          >
            <div>
              {report.issues.map((issue, i) => (
                <IssueCard key={i} issue={issue} />
              ))}
            </div>
          </SectionCollapsible>
        </Card>
      )}

      {/* Quick Wins */}
      {report.quickWins?.length > 0 && (
        <Card style="outline" padding="lg">
          <SectionCollapsible
            title="Quick Wins"
            icon={<Lightbulb className="h-5 w-5 text-green-500" />}
            badge={<Badge colorScheme="success">{report.quickWins.length}</Badge>}
          >
            <div className="space-y-2">
              {report.quickWins.map((qw, i) => (
                <QuickWinCard key={i} quickWin={qw} />
              ))}
            </div>
          </SectionCollapsible>
        </Card>
      )}

      {/* Strategic Recommendations */}
      {report.strategicRecommendations?.length > 0 && (
        <Card style="outline" padding="lg">
          <SectionCollapsible
            title="Strategic Recommendations"
            icon={<Target className="h-5 w-5 text-purple-500" />}
            badge={<Badge colorScheme="primary">{report.strategicRecommendations.length}</Badge>}
          >
            <div>
              {report.strategicRecommendations.map((rec, i) => (
                <StrategicRecommendationCard key={i} rec={rec} />
              ))}
            </div>
          </SectionCollapsible>
        </Card>
      )}

      {/* Priority Roadmap */}
      {report.priorityRoadmap && (
        <Card style="outline" padding="lg">
          <SectionCollapsible
            title="Priority Roadmap"
            icon={<Map className="h-5 w-5 text-indigo-500" />}
          >
            <div className="space-y-4">
              {/* P1 */}
              {report.priorityRoadmap.P1?.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Badge colorScheme="danger">P1</Badge>
                    <span className="text-sm font-medium">Critical - Fix Immediately</span>
                  </div>
                  <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
                    {report.priorityRoadmap.P1.map((item, i) => (
                      <li key={i}>{item}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* P2 */}
              {report.priorityRoadmap.P2?.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Badge colorScheme="warning">P2</Badge>
                    <span className="text-sm font-medium">Important - Fix Soon</span>
                  </div>
                  <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
                    {report.priorityRoadmap.P2.map((item, i) => (
                      <li key={i}>{item}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* P3 */}
              {report.priorityRoadmap.P3?.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Badge colorScheme="neutral">P3</Badge>
                    <span className="text-sm font-medium">Nice to Have</span>
                  </div>
                  <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
                    {report.priorityRoadmap.P3.map((item, i) => (
                      <li key={i}>{item}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </SectionCollapsible>
        </Card>
      )}

      {/* Next Step Recommendation */}
      {report.nextStepRecommendation && (
        <Card style="filled" padding="md" className="bg-primary/5 border-primary/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-primary">
              <Target className="h-5 w-5" />
              Recommended Next Step
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <p className="font-medium">{report.nextStepRecommendation.bestNextAction}</p>
              <p className="text-sm text-muted-foreground">{report.nextStepRecommendation.why}</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
