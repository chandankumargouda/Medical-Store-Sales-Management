const mongoose = require("mongoose");

const MedicineSchema = new mongoose.Schema({
  nameMed: String,
  price:Number,
  gst:Number,
  discount:Number,
  actualPrice:Number,
  expiry:String,
  quantity:Number
});

module.exports = mongoose.model("Medicine", MedicineSchema);