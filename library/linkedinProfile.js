import language from "../helper/language.js";

export default async function linkedinProfile() {
  try {
    const originalUrl = window.location.href;

    if (!window.location.href.includes("/contact-info/")) {
      const contactInfoLink = document.querySelector('a[href*="contact-info"]');
      if (contactInfoLink) {
        await contactInfoLink.click();
      }
    }

    const profileData = {
      profileimg: "images/default.png",
      name: "",
      headline: "",
      location: "",
      about: "",
      email: "",
      phone: "",
      socials: window.location.href,
      originalUrl: originalUrl // Store original URL in profile data
    };

    const selectors = [
      ".pv-top-card__photo img",
      ".pv-top-card-profile-picture__image",
      ".profile-photo-edit__preview",
      ".pv-member-photo img",
      ".presence-entity__image"
    ];

    let profileImg;
    for (const selector of selectors) {
      profileImg = document.querySelector(selector);
      if (profileImg && profileImg.src && !profileImg.src.includes('default')) {
        profileData.profileimg = profileImg.src;
        break;
      }
    }

    const nameSelectors = [
      "h1.text-heading-xlarge",
      ".pv-top-card-section__name",
      ".profile-topcard-person-entity__name",
      "h1.break-words",
    ];

    for (const selector of nameSelectors) {
      const nameElement = document.querySelector(selector);
      if (nameElement) {
        profileData.name = nameElement.textContent.trim();
        break;
      }
    }

    const headlineSelectors = [
      ".text-body-medium",
      ".pv-top-card-section__headline",
      ".profile-topcard__headline",
    ];

    for (const selector of headlineSelectors) {
      const headlineElement = document.querySelector(selector);
      if (headlineElement) {
        profileData.headline = headlineElement.textContent.trim();
        break;
      }
    }

    // Extract location using various possible selectors
    const locationSelectors = [
      ".text-body-small.inline.t-black--light.break-words",
      ".pv-top-card-section__location",
      ".profile-topcard__location-information",
    ];

    for (const selector of locationSelectors) {
      const locationElement = document.querySelector(selector);
      if (locationElement) {
        profileData.location = locationElement.textContent.trim();
        break;
      }
    }

    // Extract about information using various possible selectors
    const aboutSelectors = [
      "#about + div + div",
      ".pv-about-section",
      ".profile-about-section",
    ];

    for (const selector of aboutSelectors) {
      const aboutElement = document.querySelector(selector);
      if (aboutElement) {
        const aboutText = aboutElement.textContent.trim();
        profileData.about =
          aboutText.substring(0, 150) + (aboutText.length > 150 ? "..." : "");
        break;
      }
    }

    const contactNodes = document.querySelectorAll(
      ".pv-contact-info__contact-type"
    );
    contactNodes.forEach((node) => {
      const label =
        node.querySelector(".pv-contact-info__header")?.innerText || "";

      if (label.includes("Email")) {
        profileData.email = node.querySelector("div, a")?.innerText || "";
      }

      if (label.includes("Phone")) {
        const phoneStr = node.querySelector("ul, li, span")?.innerText || "";
        const phoneNo = phoneStr.split(" ")[0];
        profileData.phone = new RegExp(
          /^(?:\+?\d{1,4}[-.\s]?)?(?:\(?\d{1,}\)?[-.\s]?)?\d{1,}[-.\s]?\d{1,}[-.\s]?\d{1,}(?:\s?(?:ext|x)\.?\s?\d{1,})?$/
        ).test(phoneNo)
          ? phoneNo
          : language.ui.notFound;
      }
      if (label.includes("Profile")) {
        profileData.socials =
          "https://www." + node.querySelector("div, a")?.innerText ||
          window.location.href;
      }
    });

    return profileData;
  } catch (error) {
    console.error(language.console.extractionError, error);
    return null;
  }
};