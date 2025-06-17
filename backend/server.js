const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const path = require("path");
const app = express();
const moment = require("moment");
const sendEmailToAllUsers = require("./sendEmail");

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "public")));
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

// MongoDB Connect
mongoose
  .connect("mongodb://localhost:27017/communityPortal", {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("✅ MongoDB connected"))
  .catch((err) => console.error("MongoDB connection error:", err));

// Models
const User = require("./models/User");
const Committee = require("./models/Committee");
const Event = require("./models/Event");

// Routes
app.get("/", (req, res) => {
  res.render("home");
});

app.get("/login", (req, res) => {
  res.render("login");
});

app.post("/login", async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email, password });
  if (!user) {
    return res.status(401).send("❌ Invalid credentials");
  }

  const committee = await Committee.findOne({ email });
  const isCommittee = !!committee;

  res.redirect(
    `/dashboard?email=${encodeURIComponent(email)}&isCommittee=${isCommittee}`
  );
});

app.get("/dashboard", async (req, res) => {
  const { email } = req.query;
  const isCommittee = await Committee.findOne({ email });

  res.render("dashboard", {
    email,
    isCommittee: !!isCommittee,
  });
});

app.get("/signup", (req, res) => {
  res.render("signup");
});

app.post("/signup", async (req, res) => {
  const { email, password } = req.body;

  const existingUser = await User.findOne({ email });
  const existingCommittee = await Committee.findOne({ email });

  if (existingUser || existingCommittee) {
    return res.status(400).send("⚠️ Email already exists, just login");
  }

  const user = new User({ email, password });
  await user.save();

  res.redirect("/login");
});

// EVENTS LIST - ONLY UPCOMING & SORTED
app.get("/events", async (req, res) => {
  const today = new Date();
  const yyyyMmDd = today.toISOString().split("T")[0]; // e.g., "2025-06-15"

  try {
    const events = await Event.find({
      startDate: { $gte: yyyyMmDd },
    })
      .sort({ startDate: 1, startTime: 1 })
      .lean(); // Use .lean() so you can modify the results directly

    // Format dates to dd-mm-yy
    events.forEach((event) => {
      const start = new Date(event.startDate);
      const end = new Date(event.endDate);

      event.startDate = `${String(start.getDate()).padStart(2, "0")}-${String(
        start.getMonth() + 1
      ).padStart(2, "0")}-${String(start.getFullYear()).slice(-2)}`;
      event.endDate = `${String(end.getDate()).padStart(2, "0")}-${String(
        end.getMonth() + 1
      ).padStart(2, "0")}-${String(end.getFullYear()).slice(-2)}`;
    });

    res.render("events", { events });
  } catch (err) {
    console.error("Error fetching events:", err);
    res.status(500).send("Something went wrong.");
  }
});

// SHOW FORM TO COMMITTEE ONLY
app.get("/post-event", async (req, res) => {
  const email = req.query.email;
  const isCommittee = await Committee.findOne({ email });

  if (!isCommittee) {
    return res
      .status(403)
      .send("⛔ Access denied. Only committee members can post events.");
  }

  res.render("post-event", { error: null, formData: {} });
});

// POST NEW EVENT WITH VALIDATION
app.post("/post-event", async (req, res) => {
  const {
    name,
    startDate,
    endDate,
    startTime,
    endTime,
    location,
    requirements,
  } = req.body;

  const start = moment(`${startDate} ${startTime}`, "YYYY-MM-DD HH:mm");
  const end = moment(`${endDate} ${endTime}`, "YYYY-MM-DD HH:mm");
  const now = moment();

  if (!start.isValid() || !end.isValid()) {
    return res.render("post-event", {
      error: "❌ Invalid date or time.",
      formData: req.body,
    });
  }

  if (start.isBefore(now)) {
    return res.render("post-event", {
      error: "⚠️ Event cannot start in the past.",
      formData: req.body,
    });
  }

  if (end.isBefore(start)) {
    return res.render("post-event", {
      error: "⚠️ End date/time must be after start date/time.",
      formData: req.body,
    });
  }

  const newEvent = await Event.create({
    name,
    startDate,
    endDate,
    startTime,
    endTime,
    location,
    requirements,
  });

  // ✅ Fetch all registered users
  const users = await User.find({}, "email");

  // ✅ Email content
  const subject = `Community Update: ${name}`;
  const htmlContent = `
    <h3>Community Update Posted</h3>
    <p><strong>${name}</strong></p>
    <p><strong>Date:</strong> ${startDate} to ${endDate}</p>
    <p><strong>Time:</strong> ${startTime} - ${endTime}</p>
    <p><strong>Location:</strong> ${location}</p>
    <p><strong>Requirements:</strong> ${requirements}</p>
  `;

  // ✅ Send email
  try {
    await sendEmailToAllUsers(users, subject, htmlContent);
    console.log("📧 Notification emails sent.");
  } catch (err) {
    console.error("❌ Email sending failed:", err);
  }

  res.redirect("/events");
});

// Start server
app.listen(3000, () =>
  console.log("🚀 Server running at http://localhost:3000")
);
("684ee3ce3d27704415e92730");
