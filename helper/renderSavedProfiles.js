import showBootstrapAlert from "./showBootstrapAlert.js";
import getCRMSavedProfiles from "./getCRMSavedProfiles.js";
import CONFIG from "../config.js";
const truncateText = (text, maxLength) => {
  if (!text) return "";
  return text.length > maxLength ? text.substring(0, maxLength) + "..." : text;
};
const renderSavedProfiles = async (savedProfilesData, currentFilter) => {
  const profilesList = document.getElementById("saved-profiles-list");
  const noProfilesMessage = document.getElementById("no-profiles-message");

  if (!savedProfilesData) return;
  const crmSavedIds = await getCRMSavedProfiles();

  let allProfiles = [];
  const MAX_PROFILES = CONFIG.MAX_PROFILES;
  if (currentFilter === "all") {
    Object.keys(savedProfilesData).forEach((platform) => {
      savedProfilesData[platform].forEach((profile) => {
        if (allProfiles.length < MAX_PROFILES) {
          allProfiles.push(profile);
        }
      });
    });
  } else {
    const platformProfiles = savedProfilesData[currentFilter] || [];
    allProfiles = platformProfiles.slice(0, MAX_PROFILES);
  }
  const totalProfileCount = getTotalProfileCount(
    savedProfilesData,
    currentFilter
  );
  if (totalProfileCount > MAX_PROFILES) {
    showBootstrapAlert(
      `Displaying only ${MAX_PROFILES} profiles out of ${totalProfileCount} total profiles. Consider deleting older profiles to see newer ones.`,
      "warning"
    );
  }
  allProfiles.sort((a, b) => new Date(b.savedAt) - new Date(a.savedAt));

  if (allProfiles.length === 0) {
    profilesList.innerHTML = "";
    noProfilesMessage.style.display = "block";
    return;
  }

  noProfilesMessage.style.display = "none";

  profilesList.innerHTML = allProfiles
    .map((profile) => {
      const data = profile.data;
      const savedDate = new Date(profile.savedAt).toLocaleDateString();
      const isAlreadySavedToCRM = crmSavedIds.includes(profile.id);

      const getPlatformLogo = (platform) => {
        if (!platform) return "";

        const icons = {
          facebook: `<svg class="platform-logo" viewBox="0 0 24 24" fill="#1877F2" style="width: 16px; height: 16px; margin-right: 5px;">
            <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
        </svg>`,
          linkedin: `<svg class="platform-logo" viewBox="0 0 24 24" fill="#0A66C2" style="width: 16px; height: 16px; margin-right: 5px;">
            <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
        </svg>`,
          twitter: `<svg class="platform-logo" viewBox="0 0 24 24" fill="#1DA1F2" style="width: 16px; height: 16px; margin-right: 5px;">
            <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/>
        </svg>`,
        };

        return icons[platform.toLowerCase()] || "";
      };
      const getSaveButtonHTML = () => {
        if (isAlreadySavedToCRM) {
          return `<button class="save-button save-to-crm btn-disabled" disabled>Already Saved</button>`;
        } else {
          return `<button class="save-button save-to-crm">Save to CRM</button>`;
        }
      };

      return `
      <div class="profile-card" data-profile-id="${
        profile.id
      }" data-platform="${profile.platform}">
        <div class="profile-card-header">
          <img class="profile-card-image" src="${
            data.profileimg || "images/default.png"
          }" alt="Profile">
          <div>
            <p class="profile-card-name">${data.name || "Unknown"}</p>
          </div>
          <span class="profile-card-platform">${getPlatformLogo(
            profile.platform
          )}</span>
        </div>
        <div class="profile-card-details">
          ${
            data.headline
              ? `<div class="profile-card-detail"><strong>Headline:</strong> ${truncateText(
                  data.headline,
                  50
                )}</div>`
              : ""
          }
          ${
            data.location
              ? `<div class="profile-card-detail"><strong>Location:</strong> ${data.location}</div>`
              : ""
          }
          ${
            data.email
              ? `<div class="profile-card-detail"><strong>Email:</strong> ${data.email}</div>`
              : ""
          }
          ${
            data.phone
              ? `<div class="profile-card-detail"><strong>Phone:</strong> ${data.phone}</div>`
              : ""
          }
        </div>
        <div class="profile-card-saved-date">Saved on ${savedDate}</div>
        <div class="profile-card-actions">
          ${getSaveButtonHTML()}
          <button class="btn btn-sm btn-primary view-full-btn">View Full</button>
          <button class="btn btn-sm btn-secondary copy-profile-btn">Copy</button>
          <button class="btn btn-sm btn-danger delete-profile-btn">Delete</button>
        </div>
      </div>
    `;
    })
    .join("");
};
const getTotalProfileCount = (savedProfilesData, currentFilter) => {
  if (currentFilter === "all") {
    let totalCount = 0;
    Object.keys(savedProfilesData).forEach((platform) => {
      totalCount += savedProfilesData[platform].length;
    });
    return totalCount;
  } else {
    return savedProfilesData[currentFilter]?.length || 0;
  }
};

export default renderSavedProfiles;
