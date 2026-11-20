#!/usr/bin/env python3
"""Regenerate publications.json from publications.bib.

Usage (from the repo root):
    python3 scripts/bib_to_json.py

No third-party packages needed. publications.bib is the source of truth:
edit the .bib, run this script, commit both files. Never edit
publications.json by hand.
"""
import json
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
BIB = ROOT / "publications.bib"
OUT = ROOT / "publications.json"

# BibTeX entry type -> group shown on the site
GROUPS = {
    "article": "journal",
    "inproceedings": "conference",
    "conference": "conference",
    "phdthesis": "thesis",
}
DEFAULT_GROUP = "report"  # techreport, incollection, book, misc, ...


def split_entries(text):
    """Yield (type, key, body, raw) for each @type{key, ...} entry."""
    i = 0
    while True:
        m = re.search(r"@(\w+)\s*\{", text[i:])
        if not m:
            return
        at = i + m.start()
        start = i + m.end()
        depth, j = 1, start
        while j < len(text) and depth:
            depth += {"{": 1, "}": -1}.get(text[j], 0)
            j += 1
        inner = text[start : j - 1]
        i = j
        etype = m.group(1).lower()
        if etype in ("comment", "string", "preamble"):
            continue
        key, _, body = inner.partition(",")
        yield etype, key.strip(), body, text[at:j].strip()


def parse_fields(body):
    """Parse 'name = {value}, name = "value", name = 2024' pairs."""
    fields, i, n = {}, 0, len(body)
    while i < n:
        m = re.compile(r"\s*([\w-]+)\s*=\s*").match(body, i)
        if not m:
            break
        name, i = m.group(1).lower(), m.end()
        if body[i] == "{":
            depth, j = 1, i + 1
            while j < n and depth:
                depth += {"{": 1, "}": -1}.get(body[j], 0)
                j += 1
            value = body[i + 1 : j - 1]
        elif body[i] == '"':
            j = body.index('"', i + 1) + 1
            value = body[i + 1 : j - 1]
        else:
            j = i
            while j < n and body[j] not in ",\n":
                j += 1
            value = body[i:j]
        fields[name] = clean(value)
        i = j
        while i < n and body[i] in " \t\r\n,":
            i += 1
    return fields


def clean(value):
    value = value.replace("\\&", "&").replace("\\%", "%").replace("~", " ")
    value = value.replace("{", "").replace("}", "")
    return re.sub(r"\s+", " ", value).strip()


def parse_authors(raw):
    authors = []
    for name in re.split(r"\s+and\s+", raw):
        if "," in name:
            family, given = [p.strip() for p in name.split(",", 1)]
        else:
            parts = name.split()
            family, given = parts[-1], " ".join(parts[:-1])
        authors.append({"given": given, "family": family})
    return authors


def main():
    if not BIB.exists():
        sys.exit(f"Cannot find {BIB}")
    pubs = []
    for order, (etype, key, body, raw) in enumerate(split_entries(BIB.read_text(encoding="utf-8"))):
        f = parse_fields(body)
        pub = {
            "key": key,
            "type": etype,
            "group": GROUPS.get(etype, DEFAULT_GROUP),
            "title": f.get("title", ""),
            "authors": parse_authors(f.get("author", "")),
            "year": int(f["year"]) if f.get("year", "").isdigit() else None,
            "venue": f.get("journal") or f.get("booktitle") or f.get("institution")
                     or (", ".join(x for x in (f.get("type", ""), f.get("school", "")) if x)) or "",
            "volume": f.get("volume", ""),
            "number": f.get("number", ""),
            "pages": f.get("pages", "").replace("--", "–"),
            "publisher": f.get("publisher", ""),
            "doi": f.get("doi", ""),
            "url": f.get("url", ""),
            "bibtex": raw,
            "_order": order,
        }
        pubs.append(pub)

    # Newest first; within a year keep the order used in the .bib file.
    pubs.sort(key=lambda p: (-(p["year"] or 0), p["_order"]))
    for p in pubs:
        del p["_order"]

    OUT.write_text(json.dumps(pubs, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    print(f"Wrote {len(pubs)} publications to {OUT.name}")


if __name__ == "__main__":
    main()
