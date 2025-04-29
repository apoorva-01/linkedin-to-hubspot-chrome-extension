async function getLinkedInProfileData() {
    console.log('[Content.js] Fetching LinkedIn profile data...');
    const nameElement = document.querySelector('h1.inline.t-24.v-align-middle.break-words');
    const name = nameElement?.innerText.trim() || '';
    // console.log('[Content.js] Name:', name);

    const locationElement = document.querySelector('span.text-body-small.inline.t-black--light.break-words');
    const location = locationElement?.innerText.trim() || '';
    // console.log('[Content.js] location:', location);

    const titleElement = document.querySelector('.text-body-medium.break-words');
    const title = titleElement?.innerText.trim() || '';
    // console.log('[Content.js] Title:', title);

    const bioElement = document.querySelector('.t-14.t-normal span[aria-hidden="true"]');
    const bio = bioElement?.innerText.trim() || '';
    // console.log('[Content.js] Bio:', bio);

    const experienceSection = document.querySelector('section.artdeco-card.pv-profile-card:has(div#experience)');
    let jobTitle = '';
    let companyName = '';
    let companyType = '';
    let jobDuration = '';
    let jobDescription = '';
    let companyLogo = '';
    let companyPageLink = '';

    if (experienceSection) {
        const jobTitleElement = experienceSection.querySelector('.t-bold span[aria-hidden="true"]');
        jobTitle = jobTitleElement?.innerText.trim() || '';
        // console.log('[Content.js] Job Title:', jobTitle);

        const companyElement = experienceSection.querySelector('.t-14.t-normal > span[aria-hidden="true"]');
        const companyDetails = companyElement?.innerText.trim() || '';
        [companyName, companyType] = companyDetails.split(' · ') || ['', ''];
        // console.log('[Content.js] Company Name:', companyName);
        // console.log('[Content.js] Company Type:', companyType);

        const jobDurationElement = experienceSection.querySelector('.t-14.t-normal.t-black--light > span.pvs-entity__caption-wrapper');
        jobDuration = jobDurationElement?.innerText.trim() || '';
        // console.log('[Content.js] jobDuration:', jobDuration);

        const jobDescriptionElement = experienceSection.querySelector('div[dir="ltr"] span[aria-hidden="true"]');
        jobDescription = jobDescriptionElement?.innerText.trim() || '';
        // console.log('[Content.js] Job Description:', jobDescription);

        const companyLogoElement = experienceSection.querySelector('img[alt][width="48"]');
        companyLogo = companyLogoElement?.getAttribute('src') || '';
        // console.log('[Content.js] Company Logo URL:', companyLogo);

        const companyPageLinkElement = experienceSection.querySelector('a[data-field="experience_company_logo"]');
        companyPageLink = companyPageLinkElement?.getAttribute('href') || '';
        // console.log('[Content.js] Company Page Link:', companyPageLink);
    } else {
        console.log('[Content.js] Experience section not found.');
    }

    const profileImageElement = document.querySelector('.pv-top-card-profile-picture__image--show');
    const profileImage = profileImageElement?.getAttribute('src') || '';
    // console.log('[Content.js] Profile Image URL:', profileImage);

    let email = '';
    let website = '';

    try {
        // Ensure the button exists before proceeding
        const contactInfoButton = document.querySelector('#top-card-text-details-contact-info');
        if (!contactInfoButton) {
            console.log('[Content.js] Contact info button not found.');
            return;
        }

        await randomDelay(400, 1200);
        simulateMouseClick(contactInfoButton);

        // Wait for modal to open (randomized)
        await randomDelay(700, 1800);

        // Wait for the modal to open (checking after a delay)
        const waitForModal = () => new Promise((resolve, reject) => {
            const timeout = setTimeout(() => reject('Modal did not open in time'), 5000); // 5-second timeout

            const checkModal = setInterval(() => {
                const modal = document.querySelector('.artdeco-modal');
                // Only resolve if modal is present and contains a nested div with class artdeco-modal__content
                if (modal && modal.querySelector('.artdeco-modal__content')) {
                    clearTimeout(timeout);
                    clearInterval(checkModal);
                    resolve(modal);
                }
            }, 500); // Check every 500ms
        });

        // Wait for modal to appear
        const modal = await waitForModal();
        // console.log('[Content.js] Modal opened.');
        // Print only the div with .artdeco-modal__content (as HTML)
        const modalContentDiv = modal.querySelector('.artdeco-modal__content');
        if (modalContentDiv) {
            // console.log(modalContentDiv.innerHTML);
            // Extract email and website from modalContentDiv (not modal!)
            const emailElement = modalContentDiv.querySelector('a[href^="mailto:"]');
            if (emailElement) {
                email = emailElement.innerText.trim();
                console.log('[Content.js] Email:', email);
            } else {
                console.log('[Content.js] Email not found.');
            }

            const websiteElement = modalContentDiv.querySelector('a.pv-contact-info__contact-link[href^="http"]');
            if (websiteElement) {
                website = websiteElement.href.trim();
                console.log('[Content.js] Website:', website);
            } else {
                console.log('[Content.js] Website not found.');
            }
        } else {
            console.log('[Content.js] .artdeco-modal__content not found in modal.');
        }

        await randomDelay(400, 1200);
        // Close the modal after extracting info
        const closeButton = document.querySelector('.artdeco-modal__dismiss');
        if (closeButton) {
            simulateMouseClick(closeButton);
        } else {
            console.log('[Content.js] Close button not found.');
        }

    } catch (error) {
        console.error('[Content.js] Error:', error);
    }

    return {
        name,
        location,
        title,
        bio,
        email,
        website,
        profileImage,
        companyName,
        companyType,
        companyLogo,
        companyPageLink,
        jobDuration,
        jobTitle,
        jobDescription,
    };
}

let addHubSpotButtonRunning = false;
let lastUsernameChecked = null;
let lastButtonState = null;

function getLinkedInUsernameFromUrl() {
    const match = window.location.pathname.match(/\/in\/([^\/?#]+)/);
    return match ? match[1] : '';
}

function removeHubSpotButtons() {
    const existingBtn = document.getElementById('hubspotAddBtn');
    const alreadyBtn = document.getElementById('hubspotAlreadyBtn');
    if (existingBtn) existingBtn.remove();
    if (alreadyBtn) alreadyBtn.remove();
}

function randomDelay(min = 500, max = 1800) {
    return new Promise(resolve => setTimeout(resolve, Math.floor(Math.random() * (max - min + 1)) + min));
}

// Utility: Simulate a real mouse click event
function simulateMouseClick(element) {
    if (!element) return;
    const rect = element.getBoundingClientRect();
    const opts = { bubbles: true, cancelable: true, view: window, clientX: rect.left + 5, clientY: rect.top + 5 };
    element.dispatchEvent(new MouseEvent('mouseover', opts));
    element.dispatchEvent(new MouseEvent('mousedown', opts));
    element.dispatchEvent(new MouseEvent('mouseup', opts));
    element.dispatchEvent(new MouseEvent('click', opts));
}

// Throttle addHubSpotButton to avoid rapid re-injection
let lastButtonInjectTime = 0;
const BUTTON_INJECT_THROTTLE_MS = 2000;

function addHubSpotButton() {
    const now = Date.now();
    if (now - lastButtonInjectTime < BUTTON_INJECT_THROTTLE_MS) return;
    lastButtonInjectTime = now;
    // Only run if not already running and username has changed
    const username = getLinkedInUsernameFromUrl();
    if (addHubSpotButtonRunning || (username === lastUsernameChecked && lastButtonState !== null)) {
        return;
    }
    addHubSpotButtonRunning = true;

    chrome.storage.local.get(['hubspotApiKey'], (result) => {
        removeHubSpotButtons();
        if (!result.hubspotApiKey) {
            addHubSpotButtonRunning = false;
            lastUsernameChecked = null;
            lastButtonState = null;
            return;
        }

        lastUsernameChecked = username;

        chrome.runtime.sendMessage(
            { action: 'checkContactByLinkedinUsername', username },
            (response) => {
                removeHubSpotButtons();

                const nameElement = document.querySelector('h1.inline.t-24.v-align-middle.break-words');
                if (!nameElement) {
                    addHubSpotButtonRunning = false;
                    lastButtonState = null;
                    return;
                }

                if (response && response.found === true) {
                    // Add "Already in Contact" button (disabled)
                    if (!document.getElementById('hubspotAlreadyBtn')) {
                        const btn = document.createElement('button');
                        btn.id = 'hubspotAlreadyBtn';
                        btn.innerText = 'Already in Contact';
                        btn.disabled = true;
                        btn.style.marginLeft = '10px';
                        btn.style.padding = '5px 10px';
                        btn.style.backgroundColor = '#ccc';
                        btn.style.color = '#444';
                        btn.style.border = 'none';
                        btn.style.cursor = 'not-allowed';
                        btn.style.fontSize = '14px';
                        nameElement.parentElement.appendChild(btn);
                    }
                    lastButtonState = "already";
                } else {
                    // Add "Add to HubSpot" button
                    if (!document.getElementById('hubspotAddBtn')) {
                        const button = document.createElement('button');
                        button.id = 'hubspotAddBtn';
                        button.innerText = 'Add to HubSpot';
                        button.style.marginLeft = '10px';
                        button.style.padding = '5px 10px';
                        button.style.backgroundColor = '#FF7A59';
                        button.style.color = 'white';
                        button.style.border = 'none';
                        button.style.cursor = 'pointer';
                        button.style.fontSize = '14px';

                        button.addEventListener('click', async () => {
                            console.log('[Content.js] HubSpot button clicked.');
                            try {
                                const profileData = await getLinkedInProfileData();
                                // console.log('[Content.js] Profile Data:', profileData);
                                chrome.storage.local.get(['linkedinToHubspotMapping', 'linkedinToHubspotCompanyMapping'], (mappingResult) => {
                                    const mapping = mappingResult.linkedinToHubspotMapping || {};
                                    const companyMapping = mappingResult.linkedinToHubspotCompanyMapping || {};
                                    const mappedProfile = {};
                                    const mappedCompany = {};

                                    for (const [linkedinKey, hubspotKey] of Object.entries(mapping)) {
                                        if (hubspotKey) {
                                            if (linkedinKey === "LINKEDIN_URL") {
                                                mappedProfile[hubspotKey] = window.location.href;
                                            } else if (profileData[linkedinKey] !== undefined) {
                                                mappedProfile[hubspotKey] = profileData[linkedinKey];
                                            }
                                        }
                                    }
                                    // Map company details
                                    for (const [linkedinKey, hubspotKey] of Object.entries(companyMapping)) {
                                        if (hubspotKey) {
                                            if (linkedinKey === "LINKEDIN_URL") {
                                                mappedCompany[hubspotKey] = window.location.href;
                                            } else if (profileData[linkedinKey] !== undefined) {
                                                mappedCompany[hubspotKey] = profileData[linkedinKey];
                                            }
                                        }
                                    }
                                    // Always include these
                                    mappedProfile.hs_linkedin_url = window.location.href;
                                    mappedProfile.hs_lead_status = 'NEW';

                                    console.log({
                                        profileData: mappedProfile,
                                        companyDetails: mappedCompany
                                    })
                                    chrome.runtime.sendMessage(
                                        {
                                            action: 'sendToHubSpot',
                                            profileData: mappedProfile,
                                            companyDetails: mappedCompany
                                        },
                                        (response) => {
                                            if (chrome.runtime.lastError) {
                                                console.error('[Content.js] Runtime error:', chrome.runtime.lastError.message);
                                                showSnackbar('Failed to add ❌');
                                                return;
                                            }
                                            if (response?.success) {
                                                showSnackbar('Added to HubSpot ✅');
                                                // Add "Already in Contact" button (disabled) after successful add
                                                removeHubSpotButtons();
                                                const nameElement = document.querySelector('h1.inline.t-24.v-align-middle.break-words');
                                                if (nameElement && !document.getElementById('hubspotAlreadyBtn')) {
                                                    const btn = document.createElement('button');
                                                    btn.id = 'hubspotAlreadyBtn';
                                                    btn.innerText = 'Already in Contact';
                                                    btn.disabled = true;
                                                    btn.style.marginLeft = '10px';
                                                    btn.style.padding = '5px 10px';
                                                    btn.style.backgroundColor = '#ccc';
                                                    btn.style.color = '#444';
                                                    btn.style.border = 'none';
                                                    btn.style.cursor = 'not-allowed';
                                                    btn.style.fontSize = '14px';
                                                    nameElement.parentElement.appendChild(btn);
                                                }
                                            } else {
                                                console.error('[Content.js] Failed to add to HubSpot:', response?.error || 'Unknown error');
                                                showSnackbar('Failed to add ❌');
                                            }
                                        }
                                    );
                                });
                            } catch (error) {
                                console.error('[Content.js] Error sending message to background.js:', error);
                                showSnackbar('Failed to add ❌');
                            }
                        });

                        nameElement.parentElement.parentElement.parentElement.appendChild(button);
                        console.log('[Content.js] HubSpot button added next to the name.');
                    }
                    lastButtonState = "add";
                }
                addHubSpotButtonRunning = false;
            }
        );
    });
}

addHubSpotButton();

// Observe DOM changes to re-add the button if needed (for LinkedIn SPA navigation)
const observer = new MutationObserver((mutationsList, observer) => {
    // Look for changes in the DOM, such as new elements being added.
    for (let mutation of mutationsList) {
        if (mutation.type === 'childList' || mutation.type === 'subtree') {
            // Try adding the button after changes.
            addHubSpotButton();
        }
    }
});

// Start observing the document body for child list changes and subtree changes
observer.observe(document.body, { childList: true, subtree: true });
// Listen for reloadPage message from background.js
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "reloadPage") {
        window.location.reload();
    }
    if (request.action === "getProfileData") {
        console.log('[Content.js] Received message to fetch profile data.');
        getLinkedInProfileData().then(profile => {
            console.log('[Content.js] Sending profile data:', profile);
            sendResponse(profile);
        }).catch(error => {
            console.error('[Content.js] Error fetching profile data:', error);
        });
    }
    return true;
});

// Inject snackbar HTML and CSS if not already present
function injectSnackbar() {
    if (!document.getElementById('snackbar')) {
        const snackbarDiv = document.createElement('div');
        snackbarDiv.id = 'snackbar';
        snackbarDiv.style.visibility = 'hidden';
        snackbarDiv.style.minWidth = '250px';
        snackbarDiv.style.marginLeft = '-125px';
        snackbarDiv.style.backgroundColor = '#333';
        snackbarDiv.style.color = '#fff';
        snackbarDiv.style.textAlign = 'center';
        snackbarDiv.style.borderRadius = '2px';
        snackbarDiv.style.padding = '16px';
        snackbarDiv.style.position = 'fixed';
        snackbarDiv.style.zIndex = '2147483647'; // ensure on top
        snackbarDiv.style.left = '50%';
        snackbarDiv.style.bottom = '30px';
        snackbarDiv.style.fontSize = '17px';
        snackbarDiv.style.transition = 'visibility 0s linear 0.5s, opacity 0.5s linear';
        document.body.appendChild(snackbarDiv);

        // Add CSS animations only once
        if (!document.getElementById('snackbar-style')) {
            const style = document.createElement('style');
            style.id = 'snackbar-style';
            style.innerHTML = `
#snackbar.show {
  visibility: visible !important;
  opacity: 1 !important;
  -webkit-animation: fadein 0.5s, fadeout 0.5s 2.5s;
  animation: fadein 0.5s, fadeout 0.5s 2.5s;
}
#snackbar {
  opacity: 0;
  transition: opacity 0.5s;
}
@-webkit-keyframes fadein {
  from {bottom: 0; opacity: 0;} 
  to {bottom: 30px; opacity: 1;}
}
@keyframes fadein {
  from {bottom: 0; opacity: 0;}
  to {bottom: 30px; opacity: 1;}
}
@-webkit-keyframes fadeout {
  from {bottom: 30px; opacity: 1;} 
  to {bottom: 0; opacity: 0;}
}
@keyframes fadeout {
  from {bottom: 30px; opacity: 1;}
  to {bottom: 0; opacity: 0;}
}`;
            document.head.appendChild(style);
        }
    }
}

function showSnackbar(message) {
    injectSnackbar();
    const x = document.getElementById("snackbar");
    x.textContent = message;
    x.style.visibility = "visible";
    x.style.opacity = "1";
    x.className = "show";
    setTimeout(() => {
        x.className = x.className.replace("show", "");
        x.style.opacity = "0";
        setTimeout(() => {
            x.style.visibility = "hidden";
        }, 500);
    }, 3000);
}
