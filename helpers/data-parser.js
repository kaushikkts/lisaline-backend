const PDFParser = require("pdf2json");
const excelToJson = require("convert-excel-to-json");
const multer = require('multer');
const postgres = require("postgres");
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, './uploads')
    },
    filename: function (req, file, cb) {
        cb(null, `${Date.now()}-${file.originalname}`)
    }
})

const upload = multer({storage: storage});
const csvToJson=require('csvtojson')
let parseMasterCertificate = async (filePath, batchId, db) => {
    try {
        const response = excelToJson({
            sourceFile: filePath
        })
        let masterCertificate = response["Sheet1"];
        masterCertificate.forEach((el, index) => el["index"] = index);
        console.log(masterCertificate);

        const certificateData = {
            areteBatchNumber: masterCertificate[14]['B'],
            productDetails: {
                name: masterCertificate[13]['B'],
                type: masterCertificate[15]['D'],
                resolution: masterCertificate[16]['D'],
                range: masterCertificate[14]['D']
            },
            referenceInstrumentation: {
                model: masterCertificate[22]['B'],
                brand: masterCertificate[20]['D'],
                referenceCalibrationDate: masterCertificate[6]['D'],
                serialNumber: masterCertificate[23]['B'],
                accuracy: '±' + masterCertificate[24]['D']
            },
            temperatureValidation: [
                {
                    setPoints: masterCertificate[27]['A'],
                    deviation: masterCertificate[27]['D'],
                    result: masterCertificate[27]['E']
                },
                {
                    setPoints: masterCertificate[28]['A'],
                    deviation: masterCertificate[28]['D'],
                    result: masterCertificate[28]['E']
                },
                {
                    setPoints: masterCertificate[29]['A'],
                    deviation: masterCertificate[29]['D'],
                    result: masterCertificate[29]['E']
                },
                {
                    setPoints: masterCertificate[30]['A'],
                    deviation: masterCertificate[30]['D'],
                    result: masterCertificate[30]['E']
                },
                {
                    setPoints: masterCertificate[31]['A'],
                    deviation: masterCertificate[31]['D'],
                    result: masterCertificate[31]['E']
                }
            ],
            temperatureAndHumidity: {
                temperature: masterCertificate[7]['B'],
                humidity: masterCertificate[8]['B']
            }
        }

        console.log(certificateData);
        await db`update public."batch" set content=${certificateData}, arete_batch_number=${certificateData.areteBatchNumber} where id = ${batchId}`;

    } catch (e) {
        console.log(e);
        throw new Error(e);
    }
};
let parsePDF = (filePath, batchId, db) => {
    return new Promise((resolve, reject) => {
        const pdfParser = new PDFParser(this, 1);
        let certificateData = {};
        pdfParser.loadPDF(filePath);
        pdfParser.on("pdfParser_dataError", (errData) =>
            console.error(errData.parserError)
        );
        pdfParser.on("pdfParser_dataReady", async (pdfData, index) => {
            pdfData.Pages[0].Texts.forEach((element, index) => {
                element["index"] = index;
            });
            console.log(JSON.stringify(pdfData.Pages[0].Texts));
            certificateData = {
                areteBatchNumber: pdfData.Pages[0].Texts[169].R[0].T.replace(/%20/g, ' ').replace(/%C2%B0/g, '°').replace(/%25/g, '%')
                        + pdfData.Pages[0].Texts[170].R[0].T.replace(/%20/g, ' ').replace(/%C2%B0/g, '°').replace(/%25/g, '%'),
                productDetails: {
                    name: pdfData.Pages[0].Texts[154].R[0].T.replace(/%20/g, ' ').replace(/%C2%B0/g, '°').replace(/%25/g, '%')
                        + pdfData.Pages[0].Texts[155].R[0].T.replace(/%20/g, ' ').replace(/%C2%B0/g, '°').replace(/%25/g, '%')
                        + pdfData.Pages[0].Texts[156].R[0].T.replace(/%20/g, ' ').replace(/%C2%B0/g, '°').replace(/%25/g, '%')
                        + pdfData.Pages[0].Texts[157].R[0].T.replace(/%20/g, ' ').replace(/%C2%B0/g, '°').replace(/%25/g, '%')
                        + pdfData.Pages[0].Texts[158].R[0].T.replace(/%20/g, ' ').replace(/%C2%B0/g, '°').replace(/%25/g, '%')
                        + pdfData.Pages[0].Texts[159].R[0].T.replace(/%20/g, ' ').replace(/%C2%B0/g, '°').replace(/%25/g, '%')
                        + pdfData.Pages[0].Texts[160].R[0].T.replace(/%20/g, ' ').replace(/%C2%B0/g, '°').replace(/%25/g, '%'),
                    type: pdfData.Pages[0].Texts[198].R[0].T.replace(/%20/g, ' ').replace(/%C2%B0/g, '°').replace(/%25/g, '%'),
                    resolution: pdfData.Pages[0].Texts[209].R[0].T.replace(/%20/g, ' ').replace(/%C2%B0/g, '°').replace(/%25/g, '%')
                        + pdfData.Pages[0].Texts[210].R[0].T.replace(/%20/g, ' ').replace(/%C2%B0/g, '°').replace(/%25/g, '%')
                        + pdfData.Pages[0].Texts[211].R[0].T.replace(/%20/g, ' ').replace(/%C2%B0/g, '°').replace(/%25/g, '%'),
                    range: pdfData.Pages[0].Texts[175].R[0].T.replace(/%20/g, ' ').replace(/%C2%B0/g, '°').replace(/%25/g, '%')
                        + pdfData.Pages[0].Texts[176].R[0].T.replace(/%20/g, ' ').replace(/%C2%B0/g, '°').replace(/%25/g, '%')
                        + pdfData.Pages[0].Texts[177].R[0].T.replace(/%20/g, ' ').replace(/%C2%B0/g, '°').replace(/%25/g, '%')
                        + pdfData.Pages[0].Texts[178].R[0].T.replace(/%20/g, ' ').replace(/%C2%B0/g, '°').replace(/%25/g, '%')
                        + pdfData.Pages[0].Texts[179].R[0].T.replace(/%20/g, ' ').replace(/%C2%B0/g, '°').replace(/%25/g, '%')
                        + pdfData.Pages[0].Texts[180].R[0].T.replace(/%20/g, ' ').replace(/%C2%B0/g, '°').replace(/%25/g, '%')
                        + pdfData.Pages[0].Texts[181].R[0].T.replace(/%20/g, ' ').replace(/%C2%B0/g, '°').replace(/%25/g, '%'),

                },
                referenceInstrumentation: {
                    model: pdfData.Pages[0].Texts[277].R[0].T.replace(/%20/g, ' ').replace(/%C2%B0/g, '°').replace(/%25/g, '%'),
                    brand: pdfData.Pages[0].Texts[251].R[0].T.replace(/%20/g, ' ').replace(/%C2%B0/g, '°').replace(/%25/g, '%'),
                    serialNumber: pdfData.Pages[0].Texts[291].R[0].T,
                    accuracy: '±' + pdfData.Pages[0].Texts[312].R[0].T + pdfData.Pages[0].Texts[313].R[0].T.replace(/%20/g, ' ').replace(/%C2%B0/g, '°').replace(/%25/g, '%')
                        + pdfData.Pages[0].Texts[314].R[0].T.replace(/%20/g, ' ').replace(/%C2%B0/g, '°').replace(/%25/g, '%'),
                },
                temperatureValidation: [
                    {
                        setPoints: pdfData.Pages[0].Texts[352].R[0].T + pdfData.Pages[0].Texts[353].R[0].T,
                        deviation: pdfData.Pages[0].Texts[361].R[0].T.replace(/%20/g, ' ').replace(/%C2%B0/g, '°').replace(/%25/g, '%')
                            + pdfData.Pages[0].Texts[362].R[0].T.replace(/%20/g, ' ').replace(/%C2%B0/g, '°').replace(/%25/g, '%'),
                        result: pdfData.Pages[0].Texts[365].R[0].T.replace(/%2F/g, '/').replace(/%C2%B0/g, '°').replace(/%25/g, '%')
                    },
                    {
                        setPoints: pdfData.Pages[0].Texts[368].R[0].T + pdfData.Pages[0].Texts[369].R[0].T,
                        deviation: pdfData.Pages[0].Texts[376].R[0].T.replace(/%20/g, ' ').replace(/%C2%B0/g, '°').replace(/%25/g, '%')
                            + pdfData.Pages[0].Texts[377].R[0].T.replace(/%20/g, ' ').replace(/%C2%B0/g, '°').replace(/%25/g, '%'),
                        result: pdfData.Pages[0].Texts[380].R[0].T.replace(/%2F/g, '/').replace(/%C2%B0/g, '°').replace(/%25/g, '%')
                    },
                    {
                        setPoints: pdfData.Pages[0].Texts[382].R[0].T,
                        deviation: pdfData.Pages[0].Texts[387].R[0].T.replace(/%20/g, ' ').replace(/%C2%B0/g, '°').replace(/%25/g, '%')
                            + pdfData.Pages[0].Texts[388].R[0].T.replace(/%20/g, ' ').replace(/%C2%B0/g, '°').replace(/%25/g, '%'),
                        result: pdfData.Pages[0].Texts[391].R[0].T.replace(/%2F/g, '/').replace(/%C2%B0/g, '°').replace(/%25/g, '%')
                    },
                    {
                        setPoints: pdfData.Pages[0].Texts[393].R[0].T,
                        deviation: pdfData.Pages[0].Texts[400].R[0].T.replace(/%20/g, ' ').replace(/%C2%B0/g, '°').replace(/%25/g, '%')
                            + pdfData.Pages[0].Texts[401].R[0].T.replace(/%20/g, ' ').replace(/%C2%B0/g, '°').replace(/%25/g, '%'),
                        result: pdfData.Pages[0].Texts[404].R[0].T.replace(/%2F/g, '/').replace(/%C2%B0/g, '°').replace(/%25/g, '%')
                    },
                    {
                        setPoints: pdfData.Pages[0].Texts[406].R[0].T,
                        deviation: pdfData.Pages[0].Texts[414].R[0].T.replace(/%20/g, ' ').replace(/%C2%B0/g, '°').replace(/%25/g, '%')
                            + pdfData.Pages[0].Texts[415].R[0].T.replace(/%20/g, ' ').replace(/%C2%B0/g, '°').replace(/%25/g, '%'),
                        result: pdfData.Pages[0].Texts[418].R[0].T.replace(/%2F/g, '/').replace(/%C2%B0/g, '°').replace(/%25/g, '%')
                    }
                ],
                temperatureAndHumidity: {
                    temperature: pdfData.Pages[0].Texts[92].R[0].T.replace(/%20/g, ' ').replace(/%C2%B0/g, '°').replace(/%25/g, '%')
                    + pdfData.Pages[0].Texts[93].R[0].T.replace(/%20/g, ' ').replace(/%C2%B0/g, '°').replace(/%25/g, '%')
                        + pdfData.Pages[0].Texts[94].R[0].T.replace(/%20/g, ' ').replace(/%C2%B0/g, '°').replace(/%25/g, '%'),
                    humidity: pdfData.Pages[0].Texts[110].R[0].T.replace(/%20/g, ' ').replace(/%C2%B0/g, '°').replace(/%25/g, '%')
                        + pdfData.Pages[0].Texts[111].R[0].T.replace(/%20/g, ' ').replace(/%C2%B0/g, '°').replace(/%25/g, '%')
                        + pdfData.Pages[0].Texts[112].R[0].T.replace(/%20/g, ' ').replace(/%C2%B0/g, '°').replace(/%25/g, '%')
                        + pdfData.Pages[0].Texts[113].R[0].T.replace(/%20/g, ' ').replace(/%C2%B0/g, '°').replace(/%25/g, '%')
                        + pdfData.Pages[0].Texts[114].R[0].T.replace(/%20/g, ' ').replace(/%C2%B0/g, '°').replace(/%25/g, '%')
                }
            }
            await db`update public."batch" set content=${certificateData}, arete_batch_number=${certificateData.areteBatchNumber} where id = ${batchId}`;
            resolve(certificateData);
        });
    });
}

let parseExcel = async (filePath, batchId, calibrationDate, db) => {
    try {

        const dataFromCSV = await csvToJson().fromFile(filePath);
        const selectResponse = await db`select * from public."batch" where id=${batchId}`;
        console.log(selectResponse[0]?.quantity, dataFromCSV.length)
        await db`update public."batch" set discrepancy=${selectResponse[0]?.quantity - dataFromCSV?.length}, calibration_date=${calibrationDate} where id = ${batchId}`;
        const inspectorId = selectResponse[0]?.inspector;
        for (let i = 0; i < dataFromCSV.length; i++) {
            const result = dataFromCSV[i];
            console.log(result['Sr']['NO;Part No;Sr'][' No;Remarks'].split(';'));
            const serialNo = result['Sr']['NO;Part No;Sr'][' No;Remarks'].split(';')[2];
            const partNo = result['Sr']['NO;Part No;Sr'][' No;Remarks'].split(';')[1];
            await db`insert into public."certificate" (batchid, inspector, serial_number, part_number) values (${batchId}, ${inspectorId}, ${serialNo}, ${partNo})`;
        }

    } catch (e) {
        console.log(e);
        throw new Error(e);
    }

}

module.exports = {
    parsePDF,
    parseExcel,
    parseMasterCertificate,
    upload
}