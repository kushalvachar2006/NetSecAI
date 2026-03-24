import logging
import json
import asyncio

from config import settings

logger = logging.getLogger("netsecai.ai_service")

# ── SDK import (new google-genai package) ──────────────────────────────────
try:
    from google import genai
    from google.genai import types as genai_types
    GENAI_AVAILABLE = True
except ImportError:
    GENAI_AVAILABLE = False
    logger.warning(
        "google-genai not installed — run: pip install google-genai"
    )

MODEL_NAME = "gemini-2.5-flash"

_client = None
ai_enabled = False


def _init_client() -> None:
    global _client, ai_enabled
    if not GENAI_AVAILABLE:
        return
    if not settings.GEMINI_API_KEY:
        logger.warning("GEMINI_API_KEY not set in .env — AI explanations disabled")
        return
    try:
        _client = genai.Client(api_key=settings.GEMINI_API_KEY)
        ai_enabled = True
        logger.info("Gemini AI initialised — using model: %s", MODEL_NAME)
    except Exception as exc:
        logger.error("Gemini client initialisation failed: %s", exc)


_init_client()

# ── Generation config ──────────────────────────────────────────────────────
GENERATION_CONFIG = genai_types.GenerateContentConfig(
    temperature=0.3,
    max_output_tokens=2048,
) if GENAI_AVAILABLE else None


# ── Core call (single model, no fallback chain) ───────────────────────────

async def _call_gemini(prompt: str) -> str:
    if not ai_enabled or _client is None:
        return (
            "AI explanation unavailable: Gemini not configured. "
            "Set GEMINI_API_KEY in your .env file."
        )

    try:
        logger.info("Gemini request → model=%s", MODEL_NAME)

        response = await asyncio.get_event_loop().run_in_executor(
            None,
            lambda: _client.models.generate_content(
                model=MODEL_NAME,
                contents=prompt,
                config=GENERATION_CONFIG,
            ),
        )

        text = response.text.strip() if response.text else ""
        if text:
            logger.info("Gemini success: model=%s chars=%d", MODEL_NAME, len(text))
            return text

        logger.warning("Gemini returned empty text")
        return "AI explanation returned empty. Please try again."

    except Exception as exc:
        logger.error("Gemini error: %s", exc)
        return f"AI explanation temporarily unavailable: {str(exc)[:200]}"


# ── Public explain functions ───────────────────────────────────────────────

async def explain_url_analysis(analysis_data: dict) -> str:
    prompt = f"""You are NetSecAI, a friendly cybersecurity expert who explains security findings in simple, everyday language that anyone can understand — even someone with zero tech background.

Analyze the following URL security scan results and explain them clearly:

**What was scanned:**
- URL: {analysis_data.get('url')}
- Domain: {analysis_data.get('domain')}
- IP Address: {analysis_data.get('ip_address', 'Could not resolve')}

**What was found:**
- Open Ports: {json.dumps(analysis_data.get('open_ports', []), indent=2)}
- Risk Score: {analysis_data.get('risk_score')}/100 (Level: {analysis_data.get('risk_level')})
- Vulnerabilities: {json.dumps(analysis_data.get('vulnerabilities', []), indent=2)}
- Security Flags: {analysis_data.get('flags', [])}

Please structure your response EXACTLY like this (use these exact headings with ##):

## Summary
Write a brief, easy-to-understand overview (2-3 sentences). Imagine you're explaining to a friend who doesn't know about cybersecurity. Use analogies where helpful (e.g., "An open port is like an unlocked door in your house").

## Key Risks
- List each risk as a bullet point
- Explain WHY each risk matters in plain language
- Use everyday analogies to make threats relatable
- If there are no significant risks, say "No major risks were found"

## Recommendations
- List specific, actionable steps the user should take
- Explain each step simply, as if guiding someone through a process
- Prioritize the most important actions first
- If everything looks safe, suggest general best practices

Keep your language warm, clear, and jargon-free. When you must use a technical term, explain it in parentheses."""
    return await _call_gemini(prompt)


async def explain_pcap_analysis(analysis_data: dict) -> str:
    prompt = f"""You are NetSecAI, a friendly cybersecurity expert who explains network analysis findings in simple, everyday language that anyone can understand — even someone with zero tech background.

Analyze the following network traffic capture (PCAP) results:

**Traffic Overview:**
- Total Packets Captured: {analysis_data.get('total_packets')}
- Duration: {analysis_data.get('duration_seconds')} seconds
- Protocol Breakdown: {json.dumps(analysis_data.get('protocols', {}), indent=2)}
  (Think of protocols as different "languages" computers use to talk to each other — TCP for reliable data transfer, UDP for fast streaming, DNS for looking up website addresses, ICMP for network diagnostics)

**Top Communicators:**
{json.dumps(analysis_data.get('top_talkers', [])[:5], indent=2)}

**Risk Score:** {analysis_data.get('risk_score')}/100

**Suspicious Activity Detected:**
{json.dumps(analysis_data.get('anomalies', []), indent=2)}

Please structure your response EXACTLY like this (use these exact headings with ##):

## Summary
Write a brief, easy-to-understand overview (2-3 sentences) of what this network traffic shows. Use simple analogies (e.g., "This is like monitoring all the letters going in and out of a post office").

## What's Happening in This Traffic
- Explain the key patterns in simple language
- Describe what the top communicators are doing
- Highlight any unusual patterns
- Use everyday analogies to explain technical concepts

## Key Risks
- List each security concern found
- Explain WHY each risk matters in plain language
- If no anomalies were found, say "No suspicious activity was detected"

## Recommendations
- List specific, actionable steps
- Explain each step simply
- Prioritize the most critical actions first

Keep your language warm, clear, and jargon-free. When you must use a technical term, explain it in parentheses."""
    return await _call_gemini(prompt)


async def explain_threat_intel(threat_data: dict) -> str:
    prompt = f"""You are NetSecAI, a friendly cybersecurity expert who explains threat intelligence findings in simple, everyday language that anyone can understand — even someone with zero tech background.

Analyze the following threat intelligence check results:

**Target Checked:** {threat_data.get('target')}
**Reputation Score:** {threat_data.get('reputation_score')}/100 (0 = completely safe, 100 = definitely dangerous)
**Threat Category:** {threat_data.get('threat_category')}
**Detection Results:** {threat_data.get('positives')}/{threat_data.get('total_sources')} security databases flagged this as suspicious

**Detailed Source Results:**
{json.dumps(threat_data.get('sources', []), indent=2)}

Please structure your response EXACTLY like this (use these exact headings with ##):

## Summary
Write a brief, easy-to-understand overview (2-3 sentences). Explain what the reputation score means — like a "trust rating" for websites. Is this site safe to visit?

## Key Risks
- Explain what each security database found
- Describe in plain language what "flagged" or "clean" means from each source
- Help the user understand whether they should be worried
- If clean, reassure the user

## Recommendations
- Tell the user exactly what to do next
- If the site is flagged: warn them clearly and suggest alternatives
- If the site is clean: mention this is a good sign but suggest general caution
- Use simple, actionable language

Keep your language warm, clear, and jargon-free."""
    return await _call_gemini(prompt)


async def explain_content_analysis(content_data: dict) -> str:
    prompt = f"""You are NetSecAI, a friendly cybersecurity expert who explains webpage security analysis in simple, everyday language that anyone can understand — even someone with zero tech background.

Analyze the following webpage content scan results:

**Page Scanned:** {content_data.get('url')}
**Page Title:** {content_data.get('title', 'Unknown')}
**HTTP Status:** {content_data.get('status_code')} (200 = page loaded fine, 404 = page not found)
**Risk Score:** {content_data.get('risk_score')}/100 (Level: {content_data.get('risk_level')})

**What We Checked:**
- Forms Found: {len(content_data.get('forms', []))} (forms are where you type information like passwords or credit cards)
- External Scripts: {len(content_data.get('external_scripts', []))} (code loaded from other websites)
- Redirect Chain: {content_data.get('redirects', [])} (did the page secretly send you somewhere else?)

**Security Issues Found:**
{json.dumps(content_data.get('findings', []), indent=2)}

Please structure your response EXACTLY like this (use these exact headings with ##):

## Summary
Write a brief, easy-to-understand overview (2-3 sentences). Is this webpage safe to use? Use simple analogies (e.g., "A phishing form is like a fake ATM that steals your card details").

## Key Risks
- Explain each security finding in simple language
- Describe what each issue means for the average user
- Use real-world analogies to make threats relatable
- If no issues found, say "This page appears safe based on our scan"

## Recommendations
- Tell the user exactly what to do
- If dangerous: warn clearly about entering passwords or personal data
- If safe: mention this is positive but suggest general web safety habits
- Use simple, actionable language

Keep your language warm, clear, and jargon-free. When you must use a technical term, explain it in parentheses."""
    return await _call_gemini(prompt)


async def explain_packets(packets: list[dict]) -> str:
    sample = packets[:20]
    prompt = f"""You are NetSecAI, a friendly cybersecurity expert explaining real-time network packet capture in simple, everyday language.

Analyze these captured network packets:

**Packet Sample** ({len(sample)} of {len(packets)} total):
{json.dumps(sample, indent=2)}

Please structure your response EXACTLY like this (use these exact headings with ##):

## Summary
What kind of network activity is happening? Explain as if describing traffic on a road.

## Key Risks
- List any concerning patterns
- Explain why they matter

## Recommendations
- What should the user do about this traffic?

Keep your language warm, clear, and jargon-free."""
    return await _call_gemini(prompt)


async def generate_full_summary(full_data: dict) -> str:
    prompt = f"""You are NetSecAI, a friendly cybersecurity expert creating an executive security summary in simple, everyday language that anyone can understand — even a CEO with no tech background.

Here's the comprehensive security analysis for this target:

**Target URL:** {full_data.get('url')}
**Overall Risk Score:** {full_data.get('overall_risk_score')}/100 (Level: {full_data.get('overall_risk_level')})

**Breakdown by Analysis Type:**
- URL/Infrastructure Security: {full_data.get('url_risk_score')}/100
- Threat Intelligence (reputation databases): {full_data.get('threat_risk_score', 'Not checked')}/100
- Webpage Content Security: {full_data.get('content_risk_score', 'Not checked')}/100

**Specific Findings:**
- Infrastructure Vulnerabilities: {full_data.get('url_vulnerabilities', [])}
- Threat Category: {full_data.get('threat_category', 'Not checked')}
- Content Security Issues: {full_data.get('content_findings_count', 'Not checked')} issues found

Please structure your response EXACTLY like this (use these exact headings with ##):

## Summary
Write a clear, executive-level overview (3-4 sentences). Think of it as a "health report" for this website. Use a traffic light analogy — Green (safe), Yellow (some concerns), Red (dangerous).

## Key Risks
- List the most critical findings across ALL analysis types
- Explain each risk in plain, non-technical language
- Prioritize by severity (most dangerous first)
- Use everyday analogies

## Recommendations
- List prioritized remediation steps
- Number them in order of urgency
- Explain each action in simple terms
- Include both immediate actions and long-term suggestions

Keep your language warm, professional, and jargon-free. This summary should be presentable to non-technical stakeholders."""
    return await _call_gemini(prompt)