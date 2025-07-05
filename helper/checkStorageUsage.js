const checkStorageUsage = async () => {
  try {
    const bytesInUse = await chrome.storage.local.getBytesInUse();
    console.log(`Storage used: ${bytesInUse} bytes (${(bytesInUse/1024/1024).toFixed(2)} MB)`);
    console.log(`Remaining: ${((10485760 - bytesInUse)/1024/1024).toFixed(2)} MB`);
  } catch (error) {
    console.error('Error checking storage usage:', error);
  }
};


 export default checkStorageUsage;
