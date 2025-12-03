const BACKEND_URL = "http://localhost:3000/email"; // change when deploying
const ALERT_COOLDOWN_MS = 5 * 60 * 1000; // 5 minutes per host

// In-memory map: hostname -> last alert timestamp
const lastAlerts = {};

// Listen when a tab finishes loading
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    if (changeInfo.status !== "complete" || !tab.url) return;
    handleTabVisit(tabId, tab);
});

// Optionally also when user switches active tab
chrome.tabs.onActivated.addListener(async (activeInfo) => {
    const tab = await chrome.tabs.get(activeInfo.tabId);
    if (tab && tab.url) {
        handleTabVisit(activeInfo.tabId, tab);
    }
});

async function handleTabVisit(tabId, tab) {
    try {
        const settings = await chrome.storage.sync.get(["blockedSites", "email", "enabled"]);
        const blockedSites = settings.blockedSites || [];
        const email = settings.email;
        const enabled = settings.enabled ?? true;

        if (!enabled) return;
        if (!blockedSites.length || !email) return;

        const url = tab.url;
        const hostname = new URL(url).hostname.toLowerCase();

        if (!isBlockedHost(hostname, blockedSites)) return;

        // Cooldown per hostname
        const now = Date.now();
        const last = lastAlerts[hostname] || 0;
        if (now - last < ALERT_COOLDOWN_MS) {
            return; // recently alerted for this host
        }

        lastAlerts[hostname] = now;

        await captureAndSend(tab, email);
    } catch (err) {
        console.error("Scout error handling tab visit:", err);
    }
}

function isBlockedHost(hostname, blockedSites) {
    return blockedSites.some(entry => {
        const trimmed = entry.trim().toLowerCase();
        if (!trimmed) return false;
        // Simple "contains" match: "instagram" matches "www.instagram.com"
        return hostname.includes(trimmed);
    });
}

async function captureAndSend(tab, email) {
    try {
        // Capture the visible tab as PNG data URL
        const imageDataUrl = await chrome.tabs.captureVisibleTab(tab.windowId, { format: "png" });

        const payload = {
            image: imageDataUrl,
            url: tab.url,
            title: tab.title,
            email: email,
            timestamp: new Date().toISOString()
        };

        await fetch(BACKEND_URL, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload)
        });
    } catch (err) {
        console.error("Scout failed to capture/send screenshot:", err);
    }
}
