const loginForm = document.getElementById('loginForm');
const loginMessage = document.getElementById('loginMessage');
const signupForm = document.getElementById('signupForm');
const showSignupBtn = document.getElementById('showSignup');
const showLoginBtn = document.getElementById('showLogin');

const API = "https://haven-homes-backend.onrender.com/api";

/* ---------------- LOGIN FORM ---------------- */
if (loginForm) {
  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value.trim();

    if (!email || !password) {
      loginMessage.textContent = "Please fill both fields";
      loginMessage.style.color = "red";
      return;
    }

    try {
      const res = await fetch(`${API}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      const data = await res.json();

      if (res.status === 200) {
        loginMessage.style.color = "green";
        loginMessage.textContent = data.message;

        localStorage.setItem("isLoggedIn", "true");
        localStorage.setItem("userEmail", email);

        setTimeout(() => {
          window.location.href = "dashboard.html";
        }, 500);
      } else {
        loginMessage.style.color = "red";
        loginMessage.textContent = data.message || "Login failed";
      }

    } catch (err) {
      loginMessage.style.color = "red";
      loginMessage.textContent = "Server error. Try again!";
    }
  });
}

/* ---------------- SHOW SIGNUP FORM ---------------- */
if (showSignupBtn) {
  showSignupBtn.addEventListener('click', () => {
    document.getElementById('loginForm').style.display = "none";
    document.getElementById('loginMessage').style.display = "none";
    document.getElementById('signupContainer').style.display = "block";
  });
}

/* ---------------- SHOW LOGIN FORM AGAIN ---------------- */
if (showLoginBtn) {
  showLoginBtn.addEventListener('click', () => {
    document.getElementById('signupContainer').style.display = "none";
    document.getElementById('loginForm').style.display = "block";
    document.getElementById('loginMessage').style.display = "block";
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
      const res = await fetch('http://127.0.0.1:5000/api/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password, mobile, role })
      });

      const data = await res.json();

      if (res.status === 201) {
        alert("Signup successful! Please login.");
        document.getElementById('signupContainer').style.display = "none";
        document.getElementById('loginForm').style.display = "block";
        document.getElementById('loginMessage').style.display = "block";
      } else {
        alert(data.message);
      }

    } catch (err) {
      console.error(err);
      alert("Server error. Try again!");
    }
  });
}
