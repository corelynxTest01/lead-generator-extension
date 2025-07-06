export default function findProfileById(profileId, savedProfilesData) {
  if (!savedProfilesData)  return null;
  for (const profiles of Object.values(savedProfilesData)) {
    const profile = profiles.find(p => p.id === profileId);
    if (profile) return profile;
  }
  return null;
}
