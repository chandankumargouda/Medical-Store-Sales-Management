async function saveMedicine() {
  // 1. MOVE THIS INSIDE: Get the current ID from the hidden input
  const editId = document.getElementById("edit-id").value;

  let nameMed = document.getElementById("name").value;
  let price = parseFloat(document.getElementById("price").value);
  let gst = parseFloat(document.getElementById("gst").value);
  let discount = parseFloat(document.getElementById("discount").value);
  let expiry = document.getElementById("expiry").value;
  let quantity = parseFloat(document.getElementById("quantity").value);

  // Calculations
  let gstAmount = price * (gst / 100);
  let finalPrice = (price + gstAmount) - ((price + gstAmount) * (discount / 100));

  const data = { nameMed, price, gst, discount, expiry, actualPrice: finalPrice, quantity };

  const method = editId ? "PUT" : "POST";
  const url = editId ? `/update-medicine/${editId}` : "/admin";

  try {
    let res = await fetch(url, {
      method: method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    if (res.ok) {
      alert(editId ? "Medicine Updated!" : "Medicine Added!");

      if (!editId) {
        // CASE: NEW MEDICINE
        const savedMed = await res.json();
        addTableRow(savedMed); 
      } else {
        // CASE: UPDATED MEDICINE
        // Instead of manual DOM manipulation, refresh the whole list 
        // to show the updated calculations and values.
        loadMedicines(); 
      }
      
      cancelEdit(); // Always clear form and reset buttons after success
    } else {
      alert("Action failed.");
    }
  } catch (err) {
    console.error("Fetch error:", err);
  }
}

// Helper function to keep  code clean
function addTableRow(med) {
  let row = `
    <tr>
      <td>${med.nameMed}</td>
      <td>${med.price}</td>
      <td>${med.gst}%</td>
      <td>${med.discount}%</td>
      <td>${med.actualPrice.toFixed(2)}</td>
      <td>${med.expiry}</td>
      <td>${med.quantity}</td>
      <td><button onclick="editMed(this, '${med._id}')">Edit</button></td>
      <td><button onclick="deleteMed(this, '${med._id}')">Delete</button></td>
    </tr>
  `;
  document.getElementById("tableBody").innerHTML += row;
}
function editMed(btn, id) {
  // 1. Get row data
  let row = btn.parentElement.parentElement;
  
  // 2. Fill the visible inputs
  document.getElementById("name").value = row.children[0].innerText;
  document.getElementById("price").value = row.children[1].innerText;
  document.getElementById("gst").value = row.children[2].innerText.replace('%', '');
  document.getElementById("discount").value = row.children[3].innerText.replace('%', '');
  document.getElementById("expiry").value = row.children[5].innerText;
  document.getElementById("quantity").value = row.children[6].innerText;
  // 3. Fill the HIDDEN input
  document.getElementById("edit-id").value = id;

  // 4. Update the UI
  document.getElementById("submitBtn").innerText = "Update Medicine";
  document.getElementById("cancelBtn").style.display = "inline"; // Show cancel button

  // 5. Scroll up so the Admin sees the form is filled
  window.scrollTo(0, 0);
}
function cancelEdit() {
  document.getElementById("edit-id").value = "";
  document.getElementById("name").value = "";
  document.getElementById("price").value = "";
  document.getElementById("gst").value = "";
  document.getElementById("discount").value = "";
  document.getElementById("expiry").value = "";
  document.getElementById("quantity").value = "";
  
  document.getElementById("submitBtn").innerText = "Save Medicine";
  document.getElementById("cancelBtn").style.display = "none";
}
async function deleteMed(btn, id) {
  // 1. Ask for confirmation (Safety first!)
  if (!confirm("Are you sure you want to delete this medicine?")) return;

  try {
    // 2. Tell the server to delete it from DB
    const response = await fetch(`/delete-medicine/${id}`, {
      method: "DELETE",
    });

    const result = await response.json();

    if (result.success) {
      // 3. ONLY remove from screen if DB deletion worked
      let row = btn.parentElement.parentElement;
      row.remove();
      alert("Deleted successfully from database!");
    } else {
      alert("Error: " + result.message);
    }
  } catch (err) {
    console.error(err);
    alert("Could not connect to server to delete.");
  }
}

function logout() {
  localStorage.removeItem("userId"); // Clear the session
  window.location.href = "/login.html";
}
// Function to fetch data from the server and display it
async function loadMedicines() {
  try {
    const res = await fetch("/get-medicines");
    const medicines = await res.json();
    
    // Clear the table first (except the header)
    document.getElementById("tableBody").innerHTML = "";

    // Loop through the database results and add them to the table
    medicines.forEach(med => {
      addTableRow(med);
    });
  } catch (err) {
    console.error("Failed to load medicines:", err);
  }
}

// this function automatically when the page loads
window.onload = loadMedicines;
