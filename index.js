require("dotenv").config();
const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const dns = require("dns");
const { nanoid } = require("nanoid");
const app = express();

// Basic Configuration
const port = process.env.PORT || 3000;
const MONGODB_URI = process.env.MONGODB_URI;

// Connect to MongoDB
mongoose.connect(MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});
const connection = mongoose.connection;
connection.on(
  "error",
  console.error.bind(console, "MongoDB connection error:")
);

// Define schema and model for URL
const urlSchema = new mongoose.Schema({
  original_url: { type: String, required: true },
  short_url: { type: String, required: true },
});
const Url = mongoose.model("Url", urlSchema);

app.use(cors());
app.use(express.urlencoded({ extended: true }));
app.use("/public", express.static(`${process.cwd()}/public`));

app.get("/", function (req, res) {
  res.sendFile(process.cwd() + "/views/index.html");
});

// Your first API endpoint
app.get("/api/hello", function (req, res) {
  res.json({ greeting: "hello API" });
});

// API endpoint to shorten a URL
app.post("/api/shorturl", async (req, res) => {
  const { url } = req.body;

  // Validate URL format
  try {
    new URL(url);
  } catch (error) {
    return res.json({ error: "invalid url" });
  }

  // Check if the hostname exists
  dns.lookup(new URL(url).hostname, async (err) => {
    if (err) {
      return res.json({ error: "invalid url" });
    } else {
      // Generate short URL
      const shortUrl = nanoid(7);

      // Save the URL in the database
      const newUrl = new Url({ original_url: url, short_url: shortUrl });
      await newUrl.save();

      res.json({ original_url: url, short_url: shortUrl });
    }
  });
});

// Redirect to the original URL
app.get("/api/shorturl/:short_url", async (req, res) => {
  const { short_url } = req.params;

  try {
    const url = await Url.findOne({ short_url: short_url });
    if (!url) {
      return res.json({ error: "invalid short url" });
    }
    res.redirect(url.original_url);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "server error" });
  }
});

app.listen(port, function () {
  console.log(`Listening on port ${port}`);
});
