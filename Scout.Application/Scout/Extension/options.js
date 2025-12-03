document.addEventListener("DOMContentLoaded", () => {
    const blockedSitesInput = document.getElementById("blockedSites");
    const emailInput = document.getElementById("email");
    const enabledCheckbox = document.getElementById("enabled");
    const saveBtn = document.getElementById("saveBtn");
    const statusSpan = document.getElementById("status");

    // Load settings
    chrome.storage.sync.get(["blockedSites", "email", "enabled"], (data) => {
        const blockedSites = data.blockedSites || [];
        blockedSitesInput.value = blockedSites.join("\n");

        emailInput.value = data.email || "";
        enabledCheckbox.checked = data.enabled ?? true;
    });

    saveBtn.addEventListener("click", () => {
        const blockedSites = blockedSitesInput.value
            .split("\n")
            .map(s => s.trim())
            .filter(s => s.length > 0);

        const email = emailInput.value.trim();
        const enabled = enabledCheckbox.checked;

        chrome.storage.sync.set({ blockedSites, email, enabled }, () => {
            statusSpan.textContent = "Saved!";
            setTimeout(() => statusSpan.textContent = "", 1500);
        });
    });
});
