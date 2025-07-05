chrome.runtime.onInstalled.addListener(() => {
    console.log("Lead Generator Extension Installed");
});

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "getCurrentTabUrl") {
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            sendResponse({ url: tabs[0]?.url || "" });
        });
        return true;
    }
});

// Handle browser action click to show the lead panel
chrome.action.onClicked.addListener(async (tab) => {
    await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        func: async () => {
            const { showLeadPanel } = await import(chrome.runtime.getURL("popup.js"));
            showLeadPanel();
        },
    });
});
