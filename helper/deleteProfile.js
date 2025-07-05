import showError from "./showError";
import renderSavedProfiles from "./renderSavedProfiles";
import showBootstrapAlert from "./showBootstrapAlert";
import logStorageStats from "./logStorageStats";

export default async function deleteProfile(profileId, platform) {
  if (!confirm("Are you sure you want to delete this profile?")) return;

  try {
    const { savedProfiles = {} } = await chrome.storage.local.get(["savedProfiles"]);
    let targetPlatform = platform.toLowerCase();
    let profiles = savedProfiles[targetPlatform];

    // If not found directly, search all platforms
    if (!profiles) {
      targetPlatform = Object.keys(savedProfiles).find(key => savedProfiles[key]?.some(p => p.id === profileId)
      );
      profiles = savedProfiles[targetPlatform];
      if (!profiles) {
        showError("Profile not found in any platform.");
        return;
      }
    }

    const filteredProfiles = profiles.filter(profile => profile.id !== profileId);

    if (filteredProfiles.length === profiles.length) {
      showError("Profile not found for deletion.");
      return;
    }

    savedProfiles[targetPlatform] = filteredProfiles;
    await chrome.storage.local.set({ savedProfiles });
    renderSavedProfiles();
    showBootstrapAlert("Profile deleted successfully!");
    logStorageStats(savedProfiles);
  } catch (error) {
    showError("Failed to delete profile. Error: " + error.message);
  }
}
