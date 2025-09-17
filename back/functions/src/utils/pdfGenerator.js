const pdf = require('html-pdf');
const { uploadFileToFirebaseStorage } = require('./firebaseStorage');
const path = require('path');
const os = require('os');
const fs = require('fs');

const generatePdf = (htmlContent, fileName) => {
    return new Promise(async (resolve, reject) => {
        const tempFilePath = path.join(os.tmpdir(), fileName);

        pdf.create(htmlContent, {}).toFile(tempFilePath, async (err) => {
            if (err) {
                console.error("Error creating PDF file:", err);
                return reject(err);
            }

            try {
                const storagePath = `exports/pdf/${fileName}`;
                const downloadUrl = await uploadFileToFirebaseStorage(tempFilePath, storagePath, 'application/pdf');

                // Clean up the temporary file
                fs.unlink(tempFilePath, (unlinkErr) => {
                    if (unlinkErr) console.error("Error deleting temporary PDF file:", unlinkErr);
                });

                resolve({ filePath: storagePath, downloadUrl });
            } catch (uploadError) {
                console.error("Error uploading PDF to Firebase Storage:", uploadError);
                reject(uploadError);
            }
        });
    });
};

module.exports = { generatePdf };
