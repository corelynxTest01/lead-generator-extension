chrome.runtime.onMessage.addListener((request, _, response) => {
    const { action, tabId } = request;
    if (action === "getCurrentTab") chrome.tabs.query({ active: true, currentWindow: true }, tabs => response(tabs));
    if (action === "reloadTab" && tabId) chrome.tabs.reload(tabId, {}, () => response({ success: true }));
    return true;
});

// Handle browser action click to show the lead panel
chrome.action.onClicked.addListener(async (tab) => {
    const tabId = tab?.id;
    if (!tabId) return;
    await chrome.scripting.executeScript({
        target: { tabId },
        func: async () => {
            const { showLeadPanel } = await import(chrome.runtime.getURL("popup.js"));
            showLeadPanel();
        },
    });
});
