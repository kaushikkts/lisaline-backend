const postgres = require('postgres');
const app = require('express')();
const { v4: uuidv4 } = require('uuid');
const bodyParser = require('body-parser');
const cors = require('cors');
const {parseExcel, parsePDF, upload} = require('./helpers/data-parser');
// app.use(fileParser);
app.use(cors());
app.use(bodyParser.json());

const db = postgres({
    host: 'localhost',
    port: 5432,
    database: 'lisaline',
    user: 'kaushikkarandikar',
})


app.post('/api/batch', upload.any(), async (req, res) => {
    if (req.files.length !== 2) {
        res.status(400).json({message: 'Please upload Master Certificaate PDF and Serial Number CSV files'});
    }

    const masterCertificate = req.files.find(file => file.mimetype === 'application/pdf');
    const serialNumberFile = req.files.find(file => file.mimetype === 'application/vnd.ms-excel');
    const {refInput, quantity, inspectorId} = req.body;
    if (!masterCertificate) {
        res.status(400).json({message: 'Please upload Master Certificate PDF file'});
    }
    if (!serialNumberFile) {
        res.status(400).json({message: 'Please upload Serial Number CSV file'});
    }
    const insertResponse = await db`insert into public."batch" (id, refInput, quantity, createdBy, master_cert, jung_csv) values (${uuidv4()}, ${refInput}, ${quantity}, ${inspectorId}, ${masterCertificate.path}, ${serialNumberFile.path}) returning id`;
    await parseExcel(serialNumberFile.path, insertResponse[0]?.id);
    parsePDF(masterCertificate.path, insertResponse[0]?.id);
    res.json({
        body: req.body,
        csv: serialNumberFile,
        pdf: masterCertificate,
    });
})

app.listen(3000, () => {
    console.log('Server is running on port 3000');
});
