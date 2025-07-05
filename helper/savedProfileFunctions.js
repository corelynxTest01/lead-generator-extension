import findProfileById from "./findProfileById.js";
import showError from "./showError.js";
import showBootstrapAlert from "./showBootstrapAlert.js";
import language from "./language.js";
import showConfirmDialog from "./showConfirmDialog.js";
import logStorageStats from "./logStorageStats.js";
import renderSavedProfiles from "./renderSavedProfiles.js";
const copyProfileData = async (profileId,savedProfilesData) => {
  const profile = findProfileById(profileId, savedProfilesData);
  if (profile) {
    const profileText = formatProfileForCopy(profile.data);
    try {
      await navigator.clipboard.writeText(profileText);
      showBootstrapAlert("Profile data copied to clipboard!");
    } catch (err) {
      console.error("Failed to copy profile data:", err);
      const textArea = document.createElement("textarea");
      textArea.value = profileText;
      document.body.appendChild(textArea);
      textArea.select();
      try {
        // document.execCommand('copy');
        showBootstrapAlert("Profile data copied to clipboard!");
      } catch (fallbackErr) {
        console.error("Fallback copy failed:", fallbackErr);
        showError("Failed to copy profile data.");
      }
      document.body.removeChild(textArea);
    }
  } else {
    console.error("Profile not found for copying:", profileId);
    showError("Profile not found.");
  }
};

const formatProfileForCopy = (data) => {
  const fields = [
    `Name: ${data.name || language.ui.notFound}`,
    `Headline: ${data.headline || language.ui.notFound}`,
    `Location: ${data.location || language.ui.notFound}`,
    `Email: ${data.email || language.ui.notFound}`,
    `Phone: ${data.phone || language.ui.notFound}`,
    `Socials: ${data.socials || language.ui.notFound}`,
    `About: ${data.about || language.ui.notFound}`,
  ];
  return fields.join("\n");
};

const deleteProfile = async (profileId, platform,savedProfilesData,currentFilter) => {
  const confirmed = await showConfirmDialog(
    "Are you sure you want to delete this profile? This action cannot be undone.",
    "Delete Profile"
  );

  if (!confirmed) {
    return;
  }

  try {
    console.log("Attempting to delete profile:",profileId,"from platform:",platform);

    const result = await chrome.storage.local.get(["savedProfiles"]);
    let savedProfiles = result.savedProfiles || {};

    console.log("Current saved profiles:", savedProfiles);
    console.log("Available platform keys:", Object.keys(savedProfiles));
    let targetPlatform = platform.toLowerCase();
    let profileFound = false;
    if (!savedProfiles[targetPlatform]) {
      console.log("Direct platform not found, searching across all platforms...");
      for (const platformKey of Object.keys(savedProfiles)) {
        if (
          savedProfiles[platformKey] &&
          savedProfiles[platformKey].some((p) => p.id === profileId)
        ) {
          targetPlatform = platformKey;
          profileFound = true;
          console.log("Found profile in platform:", platformKey);
          break;
        }
      }

      if (!profileFound) {
        console.error("Profile not found in any platform. Profile ID:",profileId);
        showError("Profile not found in any platform.");
        return;
      }
    } else {
      profileFound = true;
    }

    const originalLength = savedProfiles[targetPlatform].length;
    console.log("Original profiles count for",targetPlatform,":",originalLength);
    savedProfiles[targetPlatform] = savedProfiles[targetPlatform].filter(
      (profile) => {
        console.log("Checking profile ID:",profile.id,"against target:",profileId);
        return profile.id !== profileId;
      }
    );

    const newLength = savedProfiles[targetPlatform].length;
    console.log("New profiles count for", targetPlatform, ":", newLength);

    if (newLength < originalLength) {
      await chrome.storage.local.set({ savedProfiles: savedProfiles });
      savedProfilesData = savedProfiles;
      renderSavedProfiles(savedProfilesData, currentFilter);

      showBootstrapAlert("Profile deleted successfully!");
      logStorageStats(savedProfiles);

      console.log("Profile deleted successfully");
    } else {
      console.error("Profile not found for deletion. Profile ID:", profileId);
      console.error(
        "Available profile IDs:",
        savedProfiles[targetPlatform].map((p) => p.id)
      );
      showError("Profile not found for deletion.");
    }
  } catch (error) {
    console.error("Error deleting profile:", error);
    showError("Failed to delete profile. Error: " + error.message);
  }
}

export { copyProfileData, deleteProfile };