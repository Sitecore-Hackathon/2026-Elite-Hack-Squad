import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const { url } = await request.json();

    if (!url) {
      return NextResponse.json(
        { error: "URL is required" },
        { status: 400 }
      );
    }

    console.log("[fetch-html] Starting fetch for URL:", url);

    // Validate URL format
    try {
      new URL(url);
    } catch (urlError) {
      console.error("[fetch-html] Invalid URL format:", url);
      return NextResponse.json(
        { error: `Invalid URL format: ${url}` },
        { status: 400 }
      );
    }

    // Fetch the HTML from the provided URL
    const response = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.9",
        "Cache-Control": "no-cache",
        "Pragma": "no-cache",
      },
      redirect: "follow",
    });

    console.log("[fetch-html] Response status:", response.status, response.statusText);

    if (!response.ok) {
      return NextResponse.json(
        { error: `Failed to fetch HTML: ${response.status} ${response.statusText}` },
        { status: response.status }
      );
    }

    const html = await response.text();

    console.log("HTML fetched successfully, length:", html.length);

    return NextResponse.json({
      success: true,
      html: html,
      contentType: response.headers.get("content-type"),
      statusCode: response.status,
    });
  } catch (error: any) {
    console.error("[fetch-html] Error details:", {
      message: error.message,
      cause: error.cause,
      stack: error.stack,
    });
    return NextResponse.json(
      { 
        error: error.message || "Error fetching HTML",
        details: error.cause?.message || error.toString()
      },
      { status: 500 }
    );
  }
}
