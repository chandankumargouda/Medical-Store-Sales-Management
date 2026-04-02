const mongoose = require("mongoose");

const saleSchema = new mongoose.Schema({
  name: String,
  price: Number,
  qty: Number,
  expiry: String,
  totalSale: Number,
  date: { type: Date, default: Date.now }
});

module.exports = mongoose.model("Sale", saleSchema);