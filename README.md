# BigQuery Release Notes & Social Broadcaster 🚀

A modern, responsive web application built with **Python (Flask)** and **vanilla HTML5, CSS3, and JavaScript**. The app parses the official [Google Cloud BigQuery Release Notes XML Feed](https://docs.cloud.google.com/feeds/bigquery-release-notes.xml), presenting updates as granular cards with search, category filtering, an interactive refresh spinner, and a built-in composer to share updates directly to **X (Twitter)**.

---

## 📸 Overview

BigQuery releases multiple updates, changes, and features within single release logs. This application breaks each update into distinct cards, categorizes them, and enables developers, developer advocates, and data teams to easily track, filter, and broadcast updates to their social channels.

---

## ✨ Features

- **Live Feed Ingestion**: Connects directly to `https://docs.cloud.google.com/feeds/bigquery-release-notes.xml` using standard Atom/RSS parsing.
- **Granular Update Extraction**: Automatically separates entries containing multiple features/changes into independent, actionable cards.
- **Dynamic Refresh with Animated Spinner**:
  - Re-fetches the latest feed on demand without a full page reload.
  - Smooth rotating CSS spinner and "Last updated at" timestamp.
- **One-Click Tweet / Share to X**:
  - Dedicated **"Tweet Update"** button on each card.
  - Floating action bar when an update is selected.
  - **Composer Modal** with pre-formatted text:
    `🚀 Google BigQuery Feature (<Date>): <Summary> <Link> #BigQuery #GoogleCloud`
  - Real-time character counter (280-character limit) with visual warning states.
  - One-click copy to clipboard and direct launch into Twitter/X Web Intent (`https://twitter.com/intent/tweet`).
- **Interactive Search & Category Filters**:
  - Live search across titles, summaries, and HTML content.
  - Filter pills for **Features**, **Changes**, **Fixes**, and **Announcements** with dynamic counts.
- **Zero Frontend Dependencies**: Plain vanilla HTML, CSS, and modern JS. No bloated node modules or frontend build steps required.

---

## 🛠️ Tech Stack

- **Backend**: Python 3.14 / Flask, Requests, `xml.etree.ElementTree`
- **Frontend**: Vanilla HTML5, Modern CSS3 (Flexbox/Grid, CSS Custom Properties, Animations), Vanilla JavaScript (ES6+ Fetch API)
- **Deployment**: Compatible with Google Cloud Run, App Engine, or standard Linux containers.

---

## 📂 Project Structure

```text
kruklis-event-talks-app/
├── app.py                 # Flask server, feed fetcher, and XML parser
├── requirements.txt       # Python dependencies (Flask, Requests)
├── templates/
│   └── index.html         # Main dashboard template
├── static/
│   ├── style.css          # Google Cloud-inspired theme, cards, animations
│   └── script.js          # Client-side reactivity, feed refresh, tweet composer
├── .gitignore             # Git ignore file for Python/Flask environments
└── README.md              # Project documentation
```

---

## 🚀 Getting Started

### Prerequisites
- Python 3.10+ (Python 3.12+ recommended)
- `pip` or virtual environment tool

### Installation

1. **Clone the repository**:
   ```bash
   git clone https://github.com/kruklis/kruklis-event-talks-app.git
   cd kruklis-event-talks-app
   ```

2. **Create and activate a virtual environment**:
   ```bash
   python3 -m venv venv
   source venv/bin/activate
   ```

3. **Install dependencies**:
   ```bash
   pip install -r requirements.txt
   ```

### Running Locally

Start the Flask development server:
```bash
python app.py
```

Then open your browser and navigate to:
```text
http://localhost:8080
```

---

## 🔌 API Endpoints

### `GET /`
Serves the web dashboard interface.

### `GET /api/releases`
Fetches the XML feed from Google Cloud, parses the entries, and returns a JSON payload:

**Response Example**:
```json
{
  "success": true,
  "total_releases": 30,
  "total_updates": 63,
  "last_fetched": "2026-09-04T19:46:14.123456+00:00",
  "releases": [
    {
      "id": "tag:google.com,2016:bigquery-release-notes#September_03_2026",
      "date": "September 03, 2026",
      "link": "https://docs.cloud.google.com/bigquery/docs/release-notes#September_03_2026",
      "updated": "2026-09-03T00:00:00-07:00",
      "items": [
        {
          "id": "tag:google.com,2016:bigquery-release-notes#September_03_2026-item-1",
          "type": "Feature",
          "summary": "Conversational analytics now supports questions about market basket analysis. This feature is generally available (GA).",
          "html": "<h3>Feature</h3><p>Conversational analytics now supports questions about...",
          "date": "September 03, 2026",
          "link": "https://docs.cloud.google.com/bigquery/docs/release-notes#September_03_2026"
        }
      ]
    }
  ]
}
```

---

## 🚢 Deploying to Google Cloud Run

You can deploy this application directly to Cloud Run:

```bash
gcloud run deploy kruklis-event-talks-app \
  --source . \
  --region us-central1 \
  --allow-unauthenticated
```

---

## 📄 License

This project is licensed under the MIT License.
