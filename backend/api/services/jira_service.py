"""Jira Cloud API service for Relay.

Provides functions to interact with Jira Cloud REST API v3.
"""

import os
import time
import logging
from typing import Optional
from datetime import datetime

from atlassian import Jira

logger = logging.getLogger(__name__)

# Singleton Jira client
_jira_client: Optional[Jira] = None


def get_jira_client() -> Jira:
    """Get or create the Jira client singleton."""
    global _jira_client

    if _jira_client is None:
        jira_url = os.getenv("JIRA_URL")
        jira_email = os.getenv("JIRA_EMAIL")
        jira_token = os.getenv("JIRA_API_TOKEN")

        if not all([jira_url, jira_email, jira_token]):
            raise ValueError(
                "Missing Jira configuration. "
                "Set JIRA_URL, JIRA_EMAIL, and JIRA_API_TOKEN environment variables."
            )

        _jira_client = Jira(
            url=jira_url,
            username=jira_email,
            password=jira_token,
            cloud=True,
        )

    return _jira_client


def get_project_key() -> str:
    """Get the configured Jira project key."""
    project_key = os.getenv("JIRA_PROJECT_KEY")
    if not project_key:
        raise ValueError("JIRA_PROJECT_KEY environment variable is required.")
    return project_key


def _retry_with_backoff(func, max_retries: int = 3, base_delay: float = 1.0):
    """Execute a function with retry and exponential backoff."""
    last_exception = None

    for attempt in range(max_retries):
        try:
            return func()
        except Exception as e:
            last_exception = e
            if attempt < max_retries - 1:
                delay = base_delay * (2**attempt)
                logger.warning(
                    f"Jira API call failed (attempt {attempt + 1}/{max_retries}): {e}. "
                    f"Retrying in {delay}s..."
                )
                time.sleep(delay)
            else:
                logger.error(f"Jira API call failed after {max_retries} attempts: {e}")

    raise last_exception


def fetch_issues(
    status: Optional[str] = None,
    priority: Optional[str] = None,
    issue_type: Optional[str] = None,
    reporter: Optional[str] = None,
    search: Optional[str] = None,
    page: int = 1,
    limit: int = 50,
) -> dict:
    """
    Fetch issues from Jira with optional filters.

    Args:
        status: Comma-separated status values (e.g., "Open,In Progress")
        priority: Comma-separated priority values (e.g., "Highest,High")
        issue_type: Comma-separated issue types (e.g., "Bug,Task")
        reporter: Reporter email address
        search: Search text for summary/description
        page: Page number (1-indexed)
        limit: Number of results per page (max 50)

    Returns:
        Dict with issues, total, page, and totalPages
    """
    jira = get_jira_client()
    project_key = get_project_key()

    # Build JQL query
    jql_parts = [f"project = '{project_key}'"]

    if status:
        statuses = [s.strip() for s in status.split(",")]
        status_jql = ", ".join([f'"{s}"' for s in statuses])
        jql_parts.append(f"status IN ({status_jql})")

    if priority:
        priorities = [p.strip() for p in priority.split(",")]
        priority_jql = ", ".join([f'"{p}"' for p in priorities])
        jql_parts.append(f"priority IN ({priority_jql})")

    if issue_type:
        types = [t.strip() for t in issue_type.split(",")]
        type_jql = ", ".join([f'"{t}"' for t in types])
        jql_parts.append(f"issuetype IN ({type_jql})")

    if reporter:
        jql_parts.append(f'reporter = "{reporter}"')

    if search:
        # Escape special JQL characters
        escaped_search = search.replace('"', '\\"')
        jql_parts.append(f'(summary ~ "{escaped_search}" OR description ~ "{escaped_search}")')

    jql = " AND ".join(jql_parts)
    jql += " ORDER BY created DESC"

    # Calculate start index
    start_at = (page - 1) * limit

    logger.info(f"Fetching issues with JQL: {jql}")

    def _fetch():
        return jira.jql(
            jql,
            start=start_at,
            limit=limit,
            fields="key,summary,status,priority,issuetype,reporter,assignee,created,updated",
        )

    result = _retry_with_backoff(_fetch)

    # Transform issues to a cleaner format
    issues = []
    for issue in result.get("issues", []):
        fields = issue.get("fields", {})
        issues.append({
            "key": issue.get("key"),
            "summary": fields.get("summary"),
            "status": fields.get("status", {}).get("name") if fields.get("status") else None,
            "priority": fields.get("priority", {}).get("name") if fields.get("priority") else None,
            "type": fields.get("issuetype", {}).get("name") if fields.get("issuetype") else None,
            "reporter": {
                "email": fields.get("reporter", {}).get("emailAddress"),
                "name": fields.get("reporter", {}).get("displayName"),
                "avatar": fields.get("reporter", {}).get("avatarUrls", {}).get("48x48"),
            } if fields.get("reporter") else None,
            "assignee": {
                "email": fields.get("assignee", {}).get("emailAddress"),
                "name": fields.get("assignee", {}).get("displayName"),
                "avatar": fields.get("assignee", {}).get("avatarUrls", {}).get("48x48"),
            } if fields.get("assignee") else None,
            "created": fields.get("created"),
            "updated": fields.get("updated"),
        })

    total = result.get("total", 0)
    total_pages = (total + limit - 1) // limit if limit > 0 else 0

    return {
        "issues": issues,
        "total": total,
        "page": page,
        "totalPages": total_pages,
    }


def get_issue(issue_key: str) -> dict:
    """
    Get a single issue with all details.

    Args:
        issue_key: The Jira issue key (e.g., "BUG-123")

    Returns:
        Dict with full issue details including comments and attachments
    """
    jira = get_jira_client()

    def _fetch():
        return jira.issue(issue_key, expand="changelog")

    issue = _retry_with_backoff(_fetch)
    fields = issue.get("fields", {})

    # Fetch comments separately
    def _fetch_comments():
        return jira.issue_get_comments(issue_key)

    comments_data = _retry_with_backoff(_fetch_comments)
    comments = []
    for comment in comments_data.get("comments", []):
        comments.append({
            "id": comment.get("id"),
            "author": {
                "email": comment.get("author", {}).get("emailAddress"),
                "name": comment.get("author", {}).get("displayName"),
                "avatar": comment.get("author", {}).get("avatarUrls", {}).get("48x48"),
            } if comment.get("author") else None,
            "body": comment.get("body"),
            "created": comment.get("created"),
            "updated": comment.get("updated"),
        })

    # Get attachments
    attachments = []
    for attachment in fields.get("attachment", []):
        attachments.append({
            "id": attachment.get("id"),
            "filename": attachment.get("filename"),
            "size": attachment.get("size"),
            "mimeType": attachment.get("mimeType"),
            "content": attachment.get("content"),  # Download URL
            "created": attachment.get("created"),
            "author": {
                "email": attachment.get("author", {}).get("emailAddress"),
                "name": attachment.get("author", {}).get("displayName"),
            } if attachment.get("author") else None,
        })

    # Get activity/history from changelog
    history = []
    changelog = issue.get("changelog", {})
    for change in changelog.get("histories", [])[-10:]:  # Last 10 changes
        items = []
        for item in change.get("items", []):
            items.append({
                "field": item.get("field"),
                "from": item.get("fromString"),
                "to": item.get("toString"),
            })
        history.append({
            "id": change.get("id"),
            "author": {
                "email": change.get("author", {}).get("emailAddress"),
                "name": change.get("author", {}).get("displayName"),
            } if change.get("author") else None,
            "created": change.get("created"),
            "items": items,
        })

    return {
        "key": issue.get("key"),
        "summary": fields.get("summary"),
        "description": fields.get("description"),
        "status": fields.get("status", {}).get("name") if fields.get("status") else None,
        "priority": fields.get("priority", {}).get("name") if fields.get("priority") else None,
        "type": fields.get("issuetype", {}).get("name") if fields.get("issuetype") else None,
        "reporter": {
            "email": fields.get("reporter", {}).get("emailAddress"),
            "name": fields.get("reporter", {}).get("displayName"),
            "avatar": fields.get("reporter", {}).get("avatarUrls", {}).get("48x48"),
        } if fields.get("reporter") else None,
        "assignee": {
            "email": fields.get("assignee", {}).get("emailAddress"),
            "name": fields.get("assignee", {}).get("displayName"),
            "avatar": fields.get("assignee", {}).get("avatarUrls", {}).get("48x48"),
        } if fields.get("assignee") else None,
        "created": fields.get("created"),
        "updated": fields.get("updated"),
        "comments": comments,
        "attachments": attachments,
        "history": history,
    }


def create_issue(
    summary: str,
    details: str,
    issue_type: str,
    priority: str,
    user_email: str,
    browser: str,
    os_info: str,
    attachment_links: Optional[str] = None,
) -> dict:
    """
    Create a new Jira issue with the SQA template format.

    Args:
        summary: Issue summary
        details: User-provided details
        issue_type: Issue type (Bug, Task, Story)
        priority: Priority level (Highest, High, Medium, Low, Lowest)
        user_email: Reporter's email address
        browser: Detected browser info
        os_info: Detected OS info
        attachment_links: Optional attachment links

    Returns:
        Dict with created issue key and self URL
    """
    from api.utils.template_builder import build_jira_description

    jira = get_jira_client()
    project_key = get_project_key()

    # Build the formatted description using the SQA template
    description = build_jira_description(
        summary=summary,
        details=details,
        priority=priority,
        user_email=user_email,
        browser=browser,
        os_info=os_info,
        attachment_links=attachment_links,
    )

    issue_data = {
        "project": {"key": project_key},
        "summary": summary,
        "description": description,
        "issuetype": {"name": issue_type},
        "priority": {"name": priority},
    }

    logger.info(f"Creating issue in project {project_key}: {summary}")

    def _create():
        return jira.create_issue(fields=issue_data)

    result = _retry_with_backoff(_create)

    logger.info(f"Created issue: {result.get('key')}")

    return {
        "key": result.get("key"),
        "self": result.get("self"),
    }


def update_issue(issue_key: str, fields: dict) -> dict:
    """
    Update an existing Jira issue.

    Args:
        issue_key: The Jira issue key (e.g., "BUG-123")
        fields: Dict of fields to update (summary, description, status, priority, assignee)

    Returns:
        Dict with updated issue key
    """
    jira = get_jira_client()

    update_fields = {}

    if "summary" in fields:
        update_fields["summary"] = fields["summary"]

    if "description" in fields:
        update_fields["description"] = fields["description"]

    if "priority" in fields:
        update_fields["priority"] = {"name": fields["priority"]}

    if "assignee" in fields:
        # Assignee requires account ID in Jira Cloud
        update_fields["assignee"] = {"emailAddress": fields["assignee"]} if fields["assignee"] else None

    if update_fields:
        logger.info(f"Updating issue {issue_key}: {list(update_fields.keys())}")

        def _update():
            return jira.update_issue_field(issue_key, update_fields)

        _retry_with_backoff(_update)

    # Handle status transition separately
    if "status" in fields:
        transition_issue(issue_key, fields["status"])

    return {"key": issue_key}


def transition_issue(issue_key: str, target_status: str) -> dict:
    """
    Transition an issue to a new status.

    Args:
        issue_key: The Jira issue key
        target_status: The target status name

    Returns:
        Dict with issue key and new status
    """
    jira = get_jira_client()

    # Get available transitions
    def _get_transitions():
        return jira.get_issue_transitions(issue_key)

    transitions = _retry_with_backoff(_get_transitions)

    # Find the transition that leads to the target status
    transition_id = None
    for t in transitions.get("transitions", []):
        if t.get("to", {}).get("name", "").lower() == target_status.lower():
            transition_id = t.get("id")
            break

    if not transition_id:
        available = [t.get("to", {}).get("name") for t in transitions.get("transitions", [])]
        raise ValueError(
            f"Cannot transition to '{target_status}'. "
            f"Available transitions: {available}"
        )

    logger.info(f"Transitioning {issue_key} to {target_status}")

    def _transition():
        return jira.issue_transition(issue_key, transition_id)

    _retry_with_backoff(_transition)

    return {"key": issue_key, "status": target_status}


def add_comment(issue_key: str, comment_text: str, user_email: str) -> dict:
    """
    Add a comment to an issue.

    Args:
        issue_key: The Jira issue key
        comment_text: The comment text
        user_email: Email of the user adding the comment

    Returns:
        Dict with comment details
    """
    jira = get_jira_client()

    # Add attribution to the comment
    formatted_comment = f"{comment_text}\n\n_— Posted via Relay by {user_email}_"

    logger.info(f"Adding comment to {issue_key}")

    def _add_comment():
        return jira.issue_add_comment(issue_key, formatted_comment)

    result = _retry_with_backoff(_add_comment)

    return {
        "id": result.get("id"),
        "body": comment_text,
        "created": result.get("created"),
    }


def upload_attachment(issue_key: str, filename: str, file_content: bytes) -> dict:
    """
    Upload an attachment to an issue.

    Args:
        issue_key: The Jira issue key
        filename: Name of the file
        file_content: File content as bytes

    Returns:
        Dict with attachment details
    """
    jira = get_jira_client()

    logger.info(f"Uploading attachment '{filename}' to {issue_key}")

    def _upload():
        return jira.add_attachment(issue_key, filename=filename, file=file_content)

    result = _retry_with_backoff(_upload)

    # Result is a list of attachments
    if result and len(result) > 0:
        attachment = result[0]
        return {
            "id": attachment.get("id"),
            "filename": attachment.get("filename"),
            "size": attachment.get("size"),
            "mimeType": attachment.get("mimeType"),
            "content": attachment.get("content"),
        }

    return {"filename": filename}


def check_user_can_edit(issue_key: str, user_email: str, user_role: str) -> bool:
    """
    Check if a user can edit an issue.

    Users can edit their own issues. SQA and Admin can edit any issue.

    Args:
        issue_key: The Jira issue key
        user_email: Email of the user
        user_role: Role of the user (user, sqa, admin)

    Returns:
        True if user can edit, False otherwise
    """
    # SQA and Admin can edit any issue
    if user_role in ["sqa", "admin"]:
        return True

    # Regular users can only edit their own issues
    issue = get_issue(issue_key)
    reporter_email = issue.get("reporter", {}).get("email")

    return reporter_email and reporter_email.lower() == user_email.lower()


def get_issues_updated_since(timestamp: str) -> list:
    """
    Get issues updated since a specific timestamp.

    Args:
        timestamp: ISO format timestamp

    Returns:
        List of updated issues (key, summary, status, priority, updated)
    """
    jira = get_jira_client()
    project_key = get_project_key()

    # Convert timestamp to Jira format
    try:
        dt = datetime.fromisoformat(timestamp.replace("Z", "+00:00"))
        jira_timestamp = dt.strftime("%Y-%m-%d %H:%M")
    except ValueError:
        jira_timestamp = timestamp

    jql = f"project = '{project_key}' AND updated >= '{jira_timestamp}' ORDER BY updated DESC"

    logger.info(f"Fetching issues updated since {jira_timestamp}")

    def _fetch():
        return jira.jql(
            jql,
            limit=100,
            fields="key,summary,status,priority,updated",
        )

    result = _retry_with_backoff(_fetch)

    issues = []
    for issue in result.get("issues", []):
        fields = issue.get("fields", {})
        issues.append({
            "key": issue.get("key"),
            "summary": fields.get("summary"),
            "status": fields.get("status", {}).get("name") if fields.get("status") else None,
            "priority": fields.get("priority", {}).get("name") if fields.get("priority") else None,
            "updated": fields.get("updated"),
        })

    return issues
