 import language from './language.js';
 const copytoClipboard = async()=>{
    try {
     chrome.storage.local.get(["name"],(data) =>{
        console.log(data);
      })
        document.getElementById("copy-msg").style.display = "block";
        const data = {
          name: document.getElementById("profile-name").textContent,
          headline: document.getElementById("profile-headline").textContent,
          location: document.getElementById("profile-location").textContent,
          about: document.getElementById("profile-about").textContent,
          email: document.getElementById("profile-email").textContent,
          phone: document.getElementById("profile-phone").textContent,
          socials: document.getElementById("profile-socials").textContent
        };
    
        let stringData = "";
        for (let [key, value] of Object.entries(data)) {
          stringData += key + ": " + value + "\n";
        }
    
        await navigator.clipboard.writeText(stringData).then(() => {
          document.getElementById("copy-msg").textContent = language.ui.copySuccess;
          setTimeout(() => {
            document.getElementById("copy-msg").style.display = "none";
          }, 1000);
        }).catch((err) => console.log(err));
      } catch (error) {
        console.error(language.console.copyError, error);
      }
 }

 
 export default copytoClipboard;