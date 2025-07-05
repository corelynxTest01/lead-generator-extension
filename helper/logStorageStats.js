const logStorageStats = (savedProfiles) => {
  const stats = {
    linkedin: savedProfiles.linkedin?.length || 0,
    twitter: savedProfiles.twitter?.length || 0,
    facebook: savedProfiles.facebook?.length || 0,
  };
  
  const total = Object.values(stats).reduce((sum, count) => sum + count, 0);
  console.log('Storage Stats:', stats, `Total: ${total} profiles`);
};
 
export default logStorageStats