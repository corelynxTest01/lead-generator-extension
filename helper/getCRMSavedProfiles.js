const getCRMSavedProfiles = async () => {
  try {
    const result = await chrome.storage.local.get(["crmSavedProfiles"]);
    return result.crmSavedProfiles || [];
  } catch (error) {
    console.error("Error getting CRM saved profiles:", error);
    return [];
  }
};
 export default getCRMSavedProfiles;