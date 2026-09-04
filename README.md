# BigQuery Release Notes Viewer & Tweet Broadcaster

A clean, modern web application built with **Python Flask** and **vanilla HTML, CSS, and JavaScript** that fetches live release notes from the official [BigQuery Release Notes XML Feed](https://docs.cloud.google.com/feeds/bigquery-release-notes.xml) and lets you share any update directly to X / Twitter.

## Features

- **Live RSS/Atom Feed Parsing**: Fetches and parses `https://docs.cloud.google.com/feeds/bigquery-release-notes.xml`.
- **Granular Updates**: Splits multi-item releases (Features, Changes, Fixes, Announcements) into individual selectable cards.
- **Dynamic Refresh with Animated Spinner**: Click the **Refresh** button at any time to re-fetch and render updates without full page reloads.
- **Select & Tweet to X**:
  - Click **"Tweet Update"** on any card, or select an update to view the floating action bar.
  - Interactive Tweet Composer modal with automatic text generation, character counter (280 max), copy to clipboard, and instant link to Twitter/X intent.
- **Search & Filters**:
  - Instant text filter across release descriptions, dates, and types.
  - Category filter pills for Features, Changes, Fixes, and Announcements.
- **Zero Heavy Frontend Dependencies**: Plain vanilla HTML5, CSS3, and modern JavaScript.

## Setup & Running Locally

### 1. Activate the Virtual Environment
```bash
source venv/bin/activate
```

### 2. Install Requirements (if not already installed)
```bash
pip install -r requirements.txt
```

### 3. Run the Flask Server
```bash
python app.py
```

Open your browser and navigate to:
[http://localhost:8080](http://localhost:8080)
