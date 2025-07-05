chrome.runtime.onInstalled.addListener(() => {
    console.log("Lead Generator Extension Installed");
});
chrome.action.onClicked.addListener(async (tab) => {
    await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        func: async () => {
            const { showLeadPanel } = await import(chrome.runtime.getURL("popup.js"));
            showLeadPanel();
        },
    });
});
