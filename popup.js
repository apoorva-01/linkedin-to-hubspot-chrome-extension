const LINKEDIN_FIELDS = [
    { key: "name", label: "Name" },
    { key: "location", label: "Location" },
    { key: "email", label: "Email" },
    { key: "website", label: "Website" },
    { key: "bio", label: "Linkedin Bio" },
    { key: "jobTitle", label: "Job Title" },
    { key: "LINKEDIN_URL", label: "Linkedin URL" },
    { key: "profileImage", label: "Profile Image" },

    // { key: "title", label: "Title" },
    // { key: "jobDuration", label: "Job Duration" },
    // { key: "jobDescription", label: "Job Description" }
];
const COMPANY_FIELDS = [
    { key: "companyName", label: "Company Name" },
    { key: "companyPageLink", label: "Company Linkedin Page" },
    { key: "companyLogo", label: "Company Logo" },
];
// const companyPayload = {
//     properties: {
//         name: companyDetails.companyName || 'Unknown Company',
//         ...(companyDetails.companyPageLink && { linkedin_company_page: companyDetails.companyPageLink }),
//         ...(companyDetails.companyLogo && { hs_logo_url: companyDetails.companyLogo })
//     }
// };

// Example HubSpot fields (should be fetched from API for real use)
const HUBSPOT_FIELDS = [
    "firstname", "lastname", "email", "phone", "website", "jobtitle",
    "linkedin_bio", "address", "avatar_url", "hs_linkedin_url",
    "name", "hs_logo_url", "linkedin_company_page"
];

function renderMappingTable(savedMapping = {}, savedCompanyMapping = {}) {
    const mappingSection = document.getElementById('mappingSection');
    const mappingTableBody = document.getElementById('mappingTableBody');
    mappingTableBody.innerHTML = '';
    LINKEDIN_FIELDS.forEach(field => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td style="padding:4px;">${field.label}</td>
            <td style="padding:4px;">
                <select data-linkedin="${field.key}" data-type="contact" style="width:100%;">
                    <option value="">-- Ignore --</option>
                    ${HUBSPOT_FIELDS.map(hf =>
                        `<option value="${hf}" ${savedMapping[field.key] === hf ? 'selected' : ''}>${hf}</option>`
                    ).join('')}
                </select>
            </td>
        `;
        mappingTableBody.appendChild(tr);
    });
    COMPANY_FIELDS.forEach(field => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td style="padding:4px;">${field.label}</td>
            <td style="padding:4px;">
                <select data-linkedin="${field.key}" data-type="company" style="width:100%;">
                    <option value="">-- Ignore --</option>
                    ${HUBSPOT_FIELDS.map(hf =>
                        `<option value="${hf}" ${savedCompanyMapping[field.key] === hf ? 'selected' : ''}>${hf}</option>`
                    ).join('')}
                </select>
            </td>
        `;
        mappingTableBody.appendChild(tr);
    });
    mappingSection.style.display = '';
}

function getMappingFromForm() {
    const mapping = {};
    const companyMapping = {};
    document.querySelectorAll('#mappingTableBody select').forEach(sel => {
        if (sel.value) {
            if (sel.dataset.type === "company") {
                companyMapping[sel.dataset.linkedin] = sel.value;
            } else {
                mapping[sel.dataset.linkedin] = sel.value;
            }
        }
    });
    return { mapping, companyMapping };
}

document.addEventListener('DOMContentLoaded', async () => {
    const apiKeySection = document.getElementById('apiKeySection');
    const mainSection = document.getElementById('mainSection');
    const apiKeyInput = document.getElementById('apiKeyInput');
    const saveKeyBtn = document.getElementById('saveKeyBtn');
    const removeKeyBtn = document.getElementById('removeKeyBtn');
    const statusDiv = document.getElementById('status');

    // Check if API key is stored
    chrome.storage.local.get(['hubspotApiKey'], (result) => {
        if (result.hubspotApiKey) {
            apiKeySection.style.display = 'none';
            mainSection.style.display = '';
            statusDiv.textContent = 'API Key is set.';
            document.getElementById('mappingSection').style.display = '';
        } else {
            apiKeySection.style.display = '';
            mainSection.style.display = 'none';
            document.getElementById('mappingSection').style.display = 'none';
        }
    });
    saveKeyBtn.addEventListener('click', () => {
        const key = apiKeyInput.value.trim();
        if (key) {
            chrome.storage.local.set({ hubspotApiKey: key }, () => {
                apiKeySection.style.display = 'none';
                mainSection.style.display = '';
                statusDiv.textContent = 'API Key is already set.';
                // Reload all LinkedIn profile tabs
                chrome.tabs.query({ url: "*://www.linkedin.com/in/*" }, (tabs) => {
                    for (const tab of tabs) {
                        chrome.tabs.reload(tab.id);
                    }
                });
            });
        }
    });

    removeKeyBtn.addEventListener('click', () => {
        chrome.storage.local.remove('hubspotApiKey', () => {
            apiKeyInput.value = '';
            apiKeySection.style.display = '';
            mainSection.style.display = 'none';
            // Reload all LinkedIn profile tabs
            chrome.tabs.query({ url: "*://www.linkedin.com/in/*" }, (tabs) => {
                for (const tab of tabs) {
                    chrome.tabs.reload(tab.id);
                }
            });
        });
    });

    // Load and render mapping table
    chrome.storage.local.get(['linkedinToHubspotMapping', 'linkedinToHubspotCompanyMapping'], (result) => {
        renderMappingTable(result.linkedinToHubspotMapping || {}, result.linkedinToHubspotCompanyMapping || {});
    });

    // Save mapping on form submit
    document.getElementById('mappingForm').addEventListener('submit', (e) => {
        e.preventDefault();
        const { mapping, companyMapping } = getMappingFromForm();
        chrome.storage.local.set({
            linkedinToHubspotMapping: mapping,
            linkedinToHubspotCompanyMapping: companyMapping
        }, () => {
            alert('Mapping saved!');
        });
    });
});
