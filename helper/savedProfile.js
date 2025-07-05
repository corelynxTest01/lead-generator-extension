import showBootstrapAlert from "./showBootstrapAlert.js";
import logStorageStats from "./logStorageStats.js";
import showError from "./showError.js";

const generateUniqueId = () => {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
};

const getCurrentTabUrl = () => {
  return new Promise((resolve) => {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      resolve(tabs[0]?.url || "");
    });
  });
};
const saveProfileData = async (profileData, platform) => {
  try {
    const profileId = generateUniqueId();
    const profileToSave = {
      id: profileId,
      platform: platform,
      data: profileData,
      savedAt: new Date().toISOString(),
      url: await getCurrentTabUrl(),
    };
    const result = await chrome.storage.local.get(["savedProfiles"]);
    console.log("result", result);
    let savedProfiles = result.savedProfiles || {
      linkedin: [],
      twitter: [],
      facebook: [],
      instagram: [],
    };
    if (!savedProfiles[platform]) {
      savedProfiles[platform] = [];
    }

    const existingProfileIndex = savedProfiles[platform].findIndex(
      (profile) => profile.data.name === profileData.name
    );

    if (existingProfileIndex !== -1) {
      savedProfiles[platform][existingProfileIndex] = profileToSave;
      console.log(
        `Updated existing ${platform} profile for ${profileData.name}`
      );
    } else {
      savedProfiles[platform].push(profileToSave);
      console.log(`Saved new ${platform} profile for ${profileData.name}`);
    }
    await chrome.storage.local.set({ savedProfiles: savedProfiles });
    showBootstrapAlert(`Profile saved successfully!`);
    logStorageStats(savedProfiles);
  } catch (error) {
    console.error("Error saving profile:", error);
    showError("Failed to save profile. Please try again.");
  }
};


export default saveProfileData;
