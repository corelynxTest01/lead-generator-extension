import language from './language.js';
export default async function copytoClipboard() {
  try {
    const fields = [
      "profile-name",
      "profile-headline",
      "profile-location",
      "profile-about",
      "profile-email",
      "profile-phone",
      "profile-socials"
    ];

    const data = fields.reduce((acc, id) => {
      const el = document.getElementById(id);
      acc[id.replace("profile-", "")] = el ? el.textContent.trim() : "";
      return acc;
    }, {});

    const stringData = Object.entries(data)
      .map(([key, value]) => `${key}: ${value}`)
      .join("\n");

    const copyMsg = document.getElementById("copy-msg");
    copyMsg.style.display = "block";

    await navigator.clipboard.writeText(stringData);
    copyMsg.textContent = language.ui.copySuccess;

    setTimeout(() => {
      copyMsg.style.display = "none";
    }, 1000);
  } catch (error) {
    console.error(language.console.copyError, error);
  }
}