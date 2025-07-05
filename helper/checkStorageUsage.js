export default async function checkStorageUsage() {
  try {
    const bytesInUse = await chrome.storage.local.getBytesInUse();
    const usedMB = (bytesInUse / 1048576).toFixed(2);
    const remainingMB = ((10485760 - bytesInUse) / 1048576).toFixed(2);
    console.log(`Storage used: ${bytesInUse} bytes (${usedMB} MB)`);
    console.log(`Remaining: ${remainingMB} MB`);
  } catch (error) {
    console.error('Error checking storage usage:', error);
  }
}
