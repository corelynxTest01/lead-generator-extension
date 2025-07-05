import language from "../helper/language.js";

const querySelectors = (selectors) => {
  for (const selector of selectors) {
    const el = document.querySelector(selector);
    if (el && el.textContent?.trim()) return el.textContent.trim();
  }
  return "";
};

const queryImageSrc = (selectors) => {
  for (const selector of selectors) {
    const el = document.querySelector(selector);
    if (el && el.src) return el.src;
  }
  return "";
};

export default async function instagramProfile() {
  try {
    if (!window.location.hostname.includes("instagram.com")) {
      throw new Error("Not on Instagram domain");
    }

    const profileData = {
      profileimg: "images/default.png",
      name: "",
      headline: "",
      about: "",
      location: "",
      phone: "",
      email: "",
      socials: window.location.href,
    };

    // Username
    const usernameSelectors = [
      "main header section div span",
      "header section > div > div > span",
      '[data-testid="user-display-name"]',
      "header section div:nth-child(2) span",
    ];
    let username = querySelectors(usernameSelectors).replace("@", "");
    if (username && !username.includes(" ")) profileData.name = username;

    // Name (fallback)
    if (!profileData.name) {
      const nameSelectors = [
        "header h2",
        'h1[dir="auto"]',
        "span[title]",
        'div[dir="auto"] span:first-child',
        "header section div span",
      ];
      profileData.name = querySelectors(nameSelectors);
    }

    // Profile image
    const imageSelectors = [
      'header img[alt*="profile picture"]',
      'header img[data-testid="user-avatar"]',
      'header div img',
      'img[alt="Profile photo"]',
      'span img[alt]',
      'header img:first-of-type',
    ];
    const imgSrc = queryImageSrc(imageSelectors);
    if (imgSrc) profileData.profileimg = chrome.runtime.getURL(imgSrc);

    // Bio/about
    const bioSelectors = ['span[class*="_ap3a"]'];
    const bioText = querySelectors(bioSelectors);
    if (
      bioText &&
      !bioText.includes("posts") &&
      !bioText.includes("followers")
    ) {
      profileData.about = bioText;
    }

    // Location from bio
    const locationPatterns = [
      /📍\s*([^📍\n]+)/i,
      /🌍\s*([^🌍\n]+)/i,
      /Based in\s*([^\n]+)/i,
      /From\s*([^\n]+)/i,
      /Living in\s*([^\n]+)/i,
    ];
    if (profileData.about) {
      for (const pattern of locationPatterns) {
        const match = profileData.about.match(pattern);
        if (match) {
          profileData.location = match[1].trim();
          break;
        }
      }
    }

    console.log("Instagram Profile Data:", profileData);
    return profileData;
  } catch (error) {
    console.error(
      language.console?.extractionError || "Extraction error:",
      error
    );
    return {
      error: error.message,
      url: window.location.href,
      timestamp: new Date().toISOString(),
    };
  }
}
