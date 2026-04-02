const express = require("express");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const cors = require("cors");
const User = require("./models/User");
const Medicine = require("./models/Medicine");
const Sale = require("./models/Sale");

const app = express();
app.use(cors());
app.use(bodyParser.json());
app.use(express.static("public"));

mongoose
  .connect("mongodb://127.0.0.1:27017/MedicalSale")
  .then(() => console.log("MongoDB Connected"))
  .catch((err) => console.log(err));

app.get("/", (req, res) => {
  res.send("Server working");
});
app.get("/api/operator/medicines", async (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0]; // Gets "YYYY-MM-DD"

    const medicines = await Medicine.find({
      expiry: { $gte: today } // Only find medicines where expiry is "Greater Than or Equal" to today
    }).sort({ expiry: 1 });    // Sort them so the closest date is first

    res.json(medicines);
  } catch (err) {
    res.status(500).json({ message: "Error fetching data" });
  }
});
app.get("/get-medicines", async (req, res) => {
  try {
    const allMeds = await Medicine.find(); // Fetch everything from DB
    res.json(allMeds);
  } catch (err) {
    res.status(500).send("Error fetching data");
  }
});
app.get("/sales-by-date", async (req, res) => {
  try {
    const sales = await Sale.find();

    let grouped = {};

    sales.forEach(s => {
      let date = new Date(s.date).toISOString().split("T")[0];

      if (!grouped[date]) grouped[date] = 0;

      grouped[date] += s.totalSale;
    });

    res.json(grouped);
  } catch (err) {
    res.status(500).send("Error fetching sales data");
  }
});
app.post("/sale", async (req, res) => {
  try {
    const saleData = req.body; // Aapka data req.body mein hai
    
    // Yahan 'Medicine' ki jagah 'Sale' model hona chahiye agar aap sales track kar rahe hain
    let newSale = new Sale({
      name: saleData.name,
      price: saleData.price,
      qty: saleData.qty,
      expiry: saleData.expiry,
      totalSale: saleData.totalSale
    });

    const savedSale = await newSale.save();
    
    // SIRF EK RESPONSE BHEJEIN
    res.status(201).json(savedSale); 
  } catch (err) {
    console.log("DB Save Error:", err); // Console check karein error dekhne ke liye
    res.status(500).send("Database Error");
  }
});
app.post("/admin", async (req, res) => {
  try {
    const data = req.body;
    let med = new Medicine(data);
    const savedMed = await med.save();
    res.status(201).json({
  message: "Data Stored successfully",
  data: savedMed
});
  } catch (err) {
    res.status(500).send("Error");
  }
});
app.put("/update-medicine/:id", async (req, res) => {
  try {
    const { nameMed, price, gst, discount, expiry, quantity } = req.body;

    // Calculate final price again on server side for safety
    const priceNum = parseFloat(price);
    const gstAmt = priceNum * (parseFloat(gst) / 100);
    const discAmt = (parseFloat(priceNum+gstAmt)) * (parseFloat(discount) / 100);
    const finalPrice = parseFloat(priceNum + gstAmt - discAmt);

    const updatedMed = await Medicine.findByIdAndUpdate(
      req.params.id,
      { 
        nameMed, 
        price: priceNum, 
        gst, 
        discount, 
        actualPrice:finalPrice, 
        expiry, 
        quantity 
      },
      { new: true } 
    );

    if (!updatedMed) return res.status(404).json({ success: false });

    res.json({ success: true, data: updatedMed });
  } catch (err) {
    res.status(500).json({ success: false, message: "Update failed" });
  }
});
// Route to delete medicine
app.delete("/delete-medicine/:id", async (req, res) => {
  try {
    const id = req.params.id;

    // Deletes the document from MongoDB
    const deletedMed = await Medicine.findByIdAndDelete(id);

    if (!deletedMed) {
      return res
        .status(404)
        .json({ success: false, message: "Medicine not found" });
    }

    res.json({ success: true, message: "Medicine deleted from database" });
  } catch (err) {
    res.status(500).json({ success: false, message: "Server error" });
  }
});
app.post("/signup", async (req, res) => {
  try {
    // 1. Destructure the incoming data
    const { name, email, password, role } = req.body;

    // 2. Check user exists BY EMAIL ONLY
    // If you check name/password too, you might accidentally create duplicate emails
    let user = await User.findOne({ email });

    if (user) {
      return res.status(400).send("User already exists with this email");
    }

    // 3. Create user using the variables you destructured
    const newUser = new User({
      name,
      email,
      password,
      role,
    });

    // 4. Save to MongoDB
    await newUser.save();

    res.status(201).send("Signup successful");
  } catch (err) {
    console.error(err);
    res.status(500).send("Error in signup");
  }
});

app.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find the user by email
    const user = await User.findOne({ email });

    // Logic: User must exist AND password must match
    if (user && user.password === password) {
      // Success: Send the role back
      res.json({ success: true, role: user.role, id: user._id });
    } else {
      // Fail: message for security
      res
        .status(401)
        .json({ success: false, message: "Invalid email or password or you don't have an account" });
    }
  } catch (err) {
    console.error("Login Error:", err);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
});
app.get("/sales-by-date", async (req, res) => {
  try {
    const sales = await Sale.find();

    let grouped = {};

    sales.forEach(s => {
      let date = new Date(s.date).toISOString().split("T")[0];

      if (!grouped[date]) {
        grouped[date] = 0;
      }

      grouped[date] += s.totalSale;
    });

    res.json(grouped);
  } catch (err) {
    res.status(500).send("Error fetching sales data");
  }
});
// ================= SERVER =================
app.listen(3000, () => {
  console.log("Server running on http://localhost:3000");
});
