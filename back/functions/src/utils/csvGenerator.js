const createCsvWriter = require('csv-writer').createObjectCsvWriter;
const { Writable } = require('stream');

const generateCsv = async (data, headers) => {
    let csvString = '';
    const writableStream = new Writable({
        write(chunk, encoding, callback) {
            csvString += chunk.toString();
            callback();
        }
    });

    const csvWriter = createCsvWriter({
        path: writableStream,
        header: headers,
    });

    await csvWriter.writeRecords(data);
    return csvString;
};

module.exports = { generateCsv };
