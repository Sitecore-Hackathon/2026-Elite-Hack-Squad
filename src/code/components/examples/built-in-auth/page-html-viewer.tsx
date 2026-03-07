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

interface LayoutComponent {
  componentName?: string
  uid?: string
  dataSource?: string
  fields?: Record<string, any>
  params?: Record<string, any>
  placeholders?: Record<string, LayoutComponent[]>
}

interface LayoutPlaceholder {
  [key: string]: LayoutComponent[]
}

interface LayoutData {
  sitecore?: {
    context?: {
      pageEditing?: boolean
      site?: { name?: string }
      language?: string
      itemPath?: string
    }
    route?: {
      name?: string
      displayName?: string
      fields?: Record<string, any>
      placeholders?: LayoutPlaceholder
      itemId?: string
      templateId?: string
      templateName?: string
      layoutId?: string
    }
  }
}

export const PageHtmlViewer = () => {
  const client = useMarketplaceClient()
  const [pageContext, setPageContext] = useState<PageContext | null>(null)
  const [layoutData, setLayoutData] = useState<LayoutData | null>(null)
  const [html, setHtml] = useState<string | null>(null)
  const [isExpanded, setIsExpanded] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [analyzing, setAnalyzing] = useState(false)
  const [report, setReport] = useState<PerformanceReport | null>(null)
  const [analysisError, setAnalysisError] = useState<string | null>(null)
  const [showHtml, setShowHtml] = useState(false)
  const [fetchUrl, setFetchUrl] = useState<string | null>(null)

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

  // Fetch layout data when page context is available
  useEffect(() => {
    if (pageContext?.siteInfo && pageContext?.pageInfo?.id) {
      fetchLayoutData()
    }
  }, [pageContext])

  // Build HTML from layout data
  const buildHtmlFromLayout = (
    layout: LayoutData,
    context: PageContext
  ): string => {
    const siteName = context.siteInfo?.name || "Sitecore Site"
    const pageName =
      context.pageInfo?.displayName || context.pageInfo?.name || "Page"
    const language =
      context.pageInfo?.language || context.siteInfo?.language || "en"
    const route = layout.sitecore?.route

    let componentsHtml = ""

    // Recursively render components from placeholders
    const renderComponents = (
      placeholders: LayoutPlaceholder | undefined,
      depth: number = 0
    ): string => {
      if (!placeholders) return ""

      let html = ""
      const indent = "  ".repeat(depth + 2)

      for (const [placeholderName, components] of Object.entries(
        placeholders
      )) {
        html += `${indent}<div class="sc-placeholder" data-placeholder="${placeholderName}">\n`

        for (const component of components || []) {
          html += renderComponent(component, depth + 1)
        }

        html += `${indent}</div>\n`
      }

      return html
    }

    const renderComponent = (
      component: LayoutComponent,
      depth: number = 0
    ): string => {
      const indent = "  ".repeat(depth + 2)
      const componentName = component.componentName || "UnknownComponent"
      const uid = component.uid || ""

      let html = `${indent}<section class="sc-component" data-component="${componentName}" data-uid="${uid}">\n`

      // Render component fields
      if (component.fields) {
        for (const [fieldName, fieldValue] of Object.entries(
          component.fields
        )) {
          html += renderField(fieldName, fieldValue, depth + 1)
        }
      }

      // Render nested placeholders
      if (component.placeholders) {
        html += renderComponents(component.placeholders, depth + 1)
      }

      html += `${indent}</section>\n`
      return html
    }

    const renderField = (
      fieldName: string,
      fieldValue: any,
      depth: number
    ): string => {
      const indent = "  ".repeat(depth + 2)

      if (!fieldValue) return ""

      // Log field structure for debugging
      console.log(`Rendering field "${fieldName}":`, JSON.stringify(fieldValue, null, 2))

      // Handle image fields - check both direct and nested value
      const imageValue = fieldValue.value || fieldValue
      if (imageValue?.src) {
        const src = imageValue.src || ""
        const alt = imageValue.alt || ""
        const width = imageValue.width || ""
        const height = imageValue.height || ""
        return `${indent}<img src="${src}" alt="${alt}" width="${width}" height="${height}" class="sc-image" data-field="${fieldName}" loading="lazy" />\n`
      }

      // Handle link fields - check both direct and nested value
      const linkValue = fieldValue.value || fieldValue
      if (linkValue?.href) {
        const href = linkValue.href || ""
        const text = linkValue.text || linkValue.title || href
        const target = linkValue.target || ""
        const className = linkValue.class || ""
        return `${indent}<a href="${href}" target="${target}" class="sc-link ${className}" data-field="${fieldName}">${text}</a>\n`
      }

      // Handle rich text or text fields with editable wrapper
      if (fieldValue.editable && typeof fieldValue.editable === "string") {
        // In editing mode, Sitecore wraps content with editable wrapper
        return `${indent}<div class="sc-field" data-field="${fieldName}">${fieldValue.editable}</div>\n`
      }

      // Handle rich text or text fields - string value directly
      if (typeof fieldValue === "string" && fieldValue.trim() !== "") {
        return `${indent}<div class="sc-field" data-field="${fieldName}">${fieldValue}</div>\n`
      }

      // Handle nested value property (common in Sitecore)
      if (fieldValue.value !== undefined && fieldValue.value !== null) {
        const innerValue = fieldValue.value
        
        // If value is a non-empty string
        if (typeof innerValue === "string" && innerValue.trim() !== "") {
          return `${indent}<div class="sc-field" data-field="${fieldName}">${innerValue}</div>\n`
        }
        
        // If value is a number or boolean
        if (typeof innerValue === "number" || typeof innerValue === "boolean") {
          return `${indent}<div class="sc-field" data-field="${fieldName}">${innerValue}</div>\n`
        }
        
        // If value is an object (could be image, link, or other complex type)
        if (typeof innerValue === "object" && innerValue !== null) {
          // Try to render as structured data
          const jsonStr = JSON.stringify(innerValue, null, 2).replace(/-->/g, "-- >")
          return `${indent}<!-- Field: ${fieldName} = ${jsonStr} -->\n`
        }
      }

      // Handle array values (multi-list fields, etc.)
      if (Array.isArray(fieldValue)) {
        if (fieldValue.length > 0) {
          const items = fieldValue.map(item => {
            if (typeof item === "string") return `<li>${item}</li>`
            if (item.value) return `<li>${item.value}</li>`
            return `<li>${JSON.stringify(item)}</li>`
          }).join("\n" + indent + "  ")
          return `${indent}<ul class="sc-field-list" data-field="${fieldName}">\n${indent}  ${items}\n${indent}</ul>\n`
        }
      }

      // Handle number or boolean fields
      if (typeof fieldValue === "number" || typeof fieldValue === "boolean") {
        return `${indent}<div class="sc-field" data-field="${fieldName}">${fieldValue}</div>\n`
      }

      // Handle complex field values (render as JSON comment for analysis)
      if (typeof fieldValue === "object") {
        const jsonStr = JSON.stringify(fieldValue, null, 2).replace(
          /-->/g,
          "-- >"
        )
        return `${indent}<!-- Field: ${fieldName} = ${jsonStr} -->\n`
      }

      return ""
    }

    // Build components HTML from route placeholders
    if (route?.placeholders) {
      console.log("Route placeholders:", JSON.stringify(route.placeholders, null, 2))
      componentsHtml = renderComponents(route.placeholders)
    }

    // Build page fields HTML
    let pageFieldsHtml = ""
    if (route?.fields) {
      console.log("Route fields:", JSON.stringify(route.fields, null, 2))
      for (const [fieldName, fieldValue] of Object.entries(route.fields)) {
        pageFieldsHtml += renderField(fieldName, fieldValue, 1)
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
</html>`

    return htmlDocument
  }

  const fetchLayoutData = async () => {
    if (!pageContext?.siteInfo || !pageContext?.pageInfo) {
      setError("Missing page or site context")
      return
    }

    setLoading(true)
    setError(null)

    try {
      console.log("Fetching layout data from pages.layout...")

      // Try to get layout data from SDK
      const layoutResponse = await client.query("pages.layout")

      console.log("Layout data received:", layoutResponse.data)

      if (layoutResponse.data) {
        setLayoutData(layoutResponse.data)
      }

      // Fetch the actual rendered HTML from the page
      const pageRoute = pageContext.pageInfo?.route || "/"
      
      // Get public domain from pointOfSale (where Sitecore stores the public URL)
      // pointOfSale[0].name contains the site name, not the public domain
      // We need to find the actual public URL in the context or use environment variable
      const pointOfSaleInfo = pageContext.siteInfo?.pointOfSale?.[0]
      
      console.log("[page-html-viewer] Looking for public domain...")
      console.log("[page-html-viewer] Full pointOfSale object:", pointOfSaleInfo)
      console.log("[page-html-viewer] Full siteInfo:", pageContext.siteInfo)
      
      // Get public domain - Sitecore context doesn't contain the public Vercel URL
      // Use environment variable as the source of truth for production URL
      const publicDomain = process.env.NEXT_PUBLIC_SITE_URL || null
      
      console.log("[page-html-viewer] Public domain found:", publicDomain)
      console.log("[page-html-viewer] Site name (pointOfSale.name):", pointOfSaleInfo?.name)
      
      if (publicDomain) {
        // Ensure URL starts with http/https
        const baseUrl = publicDomain.startsWith('http') ? publicDomain : `https://${publicDomain}`
        const fullUrl = baseUrl + pageRoute
        
        // Store the URL for display in UI
        setFetchUrl(fullUrl)
        
        console.log("=".repeat(80))
        console.log("[page-html-viewer] 🌐 ATTEMPTING TO FETCH HTML")
        console.log("=".repeat(80))
        console.log("📍 Public Domain:", publicDomain)
        console.log("📍 Base URL:", baseUrl)
        console.log("📍 Page Route:", pageRoute)
        console.log("🎯 FULL ENDPOINT:", fullUrl)
        console.log("=".repeat(80))
        
        try {
          const htmlResponse = await fetch("/api/fetch-html", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ 
              url: fullUrl
            }),
          })

          const htmlData = await htmlResponse.json()

          if (htmlResponse.ok && htmlData.html) {
            setHtml(htmlData.html)
            setError(null) // Clear any previous errors
            console.log("HTML fetched successfully, length:", htmlData.html.length)
          } else {
            throw new Error(htmlData.error || htmlData.details || "Failed to fetch HTML")
          }
        } catch (fetchError: any) {
          console.error("[page-html-viewer] Fetch error details:", {
            message: fetchError.message,
            url: fullUrl,
            error: fetchError
          })
          console.warn("Could not fetch HTML from public URL, using fallback...")
          
          // Keep the URL displayed even on error to show what was attempted
          // setFetchUrl remains set so user can see what URL failed
          setError(`Failed to fetch from ${fullUrl}: ${fetchError.message}`)
          
          // Fallback: Build HTML from layout data
          if (layoutResponse.data) {
            const generatedHtml = buildHtmlFromLayout(
              layoutResponse.data,
              pageContext
            )
            setHtml(generatedHtml)
            // Clear error if fallback succeeds
            if (generatedHtml) {
              setError(null)
            }
            console.log("HTML generated from layout data (fallback), length:", generatedHtml.length)
          } else {
            throw fetchError
          }
        }
      } else {
        // No public domain found, build from layout data
        setFetchUrl(null)
        console.log("[page-html-viewer] No public domain found in pointOfSale, using fallback HTML generation")
        if (layoutResponse.data) {
          const generatedHtml = buildHtmlFromLayout(
            layoutResponse.data,
            pageContext
          )
          setHtml(generatedHtml)
          setError(null) // Clear any previous errors
          console.log("HTML generated from layout data, length:", generatedHtml.length)
        } else {
          throw new Error("No layout data or rendering engine URL available")
        }
      }
    } catch (err: any) {
      console.error("Error fetching layout data:", err)
      setError(err.message || "Error fetching page data")

      // Final fallback: generate HTML from page context only
      console.log("Final fallback: generating HTML from page context only...")
      const fallbackHtml = buildHtmlFromLayout(
        { sitecore: { route: {} } },
        pageContext
      )
      setHtml(fallbackHtml)
      console.log("Fallback HTML generated, length:", fallbackHtml.length)
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
      <CollapsibleContent className="space-y-4 p-6 pt-0">
        {/* Fetch URL Display with Details */}
        {fetchUrl ? (
          <div className="space-y-3 rounded-md bg-blue-50 dark:bg-blue-950 border-2 border-blue-400 dark:border-blue-600 p-4 shadow-md">
            <h4 className="text-sm font-bold text-blue-900 dark:text-blue-100 flex items-center gap-2">
              🌐 Fetching HTML from Endpoint
            </h4>
            
            {/* Full URL */}
            <div className="bg-white dark:bg-gray-900 p-3 rounded border border-blue-200 dark:border-blue-700">
              <div className="text-[10px] text-blue-600 dark:text-blue-400 font-semibold mb-1">FULL ENDPOINT:</div>
              <code className="block text-xs break-all text-blue-700 dark:text-blue-300 font-mono font-bold">{fetchUrl}</code>
            </div>

            {/* URL Breakdown */}
            <details className="text-xs">
              <summary className="cursor-pointer text-blue-700 dark:text-blue-300 hover:underline font-semibold">🔍 View URL Breakdown</summary>
              <div className="mt-3 space-y-2 bg-blue-100 dark:bg-blue-900 p-3 rounded">
                <div className="grid grid-cols-[120px_1fr] gap-2 text-[11px]">
                  <span className="font-semibold text-blue-800 dark:text-blue-200">📍 Public Domain:</span>
                  <code className="text-blue-700 dark:text-blue-300">{process.env.NEXT_PUBLIC_SITE_URL || 'N/A'}</code>
                  
                  <span className="font-semibold text-blue-800 dark:text-blue-200">📍 Page Route:</span>
                  <code className="text-blue-700 dark:text-blue-300">{pageContext.pageInfo?.route || '/'}</code>
                  
                  <span className="font-semibold text-blue-800 dark:text-blue-200">🔧 Source:</span>
                  <span className="text-blue-700 dark:text-blue-300">NEXT_PUBLIC_SITE_URL (environment variable)</span>
                </div>
                <p className="text-[10px] text-blue-700 dark:text-blue-300 mt-2 italic">
                  💡 Note: Sitecore context doesn't expose public URLs. Using env variable as configured.
                </p>
              </div>
            </details>

            <p className="text-[10px] text-blue-600 dark:text-blue-400 mt-2">
              💡 This endpoint will be used to fetch the rendered HTML for performance analysis
            </p>
          </div>
        ) : pageContext?.siteInfo && (
          <div className="space-y-3 rounded-md bg-yellow-50 dark:bg-yellow-950 border-2 border-yellow-400 dark:border-yellow-600 p-4 shadow-md">
            <h4 className="text-sm font-bold text-yellow-900 dark:text-yellow-100">⚠️ No Public URL Configured</h4>
            
            <div className="bg-yellow-100 dark:bg-yellow-900 p-3 rounded">
              <p className="text-xs text-yellow-800 dark:text-yellow-200 font-semibold mb-2">NEXT_PUBLIC_SITE_URL not set in environment</p>
              <p className="text-[11px] text-yellow-700 dark:text-yellow-300">
                Add NEXT_PUBLIC_SITE_URL to your .env file with your Vercel deployment URL:
              </p>
              <code className="block mt-2 text-[10px] bg-yellow-200 dark:bg-yellow-800 p-2 rounded">
                NEXT_PUBLIC_SITE_URL=https://rb-sitecore-ehs-2026-rb-sitecore-eh.vercel.app
              </code>
              <p className="text-[10px] text-yellow-600 dark:text-yellow-400 mt-2 italic">
                🔄 Restart the dev server after adding the variable
              </p>
            </div>

            <p className="text-xs text-yellow-700 dark:text-yellow-300 mt-2">
              🔄 Using generated HTML from layout data as fallback
            </p>

            <details className="text-xs mt-2">
              <summary className="cursor-pointer text-yellow-600 dark:text-yellow-400 hover:underline font-semibold">🔍 Why isn't the URL in Sitecore context?</summary>
              <div className="mt-2 text-[11px] text-yellow-700 dark:text-yellow-300 space-y-1">
                <p>Sitecore XM Cloud context only provides internal URLs:</p>
                <ul className="list-disc list-inside ml-2 space-y-1">
                  <li><code>renderingEngineApplicationUrl</code>: Internal XM Cloud URL (requires auth)</li>
                  <li><code>pointOfSale[0].name</code>: Site identifier only, not a URL</li>
                </ul>
                <p className="mt-2">Public deployment URLs must be configured separately in your environment.</p>
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

        {/* Refresh Button */}
        <div className="flex flex-wrap items-center gap-2">
          <Button
            onClick={fetchLayoutData}
            disabled={loading || !pageContext?.siteInfo}
            size="sm"
            variant="outline"
          >
            <RefreshCw
              className={`mr-2 h-4 w-4 ${loading ? "animate-spin" : ""}`}
            />
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
              Generated HTML from Layout Service
            </h4>
            <pre className="max-h-[500px] overflow-auto rounded-md bg-muted p-4 text-xs break-all whitespace-pre-wrap">
              {html}
            </pre>
          </div>
        ) : !html && !error && !loading ? (
          <div className="text-sm text-muted-foreground">
            {pageContext ? "Loading layout data..." : "Loading page context..."}
          </div>
        ) : null}
      </CollapsibleContent>
    </Collapsible>
  )
}
