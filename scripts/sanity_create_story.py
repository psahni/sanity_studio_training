#!/usr/bin/env python3
"""
Create `story` documents in Sanity from a local JSON file using the HTTP Mutation API:
https://www.sanity.io/docs/http-reference/mutation

Input JSON format:
  - Expects a top-level object with `data: [...]`
  - Each item in `data` is converted into a Sanity document

Usage:
  - Default input file: scripts/sanity_story_json.json
  - Or pass a file path as the first argument (no argparse):
      SANITY_WRITE_TOKEN="..." python3 scripts/sanity_create_story.py path/to/file.json

Env loading:
  - Requires: `python-dotenv` (install with `python3 -m pip install python-dotenv`)
  - Automatically reads `.env.local` if present (repo root or `apps/web/.env.local`)

Required env vars:
  - SANITY_WRITE_TOKEN

Optional env vars:
  - SANITY_PROJECT_ID (default: d6yzt76s)
  - SANITY_DATASET (default: production)
  - SANITY_API_VERSION (default: 2026-01-22)
  - SANITY_STORY_TYPE (default: story)
"""

from __future__ import annotations

import json
import os
import sys
import urllib.error
import urllib.request
import hashlib
from typing import Any, Dict, Optional, List

try:
    from dotenv import load_dotenv
except Exception:  # pragma: no cover
    load_dotenv = None  # type: ignore[assignment]


DEFAULT_PROJECT_ID = "d6yzt76s"
DEFAULT_DATASET = "production"
DEFAULT_API_VERSION = "2026-01-22"
DEFAULT_STORY_TYPE = "story"
MAX_JS_SAFE_INT = 9007199254740991  # 2^53 - 1


def load_env_files() -> None:
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

    candidates = [
        os.path.join(repo_root, ".env.local"),
        os.path.join(repo_root, "apps", "web", ".env.local"),
        os.path.join(repo_root, "apps", "studio", ".env.local"),
    ]

    for candidate in candidates:
        if os.path.exists(candidate):
            load_dotenv(dotenv_path=candidate, override=False)

def normalize_api_version(api_version: str) -> str:
    value = api_version.strip()
    if not value:
        raise ValueError("apiVersion cannot be empty")
    if value.startswith("v"):
        return value
    return f"v{value}"

def as_non_empty_str(value: Any, field_name: str) -> str:
    if not isinstance(value, str) or not value.strip():
        raise ValueError(f'Expected "{field_name}" to be a non-empty string.')
    return value.strip()


def as_str_or_none(value: Any) -> Optional[str]:
    if value is None:
        return None
    if isinstance(value, str) and value.strip():
        return value.strip()
    return None


def as_list_of_str(value: Any) -> List[str]:
    if not isinstance(value, list):
        return []
    result: List[str] = []
    for item in value:
        if isinstance(item, str) and item.strip():
            result.append(item.strip())
    return result


def to_title_case_from_id(value: str) -> str:
    cleaned = value.replace("-", " ").replace("_", " ").strip()
    parts = [p for p in cleaned.split(" ") if p]
    if not parts:
        return "Unknown"
    return " ".join(p[:1].upper() + p[1:] for p in parts)


def date_only(value: Optional[str]) -> Optional[str]:
    if not value:
        return None
    # Accept ISO-like strings and return YYYY-MM-DD if possible.
    if "T" in value:
        return value.split("T", 1)[0]
    return value


def stable_number_from_string(value: str) -> int:
    # Deterministic, JS-safe integer derived from string input.
    digest = hashlib.sha1(value.encode("utf-8")).hexdigest()
    return int(digest, 16) % MAX_JS_SAFE_INT


def load_story_json(input_path: str) -> List[Dict[str, Any]]:
    with open(input_path, "r", encoding="utf-8") as f:
        payload = json.load(f)

    data = payload.get("data")
    if not isinstance(data, list):
        raise ValueError('Input JSON must contain a top-level key "data" with an array value.')

    stories: List[Dict[str, Any]] = []
    for item in data:
        if not isinstance(item, dict):
            continue
        stories.append(item)
    return stories


def build_story_document(story_type: str, story_payload: Dict[str, Any]) -> Dict[str, Any]:
    # Input uses snake_case; schema uses camelCase.
    story_id = as_non_empty_str(story_payload.get("story_id"), "story_id")
    headline = as_non_empty_str(story_payload.get("headline"), "headline")
    published_at = as_non_empty_str(story_payload.get("publishedAt"), "publishedAt")
    created_at = as_non_empty_str(story_payload.get("created_At"), "created_At")

    persona_info_in = story_payload.get("persona_info")
    persona_info_out: List[Dict[str, Any]] = []
    if isinstance(persona_info_in, list):
        for persona in persona_info_in:
            if not isinstance(persona, dict):
                continue

            persona_id = as_non_empty_str(persona.get("persona_id"), "persona_id")
            persona_headline = as_non_empty_str(persona.get("headline"), "headline")
            persona_name = to_title_case_from_id(persona_id)

            moderation_in = persona.get("moderation")
            moderation_out: Optional[Dict[str, Any]] = None
            if isinstance(moderation_in, dict):
                moderation_out = {
                    "score": moderation_in.get("score"),
                    "reasoning": moderation_in.get("reasoning"),
                    "flaggedRules": as_list_of_str(moderation_in.get("flagged_rules")),
                }

            question_answers_in = persona.get("question_answers")
            question_answers_out: List[Dict[str, Any]] = []
            if isinstance(question_answers_in, list):
                for idx, qa in enumerate(question_answers_in):
                    if not isinstance(qa, dict):
                        continue
                    question = as_str_or_none(qa.get("question"))
                    answer = as_str_or_none(qa.get("answer"))
                    if not question or not answer:
                        continue
                    question_answers_out.append(
                        {
                            "_key": f"{persona_id}-{idx}",
                            "question": question,
                            "answer": answer,
                        }
                    )

            persona_out: Dict[str, Any] = {
                "_key": persona_id,
                "personaId": persona_id,
                "personaName": persona_name,
                "storyId": as_str_or_none(persona.get("story_id")) or story_id,
                "headline": persona_headline,
                "summary": as_str_or_none(persona.get("summary")),
            }

            if moderation_out is not None:
                persona_out["moderation"] = moderation_out
            if question_answers_out:
                persona_out["questionAnswers"] = question_answers_out

            persona_info_out.append(persona_out)

    article_data_in = story_payload.get("article_data")
    article_data_out: List[Dict[str, Any]] = []
    if isinstance(article_data_in, list):
        for article in article_data_in:
            if not isinstance(article, dict):
                continue

            article_id_raw = as_non_empty_str(article.get("article_id"), "article_id")
            article_data_out.append(
                {
                    "_key": article_id_raw,
                    "articleId": stable_number_from_string(article_id_raw),
                    "title": as_str_or_none(article.get("title")),
                    "publicationDate": date_only(as_str_or_none(article.get("publication_date"))),
                    "companyNames": as_list_of_str(article.get("company_names")),
                    "stockSymbols": as_list_of_str(article.get("stock_symbols")),
                    "industries": as_list_of_str(article.get("topics")),
                    "newsType": [],
                }
            )

    # Use a stable id so reruns are idempotent.
    doc: Dict[str, Any] = {
        "_type": story_type,
        "_id": f"{story_type}.{story_id}",
        "storyId": story_id,
        "headline": headline,
        "publishedAt": published_at,
        "topics": as_list_of_str(story_payload.get("topics")),
        "createdAt": created_at,
    }

    if persona_info_out:
        doc["personaInfo"] = persona_info_out
    if article_data_out:
        doc["articleData"] = article_data_out

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


def main(argv: list[str]) -> int:
    load_env_files()

    script_dir = os.path.dirname(os.path.abspath(__file__))
    default_input_path = os.path.join(script_dir, "sanity_story_json.json")
    input_path = argv[0] if len(argv) >= 1 else default_input_path

    token = (os.environ.get("SANITY_WRITE_TOKEN") or "").strip()
    if not token:
        print(
            'Missing token. Set env var SANITY_WRITE_TOKEN="..." (supports .env.local).',
            file=sys.stderr,
        )
        return 2

    project_id = (os.environ.get("SANITY_PROJECT_ID") or DEFAULT_PROJECT_ID).strip()
    dataset = (os.environ.get("SANITY_DATASET") or DEFAULT_DATASET).strip()
    api_version = normalize_api_version((os.environ.get("SANITY_API_VERSION") or DEFAULT_API_VERSION).strip())
    story_type = (os.environ.get("SANITY_STORY_TYPE") or DEFAULT_STORY_TYPE).strip() or DEFAULT_STORY_TYPE

    if not project_id:
        print("Missing --project-id (or SANITY_PROJECT_ID).", file=sys.stderr)
        return 2
    if not dataset:
        print("Missing --dataset (or SANITY_DATASET).", file=sys.stderr)
        return 2

    stories = load_story_json(input_path)
    if not stories:
        print(f"No stories found in {input_path}", file=sys.stderr)
        return 2

    url = (
        f"https://{project_id}.api.sanity.io/{api_version}/data/mutate/{dataset}"
        f"?returnDocuments=true"
        f"&visibility=sync"
        f"&autoGenerateArrayKeys=true"
    )

    mutations: List[Dict[str, Any]] = []
    for story in stories:
        doc = build_story_document(story_type=story_type, story_payload=story)
        mutations.append({"createOrReplace": doc})

    payload: Dict[str, Any] = {"mutations": mutations}

    res = request_json(url=url, token=token, payload=payload)
    print(json.dumps(res, indent=2, sort_keys=True))
    return 0


if __name__ == "__main__":
    raise SystemExit(main(sys.argv[1:]))