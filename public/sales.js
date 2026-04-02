let chartInstance = null;

async function loadSalesChart() {
  try {
    const res = await fetch("/sales-by-date");
    const data = await res.json();

    let dates = Object.keys(data);
    let totals = Object.values(data);

    const ctx = document.getElementById("saleChart").getContext("2d");
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
      }
    });

  } catch (err) {
    console.error(err);
    alert("Error loading chart");
  }
}

window.onload = loadSalesChart;