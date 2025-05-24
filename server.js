
const express = require('express');
const dotenv = require('dotenv');
const fetch = require('node-fetch');
const cors = require('cors');

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

app.use(express.static('public'));


app.post('/api/generate', async (req, res) => {
  const userMessage = req.body.message;

  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{
          role: "user",
          parts: [{ text: userMessage }]
        }]
      })
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("Gemini API Error: ", data);
      return res.status(500).json({ error: data.error?.message || "Unknown Gemini API error" });
    }

    console.log("Gemini API Success:", data);
    res.json(data);

  } catch (err) {
    console.error("Backend Error:", err);
    res.status(500).json({ error: "Internal Server Error", details: err.message });
  }

});


app.listen(3000, () => {
  console.log("Server running on http://localhost:3000");
});
