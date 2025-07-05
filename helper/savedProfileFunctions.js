import findProfileById from "./findProfileById.js";
import showError from "./showError.js";
import showBootstrapAlert from "./showBootstrapAlert.js";
import language from "./language.js";
import showConfirmDialog from "./showConfirmDialog.js";
import logStorageStats from "./logStorageStats.js";
import renderSavedProfiles from "./renderSavedProfiles.js";

const formatProfileForCopy = (data) => [
  `Name: ${data.name || language.ui.notFound}`,
  `Headline: ${data.headline || language.ui.notFound}`,
  `Location: ${data.location || language.ui.notFound}`,
  `Email: ${data.email || language.ui.notFound}`,
  `Phone: ${data.phone || language.ui.notFound}`,
  `Socials: ${data.socials || language.ui.notFound}`,
  `About: ${data.about || language.ui.notFound}`,
].join("\n");

const copyProfileData = async (profileId, savedProfilesData) => {
  const profile = findProfileById(profileId, savedProfilesData);
  if (!profile) {
    showError("Profile not found.");
    return;
  }
  const profileText = formatProfileForCopy(profile.data);
  try {
    await navigator.clipboard.writeText(profileText);
    showBootstrapAlert("Profile data copied to clipboard!");
  } catch {
    const textArea = document.createElement("textarea");
    textArea.value = profileText;
    document.body.appendChild(textArea);
    textArea.select();
    try {
      document.execCommand('copy');
      showBootstrapAlert("Profile data copied to clipboard!");
    } catch {
      showError("Failed to copy profile data.");
    }
    document.body.removeChild(textArea);
  }
};

const deleteProfile = async (profileId, platform, savedProfilesData, currentFilter) => {
  if (!await showConfirmDialog(
    "Are you sure you want to delete this profile? This action cannot be undone.",
    "Delete Profile"
  )) return;

  try {
    const { savedProfiles = {} } = await chrome.storage.local.get(["savedProfiles"]);
    let targetPlatform = platform.toLowerCase();
    let platformProfiles = savedProfiles[targetPlatform];

    if (!platformProfiles || !platformProfiles.some(p => p.id === profileId)) {
      targetPlatform = Object.keys(savedProfiles).find(key =>
        savedProfiles[key]?.some(p => p.id === profileId)
      );
      platformProfiles = savedProfiles[targetPlatform];
      if (!platformProfiles) {
        showError("Profile not found in any platform.");
        return;
      }
    }

    const newProfiles = platformProfiles.filter(p => p.id !== profileId);
    if (newProfiles.length === platformProfiles.length) {
      showError("Profile not found for deletion.");
      return;
    }

    savedProfiles[targetPlatform] = newProfiles;
    await chrome.storage.local.set({ savedProfiles });
    renderSavedProfiles(savedProfiles, currentFilter);
    showBootstrapAlert("Profile deleted successfully!");
    logStorageStats(savedProfiles);
  } catch (error) {
    showError("Failed to delete profile. Error: " + error.message);
  }
};

export { copyProfileData, deleteProfile };
