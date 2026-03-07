![Hackathon Logo](docs/images/hackathon.png?raw=true "Hackathon Logo")
# Sitecore Hackathon 2026

- MUST READ: **[Submission requirements](SUBMISSION_REQUIREMENTS.md)**
- [Entry form template](ENTRYFORM.md)
  
## Team name
Elite Hack Squad

## Category
Best Marketplace App for Sitecore AI

## Description
**Page Performance Analyzer** is a Sitecore Marketplace App that helps content editors and developers optimize their pages content for performance directly from the Page Builder interface.

### Module Purpose

This application provides AI-powered performance analysis directly within the Sitecore XM Cloud Page Builder, allowing teams to examine published pages, identify performance issues, and make informed optimization decisions before republishing.

### What problem was solved

Content editors and developers need to switch between multiple tools to analyze page performance:

- Leaving Sitecore to run Google PageSpeed Insights or Lighthouse
- Manually inspecting HTML and analyzing images
- Losing context when switching between authoring and analysis tools
- Time-consuming back-and-forth between content teams and developers to understand performance issues
- Difficulty prioritizing which optimizations will have the most impact

### How does this module solve it

The Page Performance Analyzer integrates directly into the Sitecore XM Cloud authoring experience:

1. **Real-time HTML Extraction**: Fetches the fully rendered HTML from the published page via the Sitecore Rendering Engine, capturing exactly what users see in production
2. **AI-Powered Analysis**: Uses OpenAI to analyze the HTML and provide detailed insights on:
   - Estimated Lighthouse scores (Performance, Accessibility, Best Practices, SEO)
   - Core Web Vitals assessment (LCP, CLS, INP)
   - Image optimization opportunities (format, dimensions, lazy loading, fetch priority)
   - Specific issues with line numbers, severity levels, and actionable fix suggestions
   - Quick wins and strategic recommendations
3. **Actionable Insights Within Sitecore**: Presents results in an easy-to-understand format with:
   - Visual score indicators
   - Prioritized roadmap (P1/P2/P3 issues)
   - Concrete code examples for fixes
   - Best next actions to improve performance
4. **Streamlined Workflow**: Content editors can analyze, edit, and republish without leaving the Page Builder, reducing context switching and improving efficiency

By bringing performance analysis directly into the content authoring workflow, teams can make data-driven optimization decisions and publish higher-quality pages that deliver better user experiences and SEO results.

## Video link
⟹ Provide a video highlighing your Hackathon module submission and provide a link to the video. You can use any video hosting, file share or even upload the video to this repository. _Just remember to update the link below_

⟹ [Replace this Video link](#video-link)

## Pre-requisites and Dependencies

This module requires the following:

### Sitecore Requirements
- **SitecoreAI** instance with an active site
- **Sitecore Marketplace** account and access

### External Services
- **OpenAI API Key**: Required for AI-powered performance analysis
  - The module uses OpenAI's GPT-4 model to analyze HTML and generate insights
  - You can obtain an API key from [OpenAI Platform](https://platform.openai.com/)

### Development Tools (for installation/deployment)
- **Node.js** 18.x or higher
- **npm** or **yarn** package manager
- **Git** (to clone the repository)

### Optional Configuration
- Custom OpenAI API base URL (if using Azure OpenAI or other compatible endpoints)
- Custom model name (defaults to `gpt-4o`)

## Installation instructions

Follow these steps to install and configure the Page Performance Analyzer in your Sitecore AI environment:

### 1. Clone the Repository

Clone the repository and navigate to the code directory:
- git clone https://github.com/Sitecore-Hackathon/2026-Elite-Hack-Squad.git
- cd 2026-Elite-Hack-Squad/src/code

### 2. Install Dependencies

Run npm install to install all required dependencies.

### 3. Configure Environment Variables

Create a .env.local file in the src/code directory with your OpenAI API key:

OPENAI_API_KEY=sk-your-actual-openai-api-key-here
OPENAI_API_BASE_URL=https://api.openai.com/v1
OPENAI_MODEL=gpt-4o

> **Important**: Replace sk-your-actual-openai-api-key-here with your actual OpenAI API key from https://platform.openai.com/api-keys

### 4. Run the Application Locally

Start the development server:

npm run dev

The application will be available at http://localhost:3000

### 5. Create an App in Sitecore Marketplace

First, create the application in the Sitecore Marketplace:

**Step 1: Access Sitecore Cloud Portal**

1. Go to https://portal.sitecorecloud.io/
2. Login with your credentials

**Step 2: Create and Configure the Application**

1. Navigate to **My apps** and click **Create App**
2. Set **Performance Analyzer** in the App name field
3. Select Type **Custom**, click **Create**
4. Go to the **Configure your app** section
5. In the **Extension points**, turn on the **Page context panel**
6. Go to **Deployment URL** section
   - In the URL set http://localhost:3000/
7. Go to the **App logo URL** section
   - In the URL set https://cdn-1.webcatalog.io/catalog/sitecore/sitecore-icon.png?v=1731337318728
8. Then, activate the App. Click **Activate**
9. Go to the **My apps** page and click **Install**
10. Select the environment(s) and click **Install**
11. To confirm the Page Performance Analyzer is installed, open the **Page builder** of your environment


## Usage instructions

Once installed, the Page Performance Analyzer automatically appears in the Page Builder interface. Here's how to use it:

### Accessing the Analyzer

1. Open any page in the **Sitecore Page Builder**
2. The **Page Performance Analyzer** panel appears automatically in the page context
3. The component displays with the heading "Performance Analyzer" along with two badges:
   - **Layout Service** - Indicates data source
   - **Auto-fetch** - Shows automatic page detection

### Understanding the Interface

The analyzer interface consists of several sections:

#### Current Page Info

At the top, you'll see a summary of the current page including:
- **Name**: Page display name
- **Route**: URL path of the page
- **Language**: Current language version
- **Page ID**: Unique identifier
- **Site**: Site name
- **Version**: Content version number
- **Tenant ID**: Organization identifier

#### Action Buttons

- **Refresh Layout** (circular arrow icon): Manually refresh the page HTML and layout data
- **Analyze Performance** (sparkle icon): Run AI-powered performance analysis on the current page
- **Show/Hide HTML** (document icon): Toggle visibility of the raw HTML code

### Running an Analysis

1. The analyzer automatically fetches page data when you open or switch pages
2. Click the **Analyze Performance** button to start the AI analysis
3. Wait while the analysis runs (usually 10-30 seconds depending on page complexity)
4. The performance report appears below the buttons

### Understanding the Performance Report

The report includes several key sections:

#### Estimated Scores (0-100 scale)
- **Performance**: Overall speed and loading metrics
- **Accessibility**: Compliance with accessibility standards
- **Best Practices**: Code quality and security practices
- **SEO**: Search engine optimization readiness

Color coding:
- Green (90-100): Good
- Orange (50-89): Needs improvement
- Red (0-49): Poor

#### Core Web Vitals Assessment

Detailed analysis of:
- **LCP** (Largest Contentful Paint): Main content loading time
- **CLS** (Cumulative Layout Shift): Visual stability
- **INP** (Interaction to Next Paint): Responsiveness

Each metric shows:
- Status (Good/Needs Work/Poor)
- Summary explanation
- Likely drivers (causes)
- Recommended actions

#### Image Analysis

Critical images detected on the page with details:
- Image URL and role (Hero, LCP Candidate, Above-the-fold)
- Current format vs. recommended format
- Declared dimensions
- Loading strategy (lazy, eager)
- Fetch priority
- Weight and optimization suggestions

#### Issues List

Prioritized list of performance problems including:
- Severity level (Critical, High, Medium, Low)
- Issue category and title
- Approximate line number in HTML
- Selector hint to locate the element
- Evidence snippet showing the problematic code
- Why it matters (impact explanation)
- Suggested fix with code examples
- Priority level

#### Quick Wins

Easy-to-implement optimizations that provide immediate benefits:
- Title and description
- Expected impact on metrics
- Effort level (Low, Medium, High)
- Related line numbers

#### Strategic Recommendations

Longer-term improvements for sustained performance:
- Recommendation title and description
- Expected impact areas
- Priority ranking (P1, P2, P3)

#### Priority Roadmap

Action items organized by priority:
- **P1**: Critical items requiring immediate attention
- **P2**: Important improvements to schedule soon
- **P3**: Nice-to-have enhancements for future iterations

#### Best Next Action

AI-generated recommendation for the single most impactful thing to do next, with explanation of why it matters.

### Tips and Best Practices

- **Focus on P1 issues first**: Address critical problems before moving to lower priorities
- **Image optimization**: Pay special attention to image recommendations as they often have the biggest impact
- **Compare before/after**: Run analysis, make changes, then run again to verify improvements

### Viewing Raw HTML

Click the **Show HTML** button to view the complete rendered HTML of the page. This is useful for:
- Debugging rendering issues
- Verifying component output
- Checking meta tags and structured data
- Sharing with developers for troubleshooting

The HTML view shows the exact markup that will be delivered to end users.

## Comments

### About the AI Analysis

The Page Performance Analyzer uses GPT-4 to provide intelligent, context-aware performance recommendations. The AI understands:
- Modern web performance best practices
- Core Web Vitals requirements
- Image optimization strategies
- Accessibility standards
- SEO fundamentals

Results are pre-publication estimates based on HTML analysis. For final validation, supplement with actual runtime testing tools like Lighthouse or WebPageTest after publishing.

### Future Enhancements

Potential improvements for future versions:
- Real-time Lighthouse integration
- Historical performance tracking
- Automated fix suggestions with one-click apply
- Team collaboration features
- Custom performance budgets
- Integration with CI/CD pipelines

### Contributors

- Gabriel Baldeon
- Freddy Rueda
- Ramiro Batallas

Feedback and suggestions are welcome through the repository issues.
