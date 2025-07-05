const checkSavedProfilesExist = async () => {
  try {
    const result = await chrome.storage.local.get(["savedProfiles"]);
    const savedProfiles = result.savedProfiles || {
      linkedin: [],
      twitter: [],
      facebook: [],
      instagram: [],
    };
    const hasProfiles = Object.values(savedProfiles).some(profiles => profiles.length > 0);
    return hasProfiles;
  } catch (error) {
    console.error("Error checking saved profiles:", error);
    return false;
  }
};

export default checkSavedProfilesExist;