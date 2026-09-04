import os
import re
import datetime
from html import unescape
import xml.etree.ElementTree as ET
import requests
from flask import Flask, jsonify, render_template, request

app = Flask(__name__)

FEED_URL = "https://docs.cloud.google.com/feeds/bigquery-release-notes.xml"
USER_AGENT = "Mozilla/5.0 (compatible; BigQueryReleaseNotesViewer/1.0)"

# In-memory cache for fallback in case of temporary network hiccups
_cached_data = {
    "releases": [],
    "last_fetched": None,
    "raw_xml": None
}

def parse_release_notes(xml_text: str):
    root = ET.fromstring(xml_text)
    ns = {"atom": "http://www.w3.org/2005/Atom"}
    
    entries = []
    total_items = 0

    for entry in root.findall("atom:entry", ns):
        title_elem = entry.find("atom:title", ns)
        title = title_elem.text.strip() if title_elem is not None and title_elem.text else "Recent Update"
        
        id_elem = entry.find("atom:id", ns)
        entry_id = id_elem.text.strip() if id_elem is not None and id_elem.text else ""
        
        updated_elem = entry.find("atom:updated", ns)
        updated = updated_elem.text.strip() if updated_elem is not None and updated_elem.text else ""
        
        link_elem = entry.find("atom:link", ns)
        link = link_elem.get("href", "") if link_elem is not None else "https://docs.cloud.google.com/bigquery/docs/release-notes"
        
        content_elem = entry.find("atom:content", ns)
        content_html = content_elem.text if content_elem is not None and content_elem.text else ""
        
        # Split content into distinct update blocks by <h3> header if present
        parts = re.split(r"(<h3>.*?</h3>)", content_html, flags=re.DOTALL)
        items = []

        if len(parts) > 1:
            current_type = "Update"
            for part in parts:
                part = part.strip()
                if not part:
                    continue
                header_match = re.match(r"<h3>(.*?)</h3>", part, flags=re.DOTALL)
                if header_match:
                    current_type = header_match.group(1).strip()
                else:
                    clean_text = re.sub(r"<[^>]+>", " ", part)
                    clean_text = re.sub(r"\s+", " ", clean_text).strip()
                    total_items += 1
                    items.append({
                        "id": f"{entry_id}-item-{len(items)+1}",
                        "type": current_type,
                        "html": part,
                        "summary": unescape(clean_text),
                        "date": title,
                        "link": link
                    })
        else:
            clean_text = re.sub(r"<[^>]+>", " ", content_html)
            clean_text = re.sub(r"\s+", " ", clean_text).strip()
            total_items += 1
            items.append({
                "id": f"{entry_id}-item-1",
                "type": "Update",
                "html": content_html,
                "summary": unescape(clean_text),
                "date": title,
                "link": link
            })
            
        entries.append({
            "id": entry_id,
            "date": title,
            "updated": updated,
            "link": link,
            "items": items
        })

    return entries, total_items

def fetch_feed():
    global _cached_data
    headers = {"User-Agent": USER_AGENT}
    try:
        response = requests.get(FEED_URL, headers=headers, timeout=12)
        response.raise_for_status()
        xml_content = response.text
        releases, total_items = parse_release_notes(xml_content)
        _cached_data = {
            "releases": releases,
            "total_items": total_items,
            "last_fetched": datetime.datetime.now(datetime.timezone.utc).isoformat(),
            "raw_xml": xml_content
        }
        return releases, total_items, _cached_data["last_fetched"], None
    except Exception as exc:
        if _cached_data["releases"]:
            return (
                _cached_data["releases"],
                _cached_data.get("total_items", 0),
                _cached_data["last_fetched"],
                f"Fetched from cache (live refresh error: {str(exc)})"
            )
        return [], 0, None, f"Failed to fetch release notes: {str(exc)}"

@app.route("/")
def index():
    return render_template("index.html")

@app.route("/api/releases")
def get_releases():
    releases, total_items, last_fetched, error = fetch_feed()
    if error and not releases:
        return jsonify({
            "success": False,
            "error": error
        }), 502
    
    return jsonify({
        "success": True,
        "releases": releases,
        "total_releases": len(releases),
        "total_updates": total_items,
        "last_fetched": last_fetched,
        "warning": error
    })

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 8080))
    app.run(host="0.0.0.0", port=port, debug=True)
