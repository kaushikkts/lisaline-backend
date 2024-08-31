require('events').EventEmitter.defaultMaxListeners = 20;
const postgres = require('postgres');
const app = require('express')();
const { v4: uuidv4 } = require('uuid');
const bodyParser = require('body-parser');
const cors = require('cors');
const {parseExcel, parsePDF, upload} = require('./helpers/data-parser');
const jsPDF = require('jspdf');
const html2canvas = require('html2canvas');
const html_to_pdf = require("html-pdf-node");
// app.use(fileParser);
const fs = require('fs');
const {generatePDFs} = require("./helpers/generate-pdf");
app.use(cors());
app.use(bodyParser.json());

const db = postgres({
    host: 'localhost',
    port: 5432,
    database: 'lisaline',
    user: 'kaushikkarandikar',
})


app.post('/api/batch', async (req, res) => {
    const {refInput, quantity, inspectorId, batchId} = req.body;
    try {
        const insertResponse = await db`insert into public."batch" (id, batchId, refInput, quantity, createdBy) values (${uuidv4()}, ${batchId}, ${refInput}, ${quantity}, ${inspectorId}) returning id`;
        res.json(insertResponse);
    } catch (e) {
        res.status(400).json({message: `Error while creating batch : - ${e}`});
    }

})

app.post('/api/batch/files/:id', upload.any(), async (req, res) => {
    // if (req.files.length !== 2) {
    //     res.status(400).json({message: 'Please upload Master Certificate PDF and Serial Number CSV files'});
    // }

    const masterCertificate = req.files.find(file => file.mimetype === 'application/pdf');
    // const serialNumberFile = req.files.find(file => file.mimetype === 'application/vnd.ms-excel');
    //
    // console.log(masterCertificate.path, serialNumberFile.path);
    // const updateResponse = await db`update public."batch" set master_cert=${masterCertificate.path}, jung_csv=${serialNumberFile.path} where id=${req.params?.id}`;
    // console.log(updateResponse);

    // if (!masterCertificate) {
    //     res.status(400).json({message: 'Please upload Master Certificate PDF file'});
    // }
    // if (!serialNumberFile) {
    //     res.status(400).json({message: 'Please upload Serial Number CSV file'});
    // }
    //
    // await parseExcel(serialNumberFile.path, req.params?.id);
    parsePDF(masterCertificate.path, req.params?.id);
    res.json({
        body: req.body,
        // csv: serialNumberFile,
        pdf: masterCertificate,
    });
});


app.post('/api/generatePDF', async (req, res) => {
    const result = await db`select certificate.id,
                                                    certificate.date::date,
                                                    "user".firstname,
                                                    "user".lastname,
                                                    certificate.content,
                                                    certificate.serialnumber,
                                                    certificate.modelnumber
                                                      from public."certificate" inner join public."user" on certificate.inspector = "user".id` ;

    generatePDFs(result);

    res.json(result);
})


app.listen(3000, () => {
    console.log('Server is running on port 3000');
});
