function toDateOnlyYYYYMMDD(dateObj) {
  // pakai UTC supaya stabil lintas timezone
  const y = dateObj.getUTCFullYear();
  const m = String(dateObj.getUTCMonth() + 1).padStart(2, "0");
  const d = String(dateObj.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function calcAgeMonths(dob, measurementDate) {
  // dob & measurementDate adalah Date object valid
  let months =
    (measurementDate.getUTCFullYear() - dob.getUTCFullYear()) * 12 +
    (measurementDate.getUTCMonth() - dob.getUTCMonth());

  // kalau hari di bulan measurement < hari dob, belum genap sebulan
  if (measurementDate.getUTCDate() < dob.getUTCDate()) months -= 1;

  return months;
}

module.exports = { toDateOnlyYYYYMMDD, calcAgeMonths };
