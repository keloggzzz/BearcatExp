import express from "express";
import bcrypt from "bcryptjs";
const authRouter = express.Router();
import pool from "./PoolConnection.js";
import jwt from "jsonwebtoken";

function authenticateToken(req, res, next) {
    const authHeader = req.headers["authorization"];
    const token = authHeader && authHeader.split(" ")[1];

    if (!token) return res.sendStatus(401); // Unauthorized

    jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
        if (err) return res.sendStatus(403); // Forbidden
        req.user = user;
        next();
    });
}

// Generates new access token using the refresh token
authRouter.post("/refreshtoken", async (req, res) => {

    // Gets and checks for refresh token
    const refreshToken = req.cookies.refreshToken;
    if (!refreshToken) return res.status(401).json({ error: "No refresh token" });

    try {
        // Makes sure there's a valid token
        const decoded = jwt.verify(refreshToken, process.env.REFRESH_SECRET);
        const session = await pool.query(
            `SELECT * FROM sessions WHERE user_id = $1 AND refresh_token = $2`,
            [decoded.id, refreshToken]
        );
        if (!session.rows.length) return res.statusCode(403).json({ error: "Invalid refresh token "});

        // Makes new access token
        const newAccessToken = jwt.sign({ user_id: decoded.user_id, firstname: decoded.firstname, type: decoded.user_type, pic: user_picture, role: "authenticated" }, process.env.JWT_SECRET, { expiresIn: "1h" });
        await pool.query(
            "UPDATE user_sessions SET refresh_token $1 WHERE id = $2"
            [refreshToken, session.rows[0].id]
        );

        res.json({ accessToken: newAccessToken});
    } catch (err) {
        res.status(403).json({ error: "Invalid or expired refresh token "});
    }
});



export default authRouter