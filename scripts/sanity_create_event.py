#!/usr/bin/env python3
"""
Create an `event` document in Sanity using the HTTP Mutation API:
https://www.sanity.io/docs/http-reference/mutation

Defaults are inferred from this repo's Next.js config (`apps/web/src/sanity/client.ts`):
- projectId: 9057gu4d
- dataset: production
- apiVersion: 2025-07-09 (HTTP uses the `v`-prefixed form: v2025-07-09)

Usage examples:
  SANITY_WRITE_TOKEN="..." python3 scripts/sanity_create_event.py \
    --name "My Event" --format in-person --date "2026-02-01T19:30:00Z" \
    --doors-open 60 --tickets "https://example.com/tickets"

  SANITY_WRITE_TOKEN="..." python3 scripts/sanity_create_event.py \
    --name "Online Talk" --format virtual --slug "online-talk" --dry-run

Env loading:
  - Automatically reads `.env.local` if present (repo root or `apps/web/.env.local`)
  - You can also pass `--env-file path/to/.env.local`
  - Requires: `python-dotenv` (install with `python3 -m pip install python-dotenv`)
"""

from __future__ import annotations

import argparse
import json
import os
import re
import sys
import urllib.error
import urllib.request
from typing import Any, Dict, Optional

try:
    from dotenv import load_dotenv
except Exception:  # pragma: no cover
    load_dotenv = None  # type: ignore[assignment]


DEFAULT_PROJECT_ID = "d6yzt76s"
DEFAULT_DATASET = "production"
DEFAULT_API_VERSION = "2026-01-22"


def load_env_files(env_file: Optional[str]) -> None:
    """
    Load `.env.local` values into the process environment (without overwriting real env vars).
    Uses `python-dotenv` for correctness and quoting support.
    """

    if load_dotenv is None:
        print(
            "Missing dependency: python-dotenv.\n"
            "Install it with: python3 -m pip install python-dotenv",
            file=sys.stderr,
        )
        raise SystemExit(2)

    script_dir = os.path.dirname(os.path.abspath(__file__))
    repo_root = os.path.dirname(script_dir)

    candidates: list[str] = []
    if env_file:
        candidates.append(env_file)

    candidates.extend(
        [
            os.path.join(repo_root, ".env.local"),
            os.path.join(repo_root, "apps", "web", ".env.local"),
            os.path.join(repo_root, "apps", "studio", ".env.local"),
        ]
    )

    for candidate in candidates:
        if os.path.exists(candidate):
            load_dotenv(dotenv_path=candidate, override=False)


def slugify(value: str) -> str:
    value = value.strip().lower()
    value = re.sub(r"[^\w\s-]", "", value)
    value = re.sub(r"[\s_-]+", "-", value)
    value = re.sub(r"^-+|-+$", "", value)
    return value or "event"


def normalize_api_version(api_version: str) -> str:
    value = api_version.strip()
    if not value:
        raise ValueError("apiVersion cannot be empty")
    if value.startswith("v"):
        return value
    return f"v{value}"


def build_event_document(args: argparse.Namespace) -> Dict[str, Any]:
    name = args.name.strip()
    if not name:
        raise ValueError("--name cannot be empty")

    current_slug = (args.slug or slugify(name)).strip()
    if not current_slug:
        raise ValueError("--slug cannot be empty (or provide a valid --name)")

    doc: Dict[str, Any] = {
        "_type": "event",
        "name": name,
        "slug": {"_type": "slug", "current": current_slug},
        "format": args.format,
    }

    if args.id:
        doc["_id"] = args.id

    if args.date:
        doc["date"] = args.date

    if args.doors_open is not None:
        doc["doorsOpen"] = args.doors_open

    if args.tickets:
        doc["tickets"] = args.tickets

    # NOTE: Studio `initialValue` doesn't necessarily apply to API-created docs.
    # Setting defaults here keeps counters consistent.
    doc["likes"] = int(args.likes) if args.likes is not None else 0
    doc["dislikes"] = int(args.dislikes) if args.dislikes is not None else 0

    if args.venue_id:
        doc["venue"] = {"_type": "reference", "_ref": args.venue_id}

    if args.headline_id:
        doc["headline"] = {"_type": "reference", "_ref": args.headline_id}

    # `details` (portable text) and `image` are intentionally omitted here.
    # You can add them later via patch once you have the correct block/image payloads.

    return doc


def request_json(url: str, token: str, payload: Dict[str, Any]) -> Dict[str, Any]:
    data = json.dumps(payload).encode("utf-8")
    req = urllib.request.Request(
        url=url,
        data=data,
        method="POST",
        headers={
            "Authorization": f"Bearer {token}",
            "Content-Type": "application/json",
            "Accept": "application/json",
        },
    )

    try:
        with urllib.request.urlopen(req) as res:
            res_text = res.read().decode("utf-8")
            return json.loads(res_text) if res_text else {}
    except urllib.error.HTTPError as e:
        err_text = ""
        try:
            err_text = e.read().decode("utf-8")
        except Exception:
            err_text = ""
        raise RuntimeError(
            f"Sanity HTTP {e.code} {e.reason}\nURL: {url}\nResponse: {err_text or '<empty>'}"
        ) from e


def parse_args(argv: list[str]) -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Create an `event` document in Sanity.")

    parser.add_argument(
        "--env-file",
        help="Optional path to an env file (e.g. .env.local). Values won't override existing env vars.",
    )

    parser.add_argument("--project-id", default=os.environ.get("SANITY_PROJECT_ID", DEFAULT_PROJECT_ID))
    parser.add_argument("--dataset", default=os.environ.get("SANITY_DATASET", DEFAULT_DATASET))
    parser.add_argument("--api-version", default=os.environ.get("SANITY_API_VERSION", DEFAULT_API_VERSION))
    parser.add_argument("--token", default=os.environ.get("SANITY_WRITE_TOKEN"))

    parser.add_argument("--name", required=True, help="Event name")
    parser.add_argument("--slug", help="Slug (defaults to a slugified version of --name)")
    parser.add_argument("--id", help="Optional explicit Sanity document _id")

    parser.add_argument(
        "--format",
        required=True,
        choices=["in-person", "virtual"],
        help='Event format (maps to schema field "format")',
    )

    parser.add_argument("--date", required=True, help='Datetime string (e.g. "2026-02-01T19:30:00Z")')
    parser.add_argument(
        "--doors-open",
        dest="doors_open",
        type=int,
        default=60,
        help="Minutes before start time (number). Defaults to 60 to match the Studio initialValue.",
    )
    parser.add_argument("--tickets", help="Tickets URL")

    parser.add_argument("--venue-id", dest="venue_id", help='Sanity document id for a venue (reference _ref)')
    parser.add_argument("--headline-id", dest="headline_id", help='Sanity document id for an artist (reference _ref)')

    parser.add_argument("--likes", type=int, help="Initial likes (defaults to 0)")
    parser.add_argument("--dislikes", type=int, help="Initial dislikes (defaults to 0)")

    parser.add_argument("--dry-run", action="store_true", help="Validate mutation without writing")
    parser.add_argument(
        "--visibility",
        default="sync",
        choices=["sync", "async", "deferred"],
        help="Mutation visibility (sync|async|deferred)",
    )

    return parser.parse_args(argv)


def get_env_file_from_argv(argv: list[str]) -> Optional[str]:
    for i, arg in enumerate(argv):
        if arg == "--env-file" and i + 1 < len(argv):
            return argv[i + 1]
        if arg.startswith("--env-file="):
            return arg.split("=", 1)[1]
    return None


def main(argv: list[str]) -> int:
    # Load env files before parsing so env vars can affect CLI defaults.
    load_env_files(get_env_file_from_argv(argv))

    args = parse_args(argv)

    token = (args.token or "").strip()
    if not token:
        print(
            'Missing token. Set env var SANITY_WRITE_TOKEN="..." or pass --token.',
            file=sys.stderr,
        )
        return 2

    project_id = (args.project_id or "").strip()
    dataset = (args.dataset or "").strip()
    api_version = normalize_api_version(args.api_version or "")

    if not project_id:
        print("Missing --project-id (or SANITY_PROJECT_ID).", file=sys.stderr)
        return 2
    if not dataset:
        print("Missing --dataset (or SANITY_DATASET).", file=sys.stderr)
        return 2

    if args.format == "virtual" and args.venue_id:
        print('Refusing: virtual events should not include --venue-id (schema disallows venue for virtual).', file=sys.stderr)
        return 2

    event_doc = build_event_document(args)

    url = (
        f"https://{project_id}.api.sanity.io/{api_version}/data/mutate/{dataset}"
        f"?returnDocuments=true"
        f"&visibility={args.visibility}"
        f"&dryRun={'true' if args.dry_run else 'false'}"
    )

    payload: Dict[str, Any] = {"mutations": [{"create": event_doc}]}

    res = request_json(url=url, token=token, payload=payload)
    print(json.dumps(res, indent=2, sort_keys=True))
    return 0


if __name__ == "__main__":
    raise SystemExit(main(sys.argv[1:]))



# python3 scripts/sanity_create_event.py \
#   --name "Concert at Altamont Free Concert" \
#   --format in-person \
#   --date "2026-02-01T19:30:00Z" \
#   --doors-open 60 \
#   --venue-id "venue-altamont-free-concert"