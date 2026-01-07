"""
SendGrid Email Service for Relay Tracker

Handles sending branded HTML email notifications to users.
Respects user preferences for email_notifications toggle.
"""

import os
import logging
from jinja2 import Environment, FileSystemLoader, select_autoescape
from sendgrid import SendGridAPIClient
from sendgrid.helpers.mail import Mail, Email, To, Content

logger = logging.getLogger(__name__)

# Environment variables
SENDGRID_API_KEY = os.environ.get("SENDGRID_API_KEY")
SENDGRID_FROM_EMAIL = os.environ.get("SENDGRID_FROM_EMAIL", "notifications@relay-tracker.com")
APP_URL = os.environ.get("VITE_APP_URL", "http://localhost:5173")

# Jinja2 template environment
_template_dir = os.path.join(os.path.dirname(__file__), "..", "templates")
_jinja_env = Environment(
    loader=FileSystemLoader(_template_dir),
    autoescape=select_autoescape(["html", "xml"])
)


def is_configured() -> bool:
    """Check if SendGrid is properly configured."""
    return bool(SENDGRID_API_KEY)


def send_email(to_email: str, subject: str, html_content: str) -> bool:
    """
    Send an HTML email via SendGrid.

    Args:
        to_email: Recipient email address
        subject: Email subject line
        html_content: HTML body of the email

    Returns:
        True if email was sent successfully, False otherwise
    """
    if not SENDGRID_API_KEY:
        logger.warning("SendGrid API key not configured, skipping email send")
        return False

    try:
        message = Mail(
            from_email=Email(SENDGRID_FROM_EMAIL, "Relay Tracker"),
            to_emails=To(to_email),
            subject=subject,
            html_content=Content("text/html", html_content)
        )

        sg = SendGridAPIClient(SENDGRID_API_KEY)
        response = sg.send(message)

        if response.status_code in (200, 201, 202):
            logger.info(f"Email sent successfully to {to_email[:3]}***")
            return True
        else:
            logger.error(f"SendGrid returned status {response.status_code}")
            return False

    except Exception as e:
        # Fail gracefully - don't crash the app if email fails
        logger.error(f"Failed to send email: {str(e)}")
        return False


def send_test_email(to_email: str) -> bool:
    """
    Send a test email to verify SendGrid configuration.

    Args:
        to_email: Recipient email address for test

    Returns:
        True if test email was sent successfully
    """
    subject = "Relay Tracker - Test Email"
    html_content = """
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f3f4f6;">
        <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
            <div style="background: linear-gradient(135deg, #f97316 0%, #ef4444 100%); padding: 32px; border-radius: 16px 16px 0 0; text-align: center;">
                <h1 style="color: white; margin: 0; font-size: 28px;">Relay Tracker</h1>
                <p style="color: rgba(255,255,255,0.9); margin: 8px 0 0 0;">Email Configuration Test</p>
            </div>
            <div style="background: white; padding: 32px; border-radius: 0 0 16px 16px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
                <h2 style="color: #111827; margin: 0 0 16px 0;">Hello World!</h2>
                <p style="color: #4b5563; line-height: 1.6; margin: 0 0 24px 0;">
                    If you're reading this, your SendGrid integration is working correctly.
                    You will now receive notifications about your issues.
                </p>
                <div style="background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px; padding: 16px;">
                    <p style="color: #166534; margin: 0; font-weight: 500;">
                        ✓ SendGrid API Connected
                    </p>
                </div>
            </div>
            <p style="text-align: center; color: #9ca3af; font-size: 12px; margin-top: 24px;">
                Relay Tracker • Fast track from report to resolution
            </p>
        </div>
    </body>
    </html>
    """

    return send_email(to_email, subject, html_content)


def _render_template(template_name: str, **context) -> str:
    """Render a Jinja2 email template."""
    template = _jinja_env.get_template(template_name)
    return template.render(app_url=APP_URL, **context)


def _should_send_email(user_email: str) -> bool:
    """
    Check if user has email notifications enabled.

    Args:
        user_email: User's email address to look up

    Returns:
        True if email should be sent, False otherwise
    """
    try:
        from api.utils.database import get_user_by_email, get_user_preferences

        user = get_user_by_email(user_email)
        if not user:
            logger.info(f"User not found for email {user_email[:3]}***, skipping notification")
            return False

        prefs = get_user_preferences(user["user_id"])
        if not prefs or not prefs.get("email_notifications", True):
            logger.info(f"Email notifications disabled for user {user_email[:3]}***")
            return False

        return True
    except Exception as e:
        logger.error(f"Error checking user preferences: {e}")
        return False


def notify_issue_created(
    reporter_email: str,
    issue_key: str,
    summary: str,
    description: str = None,
    issue_type: str = None,
    priority: str = None
) -> bool:
    """
    Send notification when a new issue is created.

    Args:
        reporter_email: Email of the issue reporter
        issue_key: Jira issue key (e.g., "BUG-123")
        summary: Issue summary/title
        description: Issue description text
        issue_type: Type of issue (Bug, Task, Story)
        priority: Issue priority level

    Returns:
        True if email was sent successfully
    """
    if not _should_send_email(reporter_email):
        return False

    try:
        html_content = _render_template(
            "email/issue_created.html",
            issue_key=issue_key,
            summary=summary,
            description=description or "",
            issue_type=issue_type,
            priority=priority,
            issue_url=f"{APP_URL}/issues/{issue_key}"
        )

        subject = f"[{issue_key}] Issue Created - {summary[:50]}"
        return send_email(reporter_email, subject, html_content)

    except Exception as e:
        logger.error(f"Failed to send issue created notification: {e}")
        return False


def notify_status_changed(
    reporter_email: str,
    issue_key: str,
    summary: str,
    old_status: str,
    new_status: str
) -> bool:
    """
    Send notification when issue status changes.

    Args:
        reporter_email: Email of the issue reporter
        issue_key: Jira issue key
        summary: Issue summary/title
        old_status: Previous status
        new_status: New status

    Returns:
        True if email was sent successfully
    """
    if not _should_send_email(reporter_email):
        return False

    try:
        html_content = _render_template(
            "email/status_changed.html",
            issue_key=issue_key,
            summary=summary,
            old_status=old_status,
            new_status=new_status,
            issue_url=f"{APP_URL}/issues/{issue_key}"
        )

        subject = f"[{issue_key}] Status Changed: {old_status} → {new_status}"
        return send_email(reporter_email, subject, html_content)

    except Exception as e:
        logger.error(f"Failed to send status changed notification: {e}")
        return False


def notify_comment_added(
    reporter_email: str,
    commenter_email: str,
    issue_key: str,
    summary: str,
    comment_body: str,
    commenter_name: str = None
) -> bool:
    """
    Send notification when a comment is added to an issue.

    Only notifies the reporter if someone else comments (not self-comments).

    Args:
        reporter_email: Email of the issue reporter
        commenter_email: Email of the person who added the comment
        issue_key: Jira issue key
        summary: Issue summary/title
        comment_body: The comment text
        commenter_name: Display name of commenter

    Returns:
        True if email was sent successfully
    """
    # Don't notify if reporter commented on their own issue
    if reporter_email.lower() == commenter_email.lower():
        logger.info("Skipping self-comment notification")
        return False

    if not _should_send_email(reporter_email):
        return False

    try:
        html_content = _render_template(
            "email/comment_added.html",
            issue_key=issue_key,
            summary=summary,
            comment_body=comment_body,
            commenter_name=commenter_name or commenter_email.split("@")[0],
            issue_url=f"{APP_URL}/issues/{issue_key}"
        )

        subject = f"[{issue_key}] New Comment - {summary[:40]}"
        return send_email(reporter_email, subject, html_content)

    except Exception as e:
        logger.error(f"Failed to send comment notification: {e}")
        return False
