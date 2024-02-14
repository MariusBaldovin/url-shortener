require("dotenv").config();
const express = require("express");
const cors = require("cors");
const dns = require("dns");
const app = express();

// Basic Configuration
const port = process.env.PORT || 3000;
let counter = 1; // Initialize counter for generating short URLs
const urlDatabase = {}; // Store original URLs and corresponding short URLs

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
      // Generate short URL using counter
      const shortUrl = counter++;

      // Store original URL and corresponding short URL
      urlDatabase[shortUrl] = url;

      // Return JSON response with original_url and short_url properties
      res.json({ original_url: url, short_url: shortUrl });
    }
  });
});

// Redirect to the original URL
app.get("/api/shorturl/:short_url", async (req, res) => {
  const { short_url } = req.params;

  // Retrieve the original URL based on the short URL
  const originalUrl = urlDatabase[short_url];

  if (originalUrl) {
    // Redirect to the original URL
    res.redirect(originalUrl);
  } else {
    // If short URL not found, return error response
    res.status(404).json({ error: "Short URL not found" });
  }
});

// Handle invalid URL format
app.use((err, req, res, next) => {
  if (err instanceof URIError) {
    res.status(400).json({ error: "invalid url" });
  } else {
    next();
  }
});

app.listen(port, function () {
  console.log(`Listening on port ${port}`);
});
