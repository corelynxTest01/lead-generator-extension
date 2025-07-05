const findProfileById = (profileId,savedProfilesData) => {
  if (!savedProfilesData) {
    console.error("No saved profiles data available");
    return null;
  }

  for (const platform of Object.keys(savedProfilesData)) {
    const profile = savedProfilesData[platform].find((p) => p.id === profileId);
    if (profile) {
      console.log("Found profile:", profile);
      return profile;
    }
  }
  console.error("Profile not found with ID:", profileId);
  return null;
};

export default findProfileById