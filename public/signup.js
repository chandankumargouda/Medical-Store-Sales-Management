
function signup(){
// Get elements once
let nameInput = document.getElementById("name");
let emailInput = document.getElementById("email");
let roleInput = document.getElementById("role");
let passwordInput = document.getElementById("password");
let confirmInput = document.getElementById("confirm");
let EnterBtn = document.getElementById("Enter");

EnterBtn.addEventListener("click", async (e) => {
    e.preventDefault(); // Prevents page reload

    // 1. Get the actual VALUES
    const name = nameInput.value;
    const email = emailInput.value;
    const role = roleInput.value;
    const password = passwordInput.value;
    const confirm = confirmInput.value;

    // 2. Validations
    if (!name || !email || !password || !role) {
        alert("Please fill all fields");
        return;
    }

    if (password.length < 6) {
        alert("Password must be at least 6 characters");
        return;
    }

    if (password !== confirm) {
        alert("Passwords do not match!");
        return;
    }

    // 3. Prepare Data
    
    try {
      const data = { name, email, password, role };
        // 4. Send to Server
        let response = await fetch("/signup", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(data),
        });

        let result = await response.text();

        if (response.ok) {
            alert("Signup Successful!");
            window.location.href = "/login.html"; // Redirect to login
        } else {
            alert("Error: " + result); // Shows "User already exists"
        }
    } catch (err) {
        console.error("Fetch error:", err);
        alert("Server is down. Try again later.");
    }
});
}