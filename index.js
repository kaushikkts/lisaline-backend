const fs = require('fs');
const app = require('express')();
const PDFParser = require("pdf2json");
const pg = require('pg')
const csvtojsonV2=require("csvtojson/v2");
const excelToJson = require('convert-excel-to-json');

const bodyParser = require('body-parser');
const cors = require('cors');
const multer = require('multer');
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, './uploads')
    },
    filename: function (req, file, cb) {
        cb(null, `${Date.now()}-${file.originalname}`)
    }
})

const upload = multer({storage: storage});
// app.use(fileParser);
app.use(cors());
app.use(bodyParser.json());
// app.use(fileUpload({
//     useTempFiles: true,
//     tempFileDir: '/tmp/'
// }));
// bb.extend(app);
// const { Client } = pg
// const client = new Client({
//     user: 'kaushikkarandikar',
//     host: 'localhost',
//     database: 'lisaline',
//     port: 5432,
// })
// const pdfParser = new PDFParser(this, 1);
//
// pdfParser.on("pdfParser_dataError", (errData) =>
//     console.error(errData.parserError)
// );
// pdfParser.on("pdfParser_dataReady", async (pdfData) => {
//     let test = pdfData.Pages[0].Texts.map((t, index) => {
//         t["index"] = index
//         return t;
//     });
//     let certificateData = {
//         productDetails: {
//             productType: test[41].R[0].T.replace(/%20/g, ' ').replace(/%C2%B0/g, '°').replace(/%25/g, '%'),
//             resolution: test[82].R[0].T.replace(/%20/g, ' ').replace(/%C2%B0/g, '°').replace(/%25/g, '%'),
//             type: test[52].R[0].T.replace(/%20/g, ' ').replace(/%C2%B0/g, '°').replace(/%25/g, '%'),
//             range: test[47].R[0].T.replace(/%20/g, ' ').replace(/%C2%B0/g, '°').replace(/%25/g, '%'),
//         },
//         referenceInstrumentation: {
//             model: test[76].R[0].T.replace(/%20/g, ' ').replace(/%C2%B0/g, '°').replace(/%25/g, '%'),
//             brand: test[70].R[0].T.replace(/%20/g, ' ').replace(/%C2%B0/g, '°').replace(/%25/g, '%'),
//             calibrationDate: test[31].R[0].T.replace(/%20/g, ' ').replace(/%C2%B0/g, '°').replace(/%25/g, '%'),
//             accuracy: test[86].R[0].T.replace(/%20/g, ' ').replace(/%C2%B0/g, '°').replace(/%25/g, '%'),
//             indicator: test[80].R[0].T.replace(/%20/g, ' ').replace(/%C2%B0/g, '°').replace(/%25/g, '%'),
//             sensor: test[84].R[0].T.replace(/%20/g, ' ').replace(/%C2%B0/g, '°').replace(/%25/g, '%'),
//         },
//         temperatureValidation: {
//             setPoints: [
//                 test[98].R[0].T.replace(/%20/g, ' ').replace(/%C2%B0/g, '°').replace(/%25/g, '%'),
//                 test[103].R[0].T.replace(/%20/g, ' ').replace(/%C2%B0/g, '°').replace(/%25/g, '%'),
//                 test[108].R[0].T.replace(/%20/g, ' ').replace(/%C2%B0/g, '°').replace(/%25/g, '%'),
//                 test[113].R[0].T.replace(/%20/g, ' ').replace(/%C2%B0/g, '°').replace(/%25/g, '%'),
//                 test[118].R[0].T.replace(/%20/g, ' ').replace(/%C2%B0/g, '°').replace(/%25/g, '%'),
//             ],
//             deviation: [
//                 test[101].R[0].T.replace(/%20/g, ' ').replace(/%C2%B0/g, '°').replace(/%25/g, '%'),
//                 test[106].R[0].T.replace(/%20/g, ' ').replace(/%C2%B0/g, '°').replace(/%25/g, '%'),
//                 test[111].R[0].T.replace(/%20/g, ' ').replace(/%C2%B0/g, '°').replace(/%25/g, '%'),
//                 test[116].R[0].T.replace(/%20/g, ' ').replace(/%C2%B0/g, '°').replace(/%25/g, '%'),
//                 test[121].R[0].T.replace(/%20/g, ' ').replace(/%C2%B0/g, '°').replace(/%25/g, '%'),
//             ],
//             uncertainty: [
//                 test[102].R[0].T.replace(/%20/g, ' ').replace(/%C2%B0/g, '°').replace(/%25/g, '%'),
//                 test[107].R[0].T.replace(/%20/g, ' ').replace(/%C2%B0/g, '°').replace(/%25/g, '%'),
//                 test[112].R[0].T.replace(/%20/g, ' ').replace(/%C2%B0/g, '°').replace(/%25/g, '%'),
//                 test[117].R[0].T.replace(/%20/g, ' ').replace(/%C2%B0/g, '°').replace(/%25/g, '%'),
//                 test[122].R[0].T.replace(/%20/g, ' ').replace(/%C2%B0/g, '°').replace(/%25/g, '%'),
//             ],
//         },
//         environmentConditions: {
//             temperature: test[13].R[0].T.replace(/%20/g, ' ').replace(/%C2%B0/g, '°').replace(/%25/g, '%'),
//             humidity: test[15].R[0].T.replace(/%20/g, ' ').replace(/%C2%B0/g, '°').replace(/%25/g, '%'),
//         },
//     }
//     console.log(certificateData);
//     await client.connect()
//     // const res = await client.query('insert into public.user()')
//     // console.log(res.rows[0]) // Hello world!
//     await client.end()
//
//     fs.writeFileSync('./test.json', JSON.stringify(test));
//
// });
//
// pdfParser.loadPDF("./EA0F0000031AS.pdf");

app.post('/api/batch/pdf', upload.any(), (req, res) => {
    console.log(req.files[0]);
    let certificateData = {};
    const pdfParser = new PDFParser(this, 1);

pdfParser.loadPDF(`${req.files[0].path}`);
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
    // await client.connect()
    // const res = await client.query('insert into public.user()')
    // console.log(res.rows[0]) // Hello world!
    // await client.end()

    // fs.writeFileSync('./test.json', JSON.stringify(test));

    console.log(certificateData);
    res.json(certificateData);
    });
})

app.post('/api/batch/csv', upload.any(), (req, res) => {
    console.log(req.files[0]);
    // csvtojsonV2({delimiter: [";"]}).fromFile(req.files[0].path).then((jsonObj)=>{
    //     // console.log(jsonObj);
    //     res.json(jsonObj);
    // })
    const result = excelToJson({
        sourceFile: req.files[0].path,
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
    console.log(result);
    res.json(result["Sheet1"]);
})

app.listen(3000, () => {
    console.log('Server is running on port 3000');
});

