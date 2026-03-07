"use client";

import { useMarketplaceClient } from "@/components/providers/marketplace";
import { PerformanceReportViewer } from "@/components/performance-report-viewer";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CardTitle } from "@/components/ui/card";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { PerformanceReport } from "@/types/performance-report";
import { ChevronDown, ChevronRight, RefreshCw, Sparkles, FileText } from "lucide-react";
import { useEffect, useState } from "react";

interface PageContext {
  siteInfo?: {
    renderingEngineEndpointUrl?: string;
    renderingEngineApplicationUrl?: string;
    language?: string;
    name?: string;
  };
  pageInfo?: {
    id?: string;
    route?: string;
    language?: string;
    name?: string;
    displayName?: string;
    version?: number;
  };
  editingSecret?: string;
  tenantId?: string;
}

export const PageHtmlViewer = () => {
  const client = useMarketplaceClient();
  const [pageContext, setPageContext] = useState<PageContext | null>(null);
  const [html, setHtml] = useState<string | null>(null);
  const [isExpanded, setIsExpanded] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [report, setReport] = useState<PerformanceReport | null>(null);
  const [analysisError, setAnalysisError] = useState<string | null>(null);
  const [showHtml, setShowHtml] = useState(false);

  // Get page context on mount
  useEffect(() => {
    client
      .query("pages.context")
      .then((res) => {
        console.log("Page context for HTML viewer:", res.data);
        if (res.data) {
          setPageContext(res.data);
        }
      })
      .catch((err) => {
        console.error("Error retrieving pages.context:", err);
        setError(err.message || "Error retrieving page context");
      });
  }, [client]);

  // Fetch HTML when page context is available
  useEffect(() => {
    if (pageContext?.siteInfo && pageContext?.pageInfo?.id) {
      fetchPageHtml();
    }
  }, [pageContext]);

  const fetchPageHtml = async () => {
    if (!pageContext?.siteInfo || !pageContext?.pageInfo) {
      setError("Missing page or site context");
      return;
    }

    const { renderingEngineEndpointUrl, renderingEngineApplicationUrl, name: siteName, language: siteLanguage } = pageContext.siteInfo;
    const { route, language, id, version } = pageContext.pageInfo;
    const { editingSecret, tenantId } = pageContext;

    // Use rendering engine endpoint URL as base
    const baseUrl = renderingEngineEndpointUrl || renderingEngineApplicationUrl;

    if (!baseUrl) {
      setError("No rendering engine URL available in page context");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Build the editing render API URL
      // Format: {baseUrl}/api/editing/render?sc_itemid=...&sc_lang=...&sc_site=...
      const url = new URL("/api/editing/render", baseUrl);

      // Set required parameters from page context
      if (id) {
        url.searchParams.set("sc_itemid", id);
      }

      url.searchParams.set("sc_lang", language || siteLanguage || "en");

      if (siteName) {
        url.searchParams.set("sc_site", siteName);
      }

      url.searchParams.set("sc_layoutKind", "final");
      url.searchParams.set("mode", "edit");

      if (editingSecret) {
        url.searchParams.set("secret", editingSecret);
      }

      if (route) {
        url.searchParams.set("route", route);
      }

      if (tenantId) {
        url.searchParams.set("tenant_id", tenantId);
      }

      url.searchParams.set("sc_version", String(version || 1));

      console.log("Fetching HTML from Editing API:", url.toString());

      const response = await fetch(url.toString(), {
        method: "GET",
        headers: {
          Accept: "text/html",
        },
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const htmlContent = await response.text();
      setHtml(htmlContent);
      console.log("HTML fetched successfully, length:", htmlContent.length);
    } catch (err: any) {
      console.error("Error fetching page HTML:", err);
      setError(err.message || "Error fetching page HTML");
    } finally {
      setLoading(false);
    }
  };

  const analyzeHtml = async () => {
    if (!html) {
      setAnalysisError("No HTML to analyze");
      return;
    }

    setAnalyzing(true);
    setAnalysisError(null);
    setReport(null);

    try {
      console.log("Sending HTML for analysis, length:", html.length);

      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ html }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || `HTTP ${response.status}`);
      }

      if (data.success && data.report) {
        setReport(data.report);
        console.log("Analysis complete, report received");
      } else {
        throw new Error("Invalid response from analysis API");
      }
    } catch (err: any) {
      console.error("Error analyzing HTML:", err);
      setAnalysisError(err.message || "Error analyzing HTML");
    } finally {
      setAnalyzing(false);
    }
  };

  return (
    <Collapsible
      open={isExpanded}
      onOpenChange={setIsExpanded}
      className="border-[1px] rounded-lg"
    >
      <CollapsibleTrigger asChild>
        <div className="flex items-center justify-between cursor-pointer hover:bg-muted/50 p-6 rounded-t-lg transition-colors">
          <div className="flex items-center gap-2">
            <CardTitle className="flex items-center gap-2">
              Page HTML Viewer
            </CardTitle>
            <Badge colorScheme="primary">Editing API</Badge>
            <Badge colorScheme="success">Auto-fetch</Badge>
          </div>
          {isExpanded ? (
            <ChevronDown className="h-4 w-4 transition-transform" />
          ) : (
            <ChevronRight className="h-4 w-4 transition-transform" />
          )}
        </div>
      </CollapsibleTrigger>
      <CollapsibleContent className="p-6 pt-0 space-y-4">
        {/* Page Info Summary */}
        {pageContext?.pageInfo && (
          <div className="bg-muted/50 p-4 rounded-md space-y-2">
            <h4 className="font-medium text-sm">Current Page Info</h4>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <span className="text-muted-foreground">Name:</span>
              <span>{pageContext.pageInfo.displayName || pageContext.pageInfo.name || "N/A"}</span>
              <span className="text-muted-foreground">Route:</span>
              <span>{pageContext.pageInfo.route || "N/A"}</span>
              <span className="text-muted-foreground">Language:</span>
              <span>{pageContext.pageInfo.language || pageContext.siteInfo?.language || "N/A"}</span>
              <span className="text-muted-foreground">Page ID:</span>
              <span className="text-xs font-mono">{pageContext.pageInfo.id || "N/A"}</span>
              <span className="text-muted-foreground">Site:</span>
              <span>{pageContext.siteInfo?.name || "N/A"}</span>
              <span className="text-muted-foreground">Version:</span>
              <span>{pageContext.pageInfo.version || 1}</span>
              <span className="text-muted-foreground">Tenant ID:</span>
              <span className="text-xs font-mono">{pageContext.tenantId || "N/A"}</span>
            </div>
          </div>
        )}

        {/* Refresh Button */}
        <div className="flex items-center gap-2 flex-wrap">
          <Button
            onClick={fetchPageHtml}
            disabled={loading || !pageContext?.siteInfo}
            size="sm"
            variant="outline"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
            {loading ? "Fetching..." : "Refresh HTML"}
          </Button>
          {html && (
            <>
              <Button
                onClick={analyzeHtml}
                disabled={analyzing || !html}
                size="sm"
                variant="default"
              >
                <Sparkles className={`h-4 w-4 mr-2 ${analyzing ? "animate-pulse" : ""}`} />
                {analyzing ? "Analyzing..." : "Analyze Performance"}
              </Button>
              <Button
                onClick={() => setShowHtml(!showHtml)}
                size="sm"
                variant="ghost"
              >
                <FileText className="h-4 w-4 mr-2" />
                {showHtml ? "Hide HTML" : "Show HTML"}
              </Button>
              <span className="text-sm text-muted-foreground">
                {html.length.toLocaleString()} characters
              </span>
            </>
          )}
        </div>

        {/* Error Display */}
        {error && (
          <div className="bg-destructive/10 text-destructive p-4 rounded-md text-sm">
            Error: {error}
          </div>
        )}

        {/* Analysis Error Display */}
        {analysisError && (
          <div className="bg-destructive/10 text-destructive p-4 rounded-md text-sm">
            Analysis Error: {analysisError}
          </div>
        )}

        {/* Analyzing Indicator */}
        {analyzing && (
          <div className="bg-primary/10 text-primary p-4 rounded-md text-sm flex items-center gap-2">
            <Sparkles className="h-4 w-4 animate-pulse" />
            Analyzing HTML with AI... This may take a moment.
          </div>
        )}

        {/* Performance Report */}
        {report && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="font-medium text-lg">Performance Analysis Report</h4>
              <Badge colorScheme="success">AI Generated</Badge>
            </div>
            <PerformanceReportViewer report={report} />
          </div>
        )}

        {/* HTML Display */}
        {html && showHtml ? (
          <div className="space-y-2">
            <h4 className="font-medium text-sm">Page HTML</h4>
            <pre className="bg-muted p-4 rounded-md text-xs overflow-auto max-h-[500px] whitespace-pre-wrap break-all">
              {html}
            </pre>
          </div>
        ) : !html && !error && !loading ? (
          <div className="text-muted-foreground text-sm">
            {pageContext
              ? "Waiting for rendering engine URL..."
              : "Loading page context..."}
          </div>
        ) : null}
      </CollapsibleContent>
    </Collapsible>
  );
};
