import CONFIG from "./config.js";
import display from "./helper/display.js"
import language from "./helper/language.js";
import showError from "./helper/showError.js";
import saveProfileData from "./helper/savedProfile.js";
import twitterProfile from "./library/twitterProfile.js";
import findProfileById from "./helper/findProfileById.js";
import linkedinProfile from "./library/linkedinProfile.js";
import facebookProfile from "./library/facebookProfile.js";
import showConfirmDialog from "./helper/showConfirmDialog.js";
import checkStorageUsage from "./helper/checkStorageUsage.js";
import showBootstrapAlert from "./helper/showBootstrapAlert.js";
import renderSavedProfiles from "./helper/renderSavedProfiles.js";
import getCRMSavedProfiles from "./helper/getCRMSavedProfiles.js";
import checkSavedProfilesExist from "./helper/checkSavedProfilesExist.js";
import { copyProfileData, deleteProfile } from "./helper/savedProfileFunctions.js";

function getImageUrl(relativePath) {
  return chrome.runtime.getURL(relativePath);
}

export async function showLeadPanel() {

  document.getElementById("lead-panel")?.remove();

  const panel = document.createElement("div");
  panel.id = "lead-panel";

  const response = await fetch(chrome.runtime.getURL("popup.html"));
  const htmlContent = await response.text();
  panel.innerHTML = htmlContent;
  document.body.appendChild(panel);

  //  Style injection
  if (!document.getElementById("lead-panel-style")) {
    const styleResponse = await fetch(chrome.runtime.getURL("popup.css"));
    const cssText = await styleResponse.text();
    const style = document.createElement("style");
    style.id = "lead-panel-style";
    style.textContent = cssText;
    document.head.appendChild(style);
  }

  if (!document.getElementById("bootstrap-style")) {
    const bootstrapLink = document.createElement("link");
    bootstrapLink.id = "bootstrap-style";
    bootstrapLink.rel = "stylesheet";
    bootstrapLink.href = chrome.runtime.getURL("css/bootstrap.css");
    document.head.appendChild(bootstrapLink);
  }

  const bootstrapScript = document.createElement("script");
  bootstrapScript.src = chrome.runtime.getURL("js/bootstrap.js");
  bootstrapScript.id = "bootstrap-script";
  bootstrapScript.defer = true;
  document.body.appendChild(bootstrapScript);


  const imageConfigs = [
    { selector: ".logo-section img", path: "images/main.png" },
    { selector: ".close-button img", path: "images/close.svg" },
    { selector: "#profileImage", path: "images/default.png" }
  ];

  imageConfigs.forEach(({ selector, path }) => {
    const img = document.querySelector(selector);
    if (img) img.src = getImageUrl(path);
  });

  //  Make panel draggable
  const header = panel.querySelector(".logo-section");
  let offsetX = 0, offsetY = 0, isDragging = false;

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

  //  Close button handler
  panel.querySelector(".close-button")?.addEventListener("click", () => panel.remove());

  //  View saved profiles button handler
  panel.querySelector("#close-saved-profiles")?.addEventListener("click", () => {
    panel.querySelector("#saved-profiles-section").style.display = "none";
    panel.querySelector("#profile-details").style.display = "block";
    panel.querySelector("#view-saved").style.display = "block";
    updateViewSavedButtonVisibility();
  });



  try {
    let apikey = null, apisecret = null, currentFilter = "all", currentPlatform = null, currentProfileData = null, savedProfilesData = null;

    /* ### Helper Function Start ### */
    // Storage: Load, Save, Clear
    const loadStoredCredentials = async () => {
      try {
        const { apikey, apisecret } = await chrome.storage.local.get(["apikey", "apisecret"]);
        if (apikey && apisecret) {
          apikey = apikey;
          apisecret = apisecret;
          return true;
        }
      } catch { }
      return false;
    };

    const saveCredentials = async (key, secret) => {
      try {
        await chrome.storage.local.set({ apikey: key, apisecret: secret });
      } catch (err) {
        console.error("Error saving credentials:", err);
      }
    };

    const clearStoredCredentials = async () => {
      try {
        await chrome.storage.local.remove(["apikey", "apisecret"]);
        apikey = null;
        apisecret = null;
      } catch (err) {
        console.error("Error clearing credentials:", err);
      }
    };

    // CRM Saved Profiles
    const addToCRMSavedProfiles = async (profileId) => {
      try {
        const savedIds = await getCRMSavedProfiles();
        if (!savedIds.includes(profileId)) {
          savedIds.push(profileId);
          await chrome.storage.local.set({ crmSavedProfiles: savedIds });
        }
      } catch (err) {
        console.error("Error saving to CRM list:", err);
      }
    };

    const isProfileSavedToCRM = async (profileId) => {
      const savedIds = await getCRMSavedProfiles();
      return savedIds.includes(profileId);
    };

    // UI Updates
    const updateViewSavedButtonVisibility = async () => {
      const btn = document.getElementById("view-saved");
      if (btn) {
        const hasProfiles = await checkSavedProfilesExist();
        btn.style.display = hasProfiles ? "block" : "none";
      }
    };

    const updateSaveToCRMButton = (profileId, isSaved) => {
      const card = document.querySelector(`[data-profile-id="${profileId}"]`);
      const btn = card?.querySelector(".save-to-crm");
      if (btn) {
        btn.disabled = isSaved;
        btn.textContent = isSaved ? "Already Saved" : "Save to CRM";
      }
    };

    const updateLoginUI = (isLoggedIn) => {
      const loginBtn = document.getElementById("showLogin");
      const logoutBtn = document.getElementById("logoutButton");

      if (loginBtn) {
        loginBtn.textContent = isLoggedIn ? "Save to CRM" : "Login to CRM";
        loginBtn.title = loginBtn.textContent;
      }

      if (logoutBtn) {
        logoutBtn.style.display = isLoggedIn ? "inline-block" : "none";
      }
    };

    // Save to CRM
    const saveToCRM = async (profileId = null, btn = null) => {
      if (!currentProfileData || !currentPlatform) return;

      const confirmed = await showConfirmDialog("Are you sure you want to save this data to ConvergeHub CRM?", "Save to CRM");
      if (!confirmed) return;

      const { name, headline, about, email, phone, socials } = window.currentProfileData;
      const request = {
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
          }],
        }),
        ...(phone && {
          phone: [{
            number: phone,
            type: "Mobile",
            country_code: "+1",
            extension: "",
            primary: 1,
          }],
        }),
      };

      const postData = {
        apiKey: apikey,
        apiSecret: apisecret,
        request,
        social_links: { [currentPlatform]: socials },
      };

      const originalText = btn?.textContent;
      if (btn) {
        btn.textContent = "Saving...";
        btn.disabled = true;
      }

      try {
        const res = await fetch(CONFIG.LEADS_SUBMIT, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(postData),
        });

        if (res.ok) {
          showBootstrapAlert("Lead saved to CRM successfully!");
          if (profileId) {
            await addToCRMSavedProfiles(profileId);
            updateSaveToCRMButton(profileId, true);
          }
        } else {
          showError("Failed to save to CRM. Please try again.");
        }
      } catch {
        showError("Network error while saving to CRM.");
      } finally {
        if (btn && originalText) {
          btn.textContent = originalText;
          btn.disabled = false;
        }
      }
    };

    // Display Saved Profiles
    const displaySavedProfiles = async () => {
      try {
        const { savedProfiles } = await chrome.storage.local.get(["savedProfiles"]);
        savedProfilesData = savedProfiles || {
          linkedin: [],
          twitter: [],
          facebook: [],
          instagram: [],
        };

        document.getElementById("profile-details").style.display = "none";
        document.getElementById("saved-profiles-section").style.display = "block";
        document.getElementById("saved-profiles-section").scrollIntoView({ behavior: "smooth" });

        renderSavedProfiles(savedProfilesData, currentFilter);

        setTimeout(async () => {
          const crmSavedIds = await getCRMSavedProfiles();
          document.querySelectorAll(".profile-card").forEach((card) => {
            const profileId = card.dataset.profileId;
            const isSaved = crmSavedIds.includes(profileId);
            updateSaveToCRMButton(profileId, isSaved);
          });
        }, 100);

        document.getElementById("view-saved").style.display = "none";
      } catch (err) {
        showError("Failed to load saved profiles.");
      }
    };

    const getExtLeadFromLinkedIn = async (panel, url, loaderElement) => {
      const isProfilePage =
        url.includes("/in/") ||
        url.includes("/pub/") ||
        url.includes("company") ||
        url.includes("/contact-info/");
      if (isProfilePage) {
        loaderElement.style.display = "block";
        try {
          currentProfileData = await linkedinProfile();
          if (currentProfileData) {
            display(panel, currentProfileData);
          } else {
            showError(language.errors.noProfileData);
          }
        } catch (error) {
          showError(language.errors.extractionFailed);
        } finally {
          loaderElement.style.display = "none";
        }
      } else {
        document.getElementById("close-saved-profiles").style.display = "none";
        showError(language.errors.notProfilePage);
      }
    };

    const getExtLeadFromTwitter = async (panel, url, loaderElement) => {
      if (url.includes("/home")) {
        document.getElementById("close-saved-profiles").style.display = "none";
        showError(language.errors.notProfilePage);
      } else {
        const isTwitterProfilePage =
          url.match(/\/(x|twitter)\.com\/[^\/]+\/?$/) || // Direct profile
          url.match(/\/(x|twitter)\.com\/[^\/]+\/?(with_replies|media|likes)?\/?$/); // Profile tabs

        if (isTwitterProfilePage) {
          loaderElement.style.display = "block";
          await new Promise((resolve) => setTimeout(resolve, 1000));
          try {
            currentProfileData = await twitterProfile();
            if (currentProfileData) {
              display(panel, currentProfileData);
            } else {
              showError(language.errors.noProfileData);
            }
          } catch (error) {
            showError(language.errors.extractionFailed);
          } finally {
            loaderElement.style.display = "none";
          }
        } else {
          document.getElementById("close-saved-profiles").style.display = "none";
          showError(language.errors.notProfilePage);
        }
      }
    };

    const getExtLeadFromFacebook = async (panel, url, loaderElement, activeTab) => {
      const isFacebookProfilePage =
        url.match(/facebook\.com\/[^\/]+\/?$/) ||
        url.match(/facebook\.com\/profile\.php\?id=/) ||
        url.match(/facebook\.com\/[^\/]+\/?(about|photos|friends|videos)?\/?$/);

      const isNotProfilePage =
        url.includes("/home") ||
        url.includes("/feed") ||
        url.includes("/marketplace") ||
        url.includes("/groups") ||
        url.includes("/pages") ||
        url.includes("/events") ||
        url.includes("/watch") ||
        url.includes("/gaming");

      if (isFacebookProfilePage && !isNotProfilePage) {
        loaderElement.style.display = "block";
        await (() => new Promise((resolve) => {
          chrome.runtime.sendMessage({ action: "reloadTab", tabId: activeTab.id }, (response) =>
            resolve(response)
          );
        }))();

        await new Promise((resolve) => setTimeout(resolve, 1000));

        try {
          currentProfileData = await facebookProfile();
          if (currentProfileData) {
            display(panel, currentProfileData);
          } else {
            showError(language.errors.noProfileData);
          }
        } catch (error) {
          showError(language.errors.extractionFailed);
        } finally {
          loaderElement.style.display = "none";
        }
      } else {
        document.getElementById("close-saved-profiles").style.display = "none";
        showError(language.errors.notProfilePage);
      }
    };

    const viewFullProfile = (profileId) => {
      const profile = findProfileById(profileId, savedProfilesData);
      if (profile) {
        display(profile.data);
        document.getElementById("view-saved").style.display = "block";
        document.getElementById("saved-profiles-section").style.display = "none";
        document.getElementById("profile-details").style.display = "block";
      } else {
        showError("Profile not found.");
      }
    };

    /* ### Helper Function End ### */

    try {
      checkStorageUsage();
      const hasStoredCredentials = await loadStoredCredentials();
      updateLoginUI(hasStoredCredentials);
      await updateViewSavedButtonVisibility();
      const statusElement = document.getElementById("status");
      const loaderElement = document.getElementById("loader");
      loaderElement.style.display = "none";

      document.getElementById("showLogin").addEventListener("click", async () => {
        if (apisecret !== null && apikey !== null) {
          await saveToCRM();
        } else {
          document.getElementById("login-forms").style.display = "block";
          document.getElementById("login-forms").scrollIntoView();
        }
      });

      const logoutButton = document.getElementById("logoutButton");
      if (logoutButton) {
        logoutButton.addEventListener("click", async () => {
          await clearStoredCredentials();
          updateLoginUI(false);
          showBootstrapAlert("Logged out successfully!");
        });
      }

      const form = document.getElementById("loginForm");
      const usernameInput = document.getElementById("exampleInputEmail1");
      const passwordInput = document.getElementById("exampleInputPassword1");
      const loginButton = document.getElementById("loginButton");

      form.addEventListener("submit", async (event) => {
        event.preventDefault();
        const username = usernameInput.value.trim();
        const password = passwordInput.value.trim();
        const loginForms = document.getElementById("login-forms");

        loginButton.disabled = true;
        loginButton.textContent = "Logging in...";

        try {
          const response = await fetch(CONFIG.LOGIN, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ username, password }),
          });

          if (!response.ok) {
            showError("Login failed. Please check your credentials.");
            return;
          }

          const { success, data } = await response.json();

          if (success === 1 && data?.apikey && data?.apisecret) {
            apikey = data.apikey;
            apisecret = data.apisecret;

            await saveCredentials(apikey, apisecret);
            updateLoginUI(true);

            loginForms.style.display = "none";
            showBootstrapAlert("Login successful!");

            if (currentProfileData) {
              await saveToCRM();
            }
          } else {
            showBootstrapAlert("Incorrect credentials!", "danger");
            loginForms.style.display = "none";
          }
        } catch (err) {
          showError("Network error during login. Please try again.");
        } finally {
          loginButton.disabled = false;
          loginButton.textContent = "Login";
        }
      });


      document.getElementById("saved").addEventListener("click", async () => {
        if (currentProfileData && currentPlatform) {
          await saveProfileData(currentProfileData, currentPlatform);
          await displaySavedProfiles(savedProfilesData, currentFilter);
          await updateViewSavedButtonVisibility();
        } else {
          console.log("No profile data to save");
        }
      });

      document
        .getElementById("view-saved")
        .addEventListener("click", async () => {
          await displaySavedProfiles(savedProfilesData, currentFilter);
          document.getElementById("saved-profiles-section").scrollIntoView({ behavior: "smooth" });
        });

      document
        .getElementById("close-saved-profiles")
        .addEventListener("click", () => {
          document.getElementById("saved-profiles-section").style.display =
            "none";
        });

      document.querySelectorAll(".platform-tabs button").forEach((button) => {
        button.addEventListener("click", (e) => {
          document
            .querySelectorAll(".platform-tabs button")
            .forEach((btn) => btn.classList.remove("active"));
          e.target.classList.add("active");

          currentFilter = e.target.dataset.platform;
          renderSavedProfiles(savedProfilesData, currentFilter);
        });
      });

      const tabs = await (() => new Promise((resolve) => {
        chrome.runtime.sendMessage({ action: "getCurrentTab" }, (response) =>
          resolve(response)
        );
      }))();

      if (tabs.length === 0) {
        statusElement.textContent = language.errors.noActiveTab;
        return;
      }

      const activeTab = tabs[0];
      const url = activeTab.url;
      const isLinkedIn = url.includes("linkedin.com");
      const isTwitter = url.includes("x.com") || url.includes("twitter.com");
      const isFacebook = url.includes("facebook.com");

      if (!isLinkedIn && !isTwitter && !isFacebook) {
        statusElement.textContent =
          language.errors.notSupported ||
          "Please navigate to a LinkedIn, Twitter, or Facebook profile page";
        statusElement.className = "not-linkedin";
        document.getElementById("close-saved-profiles").style.display = "none";
      } else if (isLinkedIn) {
        currentPlatform = "linkedin";
        getExtLeadFromLinkedIn(panel, url, loaderElement);
      } else if (isTwitter) {
        currentPlatform = "twitter";
        getExtLeadFromTwitter(panel, url, loaderElement);
      } else if (isFacebook) {
        currentPlatform = "facebook";
        getExtLeadFromFacebook(panel, url, loaderElement, activeTab);
      }

    } catch (error) {
      console.log(error);
    }

    document.getElementById("close-saved-profiles")?.addEventListener("click", () => {
      const section = document.getElementById("saved-profiles-section");
      const details = document.getElementById("profile-details");
      const viewBtn = document.getElementById("view-saved");
      if (section) section.style.display = "none";
      if (details) details.style.display = "block";
      if (viewBtn) viewBtn.style.display = "block";
      updateViewSavedButtonVisibility();
    });

    document.getElementById("saved-profiles-list")?.addEventListener("click", async (e) => {
      const target = e.target;
      const profileCard = target.closest(".profile-card");
      if (!profileCard) return;

      const profileId = profileCard.dataset.profileId;
      const platform = profileCard.dataset.platform;

      switch (true) {
        case target.classList.contains("view-full-btn"):
          viewFullProfile(profileId);
          break;

        case target.classList.contains("copy-profile-btn"):
          await copyProfileData(profileId, savedProfilesData);
          break;

        case target.classList.contains("delete-profile-btn"):
          await deleteProfile(profileId, platform, savedProfilesData, currentFilter);
          await updateViewSavedButtonVisibility();
          break;

        case target.classList.contains("save-to-crm"):
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

          if (apikey && apisecret) {
            try {
              await saveToCRM(profileId, target);
            } catch (err) {
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
          break;
      }
    });

  } catch (error) {
    console.error("Lead extraction failed:", error);
  }
}
