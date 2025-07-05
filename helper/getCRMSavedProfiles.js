export default async function getCRMSavedProfiles() {
  const { crmSavedProfiles = [] } = await chrome.storage.local.get("crmSavedProfiles");
  return crmSavedProfiles;
}
