const apiBase = "https://haven-homes-backend.onrender.com/api";

const requestOtpForm = document.getElementById("requestOtpForm");
const verifyOtpForm = document.getElementById("verifyOtpForm");
const resetPasswordForm = document.getElementById("resetPasswordForm");
const resetMessage = document.getElementById("resetMessage");

let userEmail = "";

requestOtpForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  userEmail = document.getElementById("resetEmail").value;

  const res = await fetch(`${apiBase}/forgot-password`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: userEmail }),
  });

  const data = await res.json();
  resetMessage.textContent = data.message;

  if (res.ok) {
    requestOtpForm.style.display = "none";
    verifyOtpForm.style.display = "block";
  }
});

verifyOtpForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const otp = document.getElementById("otp").value;

  const res = await fetch(`${apiBase}/verify-otp`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: userEmail, otp }),
  });

  const data = await res.json();
  resetMessage.textContent = data.message;

  if (res.ok) {
    verifyOtpForm.style.display = "none";
    resetPasswordForm.style.display = "block";
  }
});

resetPasswordForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const newPassword = document.getElementById("newPassword").value;

  const res = await fetch(`${apiBase}/reset-password`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: userEmail, new_password: newPassword }),
  });

  const data = await res.json();
  resetMessage.textContent = data.message;

  if (res.ok) {
    setTimeout(() => {
      window.location.href = "index.html"; // go back to login
    }, 2000);
  }
});
