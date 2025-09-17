const ExcelJS = require('exceljs');
const { uploadFileToFirebaseStorage } = require('./firebaseStorage');
const path = require('path');
const os = require('os');
const fs = require('fs');

const generateExcel = async (data, headers, sheetName = 'Data', fileName) => {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet(sheetName);

    worksheet.columns = headers.map(header => ({ header, key: header, width: 15 }));
    worksheet.addRows(data);

    const tempFilePath = path.join(os.tmpdir(), fileName);
    await workbook.xlsx.writeFile(tempFilePath);

    try {
        const storagePath = `exports/excel/${fileName}`;
        const downloadUrl = await uploadFileToFirebaseStorage(tempFilePath, storagePath, 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');

        fs.unlink(tempFilePath, (unlinkErr) => {
            if (unlinkErr) console.error("Error deleting temporary Excel file:", unlinkErr);
        });

        return { filePath: storagePath, downloadUrl };
    } catch (uploadError) {
        console.error("Error uploading Excel to Firebase Storage:", uploadError);
        throw uploadError;
    }
};

module.exports = { generateExcel };
