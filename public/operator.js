let medicinesData = [];
let cartData = JSON.parse(localStorage.getItem("cart")) || [];

// Load medicines
async function loadOperatorData() {
  try {
    const response = await fetch("/api/operator/medicines");
    const data = await response.json();

    medicinesData = data; // store globally

    const tableBody = document.getElementById("operatorTableBody");
    tableBody.innerHTML = "";

    data.forEach(med => {
      let row = `
        <tr>
          <td class="medicine">${med.nameMed}</td>
          <td>${med.price}</td>
          <td>${med.gst}%</td>
          <td>${med.discount}%</td>
          <td>${med.actualPrice.toFixed(2)}</td>
          <td>${med.expiry}</td>
          <td style="color: ${med.quantity < 5 ? 'red' : 'black'}">
            ${med.quantity}
          </td>
        </tr>
      `;
      tableBody.innerHTML += row;
    });

  } catch (error) {
    console.error("Error:", error);
  }
}
function searchMedicine() {
  let input = document.getElementById("medName").value.toLowerCase();
  let rows = document.querySelectorAll("#operatorTableBody tr");

  rows.forEach(row => {
    let medicineName = row.querySelector(".medicine").innerText.toLowerCase();

    if (medicineName.includes(input)) {
      row.style.display = "";
    } else {
      row.style.display = "none";
    }
  });
}

async function addToCart() {
  // 1. Fetch Latest Data & Find Medicine
  const response = await fetch("/api/operator/medicines");
  const medicinesData = await response.json();

  let nameInput = document.getElementById("medName").value.toLowerCase();
  let qty = parseInt(document.getElementById("qty").value);

  if (!nameInput || !qty) {
    alert("Enter valid details");
    return;
  }

  let med = medicinesData.find(m => m.nameMed.toLowerCase() === nameInput);

  if (!med) {
    alert("Medicine not found");
    return;
  }

  // 2. Validation Checks
  if (new Date(med.expiry) < new Date()) {
    alert("Medicine expired!");
    return;
  }

  if (qty > med.quantity) {
    alert("Not enough stock!");
    return;
  }

  // 3. UI Update: Add Row to Table
  let price = med.actualPrice;
  let itemTotal = price * qty;
  let row = document.createElement("tr");

  row.innerHTML = `
    <td>${med.nameMed}</td>
    <td>${price.toFixed(2)}</td>
    <td class="qty">${qty}</td>
    <td>${med.expiry}</td>
    <td class="total">${itemTotal.toFixed(2)}</td>
    <td>
      <button onclick="editRow(this, ${price}, ${med.quantity})">Edit</button>
      <button onclick="deleteRow(this)">Delete</button>
    </td>
  `;
  document.getElementById("saleBody").appendChild(row);

  // 4. Calculate Grand Total AFTER adding the row
  const currentGrandTotal = updateGrandTotal(); 

  // 5. Send to Server (Now currentGrandTotal is accurate!)
  try {
    const sale = { 
      name: med.nameMed,
      price: price, 
      qty: qty,
      expiry: med.expiry,
      totalSale: price * qty 
    };

    let saleRes = await fetch("/sale", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(sale),
    });

    if (!saleRes.ok) throw new Error("Server failed to save sale");
  } catch (err) {
    console.error("Fetch error:", err);
    alert("Data saved locally but server update failed.");
  }

  // 6. Local Storage Sync
  let cartData = JSON.parse(localStorage.getItem("cart")) || [];
  let existing = cartData.find(item => item.name === med.nameMed);
  if (existing) {
    existing.qty += qty;
  } else {
    cartData.push({ 
  name: med.nameMed, 
  price, 
  qty, 
  expiry: med.expiry,
  stock: med.quantity   // ✔️ correct place
});
  }
  localStorage.setItem("cart", JSON.stringify(cartData));

  // 7. Cleanup
  document.getElementById("medName").value = "";
  document.getElementById("qty").value = "";
}
// Edit quantity
function editRow(btn, price, stock) {
  let row = btn.parentElement.parentElement;

  let name = row.cells[0].innerText;

  let qtyCell = row.querySelector(".qty");
  let totalCell = row.querySelector(".total");

  let newQty = prompt("Enter new quantity:");

  if (!newQty || isNaN(newQty)) return;

  newQty = parseInt(newQty);

  qtyCell.innerText = newQty;

  let isValid = newQty <= stock;
  let newTotal = isValid ? price * newQty : 0;

  totalCell.innerText = isValid ? newTotal.toFixed(2) : "Invalid Qty";
  row.style.color = isValid ? "black" : "red";

  //  Update localStorage
  cartData = cartData.map(item => {
    if (item.name === name) {
      item.qty = newQty;
    }
    return item;
  });

  localStorage.setItem("cart", JSON.stringify(cartData));

  updateGrandTotal();
}
function updateGrandTotal() {
  let totals = document.querySelectorAll(".total");
  let grandTotal = 0;

  totals.forEach(t => {
    let value = parseFloat(t.innerText);
    if (!isNaN(value)) {
      grandTotal += value;
    }
  });

 document.getElementById("totalText").innerText =
  `Grand Total: ₹ ${grandTotal.toFixed(2)}`;
    
  return grandTotal; // Return the number so other functions can use it!
}
function loadCart() {
  let cartBody = document.getElementById("saleBody");
  cartBody.innerHTML = "";

  cartData.forEach(item => {

    let isValid = item.qty <= item.stock;
    let total = isValid ? item.price * item.qty : 0;

    let row = document.createElement("tr");

    row.innerHTML = `
      <td>${item.name}</td>
      <td>${item.price.toFixed(2)}</td>
      <td class="qty">${item.qty}</td>
      <td>${item.expiry}</td>
      <td class="total">${isValid ? total.toFixed(2) : "Invalid Qty"}</td>
      <td>
        <button onclick="editRow(this, ${item.price}, ${item.stock})">Edit</button>
        <button onclick="deleteRow(this)">Delete</button>
      </td>
    `;

    row.style.color = isValid ? "black" : "red";

    cartBody.appendChild(row);
  });

  updateGrandTotal();
}
function deleteRow(btn) {
  let row = btn.parentElement.parentElement;

  let name = row.cells[0].innerText;

  // Remove from localStorage
  cartData = cartData.filter(item => item.name !== name);

  localStorage.setItem("cart", JSON.stringify(cartData));

  // Remove row from UI
  row.remove();

  updateGrandTotal();
}
let chartInstance = null;

async function createSaleChart() {
  try {
    const res = await fetch("/sales-by-date");
    const data = await res.json();

    let dates = Object.keys(data);
    let totals = Object.values(data);

    const ctx = document.getElementById("saleChart").getContext("2d");

    // Destroy old chart if exists
    if (chartInstance) {
      chartInstance.destroy();
    }

    chartInstance = new Chart(ctx, {
      type: "bar",
      data: {
        labels: dates,
        datasets: [{
          label: "Sales (₹)",
          data: totals
        }]
      },
      options: {
        responsive: true
      }
    });

  } catch (err) {
    console.error(err);
    alert("Failed to load chart");
  }
}
// Load on start
window.onload = () => {
  loadOperatorData();
  loadCart(); 
};
function goToSales() {
  window.location.href = "sales.html";
}
// Refresh every 30 sec
setInterval(loadOperatorData, 30000);