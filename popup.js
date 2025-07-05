const displayProfileData = (await import(chrome.runtime.getURL("helper/display.js"))).default;
const linkedinProfile = (await import(chrome.runtime.getURL("library/linkedinProfile.js"))).default;
const twitterProfile = (await import(chrome.runtime.getURL("library/twitterProfile.js"))).default;
const facebookProfile = (await import(chrome.runtime.getURL("library/facebookProfile.js"))).default;
const language = (await import(chrome.runtime.getURL("helper/language.js"))).default;
const showError = (await import(chrome.runtime.getURL("helper/showError.js"))).default;
const checkStorageUsage = (await import(chrome.runtime.getURL("helper/checkStorageUsage.js"))).default;
const showBootstrapAlert = (await import(chrome.runtime.getURL("helper/showBootstrapAlert.js"))).default;
const renderSavedProfiles = (await import(chrome.runtime.getURL("helper/renderSavedProfiles.js"))).default;
const findProfileById = (await import(chrome.runtime.getURL("helper/findProfileById.js"))).default;
const showConfirmDialog = (await import(chrome.runtime.getURL("helper/showConfirmDialog.js"))).default;
const saveProfileData = (await import(chrome.runtime.getURL("helper/savedProfile.js"))).default;
const getCRMSavedProfiles = (await import(chrome.runtime.getURL("helper/getCRMSavedProfiles.js"))).default;
const checkSavedProfilesExist = (await import(chrome.runtime.getURL("helper/checkSavedProfilesExist.js"))).default;
const { copyProfileData, deleteProfile } = (await import(chrome.runtime.getURL("helper/savedProfileFunctions.js")));
const CONFIG = (await import(chrome.runtime.getURL("config.js"))).default;

let currentProfileData = null;
let currentPlatform = null;
let savedProfilesData = null;
let currentFilter = "all";
let apisecret = null;
let apikey = null;


const loadStoredCredentials = async () => {
  try {
    const { apikey: key, apisecret: secret } = await chrome.storage.local.get(["apikey", "apisecret"]);
    if (key && secret) {
      apikey = key;
      apisecret = secret;
      console.log("Loaded stored credentials");
      return true;
    }
    return false;
  } catch (error) {
    console.error("Error loading stored credentials:", error);
    return false;
  }
};

const saveCredentials = async (key, secret) => {
  try {
    await chrome.storage.local.set({ apikey: key, apisecret: secret });
    console.log("Credentials saved to storage");
  } catch (error) {
    console.error("Error saving credentials:", error);
  }
};

const clearStoredCredentials = async () => {
  try {
    await chrome.storage.local.remove(["apikey", "apisecret"]);
    apikey = apisecret = null;
    console.log("Credentials cleared from storage");
  } catch (error) {
    console.error("Error clearing credentials:", error);
  }
};

const addToCRMSavedProfiles = async (profileId) => {
  try {
    const savedIds = await getCRMSavedProfiles();
    if (!savedIds.includes(profileId)) {
      savedIds.push(profileId);
      await chrome.storage.local.set({ crmSavedProfiles: savedIds });
      console.log("Profile ID added to CRM saved list:", profileId);
    }
  } catch (error) {
    console.error("Error adding to CRM saved profiles:", error);
  }
};

const isProfileSavedToCRM = async (profileId) => {
  const savedIds = await getCRMSavedProfiles();
  return savedIds.includes(profileId);
};

const updateViewSavedButtonVisibility = async () => {
  const viewSavedButton = document.getElementById("view-saved");
  if (viewSavedButton) {
    viewSavedButton.style.display = (await checkSavedProfilesExist()) ? "block" : "none";
  }
};

const saveToCRM = async (profileId = null, buttonElement = null) => {
  console.log("savingtocrm");
  const { name, headline, about, email, phone, socials } = currentProfileData || {};
  const create_data = {
    first_name: name,
    lead_source: currentPlatform,
    industry: headline,
    description: about,
    ...(email && {
      email: [{
        address: email,
        primary: 1,
        opt_out: 0,
        invalid: 0,
        verified: 0,
      }]
    }),
    ...(phone && {
      phone: [{
        number: phone,
        type: "Mobile",
        country_code: "+1",
        extension: "",
        primary: 1,
      }]
    })
  };

  const social_data = {};
  if (["twitter", "facebook", "linkedin"].includes(currentPlatform)) {
    social_data[currentPlatform] = socials;
  }

  const postData = {
    apiKey: apikey,
    apiSecret: apisecret,
    request: create_data,
    social_links: social_data,
  };

  if (!(await showConfirmDialog(
    "Are you sure you want to save this data to ConvergeHub CRM?",
    "Save to CRM"
  ))) return;

  const originalText = buttonElement?.textContent;
  if (buttonElement) {
    buttonElement.textContent = "Saving...";
    buttonElement.disabled = true;
  }
  try {
    const response = await fetch(CONFIG.LEADS_SUBMIT, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(postData),
    });

    if (response.ok) {
      showBootstrapAlert("Lead saved to CRM successfully!");
      if (profileId) {
        await addToCRMSavedProfiles(profileId);
        updateSaveToCRMButton(profileId, true);
      }
    } else {
      showError("Failed to save to CRM. Please try again.");
      if (buttonElement && originalText) {
        buttonElement.textContent = originalText;
        buttonElement.disabled = false;
      }
    }
  } catch (error) {
    console.log("An error occurred:", error);
    showError("Network error while saving to CRM.");
    if (buttonElement && originalText) {
      buttonElement.textContent = originalText;
      buttonElement.disabled = false;
    }
  }
};

const updateSaveToCRMButton = (profileId, isSaved) => {
  const saveButton = document.querySelector(`[data-profile-id="${profileId}"] .save-to-crm`);
  if (saveButton) {
    saveButton.disabled = !!isSaved;
    saveButton.textContent = isSaved ? "Already Saved" : "Save to CRM";
  }
};

const updateLoginUI = (isLoggedIn) => {
  const showLoginButton = document.getElementById("showLogin");
  const logoutButton = document.getElementById("logoutButton");

  if (showLoginButton) {
    showLoginButton.textContent = isLoggedIn ? "Save to CRM" : "Login to CRM";
    showLoginButton.title = isLoggedIn
      ? "Save current profile to CRM"
      : "Login to save profiles to CRM";
  }
  if (logoutButton) {
    logoutButton.style.display = isLoggedIn ? "inline-block" : "none";
  }
};

const displaySavedProfiles = async () => {
  try {
    const { savedProfiles = { linkedin: [], twitter: [], facebook: [], instagram: [] } } = await chrome.storage.local.get("savedProfiles");
    savedProfilesData = savedProfiles;
    document.getElementById("profile-details").style.display = "none";
    const savedSection = document.getElementById("saved-profiles-section");
    savedSection.style.display = "block";
    savedSection.scrollIntoView({ behavior: "smooth" });
    renderSavedProfiles(savedProfilesData, currentFilter);

    // Update CRM save buttons after rendering
    const crmSavedIds = await getCRMSavedProfiles();
    document.querySelectorAll(".profile-card").forEach(card => {
      updateSaveToCRMButton(card.dataset.profileId, crmSavedIds.includes(card.dataset.profileId));
    });

    document.getElementById("view-saved").style.display = "none";
  } catch (error) {
    console.error("Error loading saved profiles:", error);
    showError("Failed to load saved profiles.");
  }
};

const viewFullProfile = (profileId, panel) => {
  const profile = findProfileById(profileId, savedProfilesData);
  if (!profile) {
    console.error("Profile not found:", profileId);
    showError("Profile not found.");
    return;
  }
  displayProfileData(profile.data, panel);
  document.getElementById("view-saved").style.display = "block";
  document.getElementById("saved-profiles-section").style.display = "none";
  document.getElementById("profile-details").style.display = "block";
};




export async function showLeadPanel() {
  document.getElementById("lead-panel")?.remove();

  const panel = document.createElement("div");
  panel.id = "lead-panel";

  const response = await fetch(chrome.runtime.getURL("popup.html"));
  const htmlContent = await response.text();
  panel.innerHTML = htmlContent;
  document.body.appendChild(panel);

  // ✅ Style injection
  if (!document.getElementById("lead-panel-style")) {
    const styleResponse = await fetch(chrome.runtime.getURL("popup.css"));
    const cssText = await styleResponse.text();
    const style = document.createElement("style");
    style.id = "lead-panel-style";
    style.textContent = cssText;
    document.head.appendChild(style);
  }

  // ✅ Make panel draggable
  const header = panel.querySelector("#lead-panel-header");
  let offsetX = 0,
    offsetY = 0,
    isDragging = false;

  if (header) {
    header.onmousedown = (e) => {
      isDragging = true;
      offsetX = e.clientX - panel.getBoundingClientRect().left;
      offsetY = e.clientY - panel.getBoundingClientRect().top;
      document.onmousemove = (e) => {
        if (!isDragging) return;
        panel.style.left = e.clientX - offsetX + "px";
        panel.style.top = e.clientY - offsetY + "px";
        panel.style.right = "auto";
      };
      document.onmouseup = () => {
        isDragging = false;
        document.onmousemove = null;
        document.onmouseup = null;
      };
    };
  }

  // ✅ Close button handler
  panel.querySelector("#lead-panel-close")?.addEventListener("click", () => panel.remove());


  // ✅ View saved profiles button handler
  panel.querySelector("#close-saved-profiles")?.addEventListener("click", () => {
    panel.querySelector("#saved-profiles-section").style.display = "none";
    panel.querySelector("#profile-details").style.display = "block";
    panel.querySelector("#view-saved").style.display = "block";
    updateViewSavedButtonVisibility();
  });

  // ✅ View saved-profiles-list button handler
  panel.querySelector("#saved-profiles-list")?.addEventListener("click", async (e) => {
    const target = e.target.closest("button, .view-full-btn, .copy-profile-btn, .delete-profile-btn, .save-to-crm");
    const profileCard = e.target.closest(".profile-card");
    if (!profileCard || !target) return;

    const profileId = profileCard.dataset.profileId;
    const platform = profileCard.dataset.platform;

    if (target.classList.contains("view-full-btn")) {
      viewFullProfile(profileId, panel);
      return;
    }
    if (target.classList.contains("copy-profile-btn")) {
      await copyProfileData(profileId, savedProfilesData);
      return;
    }
    if (target.classList.contains("delete-profile-btn")) {
      await deleteProfile(profileId, platform, savedProfilesData, currentFilter);
      await updateViewSavedButtonVisibility();
      return;
    }
    if (target.classList.contains("save-to-crm")) {
      if (await isProfileSavedToCRM(profileId)) {
        showBootstrapAlert("This profile is already saved to CRM!", "info");
        return;
      }
      const profile = findProfileById(profileId, savedProfilesData);
      if (!profile) {
        showError("Profile not found.");
        return;
      }
      currentProfileData = profile.data;
      currentPlatform = profile.platform;
      if (apisecret && apikey) {
        try {
          await saveToCRM(profileId, target);
        } catch (error) {
          console.error("Error saving to CRM:", error);
          showError("Failed to save to CRM. Please try again.");
        }
      } else {
        target.disabled = true;
        target.textContent = "Login Required";
        showBootstrapAlert("Please login first to save profiles to CRM", "warning");
        setTimeout(() => {
          target.disabled = false;
          target.textContent = "Save to CRM";
        }, 3000);
      }
    }
  });

  // Handle login/save to CRM button
  panel.querySelector("#showLogin").addEventListener("click", async () => {
    if (apisecret && apikey) {
      await saveToCRM();
    } else {
      const loginForms = panel.querySelector("#login-forms");
      loginForms.style.display = "block";
      loginForms.scrollIntoView();
    }
  });

  // Logout button
  const logoutButton = panel.querySelector("#logoutButton");
  if (logoutButton) {
    logoutButton.addEventListener("click", async () => {
      await clearStoredCredentials();
      updateLoginUI(false);
      showBootstrapAlert("Logged out successfully!");
    });
  }

  // Login form submit
  const form = panel.querySelector("#loginForm");
  const usernameInput = panel.querySelector("#exampleInputEmail1");
  const passwordInput = panel.querySelector("#exampleInputPassword1");
  const loginButton = panel.querySelector("#loginButton");

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    const username = usernameInput.value;
    const password = passwordInput.value;
    loginButton.disabled = true;
    loginButton.textContent = "Logging in...";

    try {
      const response = await fetch(CONFIG.LOGIN, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      if (response.ok) {
        const data = await response.json();
        if (data.success === 1) {
          apikey = data.data.apikey;
          apisecret = data.data.apisecret;
          await saveCredentials(apikey, apisecret);
          updateLoginUI(true);
          panel.querySelector("#login-forms").style.display = "none";
          showBootstrapAlert("Login successful!");
          if (currentProfileData) saveToCRM();
        } else {
          showBootstrapAlert("Incorrect Credentials!", "danger");
          panel.querySelector("#login-forms").style.display = "none";
        }
      } else {
        showError("Login failed. Please check your credentials.");
      }
    } catch (error) {
      showError("Network error during login. Please try again.");
    } finally {
      loginButton.disabled = false;
      loginButton.textContent = "Login";
    }
  });

  // Save profile button
  panel.querySelector("#saved").addEventListener("click", async () => {
    if (currentProfileData && currentPlatform) {
      await saveProfileData(currentProfileData, currentPlatform);
      await displaySavedProfiles(savedProfilesData, currentFilter);
      await updateViewSavedButtonVisibility();
    }
  });

  // View saved profiles button
  panel.querySelector("#view-saved").addEventListener("click", async () => {
    await displaySavedProfiles(savedProfilesData, currentFilter);
    panel.querySelector("#saved-profiles-section").scrollIntoView({ behavior: "smooth" });
  });

  // Close saved profiles section
  panel.querySelector("#close-saved-profiles").addEventListener("click", () => {
    panel.querySelector("#saved-profiles-section").style.display = "none";
  });

  // Platform tabs event delegation
  panel.querySelectorAll(".platform-tabs button").forEach((button) => {
    button.addEventListener("click", (e) => {
      panel.querySelectorAll(".platform-tabs button").forEach((btn) => btn.classList.remove("active"));
      e.target.classList.add("active");
      currentFilter = e.target.dataset.platform;
      renderSavedProfiles(savedProfilesData, currentFilter);
    });
  });

  const statusElement = panel.querySelector("#status");
  const loaderElement = panel.querySelector("#loader");
  loaderElement.style.display = "block";

  checkStorageUsage();
  const hasStoredCredentials = await loadStoredCredentials();
  updateLoginUI(hasStoredCredentials);
  await updateViewSavedButtonVisibility();


  // ✅ Inject the module to extract LinkedIn data

  const hostname = window.location.hostname;

  if (hostname.includes("linkedin.com")) currentPlatform = "linkedin";
  else if (hostname.includes("facebook.com")) currentPlatform = "facebook";
  else if (hostname.includes("twitter.com") || hostname.includes("x.com")) currentPlatform = "twitter";
  else if (hostname.includes("instagram.com")) currentPlatform = "instagram";

  try {
    if (currentPlatform === "linkedin") {
      currentProfileData = await linkedinProfile();
    } else if (currentPlatform === "facebook") {
      currentProfileData = await facebookProfile();
    } else if (currentPlatform === "twitter") {
      currentProfileData = await twitterProfile();
    } else if (currentPlatform === "instagram") {
      currentProfileData = await instagramProfile();
    } if (!currentProfileData && !currentPlatform) {
      statusElement.textContent =
        language.errors.notSupported || "Please navigate to a LinkedIn, Twitter, or Facebook profile page";
      statusElement.className = "not-linkedin";
      document.getElementById("close-saved-profiles").style.display = "none";
    }

    if (currentProfileData) await displayProfileData(currentProfileData, panel);
    loaderElement.style.display = "none";
  } catch (error) {
    console.error("Lead extraction failed:", error);
  }
}
