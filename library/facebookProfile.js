import language from "../helper/language.js";

export default async function facebookProfile() {
  try {
    const { hostname, href } = window.location;
    if (
      !hostname.includes("facebook.com") &&
      !hostname.includes("fb.com")
    ) throw new Error("Not on Facebook domain");
    if (href.includes("about")) throw new Error("Not on Facebook domain");

    const profileData = {
      profileimg: "images/default.png",
      name: "",
      headline: "",
      about: "",
      location: "",
      phone: "",
      email: "",
      socials: href,
    };

    // Contact extraction
    const extractContactInfo = () => {
      const contactInfo = { phone: "", email: "", address: "" };
      const phoneRegex = /[\+]?[\d\s\-\(\)\.]{7,18}/g;
      const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
      const addRegex = /^[*\s]*[A-Za-z0-9][A-Za-z0-9\s,.-]*(?:\s*,\s*[A-Za-z][A-Za-z\s]*){1,4}$/g;

      const selectors = [
        // broad selectors
        [
          '[data-overviewsection="contact"]',
          '[data-pagelet="ProfileIntro"] [data-overviewsection="contact"]',
          '[data-testid="profile-contact-info"]',
          '[data-pagelet="ProfileIntro"]',
          '[data-pagelet="ProfileActions"]',
          '[data-overviewsection="basic"]',
          '[data-overviewsection="intro"]',
          ".profileContactInfo",
          ".contactInfo",
          '[data-testid="contact-section"]',
        ],
        // specific selectors
        [
          'a[href^="tel:"]',
          'a[href^="mailto:"]',
          'span[data-testid="phone"]',
          'span[data-testid="email"]',
          '[data-testid="profile-phone"]',
          '[data-testid="profile-email"]',
          'div[dir="auto"]',
          'span[dir="auto"]',
          'a[href*="phone"]',
          'a[href*="email"]',
          'a[href*="contact"]',
        ],
      ];

      // Try broad selectors
      for (const selector of selectors[0]) {
        const el = document.querySelector(selector);
        if (!el) continue;
        const text = el.textContent || "";
        const phone = (text.match(phoneRegex) || [])[0];
        const email = (text.match(emailRegex) || [])[0];
        if (phone && phone.replace(/[^\d]/g, "").length >= 10) contactInfo.phone = phone.trim();
        if (email) contactInfo.email = email.trim();
        if (contactInfo.phone && contactInfo.email) return contactInfo;
      }

      // Try specific selectors
      for (const selector of selectors[1]) {
        const elements = document.querySelectorAll(selector);
        for (const el of elements) {
          const text = el.textContent || "";
          const href = el.href || "";
          if (!contactInfo.phone) {
            if (href.startsWith("tel:")) contactInfo.phone = href.replace("tel:", "").trim();
            else {
              const phone = (text.match(phoneRegex) || [])[0];
              if (phone && phone.replace(/[^\d]/g, "").length >= 10) contactInfo.phone = phone.trim();
            }
          }
          if (!contactInfo.email) {
            if (href.startsWith("mailto:")) contactInfo.email = href.replace("mailto:", "").trim();
            else {
              const email = (text.match(emailRegex) || [])[0];
              if (email) contactInfo.email = email.trim();
            }
          }
          if (!contactInfo.address) {
            const address = (text.match(addRegex) || [])[0];
            if (address) contactInfo.address = address.trim();
          }
          if (contactInfo.phone && contactInfo.email) return contactInfo;
        }
      }

      // Fallback: scan all text nodes
      const allEls = document.querySelectorAll("div, span, p, a");
      for (const el of allEls) {
        if (
          el.closest('[data-pagelet*="feed"]') ||
          el.closest('[data-pagelet*="timeline"]') ||
          el.closest('[role="article"]')
        ) continue;
        const text = el.textContent || "";
        if (!contactInfo.phone) {
          const phone = (text.match(phoneRegex) || [])[0];
          if (phone && phone.replace(/[^\d]/g, "").length >= 10) contactInfo.phone = phone.trim();
        }
        if (!contactInfo.email) {
          const email = (text.match(emailRegex) || [])[0];
          if (email) contactInfo.email = email.trim();
        }
        if (contactInfo.phone && contactInfo.email) break;
      }
      return contactInfo;
    };

    // Name extraction
    const nameSelectors = [
      '[data-pagelet="ProfileTilesFeed"] h1',
      '[role="main"] h1',
      '[data-pagelet="ProfileActions"] h1',
      'h1[dir="auto"]',
      ".x1heor9g.x1qlqyl8.x1pd3egz.x1a2a7pz h1",
      '[data-testid="profile-name"]',
      ".profileName",
      "h1:first-of-type",
    ];
    for (const selector of nameSelectors) {
      const el = document.querySelector(selector);
      if (el && el.textContent.trim()) {
        const name = el.textContent.replace("Verified account", "").trim();
        if (
          !name.includes("Facebook") &&
          !name.includes("Home") &&
          name.length > 1
        ) {
          profileData.name = name;
          break;
        }
      }
    }

    // Profile image
    const imgEl = document.querySelector(
      `svg[aria-label="${profileData.name}"][data-visualcompletion="ignore-dynamic"][role="img"] image`
    );
    if (imgEl) {
      profileData.profileimg = imgEl.getAttribute("xlink:href") || imgEl.getAttribute("href");
    }

    // Intro section
    const introSection =
      document.querySelector('[data-pagelet="ProfileTilesSection"]') ||
      document.querySelector('[role="main"]');
    if (introSection) {
      // Location
      const locEl = Array.from(introSection.querySelectorAll("a, span")).find(
        el =>
          el.href?.includes("/places/") ||
          el.href?.includes("/city/") ||
          el.textContent?.includes("Lives in") ||
          el.textContent?.includes("From") ||
          el.textContent?.includes("/Address/")
      );
      profileData.location =
        locEl?.textContent?.replace("Lives in", "").replace("From", "").trim() || "Not found";
      // Headline
      const workEl = Array.from(introSection.querySelectorAll("a, span")).find(
        el =>
          el.href?.includes("/work/") ||
          el.textContent?.includes("Works at") ||
          el.textContent?.includes("Studied at") ||
          el.textContent?.includes("Page") ||
          el.textContent?.includes("Profile")
      );
      profileData.headline =
        workEl?.textContent
          ?.replace("Works at", "")
          .replace("Profile", "")
          .replace("Studied at", "")
          .replace("Page", "")
          .trim() || "Not found";
      // About
      const arr = Array.from(introSection.querySelectorAll('span[dir="auto"]'));
      const introIdx = arr.findIndex(el => el.innerText === "Intro");
      if (introIdx > -1 && arr[introIdx + 1]) profileData.about = arr[introIdx + 1].innerText;
    }

    // Contact info
    const contactInfo = extractContactInfo();
    profileData.phone = contactInfo.phone;
    profileData.email = contactInfo.email;

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
