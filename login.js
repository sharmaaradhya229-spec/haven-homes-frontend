const loginForm = document.getElementById('loginForm');
const loginMessage = document.getElementById('loginMessage');
const signupForm = document.getElementById('signupForm');
const showSignupBtn = document.getElementById('showSignup');
const showLoginBtn = document.getElementById('showLogin');

const API = "https://haven-homes-backend.onrender.com/api";

/* ---------------- SHOW SIGNUP FORM ---------------- */
if (showSignupBtn) {
  showSignupBtn.addEventListener('click', () => {
    loginForm.style.display = "none";
    loginMessage.style.display = "none";
    document.getElementById('signupContainer').style.display = "block";
  });
}

/* ---------------- SHOW LOGIN FORM AGAIN ---------------- */
if (showLoginBtn) {
  showLoginBtn.addEventListener('click', () => {
    document.getElementById('signupContainer').style.display = "none";
    loginForm.style.display = "block";
    loginMessage.style.display = "block";
  });
}

/* ---------------- SIGNUP FORM ---------------- */
if (signupForm) {
  signupForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const name = document.getElementById('signupName').value.trim();
    const email = document.getElementById('signupEmail').value.trim();
    const password = document.getElementById('signupPassword').value.trim();
    const mobile = document.getElementById('signupMobile').value.trim();
    const role = document.getElementById('signupRole').value;

    if (!name || !email || !password || !mobile || !role) {
      alert("Please fill all fields!");
      return;
    }

    try {
      const res = await fetch(`${API}/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password, mobile, role })
      });

      const data = await res.json();

      if (res.status === 201) {
        alert("Signup successful! Please login.");

        document.getElementById('signupContainer').style.display = "none";
        loginForm.style.display = "block";
        loginMessage.style.display = "block";
        signupForm.reset();
      } else {
        alert(data.message || "Signup failed");
      }

    } catch (err) {
      console.error(err);
      alert("Server error. Try again!");
    }
  });
}
