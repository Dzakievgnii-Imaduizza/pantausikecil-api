function generateFileName(prefix = "laporan") {
  const timestamp = Date.now();
  return `${prefix}-${timestamp}.xlsx`;
}

module.exports = { generateFileName };
