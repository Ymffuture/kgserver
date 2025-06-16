// routes/auth.js or similar
import express from "express";
import axios from "axios";
import jwt from "jsonwebtoken";

const router = express.Router();

const CLIENT_ID = process.env.GITHUB_CLIENT_ID;
const CLIENT_SECRET = process.env.GITHUB_CLIENT_SECRET;
const FRONTEND_URL = process.env.FRONTEND_URL;

// Step 1: Redirect to GitHub login
router.get("/github", (req, res) => {
  const redirectUri = `https://github.com/login/oauth/authorize?client_id=${CLIENT_ID}&scope=user`;
  res.redirect(redirectUri);
});

// Step 2: Handle GitHub callback
router.get("/github/callback", async (req, res) => {
  const code = req.query.code;
  try {
    const tokenRes = await axios.post(
      "https://github.com/login/oauth/access_token",
      {
        client_id: CLIENT_ID,
        client_secret: CLIENT_SECRET,
        code,
      },
      {
        headers: { Accept: "application/json" },
      }
    );

    const accessToken = tokenRes.data.access_token;

    // Get user info
    const userRes = await axios.get("https://api.github.com/user", {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    const githubUser = userRes.data;

    // Optional: Store user in DB, generate your own JWT
    const token = jwt.sign(
      {
        id: githubUser.id,
        name: githubUser.name,
        avatar: githubUser.avatar_url,
        email: githubUser.email,
      },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );

    // Redirect with token to frontend
    res.redirect(`${FRONTEND_URL}/login?token=${token}`);
  } catch (err) {
    res.status(500).json({ error: "GitHub login failed" });
  }
});

export default router;

