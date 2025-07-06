import showBootstrapAlert from "./showBootstrapAlert.js";
import logStorageStats from "./logStorageStats.js";
import showError from "./showError.js";

const generateUniqueId = () =>
  Date.now().toString(36) + Math.random().toString(36).slice(2);

const getCurrentTab = () =>
  new Promise((resolve) => {
    chrome.runtime.sendMessage({ action: "getCurrentTab" }, (response) =>
      resolve(response)
    );
  });

const saveProfileData = async (profileData, platform) => {
  try {
    const profileId = generateUniqueId();
    const tabs = await getCurrentTab();
    const profileToSave = {
      id: profileId,
      platform,
      data: profileData,
      savedAt: new Date().toISOString(),
      url: tabs?.[0].url,
    };

    const { savedProfiles = { linkedin: [], twitter: [], facebook: [], instagram: [] } } =
      await chrome.storage.local.get(["savedProfiles"]);

    savedProfiles[platform] = savedProfiles[platform] || [];

    const existingIndex = savedProfiles[platform].findIndex(
      (profile) => profile.data.name === profileData.name
    );

    if (existingIndex !== -1) {
      savedProfiles[platform][existingIndex] = profileToSave;
      console.log(`Updated existing ${platform} profile for ${profileData.name}`);
    } else {
      savedProfiles[platform].push(profileToSave);
      console.log(`Saved new ${platform} profile for ${profileData.name}`);
    }

    await chrome.storage.local.set({ savedProfiles });
    showBootstrapAlert("Profile saved successfully!");
    logStorageStats(savedProfiles);
  } catch (error) {
    console.error("Error saving profile:", error);
    showError("Failed to save profile. Please try again.");
  }
};

export default saveProfileData;
