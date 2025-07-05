export async function showLeadPanel() {
  document.getElementById("lead-panel")?.remove();

  const panel = document.createElement("div");
  panel.id = "lead-panel";

  const response = await fetch(chrome.runtime.getURL("popup.html"));
  const htmlContent = await response.text();
  panel.innerHTML = htmlContent;
  document.body.appendChild(panel);

  // ✅ Style injection
  if (!document.getElementById("lead-panel-style")) {
    const styleResponse = await fetch(chrome.runtime.getURL("popup.css"));
    const cssText = await styleResponse.text();
    const style = document.createElement("style");
    style.id = "lead-panel-style";
    style.textContent = cssText;
    document.head.appendChild(style);
  }

  // ✅ Make panel draggable
  const header = panel.querySelector("#lead-panel-header");
  let offsetX = 0,
    offsetY = 0,
    isDragging = false;

  if (header) {
    header.onmousedown = (e) => {
      isDragging = true;
      offsetX = e.clientX - panel.getBoundingClientRect().left;
      offsetY = e.clientY - panel.getBoundingClientRect().top;
      document.onmousemove = (e) => {
        if (!isDragging) return;
        panel.style.left = e.clientX - offsetX + "px";
        panel.style.top = e.clientY - offsetY + "px";
        panel.style.right = "auto";
      };
      document.onmouseup = () => {
        isDragging = false;
        document.onmousemove = null;
        document.onmouseup = null;
      };
    };
  }

  // ✅ Close button handler
  const closeBtn = panel.querySelector("#lead-panel-close");
  if (closeBtn) closeBtn.addEventListener("click", () => panel.remove());


  // ✅ Inject the module to extract LinkedIn data

  let platform = "";
  const hostname = window.location.hostname;

  if (hostname.includes("linkedin.com")) platform = "linkedin";
  else if (hostname.includes("facebook.com")) platform = "facebook";
  else if (hostname.includes("twitter.com") || hostname.includes("x.com")) platform = "twitter";
  else if (hostname.includes("instagram.com")) platform = "instagram";

  try {
    let data = null;
    let module = null;

    if (platform === "linkedin") {
      console.log("Loading.... LinkedIn profile extraction module");
      module = await import(chrome.runtime.getURL("library/linkedinProfile.js"));
      console.log("LinkedIn profile extraction module loaded");
      data = await module.default();
    } else if (platform === "facebook") {
      console.log("Loading.... Facebook profile extraction module");
      module = await import(chrome.runtime.getURL("library/facebookProfile.js"));
      console.log("Facebook profile extraction module loaded");
      data = await module.default();

    } else if (platform === "twitter") {
      console.log("Loading.... Twitter profile extraction module");
      module = await import(chrome.runtime.getURL("library/twitterProfile.js"));
      console.log("Twitter profile extraction module loaded");
      data = await module.default();
    } else if (platform === "instagram") {
      console.log("Loading.... Instagram profile extraction module");
      module = await import(chrome.runtime.getURL("library/instagramProfile.js"));
      console.log("Instagram profile extraction module loaded");
      data = await module.default();
    } else {
      throw new Error("Unsupported platform");
    }

    // Display logic
    const displayModule = await import(chrome.runtime.getURL("helper/display.js"));
    displayModule.default(data, panel);

  } catch (error) {
    console.error("Lead extraction failed:", error);
  }
}
