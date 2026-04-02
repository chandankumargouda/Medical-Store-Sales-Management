let emailInput = document.getElementById("emails");
let passwordInput = document.getElementById("password");
let EnterBtn = document.getElementById("Enter");
let toggleBtn = document.getElementById("togglePassword");

function login(e) {
  if (!EnterBtn) return;
if(e) e.preventDefault(); // Stop the page from refreshing
  EnterBtn.addEventListener("click", async (e) => {
    e.preventDefault();

    const email = emailInput.value.trim();
    const password = passwordInput.value.trim();

    if (email === "" || password === "" || password.length < 6) {
      alert("Please check your inputs (Password min 6 chars)");
      return;
    }

    try {
      let res = await fetch("/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const result = await res.json();

      if (result.success) {
   
    localStorage.setItem("userId", result.id); 
    
    if (result.role === "admin") {
        window.location.href = "/admin.html";
    }else{
      window.location.href = "/operator.html";
    }
} else {
        alert("If You Don't Create a account then Create one then login...");
      }
    } catch (err) {
      alert("Server connection failed");
    }
  });
}


// 3. Password Toggle Logic
if (toggleBtn) {
  toggleBtn.addEventListener("click", () => {
    passwordInput.type =
      passwordInput.type === "password" ? "text" : "password";
  });
}


