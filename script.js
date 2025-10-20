// ---------------------------------------------
// script.js - Air Astra Contact Profile Logic
// ---------------------------------------------

// 1️⃣ Get token from URL parameters
const params = new URLSearchParams(window.location.search);
const token = params.get("token");
const profileCard = document.getElementById("profileCard");

// Your deployed Apps Script endpoint (replace if needed)
const APPS_SCRIPT_BASE_URL = "https://script.google.com/macros/s/AKfycbyLoun8XjsPCj-4CLd0vijSswdwiT5fdMtSz-RvOGzFZl25iuvNr8V8zuONLo6uuUYF2Q/exec";

// 2️⃣ Handle missing token
if (!token) {
  profileCard.innerHTML = `<div class="loading-error-message"><p>No token provided.</p></div>`;
} else {
  // 3️⃣ Construct API URL to fetch employee profile
  const apiURL = `${APPS_SCRIPT_BASE_URL}?token=${token}`;

  fetch(apiURL)
    .then((res) => {
      if (!res.ok) throw new Error(`HTTP error ${res.status}`);
      return res.json();
    })
    .then((data) => {
      if (!data || data.error) {
        profileCard.innerHTML = `<div class="loading-error-message"><p>${data?.error || "Profile not found."}</p></div>`;
        return;
      }

      // ✅ Prepare VCF download link
      const vcfApiEndpoint = `${APPS_SCRIPT_BASE_URL}?action=vcf&token=${token}`;
      const vcfFileName = `${data.fullName.replace(/\s/g, "_")}.vcf`;

      // ✅ Fixed map link (Air Astra office)
      const mapURL = "https://maps.app.goo.gl/3CSgr4UpEvvDdzsC9";

      // ✅ LinkedIn fallback (auto search if missing)
      const linkedInURL =
        data.linkedin && data.linkedin !== "#"
          ? data.linkedin
          : `https://www.linkedin.com/search/results/all/?keywords=${encodeURIComponent(data.fullName)}%20Air%20Astra`;

      // ✅ Build the HTML structure dynamically
      profileCard.innerHTML = `
        <div class="profile-header">
          <div class="profile-image-container">
            <img src="${data.photoURL || 'https://via.placeholder.com/120'}" alt="Profile Picture" class="profile-image" />
          </div>
          <div class="profile-info">
            <h2>${data.fullName}</h2>
            <p class="role">${data.designation || 'Staff'}</p>
            <p class="company">Air Astra</p>
          </div>
        </div>

        <a href="javascript:void(0)" onclick="initiateVcfDownload('${vcfApiEndpoint}', '${vcfFileName}', this)" class="save-contact-btn">SAVE CONTACT</a>

        <section class="contact-details">
          ${data.email ? `
          <a href="mailto:${data.email}" class="contact-item">
            <i class="fas fa-at icon"></i>
            <span>${data.email}</span>
            <i class="fas fa-chevron-right arrow"></i>
          </a>` : ''}

          ${data.phone ? `
          <a href="tel:${data.phone}" class="contact-item">
            <i class="fas fa-phone-alt icon"></i>
            <span>${data.phone}</span>
            <i class="fas fa-chevron-right arrow"></i>
          </a>` : ''}

          <a href="${mapURL}" target="_blank" class="contact-item">
            <i class="fas fa-map-marker-alt icon"></i>
            <span>Air Astra Office, Dhaka</span>
            <i class="fas fa-chevron-right arrow"></i>
          </a>

          <a href="${linkedInURL}" target="_blank" class="contact-item">
            <i class="fab fa-linkedin icon"></i>
            <span>LinkedIn Profile</span>
            <i class="fas fa-chevron-right arrow"></i>
          </a>
        </section>
      `;
    })
    .catch((err) => {
      console.error("Error fetching profile:", err);
      profileCard.innerHTML = `<div class="loading-error-message"><p>Could not load profile. (${err.message})</p></div>`;
    });
}

// 4️⃣ Function to download and save VCF file
async function initiateVcfDownload(vcfApiEndpoint, fileName, buttonElement) {
  if (!buttonElement) return;

  buttonElement.textContent = "Downloading...";
  buttonElement.disabled = true;

  try {
    // Fetch the VCF file as plain text
    const response = await fetch(vcfApiEndpoint);

    if (!response.ok) throw new Error(`Failed: ${response.statusText}`);

    const vcfText = await response.text();

    console.log(vcfText);
        /////////////////////////////////////////////////////////////////////////////// Vcard json to vcard

    // Convert JSON string to object
    const userData = JSON.parse(vcfText);

    function generateVCard(data) {
    const vCard = 
`BEGIN:VCARD
VERSION:3.0
FN:${data.fullName || ""}
ORG:Air Astra
TITLE:${data.designation || ""}
TEL;TYPE=CELL:${data.phone || ""}
EMAIL;TYPE=WORK:${data.email || ""}
END:VCARD`;

    return vCard;
}




    const vCardText = generateVCard(userData);
    //////////////////////////////////////////////////////////////////////////////////////////

    // Create and download the .vcf file
    const blob = new Blob([vCardText], { type: "text/vcard;charset=utf-8" });
    const url = URL.createObjectURL(blob);


    const a = document.createElement("a");
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);


    URL.revokeObjectURL(url);
    buttonElement.textContent = "SAVE CONTACT";
    buttonElement.disabled = false;
  } catch (error) {
    console.error("VCF Download Error:", error);
    alert("Failed to save contact. " + error.message);
    buttonElement.textContent = "SAVE CONTACT";
    buttonElement.disabled = false;
  }
}

