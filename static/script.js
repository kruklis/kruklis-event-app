(function() {
  'use strict';

  // App State
  let releasesData = [];
  let flatItems = [];
  let selectedItem = null;
  let activeFilter = 'ALL';
  let searchQuery = '';

  // DOM Elements
  const refreshBtn = document.getElementById('refresh-btn');
  const spinnerIcon = refreshBtn ? refreshBtn.querySelector('.spinner-icon') : null;
  const lastUpdatedText = document.getElementById('last-updated-text');
  const searchInput = document.getElementById('search-input');
  const clearSearchBtn = document.getElementById('clear-search');
  const filterPills = document.getElementById('filter-pills');
  const releasesContainer = document.getElementById('releases-container');
  const noticeBanner = document.getElementById('notice-banner');

  // Floating Selection Bar
  const selectionBar = document.getElementById('selection-bar');
  const selectionPreviewTitle = document.getElementById('selection-preview-title');
  const barComposeBtn = document.getElementById('bar-compose-btn');
  const clearSelectionBtn = document.getElementById('clear-selection-btn');

  // Modal Elements
  const tweetModal = document.getElementById('tweet-modal');
  const closeModalBtn = document.getElementById('close-modal-btn');
  const modalUpdateBadge = document.getElementById('modal-update-badge');
  const modalUpdateDate = document.getElementById('modal-update-date');
  const tweetTextarea = document.getElementById('tweet-textarea');
  const charCounter = document.getElementById('char-counter');
  const modalLinkDisplay = document.getElementById('modal-link-display');
  const copyTweetBtn = document.getElementById('copy-tweet-btn');
  const copyBtnText = document.getElementById('copy-btn-text');
  const launchTweetBtn = document.getElementById('launch-tweet-btn');

  // Toast Element
  const toast = document.getElementById('toast');
  let toastTimeout = null;

  // Helpers
  function showToast(msg, duration = 3000) {
    if (!toast) return;
    toast.textContent = msg;
    toast.classList.add('show');
    if (toastTimeout) clearTimeout(toastTimeout);
    toastTimeout = setTimeout(() => {
      toast.classList.remove('show');
    }, duration);
  }

  function getBadgeClass(type) {
    const t = (type || '').toLowerCase();
    if (t.includes('feature')) return 'badge-feature';
    if (t.includes('change')) return 'badge-change';
    if (t.includes('fixed') || t.includes('fix')) return 'badge-fixed';
    if (t.includes('announcement')) return 'badge-announcement';
    return 'badge-default';
  }

  function formatRelativeDate(isoString) {
    if (!isoString) return '';
    try {
      const date = new Date(isoString);
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    } catch {
      return '';
    }
  }

  // Fetch Releases from Backend
  async function fetchReleases(isManual = false) {
    if (refreshBtn) refreshBtn.disabled = true;
    if (spinnerIcon) spinnerIcon.classList.add('spinning');
    if (lastUpdatedText) lastUpdatedText.textContent = isManual ? 'Refreshing feed...' : 'Loading feed...';

    try {
      const res = await fetch(`/api/releases?_t=${Date.now()}`);
      if (!res.ok) {
        throw new Error(`HTTP error ${res.status}`);
      }
      const data = await res.json();

      if (!data.success && !data.releases.length) {
        throw new Error(data.error || 'Failed to load releases');
      }

      releasesData = data.releases || [];

      // Flatten items for filtering and counts
      flatItems = [];
      releasesData.forEach(rel => {
        rel.items.forEach(item => {
          flatItems.push({
            ...item,
            releaseDate: rel.date,
            releaseLink: rel.link
          });
        });
      });

      updateFilterCounts();

      if (data.warning) {
        noticeBanner.style.display = 'block';
        noticeBanner.textContent = data.warning;
      } else {
        noticeBanner.style.display = 'none';
      }

      const timeFormatted = formatRelativeDate(data.last_fetched);
      if (lastUpdatedText) {
        lastUpdatedText.textContent = timeFormatted ? `Updated at ${timeFormatted}` : 'Up to date';
      }

      render();

      if (isManual) {
        showToast('BigQuery release notes refreshed successfully!');
      }

    } catch (err) {
      console.error('Error fetching release notes:', err);
      if (lastUpdatedText) lastUpdatedText.textContent = 'Failed to update';
      if (!releasesData.length) {
        releasesContainer.innerHTML = `
          <div class="error-state">
            <p><strong>Failed to load BigQuery release notes.</strong></p>
            <p style="margin-top: 8px; font-size: 0.88rem;">${err.message}</p>
            <button class="btn btn-primary" style="margin-top: 16px;" onclick="location.reload()">Retry</button>
          </div>
        `;
      } else {
        showToast(`Could not refresh: ${err.message}`);
      }
    } finally {
      if (refreshBtn) refreshBtn.disabled = false;
      if (spinnerIcon) spinnerIcon.classList.remove('spinning');
    }
  }

  // Update Count Badges on Filter Pills
  function updateFilterCounts() {
    const counts = {
      ALL: flatItems.length,
      Feature: 0,
      Change: 0,
      Fixed: 0,
      Announcement: 0
    };

    flatItems.forEach(item => {
      const t = item.type || '';
      if (t.includes('Feature')) counts.Feature++;
      else if (t.includes('Change')) counts.Change++;
      else if (t.includes('Fixed')) counts.Fixed++;
      else if (t.includes('Announcement')) counts.Announcement++;
    });

    const elAll = document.getElementById('count-all');
    const elFeat = document.getElementById('count-feature');
    const elChange = document.getElementById('count-change');
    const elFixed = document.getElementById('count-fixed');
    const elAnnounce = document.getElementById('count-announcement');

    if (elAll) elAll.textContent = counts.ALL;
    if (elFeat) elFeat.textContent = counts.Feature;
    if (elChange) elChange.textContent = counts.Change;
    if (elFixed) elFixed.textContent = counts.Fixed;
    if (elAnnounce) elAnnounce.textContent = counts.Announcement;
  }

  // Render Releases List
  function render() {
    if (!releasesData.length) {
      releasesContainer.innerHTML = `
        <div class="empty-state">
          <p>No release notes found.</p>
        </div>
      `;
      return;
    }

    const query = searchQuery.trim().toLowerCase();
    let totalRendered = 0;
    let html = '';

    releasesData.forEach(rel => {
      // Filter items in this release entry
      const matchingItems = rel.items.filter(item => {
        // Category filter
        if (activeFilter !== 'ALL') {
          if (activeFilter === 'Fixed') {
            if (!item.type.includes('Fixed') && !item.type.includes('Fix')) return false;
          } else if (!item.type.includes(activeFilter)) {
            return false;
          }
        }
        // Search query filter
        if (query) {
          const matchText = (item.summary + ' ' + item.type + ' ' + rel.date).toLowerCase();
          if (!matchText.includes(query)) return false;
        }
        return true;
      });

      if (matchingItems.length === 0) return;

      totalRendered += matchingItems.length;

      html += `
        <article class="date-group">
          <div class="date-heading">
            <span>📅 ${escapeHtml(rel.date)}</span>
            <a href="${escapeHtml(rel.link)}" target="_blank" rel="noopener noreferrer" class="source-link" title="Open official release notes">
              Official Docs &rarr;
            </a>
          </div>
          <div class="update-cards-list">
      `;

      matchingItems.forEach(item => {
        const isSelected = selectedItem && selectedItem.id === item.id;
        const badgeClass = getBadgeClass(item.type);

        html += `
          <div class="update-card ${isSelected ? 'selected' : ''}" data-id="${escapeHtml(item.id)}">
            <div class="card-top">
              <div class="card-badges">
                <span class="type-badge ${badgeClass}">${escapeHtml(item.type)}</span>
              </div>
              <label class="card-select-label" title="Select this update">
                <input type="radio" name="selected_update" ${isSelected ? 'checked' : ''} data-id="${escapeHtml(item.id)}">
                <span>Select</span>
              </label>
            </div>

            <div class="card-content">
              ${item.html}
            </div>

            <div class="card-footer">
              <button class="btn-card-tweet" data-id="${escapeHtml(item.id)}">
                <svg class="x-icon-small" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                </svg>
                Tweet Update
              </button>
            </div>
          </div>
        `;
      });

      html += `
          </div>
        </article>
      `;
    });

    if (totalRendered === 0) {
      releasesContainer.innerHTML = `
        <div class="empty-state">
          <p>No release updates match your current filter or search criteria.</p>
        </div>
      `;
      return;
    }

    releasesContainer.innerHTML = html;
    attachCardListeners();
    updateSelectionBar();
  }

  function escapeHtml(str) {
    if (!str) return '';
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  // Attach Event Listeners to rendered cards
  function attachCardListeners() {
    // Radio buttons / selection
    const radioInputs = releasesContainer.querySelectorAll('input[type="radio"]');
    radioInputs.forEach(radio => {
      radio.addEventListener('change', (e) => {
        const itemId = e.target.getAttribute('data-id');
        selectItemById(itemId);
      });
    });

    // Tweet buttons on cards
    const tweetBtns = releasesContainer.querySelectorAll('.btn-card-tweet');
    tweetBtns.forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const itemId = btn.getAttribute('data-id');
        selectItemById(itemId);
        openTweetModal();
      });
    });

    // Clicking anywhere on the card header/padding selects it
    const cards = releasesContainer.querySelectorAll('.update-card');
    cards.forEach(card => {
      card.addEventListener('click', (e) => {
        // If clicking a link or button, let default action happen
        if (e.target.closest('a') || e.target.closest('button')) return;
        const itemId = card.getAttribute('data-id');
        selectItemById(itemId);
      });
    });
  }

  function selectItemById(itemId) {
    const item = flatItems.find(it => it.id === itemId);
    if (!item) return;
    selectedItem = item;

    // Update active highlight classes
    document.querySelectorAll('.update-card').forEach(card => {
      if (card.getAttribute('data-id') === itemId) {
        card.classList.add('selected');
        const radio = card.querySelector('input[type="radio"]');
        if (radio) radio.checked = true;
      } else {
        card.classList.remove('selected');
        const radio = card.querySelector('input[type="radio"]');
        if (radio) radio.checked = false;
      }
    });

    updateSelectionBar();
  }

  function updateSelectionBar() {
    if (selectedItem) {
      selectionBar.style.display = 'block';
      selectionPreviewTitle.textContent = `[${selectedItem.type}] ${selectedItem.summary}`;
    } else {
      selectionBar.style.display = 'none';
    }
  }

  // Generate Tweet Text
  function generateTweetText(item) {
    if (!item) return '';

    // Emojis based on type
    let emoji = '🚀';
    const t = (item.type || '').toLowerCase();
    if (t.includes('fix')) emoji = '🛠️';
    else if (t.includes('change')) emoji = '🔄';
    else if (t.includes('announce')) emoji = '📢';

    const header = `${emoji} Google BigQuery ${item.type} (${item.date}):`;
    const hashtags = `#BigQuery #GoogleCloud`;
    const url = item.link || 'https://docs.cloud.google.com/bigquery/docs/release-notes';

    // Target max ~280 chars total
    // Tweet formula: header + "\n\n" + summary + "\n\n" + url + " " + hashtags
    const fixedLength = header.length + url.length + hashtags.length + 6; // for spaces and newlines
    const maxSummaryLength = 280 - fixedLength;

    let summary = item.summary;
    if (summary.length > maxSummaryLength && maxSummaryLength > 30) {
      summary = summary.substring(0, maxSummaryLength - 3).trim() + '...';
    }

    return `${header}\n\n${summary}\n\n${url} ${hashtags}`;
  }

  // Open & Configure Tweet Modal
  function openTweetModal() {
    if (!selectedItem) return;

    modalUpdateBadge.textContent = selectedItem.type;
    modalUpdateBadge.className = `type-badge ${getBadgeClass(selectedItem.type)}`;
    modalUpdateDate.textContent = selectedItem.date;
    modalLinkDisplay.textContent = selectedItem.link;

    const initialTweet = generateTweetText(selectedItem);
    tweetTextarea.value = initialTweet;
    updateCharCounter();

    tweetModal.style.display = 'flex';
    tweetTextarea.focus();
  }

  function closeTweetModal() {
    tweetModal.style.display = 'none';
  }

  function updateCharCounter() {
    const text = tweetTextarea.value;
    const remaining = 280 - text.length;
    charCounter.textContent = remaining;

    if (remaining < 0) {
      charCounter.className = 'char-counter danger';
    } else if (remaining <= 20) {
      charCounter.className = 'char-counter warning';
    } else {
      charCounter.className = 'char-counter';
    }
  }

  // Event Listeners
  if (refreshBtn) {
    refreshBtn.addEventListener('click', () => fetchReleases(true));
  }

  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      searchQuery = e.target.value;
      if (clearSearchBtn) {
        clearSearchBtn.style.display = searchQuery ? 'block' : 'none';
      }
      render();
    });
  }

  if (clearSearchBtn) {
    clearSearchBtn.addEventListener('click', () => {
      searchQuery = '';
      searchInput.value = '';
      clearSearchBtn.style.display = 'none';
      render();
    });
  }

  if (filterPills) {
    filterPills.addEventListener('click', (e) => {
      const btn = e.target.closest('.pill');
      if (!btn) return;
      const type = btn.getAttribute('data-type');
      activeFilter = type;

      filterPills.querySelectorAll('.pill').forEach(p => p.classList.remove('active'));
      btn.classList.add('active');

      render();
    });
  }

  if (barComposeBtn) {
    barComposeBtn.addEventListener('click', openTweetModal);
  }

  if (clearSelectionBtn) {
    clearSelectionBtn.addEventListener('click', () => {
      selectedItem = null;
      document.querySelectorAll('.update-card').forEach(card => {
        card.classList.remove('selected');
        const radio = card.querySelector('input[type="radio"]');
        if (radio) radio.checked = false;
      });
      updateSelectionBar();
    });
  }

  if (closeModalBtn) {
    closeModalBtn.addEventListener('click', closeTweetModal);
  }

  if (tweetModal) {
    tweetModal.addEventListener('click', (e) => {
      if (e.target === tweetModal) {
        closeTweetModal();
      }
    });
  }

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && tweetModal.style.display === 'flex') {
      closeTweetModal();
    }
  });

  if (tweetTextarea) {
    tweetTextarea.addEventListener('input', updateCharCounter);
  }

  if (copyTweetBtn) {
    copyTweetBtn.addEventListener('click', async () => {
      try {
        await navigator.clipboard.writeText(tweetTextarea.value);
        copyBtnText.textContent = 'Copied!';
        showToast('Tweet copied to clipboard!');
        setTimeout(() => {
          copyBtnText.textContent = 'Copy Text';
        }, 2000);
      } catch {
        tweetTextarea.select();
        document.execCommand('copy');
        showToast('Tweet copied to clipboard!');
      }
    });
  }

  if (launchTweetBtn) {
    launchTweetBtn.addEventListener('click', () => {
      const text = tweetTextarea.value;
      const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`;
      window.open(twitterUrl, '_blank', 'noopener,noreferrer,width=600,height=500');
    });
  }

  // Initial load
  fetchReleases(false);

})();
