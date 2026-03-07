"use client"

import { useMarketplaceClient } from "@/components/providers/marketplace"
import { PerformanceReportViewer } from "@/components/performance-report-viewer"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { CardTitle } from "@/components/ui/card"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import { PerformanceReport } from "@/types/performance-report"
import {
  ChevronDown,
  ChevronRight,
  RefreshCw,
  Sparkles,
  FileText,
} from "lucide-react"
import { useEffect, useState } from "react"

interface PageContext {
  siteInfo?: {
    renderingEngineEndpointUrl?: string
    renderingEngineApplicationUrl?: string
    hostname?: string
    language?: string
    name?: string
    pointOfSale?: Array<{
      name?: string
      [key: string]: any
    }>
  }
  pageInfo?: {
    id?: string
    route?: string
    language?: string
    name?: string
    displayName?: string
    version?: number
  }
  editingSecret?: string
  tenantId?: string
}

export const PageHtmlViewer = () => {
  const client = useMarketplaceClient()
  const [pageContext, setPageContext] = useState<PageContext | null>(null)
  const [html, setHtml] = useState<string | null>(null)
  const [isExpanded, setIsExpanded] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [analyzing, setAnalyzing] = useState(false)
  const [report, setReport] = useState<PerformanceReport | null>(null)
  const [analysisError, setAnalysisError] = useState<string | null>(null)
  const [showHtml, setShowHtml] = useState(false)
  const [fetchUrl, setFetchUrl] = useState<string | null>(null)
  const [siteUrl, setSiteUrl] = useState<string>(process.env.NEXT_PUBLIC_SITE_URL || "")

  // Get page context on mount
  useEffect(() => {
    if (!client) return

    client.query("pages.context", {
      subscribe: true,
      onSuccess: (data) => {
        setPageContext(data)
        console.log("Page has been updated:", data)
      },
    })
  }, [client])

  // Auto-fetch HTML when page context changes and site URL is configured
  useEffect(() => {
    if (pageContext?.pageInfo?.id && siteUrl && siteUrl.trim() !== "") {
      fetchLayoutData()
    }
  }, [pageContext?.pageInfo?.id, pageContext?.pageInfo?.route, siteUrl])

  const fetchLayoutData = async () => {
    if (!pageContext?.pageInfo) {
      setError("Missing page context")
      return
    }

    if (!siteUrl || siteUrl.trim() === "") {
      setError("Please enter a website URL in the textbox above")
      return
    }

    setLoading(true)
    setError(null)

    try {
      // Get the page route from Sitecore context
      const pageRoute = pageContext.pageInfo.route || "/"

      // Construct the full URL from textbox input + page route
      const baseUrl = siteUrl.startsWith('http') ? siteUrl : `https://${siteUrl}`
      const fullUrl = `${baseUrl}${pageRoute}`

      // Store the URL for display in UI
      setFetchUrl(fullUrl)

      console.log("=".repeat(80))
      console.log("[page-html-viewer] 🌐 FETCHING HTML FROM PUBLIC WEBSITE")
      console.log("=".repeat(80))
      console.log("📍 Base URL (from textbox):", siteUrl)
      console.log("📍 Page Route (from context):", pageRoute)
      console.log("🎯 FULL URL:", fullUrl)
      console.log("=".repeat(80))

      // Fetch HTML from the public website
      const htmlResponse = await fetch("/api/fetch-html", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ url: fullUrl }),
      })

      const htmlData = await htmlResponse.json()

      if (htmlResponse.ok && htmlData.html) {
        setHtml(htmlData.html)
        setError(null)
        console.log("✅ HTML fetched successfully, length:", htmlData.html.length)
      } else {
        throw new Error(htmlData.error || htmlData.details || "Failed to fetch HTML from public website")
      }
    } catch (err: any) {
      console.error("❌ Error fetching HTML from public website:", err)
      setError(err.message || "Error fetching HTML. Please check the URL and try again.")
      setHtml(null)
    } finally {
      setLoading(false)
    }
  }

  const analyzeHtml = async () => {
    if (!html) {
      setAnalysisError("No HTML to analyze")
      return
    }

    setAnalyzing(true)
    setAnalysisError(null)
    setReport(null)

    try {
      console.log("Sending HTML for analysis, length:", html.length)

      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ html }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || `HTTP ${response.status}`)
      }

      if (data.success && data.report) {
        setReport(data.report)
        console.log("Analysis complete, report received")
      } else {
        throw new Error("Invalid response from analysis API")
      }
    } catch (err: any) {
      console.error("Error analyzing HTML:", err)
      setAnalysisError(err.message || "Error analyzing HTML")
    } finally {
      setAnalyzing(false)
    }
  }

  return (
    <Collapsible
      open={isExpanded}
      onOpenChange={setIsExpanded}
      className="rounded-lg border-[1px]"
    >
      <CollapsibleTrigger asChild>
        <div className="flex cursor-pointer items-center justify-between rounded-t-lg p-6 transition-colors hover:bg-muted/50">
          <div className="flex items-center gap-2">
            <CardTitle className="flex items-center gap-2">
              Page Performance Analyzer
            </CardTitle>
            <Badge colorScheme="primary">Public Website</Badge>
            <Badge colorScheme="success">Auto-sync</Badge>
          </div>
          {isExpanded ? (
            <ChevronDown className="h-4 w-4 transition-transform" />
          ) : (
            <ChevronRight className="h-4 w-4 transition-transform" />
          )}
        </div>
      </CollapsibleTrigger>
      <CollapsibleContent className="space-y-4 p-6 pt-0">
        {/* Site URL Input */}
        <div className="space-y-3 rounded-md bg-gray-50 dark:bg-gray-900 border-2 border-gray-300 dark:border-gray-700 p-4 shadow-md">
          <h4 className="text-sm font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
            🌐 Website URL Configuration
          </h4>
          <div className="space-y-2">
            <label htmlFor="site-url" className="text-xs font-semibold text-gray-700 dark:text-gray-300">
              Enter your published website URL:
            </label>
            <input
              id="site-url"
              type="text"
              value={siteUrl}
              onChange={(e) => setSiteUrl(e.target.value)}
              placeholder="https://your-site.vercel.app"
              className="w-full px-3 py-2 text-sm rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <p className="text-[10px] text-gray-600 dark:text-gray-400">
              💡 This URL will be used to fetch the rendered HTML for performance analysis
            </p>
          </div>
        </div>

        {/* Fetch URL Display with Details */}
        {fetchUrl && (
          <div className="space-y-3 rounded-md bg-blue-50 dark:bg-blue-950 border-2 border-blue-400 dark:border-blue-600 p-4 shadow-md">
            <h4 className="text-sm font-bold text-blue-900 dark:text-blue-100 flex items-center gap-2">
              🌐 Fetching from Public Website
            </h4>

            {/* Full URL */}
            <div className="bg-white dark:bg-gray-900 p-3 rounded border border-blue-200 dark:border-blue-700">
              <div className="text-[10px] text-blue-600 dark:text-blue-400 font-semibold mb-1">FULL URL:</div>
              <code className="block text-xs break-all text-blue-700 dark:text-blue-300 font-mono font-bold">{fetchUrl}</code>
            </div>

            {/* URL Breakdown */}
            <details className="text-xs">
              <summary className="cursor-pointer text-blue-700 dark:text-blue-300 hover:underline font-semibold">🔍 View URL Breakdown</summary>
              <div className="mt-3 space-y-2 bg-blue-100 dark:bg-blue-900 p-3 rounded">
                <div className="grid grid-cols-[120px_1fr] gap-2 text-[11px]">
                  <span className="font-semibold text-blue-800 dark:text-blue-200">📍 Base URL:</span>
                  <code className="text-blue-700 dark:text-blue-300">{siteUrl || 'N/A'}</code>

                  <span className="font-semibold text-blue-800 dark:text-blue-200">➕</span>
                  <span className="font-semibold text-blue-700 dark:text-blue-300">+</span>

                  <span className="font-semibold text-blue-800 dark:text-blue-200">📍 Page Route:</span>
                  <code className="text-blue-700 dark:text-blue-300">{pageContext?.pageInfo?.route || '/'}</code>

                  <span className="font-semibold text-blue-800 dark:text-blue-200">🔧 Sources:</span>
                  <span className="text-blue-700 dark:text-blue-300">Textbox + Sitecore Context</span>
                </div>
                <p className="text-xs text-yellow-700 dark:text-yellow-300 mt-2">
                  💡 Note: Base URL comes from the textbox, route comes from Sitecore context.
                </p>
              </div>
            </details>

            <p className="text-[10px] text-blue-600 dark:text-blue-400 mt-2">
              💡 The HTML from this URL will be analyzed for performance insights
            </p>
          </div>
        )}

        {pageContext?.siteInfo && !siteUrl && (
          <div className="space-y-3 rounded-md bg-yellow-50 dark:bg-yellow-950 border-2 border-yellow-400 dark:border-yellow-600 p-4 shadow-md">
            <h4 className="text-sm font-bold text-yellow-900 dark:text-yellow-100">⚠️ No Website URL Configured</h4>

            <div className="bg-yellow-100 dark:bg-yellow-900 p-3 rounded">
              <p className="text-xs text-yellow-800 dark:text-yellow-200 font-semibold mb-2">Website URL required</p>
              <p className="text-[11px] text-yellow-700 dark:text-yellow-300">
                Enter your published website URL in the textbox above to fetch HTML for performance analysis.
              </p>
              <p className="text-[10px] text-yellow-600 dark:text-yellow-400 mt-2 italic">
                Example: https://your-site.vercel.app
              </p>
            </div>

            <p className="text-xs text-yellow-700 dark:text-yellow-300 mt-2">
              📝 The system will combine your URL with the current page route: {pageContext.pageInfo?.route || "/"}
            </p>

            <details className="text-xs mt-2">
              <summary className="cursor-pointer text-yellow-600 dark:text-yellow-400 hover:underline font-semibold">🔍 How does this work?</summary>
              <div className="mt-2 text-[11px] text-yellow-700 dark:text-yellow-300 space-y-1">
                <p>The component fetches HTML by combining:</p>
                <ul className="list-disc list-inside ml-2 space-y-1">
                  <li><strong>Base URL</strong>: From the textbox (e.g., https://your-site.vercel.app)</li>
                  <li><strong>Page Route</strong>: From Sitecore context (e.g., /about)</li>
                  <li><strong>Result</strong>: https://your-site.vercel.app/about</li>
                </ul>
              </div>
            </details>
          </div>
        )}

        {/* Error Display */}
        {error && (
          <div className="rounded-md bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 p-4">
            <h4 className="text-sm font-medium text-red-900 dark:text-red-100 mb-2">⚠️ Error</h4>
            <p className="text-xs text-red-700 dark:text-red-300">{error}</p>
          </div>
        )}

        {/* Page Info Summary */}
        {pageContext?.pageInfo && (
          <div className="space-y-2 rounded-md bg-muted/50 p-4">
            <h4 className="text-sm font-medium">Current Page Info</h4>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <span className="text-muted-foreground">Name:</span>
              <span>
                {pageContext.pageInfo.displayName ||
                  pageContext.pageInfo.name ||
                  "N/A"}
              </span>
              <span className="text-muted-foreground">Route:</span>
              <span>{pageContext.pageInfo.route || "N/A"}</span>
              <span className="text-muted-foreground">Language:</span>
              <span>
                {pageContext.pageInfo.language ||
                  pageContext.siteInfo?.language ||
                  "N/A"}
              </span>
              <span className="text-muted-foreground">Page ID:</span>
              <span className="font-mono text-xs">
                {pageContext.pageInfo.id || "N/A"}
              </span>
              <span className="text-muted-foreground">Site:</span>
              <span>{pageContext.siteInfo?.name || "N/A"}</span>
              <span className="text-muted-foreground">Version:</span>
              <span>{pageContext.pageInfo.version || 1}</span>
              <span className="text-muted-foreground">Tenant ID:</span>
              <span className="font-mono text-xs">
                {pageContext.tenantId || "N/A"}
              </span>
            </div>
          </div>
        )}

        {/* Fetch Button */}
        <div className="flex flex-wrap items-center gap-2">
          <Button
            onClick={fetchLayoutData}
            disabled={loading || !pageContext?.pageInfo || !siteUrl}
            size="sm"
            variant="outline"
          >
            <RefreshCw
              className={`mr-2 h-4 w-4 ${loading ? "animate-spin" : ""}`}
            />
            {loading ? "Fetching..." : "Fetch HTML"}
          </Button>
          {html && (
            <>
              <Button
                onClick={analyzeHtml}
                disabled={analyzing || !html}
                size="sm"
                variant="default"
              >
                <Sparkles
                  className={`mr-2 h-4 w-4 ${analyzing ? "animate-pulse" : ""}`}
                />
                {analyzing ? "Analyzing..." : "Analyze Performance"}
              </Button>
              <Button
                onClick={() => setShowHtml(!showHtml)}
                size="sm"
                variant="ghost"
              >
                <FileText className="mr-2 h-4 w-4" />
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
          <div className="rounded-md bg-destructive/10 p-4 text-sm text-destructive">
            Error: {error}
          </div>
        )}

        {/* Analysis Error Display */}
        {analysisError && (
          <div className="rounded-md bg-destructive/10 p-4 text-sm text-destructive">
            Analysis Error: {analysisError}
          </div>
        )}

        {/* Analyzing Indicator */}
        {analyzing && (
          <div className="flex items-center gap-2 rounded-md bg-primary/10 p-4 text-sm text-primary">
            <Sparkles className="h-4 w-4 animate-pulse" />
            Analyzing HTML with AI... This may take a moment.
          </div>
        )}

        {/* Performance Report */}
        {report && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-lg font-medium">
                Performance Analysis Report
              </h4>
              <Badge colorScheme="success">AI Generated</Badge>
            </div>
            <PerformanceReportViewer report={report} />
          </div>
        )}

        {/* HTML Display */}
        {html && showHtml ? (
          <div className="space-y-2">
            <h4 className="text-sm font-medium">
              HTML from Public Website
            </h4>
            <pre className="max-h-[500px] overflow-auto rounded-md bg-muted p-4 text-xs break-all whitespace-pre-wrap">
              {html}
            </pre>
          </div>
        ) : !html && !error && !loading ? (
          <div className="text-sm text-muted-foreground">
            {pageContext
              ? siteUrl
                ? "Waiting to fetch HTML..."
                : "Enter a website URL to begin"
              : "Loading page context..."}
          </div>
        ) : null}
      </CollapsibleContent>
    </Collapsible>
  )
}
