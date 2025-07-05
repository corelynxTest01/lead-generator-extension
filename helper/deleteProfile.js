import showError from "./showError";
import renderSavedProfiles from "./renderSavedProfiles";
import showBootstrapAlert from "./showBootstrapAlert";
import logStorageStats from "./logStorageStats";
const deleteProfile = async (profileId, platform) => {
  if (!confirm("Are you sure you want to delete this profile?")) {
    return;
  }

  try {
    console.log("Attempting to delete profile:",profileId,"from platform:",platform);
    const result = await chrome.storage.local.get([
      
    ]);
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
          savedProfiles[platformKey].some((p) => p.id === profileId)) {
          targetPlatform = platformKey;
          profileFound = true;
          console.log("Found profile in platform:", platformKey);
          break;
        }
      }

      if (!profileFound) {
        console.error(
          "Profile not found in any platform. Profile ID:",
          profileId
        );
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
      renderSavedProfiles();

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
};

export default deleteProfile;
