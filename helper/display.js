export default function displayData(profileData, panel) {
    console.log('Display function call')
    panel.querySelector("#profileImage").src = profileData.profileimg || "images/default.png";
    panel.querySelector("#profile-name").textContent = profileData.name || "Not Found";
    panel.querySelector("#profile-headline").textContent = profileData.headline || "Not Found";
    panel.querySelector("#profile-location").textContent = profileData.location || "Not Found";
    panel.querySelector("#profile-about").textContent = profileData.about || "Not Found";
    panel.querySelector("#profile-email").textContent = profileData.email || "Not Found";
    panel.querySelector("#profile-phone").textContent = profileData.phone || "Not Found";
    panel.querySelector("#profile-socials").textContent = profileData.socials || "Not Found";
    panel.querySelector("#profile-details").style.display = "block";
    panel.querySelector("#status").style.display = "none";
    panel.querySelector("#status")?.classList.remove("not-linkedin", "not-supported");
};