const anakRepo = require("../repositories/anak.repository");
const pemeriksaanRepo = require("../repositories/pemeriksaan.repository")

function requirePosyandu(req, res) {
  const posyanduId = req.user?.posyanduId;
  if (!posyanduId) {
    res.status(400).json({ message: "User tidak terikat posyandu" });
    return null;
  }
  return posyanduId;
}


async function recap(req, res) {
  const posyanduId = requirePosyandu(req, res);
  if (!posyanduId) return;
  console.log("masuk")
  const totalAnak = await anakRepo.countAnak(posyanduId);
  if (!totalAnak) return res.status(404).json({message: "Not found"});
  const totalAnakNormal = await pemeriksaanRepo.totalAnakNormal(posyanduId);
  const totalAnakStunting = await pemeriksaanRepo.totalAnakStunting(posyanduId);
  const totalAnakStuntingBerat = await pemeriksaanRepo.totalAnakSevere(posyanduId);
  const totalStunting = totalAnakStunting+totalAnakStuntingBerat;
  const totalAnakBeresiko = await pemeriksaanRepo.totalAnakBeresiko(posyanduId);

  res.json({
    totalAnak: totalAnak,
    normal : totalAnakNormal,
    stunting : totalStunting,
    beresiko : totalAnakBeresiko
  });


}

module.exports = { recap };
