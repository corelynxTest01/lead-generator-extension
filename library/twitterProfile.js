import language from '../helper/language.js';

const queryFirst = (selectors) => {
  for (const selector of selectors) {
    const el = document.querySelector(selector);
    if (el && el.textContent?.trim()) return el.textContent.trim();
  }
  return "";
};

const queryProfileImg = (selectors) => {
  for (const selector of selectors) {
    const img = document.querySelector(selector);
    if (
      img?.src &&
      !img.src.includes('default') &&
      !img.src.includes('default_profile') &&
      (img.src.includes('pbs.twimg.com') || img.src.includes('twimg.com'))
    ) {
      return img.src;
    }
  }
  return "images/default.png";
};

export default async function twitterProfile() {
  try {
    const host = window.location.hostname;
    if (!(host.includes('twitter.com') || host.includes('x.com'))) {
      throw new Error('Not on Twitter/X domain');
    }

    const profileData = {
      profileimg: queryProfileImg([
        "[data-testid='primaryColumn'] img[src*='profile_images']",
      ]),
      name: queryFirst([
        '[data-testid="UserName"] > div > div > div > span',
        '[data-testid="UserName"] span',
        'h2[role="heading"] span',
        '.ProfileHeaderCard-name',
      ]),
      headline: (() => {
        const m = window.location.pathname.match(/\/([^\/]+)/);
        return m ? `@${m[1]}` : "";
      })(),
      about: (() => {
        for (const selector of [
          '[data-testid="UserDescription"]> div> span',
          '[data-testid="UserDescription"] span',
          '.ProfileHeaderCard-about',
        ]) {
          const el = document.querySelector(selector);
          if (el) {
            const txt = el.textContent.trim();
            return txt.length > 200 ? txt.substring(0, 200) + "..." : txt;
          }
        }
        return "";
      })(),
      location: queryFirst([
        '[data-testid="UserLocation"]',
        '[data-testid="UserLocation"] span',
        '.ProfileHeaderCard-location',
      ]),
      socials: window.location.href,
    };

    return profileData;
  } catch (error) {
    console.error(language.console?.extractionError || 'Extraction error:', error);
    return {
      error: error.message,
      url: window.location.href,
      timestamp: new Date().toISOString(),
    };
  }
};
