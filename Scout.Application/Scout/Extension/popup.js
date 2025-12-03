document.addEventListener("DOMContentLoaded", () => {
    const statusText = document.getElementById("statusText");
    const enabledToggle = document.getElementById("enabledToggle");
    const openOptionsBtn = document.getElementById("openOptionsBtn");

    chrome.storage.sync.get(["blockedSites", "email", "enabled"], (data) => {
        const blockedSites = data.blockedSites || [];
        const email = data.email || "";
        const enabled = data.enabled ?? true;

        enabledToggle.checked = enabled;

        if (!blockedSites.length || !email) {
            statusText.textContent = "Setup incomplete: add blocked sites and email.";
        } else if (!enabled) {
            statusText.textContent = "Scout is disabled.";
        } else {
            statusText.textContent = `Monitoring ${blockedSites.length} blocked sites.`;
        }
    });

    enabledToggle.addEventListener("change", () => {
        const enabled = enabledToggle.checked;
        chrome.storage.sync.set({ enabled });
    });

    openOptionsBtn.addEventListener("click", () => {
        if (chrome.runtime.openOptionsPage) {
            chrome.runtime.openOptionsPage();
        } else {
            window.open(chrome.runtime.getURL("options.html"));
        }
    });
});
