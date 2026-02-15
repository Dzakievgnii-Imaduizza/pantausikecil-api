const bcrypt = require("bcrypt");
const adminUserRepo = require("../repositories/adminUser.repository");
const userRepo = require("../repositories/user.repository"); // yang sudah ada: findByEmail

function requirePosyandu(req, res) {
  const posyanduId = req.user?.posyanduId;
  if (!posyanduId) {
    res.status(400).json({ message: "Admin tidak terikat posyandu" });
    return null;
  }
  return posyanduId;
}

// GET /admin/users
async function list(req, res) {
  const posyanduId = requirePosyandu(req, res);
  if (!posyanduId) return;

  const users = await adminUserRepo.listByPosyandu(posyanduId);
  res.json(users);
}

// POST /admin/users  (buat akun kader)
async function create(req, res) {
  const posyanduId = requirePosyandu(req, res);
  if (!posyanduId) return;

  const { nama, email, password, role } = req.body || {};

  if (!nama || !email || !password) {
    return res.status(400).json({ message: "nama, email, password wajib diisi" });
  }

  // role default kader
  const finalRole = role || "kader";
  if (!["kader", "admin"].includes(finalRole)) {
    return res.status(400).json({ message: "role tidak valid" });
  }

  // email uniqueness
  const existing = await userRepo.findByEmail(email.trim());
  if (existing) return res.status(409).json({ message: "Email sudah terdaftar" });

  // hash password
  if (String(password).length < 6) {
    return res.status(400).json({ message: "Password minimal 6 karakter" });
  }
  const passwordHash = await bcrypt.hash(password, 10);

  const created = await adminUserRepo.createForPosyandu(posyanduId, {
    nama: nama.trim(),
    email: email.trim().toLowerCase(),
    passwordHash,
    role: finalRole,
  });

  res.status(201).json(created);
}

// GET /admin/users/:id
async function detail(req, res) {
  const posyanduId = requirePosyandu(req, res);
  if (!posyanduId) return;

  const user = await adminUserRepo.findByIdForPosyandu(req.params.id, posyanduId);
  if (!user) return res.status(404).json({ message: "Not found" });

  res.json(user);
}

// PATCH /admin/users/:id  (update nama/role/reset password)
async function update(req, res) {
  const posyanduId = requirePosyandu(req, res);
  if (!posyanduId) return;

  const { nama, role, password } = req.body || {};
  const data = {};

  if (nama) data.nama = nama.trim();

  if (role) {
    if (!["kader", "admin"].includes(role)) {
      return res.status(400).json({ message: "role tidak valid" });
    }
    data.role = role;
  }

  if (password) {
    if (String(password).length < 6) {
      return res.status(400).json({ message: "Password minimal 6 karakter" });
    }
    data.passwordHash = await bcrypt.hash(password, 10);
  }

  if (Object.keys(data).length === 0) {
    return res.status(400).json({ message: "Tidak ada field untuk diupdate" });
  }

  const updated = await adminUserRepo.updateForPosyandu(req.params.id, posyanduId, data);
  if (!updated) return res.status(404).json({ message: "Not found" });

  res.json(updated);
}

async function remove(req, res) {
  const posyanduId = requirePosyandu(req, res);
  if (!posyanduId) return;

  const targetUserId = req.params.id;

  // ❌ admin tidak boleh hapus dirinya sendiri
  if (req.user.userId === targetUserId) {
    return res.status(400).json({ message: "Tidak boleh menghapus akun sendiri" });
  }

  const deleted = await adminUserRepo.deleteForPosyandu(targetUserId, posyanduId);
  if (!deleted) {
    return res.status(404).json({ message: "User tidak ditemukan" });
  }

  res.json({
    message: "User berhasil dihapus",
    user: deleted,
  });
}


module.exports = { list, create, detail, update, remove };
