chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === 'sendToHubSpot') {
        console.log('[Background.js] Received profile data:', message.profileData);

        chrome.storage.local.get(['hubspotApiKey'], (result) => {
            const hubspotApiKey = result.hubspotApiKey;
            if (!hubspotApiKey) {
                sendResponse({ success: false, error: 'HubSpot API key not set.' });
                return;
            }
            const headers = {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${hubspotApiKey}`
            };

            (async () => {
                try {
                    const contactResponse = await fetch('https://api.hubapi.com/crm/v3/objects/contacts', {
                        method: 'POST',
                        headers,
                        body: JSON.stringify({properties: message.profileData })
                    });

                    const data = await contactResponse.json();
                    console.log('[Background.js] HubSpot Response:', data);

                    if (contactResponse.ok) {
                        sendResponse({ success: true });
                    } else {
                        sendResponse({ success: false, error: data.message || 'Unknown error' });
                    }
                    const contactId = data.id;
                    console.log('[Background.js] Created contact:', contactId);

                    // Step 2: Search/Create Company
                    const companyId = await searchOrCreateCompany(message.companyDetails, hubspotApiKey);
                    console.log('[Background.js] Company ID:', companyId);

                    if (companyId) {
                        // Step 3: Associate Contact ⇄ Company
                        const associationResponse = await fetch(`https://api.hubapi.com/crm/v3/objects/contacts/${contactId}/associations/companies/${companyId}/contact_to_company`, {
                            method: 'PUT',
                            headers
                        });

                        if (!associationResponse.ok) {
                            throw new Error(`Association failed: ${associationResponse.statusText}`);
                        }

                        console.log('[Background.js] Associated contact with company.');
                    } else {
                        console.log('[Background.js] Company not found or created; skipping association.');
                    }

                } catch (error) {
                    console.error('[Background.js] Error sending data to HubSpot:', error);
                    sendResponse({ success: false, error: error.message });
                }
            })();

        });

        return true; // NOW this is meaningful because the listener itself is NOT async
    } else if (message.action === 'checkContactByLinkedinUsername') {
        chrome.storage.local.get(['hubspotApiKey'], async (result) => {
            const hubspotApiKey = result.hubspotApiKey;
            if (!hubspotApiKey) {
                sendResponse({ found: false });
                return;
            }
            const headers = {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${hubspotApiKey}`
            };
            const username = message.username;
            if (!username) {
                sendResponse({ found: false });
                return;
            }
            const query = {
                filterGroups: [{
                    filters: [{
                        propertyName: 'hs_linkedin_url',
                        operator: 'CONTAINS_TOKEN',
                        value: username
                    }]
                }],
                properties: ['hs_linkedin_url']
            };
            try {
                const resp = await fetch('https://api.hubapi.com/crm/v3/objects/contacts/search', {
                    method: 'POST',
                    headers,
                    body: JSON.stringify(query)
                });
                if (!resp.ok) {
                    sendResponse({ found: false });
                    return;
                }
                const data = await resp.json();
                const found = (data.results && data.results.some(
                    contact =>
                        contact.properties &&
                        contact.properties.hs_linkedin_url &&
                        contact.properties.hs_linkedin_url.includes(username)
                ));
                sendResponse({ found });
            } catch (e) {
                sendResponse({ found: false });
            }
        });
        return true;
    }
});

async function searchOrCreateCompany(companyDetails, hubspotApiKey) {
    console.log('[Background.js] Searching or creating company with details:', companyDetails);
    const headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${hubspotApiKey}`
    };

    let companyId = null;

    try {
        if (companyDetails.companyPageLink) {
            const query = {
                filterGroups: [{
                    filters: [{
                        propertyName: 'linkedin_company_page',
                        operator: 'EQ',
                        value: companyDetails.companyPageLink
                    }]
                }],
                properties: ['name']
            };

            const searchResponse = await fetch('https://api.hubapi.com/crm/v3/objects/companies/search', {
                method: 'POST',
                headers,
                body: JSON.stringify(query)
            });

            if (!searchResponse.ok) {
                const errorBody = await searchResponse.json();
                throw new Error(`Search failed for linkedin_company_page: ${searchResponse.statusText}, Response: ${JSON.stringify(errorBody)}`);
            }

            const searchResult = await searchResponse.json();
            if (searchResult.results && searchResult.results.length > 0) {
                companyId = searchResult.results[0].id;
                console.log('[Background.js] Company found using linkedin_company_page:', companyId);
            }
        }

        if (!companyId && companyDetails.companyName) {
            const query = {
                filterGroups: [{
                    filters: [{
                        propertyName: 'name',
                        operator: 'EQ',
                        value: companyDetails.companyName
                    }]
                }],
                properties: ['name']
            };

            const searchResponse = await fetch('https://api.hubapi.com/crm/v3/objects/companies/search', {
                method: 'POST',
                headers,
                body: JSON.stringify(query)
            });

            if (!searchResponse.ok) {
                const errorBody = await searchResponse.json();
                throw new Error(`Search failed for companyName: ${searchResponse.statusText}, Response: ${JSON.stringify(errorBody)}`);
            }

            const searchResult = await searchResponse.json();
            if (searchResult.results && searchResult.results.length > 0) {
                companyId = searchResult.results[0].id;
                console.log('[Background.js] Company found using companyName:', companyId);
            }
        }

        if (!companyId) {

            const createResponse = await fetch('https://api.hubapi.com/crm/v3/objects/companies', {
                method: 'POST',
                headers,
                body: JSON.stringify({properties: companyDetails })
            });

            if (!createResponse.ok) {
                const errorBody = await createResponse.json();
                throw new Error(`Company creation failed: ${createResponse.statusText}, Response: ${JSON.stringify(errorBody)}`);
            }

            const createResult = await createResponse.json();
            companyId = createResult.id;
            console.log('[Background.js] Created new company:', companyId);
        }
    } catch (error) {
        console.error('[Background.js] Error in searchOrCreateCompany:', error);
    }

    return companyId;
}
