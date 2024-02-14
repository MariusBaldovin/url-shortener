require("dotenv").config();
const express = require("express");
const cors = require("cors");
const dns = require("dns");
const app = express();

// Basic Configuration
const port = process.env.PORT || 3000;

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

      // Return JSON response with original_url and short_url properties
      res.json({ original_url: url, short_url: shortUrl });
    }
  });
});

// Redirect to the original URL
app.get("/api/shorturl/:short_url", async (req, res) => {
  const { short_url } = req.params;

  try {
    // Find the corresponding document in the database
    const url = await Url.findOne({ short_url: short_url });

    // If the document is not found, return an error response
    if (!url) {
      return res.status(404).json({ error: "Short URL not found" });
    }

    // Redirect to the original URL
    res.redirect(url.original_url);
  } catch (error) {
    // Handle any errors
    console.error(error);
    res.status(500).json({ error: "Internal server error" });
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
