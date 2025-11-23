const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
require("dotenv").config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// MongoDB Connection
mongoose.connect("mongodb://localhost:27017/coderunner", {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log("MongoDB connected"))
.catch((err) => console.log("MongoDB connection error:", err));

// Schema
const codeSchema = new mongoose.Schema({
  code: String,
  languageId: Number,
  testcases: [String],
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

const Code = mongoose.model("Code", codeSchema);

// Routes
app.post("/api/code/save", async (req, res) => {
  try {
    const { code, languageId, testcases } = req.body;
    
    let codeDoc = await Code.findOne();
    if (!codeDoc) {
      codeDoc = new Code({ code, languageId, testcases });
    } else {
      codeDoc.code = code;
      codeDoc.languageId = languageId;
      codeDoc.testcases = testcases;
      codeDoc.updatedAt = Date.now();
    }
    
    await codeDoc.save();
    res.json({ success: true, data: codeDoc });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get("/api/code/load", async (req, res) => {
  try {
    const codeDoc = await Code.findOne();
    if (codeDoc) {
      res.json(codeDoc);
    } else {
      res.json(null);
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));