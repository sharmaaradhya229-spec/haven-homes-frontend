const isDashboard = window.location.pathname.includes("dashboard.html");
const isLogin = window.location.pathname.includes("index.html");
// ---------------- LOGOUT ----------------
function logout() {
  localStorage.removeItem("isLoggedIn");
  localStorage.removeItem("userEmail");
  window.location.href = "index.html";
}
const apiBase = "https://haven-homes-backend.onrender.com/api";

// ---------------- LOGIN (OTP) ----------------
const loginForm = document.getElementById("loginForm");
const loginMessage = document.getElementById("loginMessage");
let userEmail = "";

if (loginForm) {
  loginForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value.trim();

    try {
      const res = await fetch(`${apiBase}/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (res.ok && data.message === "OTP sent to your email") {
        loginMessage.style.color = "green";
        loginMessage.textContent = "OTP sent to your email. Please check.";
        userEmail = email;
        showOtpInput();
      } else {
        loginMessage.style.color = "red";
        loginMessage.textContent = data.message || "Login failed";
      }
    } catch (err) {
      loginMessage.style.color = "red";
      loginMessage.textContent = "Server error. Try again later.";
    }
  });
}

function showOtpInput() {
  const otpDiv = document.createElement("div");
  otpDiv.innerHTML = `
    <input type="text" id="otpInput" placeholder="Enter OTP" required>
    <button id="verifyOtpBtn">Verify OTP</button>
  `;
  loginForm.appendChild(otpDiv);

  document.getElementById("verifyOtpBtn").addEventListener("click", verifyOtp);
}

async function verifyOtp(e) {
  e.preventDefault();
  const otp = document.getElementById("otpInput").value.trim();

  try {
    const res = await fetch(`${apiBase}/verify-otp`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: userEmail, otp }),
    });

    const data = await res.json();

        if (res.ok && data.message === "Login successful") {
      // 🔐 mark user as logged in
      localStorage.setItem("isLoggedIn", "true");

      loginMessage.style.color = "green";
      loginMessage.textContent = "Login successful! Redirecting...";
      setTimeout(() => {
        window.location.href = "dashboard.html";
      }, 1500);
    } else {
      loginMessage.style.color = "red";
      loginMessage.textContent = data.message || "Invalid OTP";
    }

  } catch (err) {
    loginMessage.style.color = "red";
    loginMessage.textContent = "Server error during OTP verification.";
  }
}

// ---------------- UTILITY ----------------
function getStatusColor(status) {
  return status === "empty" ? "red" : status === "filled" ? "green" : "black";
}

function safeRent(rent) {
  return rent !== null && rent !== undefined && rent !== "" ? rent : 0;
}

function formatRent(rent) {
  rent = safeRent(rent);
  return rent ? `₹${rent}` : "₹0";
}

// ---------------- PROPERTY ANALYTICS ----------------
function updateAnalytics(houses) {
  // If analytics elements are not on this page (e.g., login page), do nothing
  const totalEl = document.getElementById("totalProperties");
  const filledEl = document.getElementById("filledProperties");
  const emptyEl = document.getElementById("emptyProperties");
  const avgRentEl = document.getElementById("averageRent");

  if (!totalEl || !filledEl || !emptyEl || !avgRentEl) return;

  const total = houses.length;
  const filled = houses.filter(h => h.status === "filled").length;
  const empty = houses.filter(h => h.status === "empty").length;

  const avgRent = houses.length
    ? Math.round(
        houses.reduce(
          (sum, h) => sum + Number(safeRent(h.rent_price)),
          0
        ) / houses.length
      )
    : 0;

  totalEl.innerText = total;
  filledEl.innerText = filled;
  emptyEl.innerText = empty;
  avgRentEl.innerText = "₹" + avgRent;
}

// ---------------- FETCH DATA ----------------
let housesFetchController = null;

async function fetchHouses(queryParams = {}) {
  if (housesFetchController) {
    try { housesFetchController.abort(); } catch (_) {}
  }
  housesFetchController = new AbortController();
  const signal = housesFetchController.signal;

  const container = document.getElementById("housesTableContainer");
  if (!container) return;
  container.innerHTML = "";

  try {
    let url = `${apiBase}/houses?`;

    if (queryParams.address) url += `address=${encodeURIComponent(queryParams.address)}&`;
    if (queryParams.status) url += `status=${queryParams.status}&`;
    if (queryParams.rent) url += `rent=${queryParams.rent}&`;
    if (queryParams.house_type) url += `house_type=${encodeURIComponent(queryParams.house_type)}&`;

    url = url.replace(/[&?]$/, "");

    const res = await fetch(url, { signal });
    if (!res.ok) return;

    const houses = await res.json();
    houses.sort((a, b) => Number(a.id) - Number(b.id));

    // 🔹 Update analytics based on the currently loaded/filtered houses
    updateAnalytics(houses);

    if (houses.length === 0) {
      container.innerHTML = `<p style="text-align:center; color:gray;">No results found</p>`;
      return;
    }

    // Create table
    const table = document.createElement("table");
    table.classList.add("houses-table");

    // Dynamic headers
    const thead = document.createElement("thead");
    const headerRow = document.createElement("tr");
    const headers = ["ID", "Address", "Status", "House Type", "Rent Price", "Actions"];
    headers.forEach(h => {
      const th = document.createElement("th");
      th.textContent = h;
      headerRow.appendChild(th);
    });
    thead.appendChild(headerRow);
    table.appendChild(thead);

    // Dynamic rows
    const tbody = document.createElement("tbody");
    houses.forEach(house => {
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${house.id}</td>
        <td>${house.address}</td>
        <td style="color:${getStatusColor(house.status)}">${house.status}</td>
        <td>${house.house_type || ""}</td>
        <td>${formatRent(house.rent_price)}</td>
        <td style="display:flex; gap:5px; flex-wrap:wrap;">
          <button onclick="window.open('https://www.google.com/maps/search/${encodeURIComponent(house.address)}', '_blank')">Map</button>
          <button onclick="viewHouseDetails(${house.id})">Details</button>
          <button onclick="deleteHouse(${house.id})">Delete</button>
        </td>
      `;
      tbody.appendChild(tr);
    });
    table.appendChild(tbody);

    container.appendChild(table);

  } catch (err) {
    if (err.name !== "AbortError") console.error(err);
  } finally {
    if (housesFetchController && housesFetchController.signal === signal)
      housesFetchController = null;
  }
}

// ---------------- FETCH RECENT HOUSES (CARDS) ----------------
async function fetchRecentHouses(limit = 4) {  // ✅ 4 cards
  const container = document.getElementById("recentHousesContainer");
  if (!container) return;
  container.innerHTML = "";

  try {
    const res = await fetch(`${apiBase}/houses`);
    if (!res.ok) return;
    const houses = await res.json();
    houses.sort((a, b) => Number(b.id) - Number(a.id)); // latest first
    const recent = houses.slice(0, limit);

    if (recent.length === 0) {
      container.innerHTML = `<p style="text-align:center; color:gray;">No recent properties</p>`;
      return;
    }

    // Create card layout
    recent.forEach(house => {
      const card = document.createElement("div");
      card.classList.add("property-card");
      card.innerHTML = `
        <h4>${house.address}</h4>
        <p>Status: <span style="color:${getStatusColor(house.status)}">${house.status}</span></p>
        <p>Type: ${house.house_type || ""}</p>
        <p>Rent: ${formatRent(house.rent_price)}</p>
        <div style="display:flex; gap:5px; flex-wrap:wrap;">
          <button onclick="window.open('https://www.google.com/maps/search/${encodeURIComponent(house.address)}', '_blank')">Map</button>
          <button onclick="viewHouseDetails(${house.id})">Details</button>
        </div>
      `;
      container.appendChild(card);
    });

  } catch (err) {
    console.error(err);
  }
}

// ---------------- ADVICE & TOOLS ----------------
function loadAdviceTools() {
  const container = document.getElementById("adviceToolsContainer");
  if (!container) return;

  container.innerHTML = ""; // clear previous content

  // Define tools (make sure file names match your HTML files exactly)
  const tools = [
    { name: "EMI Calculator", desc: "Calculate your monthly EMI for loans", link: "emi-calculator.html" },
    { name: "Home Loan Offers", desc: "Compare latest home loan rates", link: "home_loan_offers.html" },
    { name: "Interior Budget Estimator", desc: "Plan your interior design budget", link: "interior_budget.html" },
    { name: "Rates & Trends", desc: "Check property rates & market trends", link: "rates_trends.html" },
    { name: "Investment Hotspot", desc: "Discover best areas to invest", link: "investment_hotspot.html" }
  ];

  tools.forEach(tool => {
    const card = document.createElement("div");
    card.classList.add("advice-tool-card");
    card.innerHTML = `
      <h4>${tool.name}</h4>
      <p>${tool.desc}</p>
    `;
    // Make sure each card navigates to the correct page
    card.addEventListener("click", () => {
      window.location.href = tool.link;
    });
    container.appendChild(card);
  });
}

// ---------------- ADD HOUSE ----------------
const addHouseForm = document.getElementById("addHouseForm");
if (addHouseForm) {
  addHouseForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const houseAddress = document.getElementById("houseAddress").value.trim();
    const houseStatus = document.getElementById("houseStatus").value;
    const houseRent = document.getElementById("houseRent").value.trim();
    const houseType = document.getElementById("houseType").value.trim();
    const houseFurnished = document.getElementById("houseFurnished").value;
    const houseOwner = document.getElementById("houseOwner").value.trim();
    const houseArea = document.getElementById("houseArea").value.trim();

    try {
      const res = await fetch(`${apiBase}/add-house`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          address: houseAddress,
          status: houseStatus,
          rent_price: houseRent,
          house_type: houseType,
          furnished: houseFurnished,
          owner_name: houseOwner,
          area_sqft: houseArea
        }),
      });

      const data = await res.json();
      if (res.ok) {
        alert("House added successfully!");
        addHouseForm.reset();

        // 🔹 Refresh houses + recent cards
        fetchHouses();
        fetchRecentHouses();

        hideAllSections();
        document.getElementById("viewPropertySection").style.display = "block";
      } else {
        alert(data.message || "Failed to add house");
      }
    } catch (err) {
      console.error(err);
      alert("Server error while adding house");
    }
  });
}

// ---------------- FETCH TENANTS ----------------
async function fetchTenants() {
  const tbody = document.querySelector("#tenantsTable tbody");
  if (!tbody) return;
  tbody.innerHTML = "";

  try {
    const res = await fetch(`${apiBase}/tenants`);
    if (!res.ok) return;
    const tenants = await res.json();
    tenants.sort((a, b) => Number(a.id) - Number(b.id));

    tenants.forEach((tenant) => {
      const row = document.createElement("tr");
      row.innerHTML = `
        <td>${tenant.id}</td>
        <td>${tenant.name}</td>
        <td>${tenant.contract_end}</td>
        <td>${tenant.house_id}</td>
        <td>${tenant.address || ""}</td>
        <td>
          <button onclick="showEditTenantForm(${tenant.id}, '${tenant.name}', ${tenant.house_id}, '${tenant.contract_end}')">Edit</button>
          <button onclick="deleteTenant(${tenant.id})">Delete</button>
        </td>
      `;
      tbody.appendChild(row);
    });
  } catch (err) {
    console.error(err);
  }
}

// ---------------- ADVANCED SEARCH FILTER ----------------
const applyFiltersBtn = document.getElementById("applyFilters");
if (applyFiltersBtn) {
  applyFiltersBtn.addEventListener("click", () => {
    const address = document.getElementById("filterAddress").value.trim();

    let status = document.getElementById("filterStatus").value;
    if (status === "All") status = "";

    let houseType = document.getElementById("filterHouseType").value;
    if (houseType === "All") houseType = "";

    let rent = document.getElementById("filterRent").value;
    if (rent === "All") rent = "";

    fetchHouses({ address, status, house_type: houseType, rent });
  });
}

// ---------------- NAV BUTTONS LOGIC ----------------
const viewPropBtn = document.getElementById("viewPropertyBtn");
const addPropBtn = document.getElementById("addPropertyBtn");
const viewTenantBtn = document.getElementById("viewTenantsBtn");
const addTenantBtn = document.getElementById("addTenantsBtn");
const helpBtn = document.getElementById("helpBtn");

const viewPropertySection = document.getElementById("viewPropertySection");
const addPropertySection = document.getElementById("addPropertySection");
const viewTenantSection = document.getElementById("viewTenantSection");
const addTenantSection = document.getElementById("addTenantSection");
const helpSection = document.getElementById("helpSection");
const contactSection = document.getElementById("contactSection");

function hideAllSections() {
  viewPropertySection.style.display = "none";
  addPropertySection.style.display = "none";
  viewTenantSection.style.display = "none";
  addTenantSection.style.display = "none";
  if (helpSection) helpSection.style.display = "none";
  if (contactSection) contactSection.style.display = "none";
}

viewPropBtn.addEventListener("click", () => {
  hideAllSections();
  viewPropertySection.style.display = "block";
  fetchRecentHouses();
  fetchHouses();
});

addPropBtn.addEventListener("click", () => {
  hideAllSections();
  addPropertySection.style.display = "block";
});

viewTenantBtn.addEventListener("click", () => {
  hideAllSections();
  viewTenantSection.style.display = "block";
  fetchTenants();
});

addTenantBtn.addEventListener("click", () => {
  hideAllSections();
  addTenantSection.style.display = "block";
});

if (helpBtn) {
  helpBtn.addEventListener("click", () => {
    hideAllSections();
    if (helpSection) helpSection.style.display = "block";
  });
}

// ---------------- EDIT/DELETE HOUSES & TENANTS ----------------
function showEditHouseForm(id, address, status, rent_price, house_type, furnished, owner_name, area_sqft) {
  const form = document.getElementById("editHouseForm");
  form.style.display = "block";
  document.getElementById("editHouseId").value = id;
  document.getElementById("editHouseAddress").value = address;
  document.getElementById("editHouseStatus").value = status;
  document.getElementById("editHouseRent").value = rent_price;
  document.getElementById("editHouseType").value = house_type;
  document.getElementById("editHouseFurnished").value = furnished;
  document.getElementById("editHouseOwner").value = owner_name;
  document.getElementById("editHouseArea").value = area_sqft;
}

async function deleteHouse(id) {
  if (!confirm("Delete this house?")) return;
  try {
    const res = await fetch(`${apiBase}/delete-house/${id}`, { method: "DELETE" });
    if (!res.ok) throw new Error("Delete house failed");
    await res.json();
    fetchHouses();
    fetchRecentHouses();
  } catch (err) { console.error(err); }
}

function viewHouseDetails(id) {
  window.location.href = `house_details.html?id=${id}`;
}

function showEditTenantForm(id, name, house_id, contract_end) {
  const form = document.getElementById("editTenantForm");
  form.style.display = "block";
  document.getElementById("editTenantId").value = id;
  document.getElementById("editTenantName").value = name;
  document.getElementById("editTenantHouse").value = house_id;
  document.getElementById("editTenantContractEnd").value = contract_end;
}

async function deleteTenant(id) {
  if (!confirm("Delete this tenant?")) return;
  try {
    const res = await fetch(`${apiBase}/delete-tenant/${id}`, { method: "DELETE" });
    if (!res.ok) throw new Error("Delete tenant failed");
    await res.json();
    fetchTenants();
  } catch (err) { console.error(err); }
}

// ---------------- CONTACT FORM ----------------
const contactBtn = document.getElementById("contactUsBtn");
const contactForm = document.getElementById("contactForm");
const contactResponse = document.getElementById("contactResponse");

if (contactBtn && contactSection) {
  contactBtn.addEventListener("click", () => {
    hideAllSections();
    contactSection.style.display = "block";
  });
}

if (contactForm) {
  contactForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const name = document.getElementById("contactName").value.trim();
    const email = document.getElementById("contactEmail").value.trim();
    const subject = document.getElementById("contactSubject").value.trim();
    const message = document.getElementById("contactMessage").value.trim();

    try {
      const res = await fetch(`${apiBase}/contact`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, subject, message }),
      });
      if (!res.ok) throw new Error("Message failed to send");
      await res.json();
      contactResponse.textContent = "Message sent successfully!";
      contactForm.reset();
    } catch (err) {
      console.error(err);
      contactResponse.textContent = "Failed to send message. Try again later.";
    }
  });
}

// ---------------- INITIAL LOAD ----------------
if (isDashboard) {
  if (!localStorage.getItem("isLoggedIn")) {
    window.location.replace("index.html");
  } else {
    hideAllSections();
    if (viewPropertySection) {
      viewPropertySection.style.display = "block";
      fetchRecentHouses();
      fetchHouses();
      loadAdviceTools();
    }
  }
}


// ---------------- PWA: SERVICE WORKER REGISTRATION ----------------
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker
      .register("service-worker.js")
      .then((reg) => {
        console.log("Service Worker registered:", reg.scope);
      })
      .catch((err) => {
        console.log("Service Worker registration failed:", err);
      });
  });
}
