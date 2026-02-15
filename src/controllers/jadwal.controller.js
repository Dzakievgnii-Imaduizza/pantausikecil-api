// src/controllers/jadwal.controller.js
const jadwalRepo = require("../repositories/jadwal.repository");

function requirePosyandu(req, res) {
  const posyanduId = req.user?.posyanduId;
  if (!posyanduId) {
    res.status(400).json({ message: "User tidak terikat posyandu" });
    return null;
  }
  return posyanduId;
}

function isValidDate(value) {
  const d = new Date(value);
  return !Number.isNaN(d.getTime());
}

async function list(req, res) {
  const posyanduId = requirePosyandu(req, res);
  if (!posyanduId) return;

  const { from, to, q } = req.query;

  if (from && !isValidDate(from)) return res.status(400).json({ message: "Parameter from tidak valid" });
  if (to && !isValidDate(to)) return res.status(400).json({ message: "Parameter to tidak valid" });

  const items = await jadwalRepo.listByPosyandu(posyanduId, {
    from: from ? String(from) : undefined,
    to: to ? String(to) : undefined,
    q: q ? String(q) : undefined,
  });

  res.json(items);
}

async function detail(req, res) {
  const posyanduId = requirePosyandu(req, res);
  if (!posyanduId) return;

  const item = await jadwalRepo.findByIdAndPosyandu(req.params.id, posyanduId);
  if (!item) return res.status(404).json({ message: "Not found" });

  res.json(item);
}

async function create(req, res) {
  const posyanduId = requirePosyandu(req, res);
  if (!posyanduId) return;

  const { judul, kegiatan, scheduledAt } = req.body;

  if (!judul) return res.status(400).json({ message: "judul wajib diisi" });
  if (!scheduledAt) return res.status(400).json({ message: "scheduledAt wajib diisi" });
  if (!isValidDate(scheduledAt)) return res.status(400).json({ message: "scheduledAt harus DateTime valid" });

  const item = await jadwalRepo.create({
    posyanduId,
    judul,
    kegiatan,
    scheduledAt,
  });

  res.status(201).json(item);
}

async function update(req, res) {
  const posyanduId = requirePosyandu(req, res);
  if (!posyanduId) return;

  const existing = await jadwalRepo.findByIdAndPosyandu(req.params.id, posyanduId);
  if (!existing) return res.status(404).json({ message: "Not found" });

  const { judul, kegiatan, scheduledAt } = req.body;

  if (judul !== undefined && !judul) return res.status(400).json({ message: "judul tidak boleh kosong" });
  if (scheduledAt !== undefined) {
    if (!scheduledAt) return res.status(400).json({ message: "scheduledAt tidak boleh kosong" });
    if (!isValidDate(scheduledAt)) return res.status(400).json({ message: "scheduledAt harus DateTime valid" });
  }

  const item = await jadwalRepo.update(req.params.id, { judul, kegiatan, scheduledAt });
  res.json(item);
}

async function remove(req, res) {
  const posyanduId = requirePosyandu(req, res);
  if (!posyanduId) return;

  const existing = await jadwalRepo.findByIdAndPosyandu(req.params.id, posyanduId);
  if (!existing) return res.status(404).json({ message: "Not found" });

  await jadwalRepo.remove(req.params.id);
  res.json({ message: "Deleted" });
}

module.exports = { list, detail, create, update, remove };
