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
                areteBatchNumber: pdfData.Pages[0].Texts[171].R[0].T.replace(/%20/g, ' ').replace(/%C2%B0/g, '°').replace(/%25/g, '%')
                        + pdfData.Pages[0].Texts[172].R[0].T.replace(/%20/g, ' ').replace(/%C2%B0/g, '°').replace(/%25/g, '%'),
                productDetails: {
                    name: pdfData.Pages[0].Texts[156].R[0].T.replace(/%20/g, ' ').replace(/%C2%B0/g, '°').replace(/%25/g, '%')
                        + pdfData.Pages[0].Texts[157].R[0].T.replace(/%20/g, ' ').replace(/%C2%B0/g, '°').replace(/%25/g, '%')
                        + pdfData.Pages[0].Texts[158].R[0].T.replace(/%20/g, ' ').replace(/%C2%B0/g, '°').replace(/%25/g, '%')
                        + pdfData.Pages[0].Texts[159].R[0].T.replace(/%20/g, ' ').replace(/%C2%B0/g, '°').replace(/%25/g, '%')
                        + pdfData.Pages[0].Texts[160].R[0].T.replace(/%20/g, ' ').replace(/%C2%B0/g, '°').replace(/%25/g, '%')
                        + pdfData.Pages[0].Texts[161].R[0].T.replace(/%20/g, ' ').replace(/%C2%B0/g, '°').replace(/%25/g, '%')
                        + pdfData.Pages[0].Texts[162].R[0].T.replace(/%20/g, ' ').replace(/%C2%B0/g, '°').replace(/%25/g, '%'),
                    type: pdfData.Pages[0].Texts[200].R[0].T.replace(/%20/g, ' ').replace(/%C2%B0/g, '°').replace(/%25/g, '%'),
                    resolution: pdfData.Pages[0].Texts[210].R[0].T.replace(/%20/g, ' ').replace(/%C2%B0/g, '°').replace(/%25/g, '%'),
                    range: pdfData.Pages[0].Texts[177].R[0].T.replace(/%20/g, ' ').replace(/%C2%B0/g, '°').replace(/%25/g, '%')
                        + pdfData.Pages[0].Texts[178].R[0].T.replace(/%20/g, ' ').replace(/%C2%B0/g, '°').replace(/%25/g, '%')
                        + pdfData.Pages[0].Texts[179].R[0].T.replace(/%20/g, ' ').replace(/%C2%B0/g, '°').replace(/%25/g, '%')
                        + pdfData.Pages[0].Texts[180].R[0].T.replace(/%20/g, ' ').replace(/%C2%B0/g, '°').replace(/%25/g, '%')
                        + pdfData.Pages[0].Texts[181].R[0].T.replace(/%20/g, ' ').replace(/%C2%B0/g, '°').replace(/%25/g, '%')
                        + pdfData.Pages[0].Texts[182].R[0].T.replace(/%20/g, ' ').replace(/%C2%B0/g, '°').replace(/%25/g, '%')
                        + pdfData.Pages[0].Texts[183].R[0].T.replace(/%20/g, ' ').replace(/%C2%B0/g, '°').replace(/%25/g, '%'),

                },
                referenceInstrumentation: {
                    model: pdfData.Pages[0].Texts[252].R[0].T,
                    brand: pdfData.Pages[0].Texts[278].R[0].T.replace(/%20/g, ' ').replace(/%C2%B0/g, '°').replace(/%25/g, '%'),
                    serialNumber: pdfData.Pages[0].Texts[292].R[0].T,
                    accuracy: pdfData.Pages[0].Texts[312].R[0].T + pdfData.Pages[0].Texts[313].R[0].T.replace(/%20/g, ' ').replace(/%C2%B0/g, '°').replace(/%25/g, '%')
                        + pdfData.Pages[0].Texts[314].R[0].T.replace(/%20/g, ' ').replace(/%C2%B0/g, '°').replace(/%25/g, '%'),
                },
                temperatureValidation: [
                    {
                        setPoints: pdfData.Pages[0].Texts[351].R[0].T + pdfData.Pages[0].Texts[352].R[0].T,
                        deviation: pdfData.Pages[0].Texts[101].R[0].T.replace(/%20/g, ' ').replace(/%C2%B0/g, '°').replace(/%25/g, '%'),
                        result: pdfData.Pages[0].Texts[358].R[0].T.replace(/%2F/g, '/').replace(/%C2%B0/g, '°').replace(/%25/g, '%')
                    },
                    {
                        setPoints: pdfData.Pages[0].Texts[361].R[0].T + pdfData.Pages[0].Texts[362].R[0].T,
                        deviation: pdfData.Pages[0].Texts[106].R[0].T.replace(/%20/g, ' ').replace(/%C2%B0/g, '°').replace(/%25/g, '%'),
                        result: pdfData.Pages[0].Texts[368].R[0].T.replace(/%2F/g, '/').replace(/%C2%B0/g, '°').replace(/%25/g, '%')
                    },
                    {
                        setPoints: pdfData.Pages[0].Texts[370].R[0].T,
                        deviation: pdfData.Pages[0].Texts[111].R[0].T.replace(/%20/g, ' ').replace(/%C2%B0/g, '°').replace(/%25/g, '%'),
                        result: pdfData.Pages[0].Texts[376].R[0].T.replace(/%2F/g, '/').replace(/%C2%B0/g, '°').replace(/%25/g, '%')
                    },
                    {
                        setPoints: pdfData.Pages[0].Texts[378].R[0].T,
                        deviation: pdfData.Pages[0].Texts[116].R[0].T.replace(/%20/g, ' ').replace(/%C2%B0/g, '°').replace(/%25/g, '%'),
                        result: pdfData.Pages[0].Texts[384].R[0].T.replace(/%2F/g, '/').replace(/%C2%B0/g, '°').replace(/%25/g, '%')
                    },
                    {
                        setPoints: pdfData.Pages[0].Texts[386].R[0].T,
                        deviation: pdfData.Pages[0].Texts[121].R[0].T.replace(/%20/g, ' ').replace(/%C2%B0/g, '°').replace(/%25/g, '%'),
                        result: pdfData.Pages[0].Texts[392].R[0].T.replace(/%2F/g, '/').replace(/%C2%B0/g, '°').replace(/%25/g, '%')
                    }
                ],
                temperatureAndHumidity: {
                    temperature: pdfData.Pages[0].Texts[94].R[0].T.replace(/%20/g, ' ').replace(/%C2%B0/g, '°').replace(/%25/g, '%')
                    + pdfData.Pages[0].Texts[95].R[0].T.replace(/%20/g, ' ').replace(/%C2%B0/g, '°').replace(/%25/g, '%') + pdfData.Pages[0].Texts[96].R[0].T.replace(/%20/g, ' ').replace(/%C2%B0/g, '°').replace(/%25/g, '%'),
                    humidity: pdfData.Pages[0].Texts[112].R[0].T.replace(/%20/g, ' ').replace(/%C2%B0/g, '°').replace(/%25/g, '%')
                        + pdfData.Pages[0].Texts[113].R[0].T.replace(/%20/g, ' ').replace(/%C2%B0/g, '°').replace(/%25/g, '%')
                        + pdfData.Pages[0].Texts[114].R[0].T.replace(/%20/g, ' ').replace(/%C2%B0/g, '°').replace(/%25/g, '%')
                        + pdfData.Pages[0].Texts[115].R[0].T.replace(/%20/g, ' ').replace(/%C2%B0/g, '°').replace(/%25/g, '%')
                        + pdfData.Pages[0].Texts[116].R[0].T.replace(/%20/g, ' ').replace(/%C2%B0/g, '°').replace(/%25/g, '%')
                }
            }
            await db`update public."batch" set content=${certificateData}, arete_batch_number=${certificateData.areteBatchNumber} where id = ${batchId}`;
            resolve(certificateData);
        });
    });
}

let parseExcel = async (filePath, batchId, calibrationDate, db) => {
    try {
        const parseResult = excelToJson({
            sourceFile: filePath,
            columnToKey: {
                A: 'number',
                B: 'partNumber',
                C: 'serialNumber',
                D: 'result'
            },
            header: {
                rows: 1
            }
        });
        const selectResponse = await db`select * from public."batch" where id=${batchId}`;
        await db`update public."batch" set discrepancy=${selectResponse[0]?.quantity - parseResult["Sheet1"]?.length}, calibration_date=${calibrationDate} where id = ${batchId}`;
        const inspectorId = selectResponse[0]?.inspector;
        console.log(parseResult["Sheet1"], inspectorId);
        for (let i = 0; i < parseResult["Sheet1"].length; i++) {
            const result = parseResult["Sheet1"][i];
            await db`insert into public."certificate" (batchid, inspector, serial_number, part_number) values (${batchId}, ${inspectorId}, ${result?.serialNumber}, ${result?.partNumber})`;
        }
    } catch (e) {
        console.log(e);
        throw new Error(e);
    }

}

module.exports = {
    parsePDF,
    parseExcel,
    upload
}