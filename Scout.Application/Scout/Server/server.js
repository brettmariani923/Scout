require("dotenv").config();

const express = require("express");
const cors = require("cors");
const nodemailer = require("nodemailer");

const app = express();

const PORT = process.env.PORT || 3000;
const FROM_ADDRESS = process.env.FROM_ADDRESS;

// Allow requests from the extension (localhost for dev)
app.use(cors());
app.use(express.json({ limit: "10mb" }));

// SendGrid Transport
const transporter = nodemailer.createTransport({
    service: "SendGrid",
    auth: {
        user: "apikey",
        pass: process.env.SENDGRID_API_KEY
    }
});

app.post("/email", async (req, res) => {
    try {
        const { image, url, title, email, timestamp } = req.body;

        if (!image || !url || !email) {
            return res.status(400).json({ error: "Missing required fields." });
        }

        const base64Data = image.split(";base64,").pop();

        const subject = `Scout Alert: Blocked site visited`;

        const htmlBody = `
            <p>Scout detected a blocked site.</p>
            <ul>
                <li><strong>URL:</strong> ${escapeHtml(url)}</li>
                <li><strong>Title:</strong> ${escapeHtml(title || "")}</li>
                <li><strong>Time (UTC):</strong> ${escapeHtml(timestamp || "")}</li>
            </ul>
            <p>Screenshot is attached.</p>
        `;

        await transporter.sendMail({
            from: FROM_ADDRESS,
            to: email,
            subject,
            html: htmlBody,
            attachments: [
                {
                    filename: "screenshot.png",
                    content: base64Data,
                    encoding: "base64"
                }
            ]
        });

        res.json({ success: true });
    } catch (err) {
        console.error("Error sending Scout email:", err);
        res.status(500).json({ error: "Failed to send email." });
    }
});

// Basic HTML escap
function escapeHtml(str) {
    return String(str || "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;");
}

app.listen(PORT, () => {
    console.log(`Scout email server running on http://localhost:${PORT}`);
});
