import { NextRequest, NextResponse } from "next/server";
import { PerformanceReport } from "@/types/performance-report";

/**
 * Pre-processes HTML to extract only performance-relevant parts
 * This reduces token usage and focuses the analysis
 */
function preprocessHtml(html: string): string {
  try {
    // Extract head section (meta tags, scripts, styles)
    const headMatch = html.match(/<head[^>]*>([\s\S]*?)<\/head>/i);
    const head = headMatch ? headMatch[1] : "";

    // Extract all img tags (especially above-the-fold candidates)
    const imgMatches = html.matchAll(/<img[^>]*>/gi);
    const images = Array.from(imgMatches).slice(0, 20).join("\n"); // Limit to first 20 images

    // Extract script tags in body
    const scriptMatches = html.matchAll(/<script[^>]*>[\s\S]*?<\/script>/gi);
    const scripts = Array.from(scriptMatches).slice(0, 10).join("\n"); // Limit to first 10 scripts

    // Extract link preload/prefetch
    const preloadMatches = html.matchAll(/<link[^>]*(?:preload|prefetch)[^>]*>/gi);
    const preloads = Array.from(preloadMatches).join("\n");

    // Basic body structure (without full content)
    const bodyMatch = html.match(/<body[^>]*>/i);
    const bodyTag = bodyMatch ? bodyMatch[0] : "<body>";

    const processed = `
<!DOCTYPE html>
<html>
<head>
${head}
</head>
${bodyTag}
  <!-- Images (first 20) -->
  ${images}
  
  <!-- Scripts (first 10) -->
  ${scripts}
  
  <!-- Preloads/Prefetches -->
  ${preloads}
</body>
</html>`;

    console.log(`HTML preprocessed: ${html.length} bytes → ${processed.length} bytes`);
    return processed;
  } catch (error) {
    console.error("Error preprocessing HTML:", error);
    // Fallback: return first 10KB of original HTML
    return html.substring(0, 10000) + "\n<!-- HTML truncated for analysis -->";
  }
}

const SYSTEM_PROMPT = `You are an expert web performance analyst. Analyze the provided HTML excerpt and return a strict JSON report.

Focus on these key areas:
1. Overall Performance Score (0-100) - Based on: image optimization, resource loading strategy, HTML structure, script placement
2. Top Priority Actions (5-7 items) - The most impactful improvements ordered by priority

For each action, include:
- The approximate line number where the issue is found (if applicable)
- A small code snippet showing the problematic code (max 1-2 lines)

Keep recommendations specific, actionable, and focused on the biggest wins.

IMPORTANT: Return ONLY valid JSON matching this structure:
{
  "overallScore": number,
  "topActions": [
    { 
      "priority": number, 
      "title": string, 
      "impact": string, 
      "fix": string,
      "lineNumber": number (optional),
      "codeSnippet": string (optional, max 1-2 lines of code)
    }
  ]
}`;

export async function POST(request: NextRequest) {
  try {
    const { html } = await request.json();

    if (!html) {
      return NextResponse.json(
        { error: "HTML content is required" },
        { status: 400 }
      );
    }

    const apiKey = process.env.OPENAI_API_KEY;
    const baseUrl = process.env.OPENAI_API_BASE_URL || "https://api.openai.com/v1";
    const model = process.env.OPENAI_MODEL || "gpt-4o";

    if (!apiKey || apiKey === "your_openai_api_key_here" || apiKey === "sk-your-actual-openai-api-key") {
      return NextResponse.json(
        { error: "OpenAI API key not configured. Please set OPENAI_API_KEY in .env.local" },
        { status: 500 }
      );
    }

    // Preprocess HTML to reduce size and focus on performance-relevant parts
    const processedHtml = preprocessHtml(html);

    const userPrompt = `Analyze the following HTML excerpt (preprocessed for performance analysis) and return a strict JSON report.

${processedHtml}`;

    const requestBody = {
      model: model,
      messages: [
        {
          role: "system",
          content: SYSTEM_PROMPT
        },
        {
          role: "user",
          content: userPrompt
        }
      ],
      temperature: 0.2,
      max_tokens: 2000,
      response_format: { type: "json_object" }
    };

    console.log("Calling OpenAI API with model:", model);

    const response = await fetch(`${baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`
      },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error("OpenAI API error:", errorData);
      return NextResponse.json(
        { error: `OpenAI API error: ${response.status} - ${errorData}` },
        { status: response.status }
      );
    }

    const data = await response.json();

    if (!data.choices || !data.choices[0]?.message?.content) {
      return NextResponse.json(
        { error: "Invalid response from OpenAI API" },
        { status: 500 }
      );
    }

    const reportContent = data.choices[0].message.content;

    let report: PerformanceReport;
    try {
      report = JSON.parse(reportContent);
    } catch (parseError) {
      console.error("Failed to parse OpenAI response as JSON:", reportContent);
      return NextResponse.json(
        { error: "Failed to parse analysis report as JSON", raw: reportContent },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      report,
      usage: data.usage
    });

  } catch (error: any) {
    console.error("Error in analyze API:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}
