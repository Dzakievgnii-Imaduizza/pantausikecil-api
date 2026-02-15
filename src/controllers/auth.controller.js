const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const userRepo = require("../repositories/user.repository");

async function login(req, res) {
  const { email, password } = req.body || {};
  
  if (!email || !password) {
    return res.status(400).json({ message: "Email dan password wajib diisi" });
  }

  const user = await userRepo.findByEmail(email.trim());
  if (!user) return res.status(401).json({ message: "Email atau password salah" });

  const ok = await bcrypt.compare(password, user.passwordHash);
  if (!ok) return res.status(401).json({ message: "Email atau password salah" });

  const token = jwt.sign(
    { userId: user.userId, posyanduId: user.posyanduId, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: "7d" }
  );

  return res.json({
    token,
    user: {
      userId: user.userId,
      nama: user.nama,
      email: user.email,
      role: user.role,
      posyanduId: user.posyanduId,
    },
  });
}

module.exports = { login };
