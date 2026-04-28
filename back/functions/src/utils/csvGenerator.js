const createCsvWriter = require("csv-writer").createObjectCsvWriter;
const fs = require("fs");
const path = require("path");
const os = require("os");

const generateCsv = async (data, headers) => {
  const tmpDir = os.tmpdir();
  const fileName = `csv_${Date.now()}_${Math.random().toString(36).substring(7)}.csv`;
  const filePath = path.join(tmpDir, fileName);

  try {
    const csvWriter = createCsvWriter({
      path: filePath,
      header: headers,
    });

    await csvWriter.writeRecords(data);
    const csvString = fs.readFileSync(filePath, "utf8");
    return csvString;
  } finally {
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  }
};

module.exports = { generateCsv };
