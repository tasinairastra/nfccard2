// script.js - Air Astra Contact Profile (Frontend Logic)

// ---------------------------------------------
// Step 1: Get token from URL query parameters
// ---------------------------------------------
const params = new URLSearchParams(window.location.search);
const token = params.get('token');
const profileCard = document.getElementById('profileCard'); // Target element to display profile

// Base URL for your Google Apps Script Web App deployment
// !! IMPORTANT !! Replace this with YOUR DEPLOYED APPS SCRIPT URL
const APPS_SCRIPT_BASE_URL = 'https://script.google.com/macros/s/AKfycbyLoun8XjsPCj-4CLd0vijSswdwiT5fdMtSz-RvOGzFZl25iuvNr8V8zuONLo6uuUYF2Q/exec';

// ---------------------------------------------
// Function to handle VCF download (called by the button's onclick)
// ---------------------------------------------
async function initiateVcfDownload(vcfApiEndpoint, fileName, buttonElement) {
    if (!buttonElement) return; // Guard against null element

    buttonElement.textContent = "Downloading...";
    buttonElement.disabled = true;

    try {
        const response = await fetch(vcfApiEndpoint);
        if (!response.ok) {
            throw new Error(`Failed to fetch VCF: ${response.status} ${response.statusText}`);
        }

        // Crucially, get the response as text, assuming it's VCF content
        const vcfText = await response.text();

        // Create a Blob from the VCF text
        const blob = new Blob([vcfText], { type: 'text/vcard;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        
        // Create a temporary link element
        const a = document.createElement('a');
        a.href = url;
        a.download = fileName; // Suggested filename
        document.body.appendChild(a); // Required for Firefox to click
        a.click(); // Programmatically click the link
        document.body.removeChild(a); // Clean up the link
        URL.revokeObjectURL(url); // Clean up the object URL

        buttonElement.textContent = "SAVE CONTACT";
        buttonElement.disabled = false;

    } catch (error) {
        console.error("Error downloading VCF:", error);
        alert("Failed to download contact. Please try again. Error: " + error.message);
        buttonElement.textContent = "SAVE CONTACT";
        buttonElement.disabled = false;
    }
}


// ---------------------------------------------
// Step 2: Handle missing token scenario
// ---------------------------------------------
if (!token) {
    profileCard.innerHTML = `
        <div class='loading-error-message'>
            <p>No token provided. Please ensure you have a valid link.</p>
        </div>
    `;
} else {
    // ---------------------------------------------
    // Step 3: Construct API URL for fetching employee data
    // ---------------------------------------------
    const apiURL = `${APPS_SCRIPT_BASE_URL}?token=${token}`;

    // ---------------------------------------------
    // Step 4: Fetch data from Google Apps Script
    // ---------------------------------------------
    fetch(apiURL)
        .then(res => {
            if (!res.ok) {
                throw new Error(`HTTP error! status: ${res.status}`);
            }
            return res.json();
        })
        .then(data => {
            if (!data || data.error) {
                profileCard.innerHTML = `
                    <div class='loading-error-message'>
                        <p>${data && data.error ? data.error : 'Profile not found or invalid token.'}</p>
                    </div>
                `;
                return;
            }

            // ---------------------------------------------
            // Step 5: Build profile layout dynamically
            // ---------------------------------------------

            const linkedInURL = data.linkedin && data.linkedin !== "#"
                                ? data.linkedin
                                : `https://www.linkedin.com/search/results/all/?keywords=${encodeURIComponent(data.fullName)}%20${encodeURIComponent(data.company || "Air Astra")}`;
            
            // This is the API endpoint to get the VCF *content*.
            const vcfApiEndpoint = `${APPS_SCRIPT_BASE_URL}?action=vcf&token=${token}`;
            const vcfFileName = `${data.fullName.replace(/\s/g, '_')}.vcf`;
            
            const companyName = data.company || "Air Astra"; 

            const mapURL = data.address ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(data.address)}` : '#';

            // Set the inner HTML of the profile card with all the dynamic data
            // IMPORTANT: The onclick now calls the global function 'initiateVcfDownload'
            profileCard.innerHTML = `
                <div class="profile-header">
                    <div class="profile-image-container">
                        <img src="${data.photoURL || 'https://via.placeholder.com/120/f0f0f0/333333?text=Profile'}" alt="Profile Picture" class="profile-image">
                    </div>
                    <div class="profile-info">
                        <h2>${data.fullName}</h2>
                        <p class="role">${data.designation || 'Staff'}</p>
                        <p class="company">${companyName}</p>
                    </div>
                </div>

                <a href="javascript:void(0)" onclick="initiateVcfDownload('${vcfApiEndpoint}', '${vcfFileName}', this)" class="save-contact-btn">SAVE CONTACT</a>

                <section class="contact-details">
                    ${data.email ? `<a href="mailto:${data.email}" class="contact-item">
                        <i class="fas fa-at icon"></i>
                        <span>${data.email}</span>
                        <i class="fas fa-chevron-right arrow"></i>
                    </a>` : ''}

                    ${data.phone ? `<a href="tel:${data.phone}" class="contact-item">
                        <i class="fas fa-phone-alt icon"></i>
                        <span>${data.phone} ${data.phoneLabel ? `(${data.phoneLabel})` : ''}</span>
                        <i class="fas fa-chevron-right arrow"></i>
                    </a>` : ''}

                    ${data.address ? `<a href="${mapURL}" target="_blank" class="contact-item">
                        <i class="fas fa-map-marker-alt icon"></i>
                        <span>${data.address}</span>
                        <i class="fas fa-chevron-right arrow"></i>
                    </a>` : ''}

                    <a href="${linkedInURL}" target="_blank" class="contact-item">
                        <i class="fab fa-linkedin icon"></i>
                        <span>LinkedIn Profile</span>
                        <i class="fas fa-chevron-right arrow"></i>
                    </a>
                </section>
            `;
        })
        .catch(err => {
            console.error("Error fetching profile:", err);
            profileCard.innerHTML = `
                <div class='loading-error-message'>
                    <p>Error loading profile. Please check your internet connection or try again later. (Details: ${err.message})</p>
                </div>
            `;
        });
}