const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
require("dotenv").config();
const fetch = (...args) =>
  import("node-fetch").then(({ default: f }) => f(...args));

const app = express();

app.use(cors());
app.use(express.json());

mongoose
  .connect(process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("MongoDB Connected"))
  .catch((err) => console.error("MongoDB Error:", err.message));

const codeSchema = new mongoose.Schema({
  code: String,
  languageId: Number,
  testcases: [String],
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

const Code = mongoose.model("Code", codeSchema);

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
    res.json(codeDoc || null);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/fix", async (req, res) => {
  try {
    const { code, languageId, testcases } = req.body;
    if (!code) return res.status(400).json({ error: "code required" });

    const prompt = `
Fix all syntax/runtime errors. Do NOT explain.
Return ONLY JSON:
{"fixed_code":"<fixed code>"}

LANGUAGE_ID: ${languageId}

CODE:
${code}

TESTCASES:
${(testcases || []).join("\n")}
`;

    const url = "http://192.168.56.1:1234/v1/chat/completions";  // LM Studio URL

    const payload = {
      model: "qwen2.5-vl-3b-instruct",
      messages: [
        { role: "system", content: "You are a code fixer. Return only JSON." },
        { role: "user", content: prompt }
      ],
      temperature: 0
    };

    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const raw = await response.text();
    console.log("LM Studio raw:", raw);

    let data;
    try {
      data = JSON.parse(raw);
    } catch {
      return res.json({ success: false, error: "Invalid JSON from model", raw });
    }

    let output = data?.choices?.[0]?.message?.content || "";

    // Extract JSON inside output
    let jsonMatch = output.match(/{[\s\S]*}/);
    if (!jsonMatch) {
      return res.json({
        success: false,
        error: "No JSON found in model output",
        raw: output
      });
    }

    let parsed;
    try {
      parsed = JSON.parse(jsonMatch[0]);
    } catch {
      return res.json({ success: false, error: "JSON parse error", raw: jsonMatch[0] });
    }

    let fixed_code = parsed.fixed_code || "";

    // Clean escape sequences
    fixed_code = fixed_code
      .replace(/\\n/g, "\n")
      .replace(/\\t/g, "    ")
      .replace(/\\"/g, '"')
      .trim();

    return res.json({ success: true, fixed_code });

  } catch (err) {
    console.error("Fix error:", err);
    res.status(500).json({ error: err.message });
  }
});



const PORT = process.env.PORT || 5000;
app.listen(PORT, () =>
  console.log(`Server running on port ${PORT}`)
);
