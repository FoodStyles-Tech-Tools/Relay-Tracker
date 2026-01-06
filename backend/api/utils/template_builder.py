"""Template builder for Jira issue descriptions.

Transforms simple user input into the professional SQA template format.
"""

from datetime import datetime
from typing import Optional


def build_jira_description(
    summary: str,
    details: str,
    priority: str,
    user_email: str,
    browser: str,
    os_info: str,
    attachment_links: Optional[str] = None,
) -> str:
    """
    Build a Jira issue description using the SQA template format.

    Args:
        summary: Issue summary provided by user
        details: Detailed description provided by user
        priority: Priority level (Highest, High, Medium, Low, Lowest)
        user_email: Reporter's email address
        browser: Detected browser info (e.g., "Chrome 120.0.0")
        os_info: Detected OS info (e.g., "Windows 11")
        attachment_links: Optional BEB/attachment links

    Returns:
        Formatted Jira description string
    """
    timestamp = datetime.utcnow().strftime("%Y-%m-%d %H:%M UTC")

    # Default attachment text if none provided
    attachment_text = attachment_links if attachment_links else "[No attachments provided]"

    template = f"""*ENVIRONMENT:*
Browser: {browser}
OS: {os_info}

*STEPS TO REPRODUCE:*
[To be filled by SQA]

*EXPECTED RESULT:*
[To be filled by SQA]

*ACTUAL RESULT:*
[To be filled by SQA]

*PLEASE SEE (BEB LINK):*
{attachment_text}

*(FOR SQA ONLY) WATCHERS:*
[To be filled by SQA]

*(FOR SQA ONLY) DEVELOPERS (IF PRIORITY IS HIGHEST OR HIGH):*
[To be filled by SQA]

----

*USER PROVIDED INFORMATION:*

*Summary:* {summary}

*Details:* {details}

*Priority:* {priority}

*Reporter:* {user_email}

*Reported via:* Relay App
*Timestamp:* {timestamp}

----
*IF YOU ARE EXPERIENCING SLOWDOWNS READ THIS:*
1. During our BEB recording, without stopping it, open the link to Ookla's Speedtest.
2. Press the "GO" button.
3. Wait until the test is finished.
4. Finish the BEB recording.
Note: Please share the whole screen and not just a tab when recording so BEB can catch what happens during the speed test."""

    return template


def parse_user_agent(user_agent: str) -> tuple[str, str]:
    """
    Parse User-Agent string to extract browser and OS information.

    Args:
        user_agent: The User-Agent header string

    Returns:
        Tuple of (browser, os_info)
    """
    browser = "Unknown Browser"
    os_info = "Unknown OS"

    if not user_agent:
        return browser, os_info

    ua_lower = user_agent.lower()

    # Detect OS
    if "windows nt 10" in ua_lower:
        if "windows nt 10.0" in ua_lower:
            os_info = "Windows 10/11"
        else:
            os_info = "Windows 10"
    elif "windows nt 11" in ua_lower:
        os_info = "Windows 11"
    elif "windows nt 6.3" in ua_lower:
        os_info = "Windows 8.1"
    elif "windows nt 6.2" in ua_lower:
        os_info = "Windows 8"
    elif "windows nt 6.1" in ua_lower:
        os_info = "Windows 7"
    elif "mac os x" in ua_lower:
        os_info = "macOS"
        # Try to extract version
        import re
        mac_match = re.search(r"mac os x (\d+[._]\d+)", ua_lower)
        if mac_match:
            version = mac_match.group(1).replace("_", ".")
            os_info = f"macOS {version}"
    elif "linux" in ua_lower:
        if "android" in ua_lower:
            os_info = "Android"
            android_match = __import__("re").search(r"android (\d+\.?\d*)", ua_lower)
            if android_match:
                os_info = f"Android {android_match.group(1)}"
        else:
            os_info = "Linux"
    elif "iphone" in ua_lower or "ipad" in ua_lower:
        os_info = "iOS"
        ios_match = __import__("re").search(r"os (\d+[._]\d+)", ua_lower)
        if ios_match:
            version = ios_match.group(1).replace("_", ".")
            os_info = f"iOS {version}"
    elif "cros" in ua_lower:
        os_info = "Chrome OS"

    # Detect Browser (order matters - more specific first)
    import re

    if "edg/" in ua_lower or "edge/" in ua_lower:
        browser = "Microsoft Edge"
        edge_match = re.search(r"edg[e]?/(\d+\.?\d*)", ua_lower)
        if edge_match:
            browser = f"Microsoft Edge {edge_match.group(1)}"
    elif "opr/" in ua_lower or "opera" in ua_lower:
        browser = "Opera"
        opera_match = re.search(r"opr/(\d+\.?\d*)", ua_lower)
        if opera_match:
            browser = f"Opera {opera_match.group(1)}"
    elif "firefox/" in ua_lower:
        browser = "Firefox"
        ff_match = re.search(r"firefox/(\d+\.?\d*)", ua_lower)
        if ff_match:
            browser = f"Firefox {ff_match.group(1)}"
    elif "safari/" in ua_lower and "chrome" not in ua_lower:
        browser = "Safari"
        safari_match = re.search(r"version/(\d+\.?\d*)", ua_lower)
        if safari_match:
            browser = f"Safari {safari_match.group(1)}"
    elif "chrome/" in ua_lower:
        browser = "Chrome"
        chrome_match = re.search(r"chrome/(\d+\.?\d*)", ua_lower)
        if chrome_match:
            browser = f"Chrome {chrome_match.group(1)}"

    return browser, os_info
