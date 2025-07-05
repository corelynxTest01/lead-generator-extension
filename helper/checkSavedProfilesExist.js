const checkSavedProfilesExist = async () => {
  try {
    const { savedProfiles = { linkedin: [], twitter: [], facebook: [], instagram: [] } } = await chrome.storage.local.get("savedProfiles");
    return Object.values(savedProfiles).some(arr => arr.length);
  } catch (error) {
    console.error("Error checking saved profiles:", error);
    return false;
  }
};

export default checkSavedProfilesExist;
