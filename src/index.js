require("dotenv").config();
const express = require("express");
const cors = require("cors");

const authRoutes = require("./routes/auth.routes");
const anakRoutes = require("./routes/anak.routes");
const pemeriksaanRoutes = require("./routes/pemeriksaan.routes");
const recapRoutes = require("./routes/recap.routes");
const adminUserRoutes = require("./routes/adminUser.routes");
const jadwalRoutes = require("./routes/jadwal.routes");
const laporanRoutes = require("./routes/laporan.routes");

const app = express();
app.use(cors());
app.use(express.json());

app.get("/health", (req, res) => res.json({ ok: true }));

app.use("/auth", authRoutes, anakRoutes);
app.use("/anak", anakRoutes);
app.use("/", pemeriksaanRoutes);
app.use("/recap", recapRoutes);
app.use("/admin", adminUserRoutes);
app.use("/jadwal", jadwalRoutes);
app.use("/laporan", laporanRoutes);


const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`API running on http://localhost:${port}`));
