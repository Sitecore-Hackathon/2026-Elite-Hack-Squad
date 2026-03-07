import { NextRequest, NextResponse } from "next/server";
import { PerformanceReport } from "@/types/performance-report";

const SYSTEM_PROMPT = `You are an expert web performance analyst. Analyze the provided HTML and return a strict JSON report only.

Requirements:
- This is a pre-publication audit similar in spirit to PageSpeed Insights, but based only on the provided HTML.
- Include estimated scores (0-100 scale).
- Include Core Web Vitals analysis for LCP, CLS, and INP.
- Include image analysis with:
  - hero/LCP candidate detection
  - declaredFormatFromPath
  - likelyServedFormat
  - declaredDimensions
  - loading
  - fetchPriority
  - role
  - weightBytes
  - weightStatus
  - format recommendations
  - recommended image byte budgets
- Include issues with:
  - approximate line number
  - selector hint
  - evidence snippet
  - problem
  - why it matters
  - suggested fix
  - concrete fix example
- Include quick wins.
- Include strategic recommendations.
- Include a P1/P2/P3 roadmap.
- If an exact value cannot be known from HTML alone, set it to null and explain briefly in the relevant field.

IMPORTANT: Return ONLY valid JSON, no markdown code blocks, no explanations outside the JSON.`;

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

    const userPrompt = `Analyze the following HTML and return a strict JSON report only.

Now analyze this HTML:

${html}`;

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
      max_tokens: 8000,
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
