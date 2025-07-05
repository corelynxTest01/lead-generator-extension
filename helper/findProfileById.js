export default function findProfileById(profileId, savedProfilesData) {
  if (!savedProfilesData) {
    console.error("No saved profiles data available");
    return null;
  }

  for (const profiles of Object.values(savedProfilesData)) {
    const profile = profiles.find(p => p.id === profileId);
    if (profile) return profile;
  }

  console.error("Profile not found with ID:", profileId);
  return null;
}
