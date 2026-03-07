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

interface LayoutComponent {
  componentName?: string;
  uid?: string;
  dataSource?: string;
  fields?: Record<string, any>;
  params?: Record<string, any>;
  placeholders?: Record<string, LayoutComponent[]>;
}

interface LayoutPlaceholder {
  [key: string]: LayoutComponent[];
}

interface LayoutData {
  sitecore?: {
    context?: {
      pageEditing?: boolean;
      site?: { name?: string };
      language?: string;
      itemPath?: string;
    };
    route?: {
      name?: string;
      displayName?: string;
      fields?: Record<string, any>;
      placeholders?: LayoutPlaceholder;
      itemId?: string;
      templateId?: string;
      templateName?: string;
      layoutId?: string;
    };
  };
}

export const PageHtmlViewer = () => {
  const client = useMarketplaceClient();
  const [pageContext, setPageContext] = useState<PageContext | null>(null);
  const [layoutData, setLayoutData] = useState<LayoutData | null>(null);
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

  // Fetch layout data when page context is available
  useEffect(() => {
    if (pageContext?.siteInfo && pageContext?.pageInfo?.id) {
      fetchLayoutData();
    }
  }, [pageContext]);

  // Build HTML from layout data
  const buildHtmlFromLayout = (layout: LayoutData, context: PageContext): string => {
    const siteName = context.siteInfo?.name || "Sitecore Site";
    const pageName = context.pageInfo?.displayName || context.pageInfo?.name || "Page";
    const language = context.pageInfo?.language || context.siteInfo?.language || "en";
    const route = layout.sitecore?.route;

    let componentsHtml = "";

    // Recursively render components from placeholders
    const renderComponents = (placeholders: LayoutPlaceholder | undefined, depth: number = 0): string => {
      if (!placeholders) return "";

      let html = "";
      const indent = "  ".repeat(depth + 2);

      for (const [placeholderName, components] of Object.entries(placeholders)) {
        html += `${indent}<div class="sc-placeholder" data-placeholder="${placeholderName}">\n`;

        for (const component of components || []) {
          html += renderComponent(component, depth + 1);
        }

        html += `${indent}</div>\n`;
      }

      return html;
    };

    const renderComponent = (component: LayoutComponent, depth: number = 0): string => {
      const indent = "  ".repeat(depth + 2);
      const componentName = component.componentName || "UnknownComponent";
      const uid = component.uid || "";

      let html = `${indent}<section class="sc-component" data-component="${componentName}" data-uid="${uid}">\n`;

      // Render component fields
      if (component.fields) {
        for (const [fieldName, fieldValue] of Object.entries(component.fields)) {
          html += renderField(fieldName, fieldValue, depth + 1);
        }
      }

      // Render nested placeholders
      if (component.placeholders) {
        html += renderComponents(component.placeholders, depth + 1);
      }

      html += `${indent}</section>\n`;
      return html;
    };

    const renderField = (fieldName: string, fieldValue: any, depth: number): string => {
      const indent = "  ".repeat(depth + 2);

      if (!fieldValue) return "";

      // Handle image fields
      if (fieldValue.value?.src || fieldValue.src) {
        const src = fieldValue.value?.src || fieldValue.src;
        const alt = fieldValue.value?.alt || fieldValue.alt || "";
        const width = fieldValue.value?.width || fieldValue.width || "";
        const height = fieldValue.value?.height || fieldValue.height || "";
        return `${indent}<img src="${src}" alt="${alt}" width="${width}" height="${height}" class="sc-image" data-field="${fieldName}" loading="lazy" />\n`;
      }

      // Handle link fields
      if (fieldValue.value?.href || fieldValue.href) {
        const href = fieldValue.value?.href || fieldValue.href;
        const text = fieldValue.value?.text || fieldValue.text || href;
        const target = fieldValue.value?.target || fieldValue.target || "";
        return `${indent}<a href="${href}" target="${target}" class="sc-link" data-field="${fieldName}">${text}</a>\n`;
      }

      // Handle rich text or text fields
      if (typeof fieldValue === "string") {
        return `${indent}<div class="sc-field" data-field="${fieldName}">${fieldValue}</div>\n`;
      }

      if (fieldValue.value && typeof fieldValue.value === "string") {
        return `${indent}<div class="sc-field" data-field="${fieldName}">${fieldValue.value}</div>\n`;
      }

      // Handle complex field values (render as JSON comment for analysis)
      if (typeof fieldValue === "object") {
        const jsonStr = JSON.stringify(fieldValue, null, 2).replace(/-->/g, "-- >");
        return `${indent}<!-- Field: ${fieldName} = ${jsonStr} -->\n`;
      }

      return "";
    };

    // Build components HTML from route placeholders
    if (route?.placeholders) {
      componentsHtml = renderComponents(route.placeholders);
    }

    // Build page fields HTML
    let pageFieldsHtml = "";
    if (route?.fields) {
      for (const [fieldName, fieldValue] of Object.entries(route.fields)) {
        pageFieldsHtml += renderField(fieldName, fieldValue, 1);
      }
    }

    // Build the full HTML document
    const htmlDocument = `<!DOCTYPE html>
<html lang="${language}">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${pageName} | ${siteName}</title>
  <meta name="description" content="Page: ${pageName}">
  <meta name="generator" content="Sitecore XM Cloud">
  <!-- Page ID: ${context.pageInfo?.id || "N/A"} -->
  <!-- Template: ${route?.templateName || "N/A"} -->
  <!-- Route: ${context.pageInfo?.route || "/"} -->
  <link rel="stylesheet" href="/styles/main.css">
</head>
<body>
  <div id="__next" data-site="${siteName}" data-language="${language}">
    <header class="site-header">
      <nav class="main-navigation">
        <a href="/" class="logo-link">${siteName}</a>
      </nav>
    </header>

    <main id="main-content" class="page-content" data-page-name="${pageName}" data-route="${context.pageInfo?.route || "/"}">
      <!-- Page Fields -->
      <div class="page-fields">
${pageFieldsHtml}
      </div>

      <!-- Page Components -->
      <div class="page-components">
${componentsHtml}
      </div>
    </main>

    <footer class="site-footer">
      <div class="footer-content">
        <p>&copy; ${new Date().getFullYear()} ${siteName}. All rights reserved.</p>
      </div>
    </footer>
  </div>

  <script src="/scripts/main.js" defer></script>
</body>
</html>`;

    return htmlDocument;
  };

  const fetchLayoutData = async () => {
    if (!pageContext?.siteInfo || !pageContext?.pageInfo) {
      setError("Missing page or site context");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      console.log("Fetching layout data from pages.layout...");

      // Try to get layout data from SDK
      const layoutResponse = await client.query("pages.layout");

      console.log("Layout data received:", layoutResponse.data);

      if (layoutResponse.data) {
        setLayoutData(layoutResponse.data);

        // Build HTML from layout data
        const generatedHtml = buildHtmlFromLayout(layoutResponse.data, pageContext);
        setHtml(generatedHtml);
        console.log("HTML generated from layout, length:", generatedHtml.length);
      } else {
        // If no layout data, generate a basic HTML structure from page context
        console.log("No layout data, generating from page context...");
        const basicHtml = buildHtmlFromLayout({ sitecore: { route: {} } }, pageContext);
        setHtml(basicHtml);
      }
    } catch (err: any) {
      console.error("Error fetching layout data:", err);

      // Fallback: generate HTML from page context only
      console.log("Fallback: generating HTML from page context only...");
      const fallbackHtml = buildHtmlFromLayout({ sitecore: { route: {} } }, pageContext);
      setHtml(fallbackHtml);
      console.log("Fallback HTML generated, length:", fallbackHtml.length);
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
              Page Performance Analyzer
            </CardTitle>
            <Badge colorScheme="primary">Layout Service</Badge>
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
            onClick={fetchLayoutData}
            disabled={loading || !pageContext?.siteInfo}
            size="sm"
            variant="outline"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
            {loading ? "Loading..." : "Refresh Layout"}
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
            <h4 className="font-medium text-sm">Generated HTML from Layout Service</h4>
            <pre className="bg-muted p-4 rounded-md text-xs overflow-auto max-h-[500px] whitespace-pre-wrap break-all">
              {html}
            </pre>
          </div>
        ) : !html && !error && !loading ? (
          <div className="text-muted-foreground text-sm">
            {pageContext
              ? "Loading layout data..."
              : "Loading page context..."}
          </div>
        ) : null}
      </CollapsibleContent>
    </Collapsible>
  );
};
