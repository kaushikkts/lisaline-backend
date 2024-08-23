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

const db = postgres({
    host: 'localhost',
    port: 5432,
    database: 'lisaline',
    user: 'kaushikkarandikar',
})

const upload = multer({storage: storage});
let parsePDF = (filePath, batchId) => {
    const pdfParser = new PDFParser(this, 1);
    let certificateData = {};
    pdfParser.loadPDF(filePath);
    pdfParser.on("pdfParser_dataError", (errData) =>
        console.error(errData.parserError)
    );
    pdfParser.on("pdfParser_dataReady", async (pdfData) => {

        certificateData = {
            productDetails: {
                productType: pdfData.Pages[0].Texts[41].R[0].T.replace(/%20/g, ' ').replace(/%C2%B0/g, '°').replace(/%25/g, '%'),
                resolution: pdfData.Pages[0].Texts[82].R[0].T.replace(/%20/g, ' ').replace(/%C2%B0/g, '°').replace(/%25/g, '%'),
                type: pdfData.Pages[0].Texts[52].R[0].T.replace(/%20/g, ' ').replace(/%C2%B0/g, '°').replace(/%25/g, '%'),
                range: pdfData.Pages[0].Texts[47].R[0].T.replace(/%20/g, ' ').replace(/%C2%B0/g, '°').replace(/%25/g, '%'),
            },
            referenceInstrumentation: {
                model: pdfData.Pages[0].Texts[76].R[0].T.replace(/%20/g, ' ').replace(/%C2%B0/g, '°').replace(/%25/g, '%'),
                brand: pdfData.Pages[0].Texts[70].R[0].T.replace(/%20/g, ' ').replace(/%C2%B0/g, '°').replace(/%25/g, '%'),
                calibrationDate: pdfData.Pages[0].Texts[31].R[0].T.replace(/%20/g, ' ').replace(/%C2%B0/g, '°').replace(/%25/g, '%'),
                accuracy: pdfData.Pages[0].Texts[86].R[0].T.replace(/%20/g, ' ').replace(/%C2%B0/g, '°').replace(/%25/g, '%'),
                indicator: pdfData.Pages[0].Texts[80].R[0].T.replace(/%20/g, ' ').replace(/%C2%B0/g, '°').replace(/%25/g, '%'),
                sensor: pdfData.Pages[0].Texts[84].R[0].T.replace(/%20/g, ' ').replace(/%C2%B0/g, '°').replace(/%25/g, '%'),
            },
            temperatureValidation: {
                setPoints: [
                    pdfData.Pages[0].Texts[98].R[0].T.replace(/%20/g, ' ').replace(/%C2%B0/g, '°').replace(/%25/g, '%'),
                    pdfData.Pages[0].Texts[103].R[0].T.replace(/%20/g, ' ').replace(/%C2%B0/g, '°').replace(/%25/g, '%'),
                    pdfData.Pages[0].Texts[108].R[0].T.replace(/%20/g, ' ').replace(/%C2%B0/g, '°').replace(/%25/g, '%'),
                    pdfData.Pages[0].Texts[113].R[0].T.replace(/%20/g, ' ').replace(/%C2%B0/g, '°').replace(/%25/g, '%'),
                    pdfData.Pages[0].Texts[118].R[0].T.replace(/%20/g, ' ').replace(/%C2%B0/g, '°').replace(/%25/g, '%'),
                ],
                deviation: [
                    pdfData.Pages[0].Texts[101].R[0].T.replace(/%20/g, ' ').replace(/%C2%B0/g, '°').replace(/%25/g, '%'),
                    pdfData.Pages[0].Texts[106].R[0].T.replace(/%20/g, ' ').replace(/%C2%B0/g, '°').replace(/%25/g, '%'),
                    pdfData.Pages[0].Texts[111].R[0].T.replace(/%20/g, ' ').replace(/%C2%B0/g, '°').replace(/%25/g, '%'),
                    pdfData.Pages[0].Texts[116].R[0].T.replace(/%20/g, ' ').replace(/%C2%B0/g, '°').replace(/%25/g, '%'),
                    pdfData.Pages[0].Texts[121].R[0].T.replace(/%20/g, ' ').replace(/%C2%B0/g, '°').replace(/%25/g, '%'),
                ],
                uncertainty: [
                    pdfData.Pages[0].Texts[102].R[0].T.replace(/%20/g, ' ').replace(/%C2%B0/g, '°').replace(/%25/g, '%'),
                    pdfData.Pages[0].Texts[107].R[0].T.replace(/%20/g, ' ').replace(/%C2%B0/g, '°').replace(/%25/g, '%'),
                    pdfData.Pages[0].Texts[112].R[0].T.replace(/%20/g, ' ').replace(/%C2%B0/g, '°').replace(/%25/g, '%'),
                    pdfData.Pages[0].Texts[117].R[0].T.replace(/%20/g, ' ').replace(/%C2%B0/g, '°').replace(/%25/g, '%'),
                    pdfData.Pages[0].Texts[122].R[0].T.replace(/%20/g, ' ').replace(/%C2%B0/g, '°').replace(/%25/g, '%'),
                ],
            },
            environmentConditions: {
                temperature: pdfData.Pages[0].Texts[13].R[0].T.replace(/%20/g, ' ').replace(/%C2%B0/g, '°').replace(/%25/g, '%'),
                humidity: pdfData.Pages[0].Texts[15].R[0].T.replace(/%20/g, ' ').replace(/%C2%B0/g, '°').replace(/%25/g, '%'),
            },
        }
        await db`update public."certificate" set content=${certificateData} where batchId = ${batchId}`;
    })
}

let parseExcel = async (filePath, batchId) => {
    const parseResult = excelToJson({
        sourceFile: filePath,
        columnToKey: {
            A: 'number',
            B: 'modelNumber',
            C: 'serialNumber',
            D: 'result'
        },
        header: {
            rows: 1
        }
    });
    // console.log(parseResult["Sheet1"]);
    const selectResponse = await db`select * from public."batch" where id = ${batchId}`;
    // console.log(selectResponse);
    await db`update public."batch" set discrepancy=${selectResponse[0]?.quantity - parseResult["Sheet1"]?.length} where id = ${batchId}`;
    for (let i = 0; i < parseResult["Sheet1"].length; i++) {
        const result = parseResult["Sheet1"][i];
        // console.log(result);
        await db`insert into public."certificate" (batchId, inspector, modelNumber, serialNumber) values (${batchId}, 'b50fb908-fed1-486d-86cd-050ad65905b5', ${result?.modelNumber}, ${result?.serialNumber})`;
    }
}

module.exports = {
    parsePDF,
    parseExcel,
    upload
}