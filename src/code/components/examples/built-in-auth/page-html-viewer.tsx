"use client";

import { useMarketplaceClient } from "@/components/providers/marketplace";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CardTitle } from "@/components/ui/card";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { ChevronDown, ChevronRight, RefreshCw } from "lucide-react";
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
        <div className="flex items-center gap-2">
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
            <span className="text-sm text-muted-foreground">
              {html.length.toLocaleString()} characters
            </span>
          )}
        </div>

        {/* Error Display */}
        {error && (
          <div className="bg-destructive/10 text-destructive p-4 rounded-md text-sm">
            Error: {error}
          </div>
        )}

        {/* HTML Display */}
        {html ? (
          <div className="space-y-2">
            <h4 className="font-medium text-sm">Page HTML</h4>
            <pre className="bg-muted p-4 rounded-md text-xs overflow-auto max-h-[500px] whitespace-pre-wrap break-all">
              {html}
            </pre>
          </div>
        ) : !error && !loading ? (
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
