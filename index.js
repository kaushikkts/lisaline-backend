require('events').EventEmitter.defaultMaxListeners = 50;
const postgres = require('postgres');
const app = require('express')();
const { v4: uuidv4 } = require('uuid');
const bodyParser = require('body-parser');
const cors = require('cors');
const {parseExcel, parsePDF, upload} = require('./helpers/data-parser');
const fs = require('fs');
const {generatePDFs} = require("./helpers/generate-pdf");
const bcrypt = require('bcrypt');
app.use(cors());
app.use(bodyParser.json());

const db = postgres({
    host: 'localhost',
    port: 5432,
    database: 'lisaline',
    user: 'kaushikkarandikar',
})

app.post('/api/batch', async (req, res) => {
    const {calibrationDate, quantity, inspectorName, batchId} = req.body;
    try {
        const insertResponse = await db`insert into public."batch" (id, batchId, quantity, inspectorname, calibrationDate) values (${uuidv4()}, ${batchId}, ${quantity}, ${inspectorName}, ${calibrationDate}) returning id`;
        res.json(insertResponse);
    } catch (e) {
        res.status(400).json({message: `Error while creating batch : - ${e}`});
    }
})

app.post('/api/batch/files/:id', upload.any(), async (req, res) => {
    if (req.files.length !== 2) {
        res.status(400).json({message: 'Please upload Master Certificate PDF and Serial Number CSV files'});
    }

    const masterCertificate = req.files.find(file => file.mimetype === 'application/pdf');
    const serialNumberFile = req.files.find(file => file.mimetype === 'application/vnd.ms-excel');

    console.log(masterCertificate.path, serialNumberFile.path);
    const updateResponse = await db`update public."batch" set master_cert=${masterCertificate.path}, jung_csv=${serialNumberFile.path} where id=${req.params?.id}`;
    console.log(updateResponse);

    if (!masterCertificate) {
        res.status(400).json({message: 'Please upload Master Certificate PDF file'});
    }
    if (!serialNumberFile) {
        res.status(400).json({message: 'Please upload Serial Number CSV file'});
    }

    await parseExcel(serialNumberFile.path, req.params?.id);
    const certificateData = await parsePDF(masterCertificate.path, req.params?.id);
    console.log(certificateData);
    res.json({
        batchId: req.params?.id,
        certificateData: certificateData,
        message: "Files uploaded successfully, and data parsed"
    });
});

app.get('/api/review/:id', async (req, res) => {
    const batchId = req.params?.id;
    const result = await db`select * from public."certificate" where batchid=${batchId}`;
    res.json(result);
});


app.post('/api/generatePDF', async (req, res) => {
    const {serialNumbers, emailToSend} = req.body;
    const queryArray = serialNumbers.replace(/ /g,'').split(',').map((serialNumber) => `%${serialNumber}%`);

    const result = await db`select certificate.id,
                                                    certificate.date::date,
                                                    certificate.content,
                                                    certificate.serialnumber,
                                                    certificate.modelnumber,
                                                    batch.calibrationdate::date,
                                                    batch.inspectorname

                                                      from public."certificate" inner join public."batch" on certificate.batchid = batch.id
                                                      where certificate.serialnumber like any(${queryArray})` ;
    generatePDFs(result, emailToSend);

    res.json(result);
})

app.get('/health', (req, res) => {
    console.log('Health check success');
    res.status(200).json({message: 'Health check success'});
});

app.post('/api/register', async (req, res) => {
    const {firstName, lastName, email, password} = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);
    try {
        const insertResponse = await db`insert into public."user" (id, first_name, last_name, email, password) values (${uuidv4()}, ${firstName}, ${lastName}, ${email}, ${hashedPassword}) returning id`;
        res.json(insertResponse);
    } catch (e) {
        res.status(400).json({message: `Error while creating user : - ${e}`});
    }
});

app.post('/api/login', async (req, res) => {
    const {email, password} = req.body;
    const user = await db`select * from public."user" where email=${email}`;
    if (user.length === 0) {
        res.status(400).json({message: 'User not found'});
        return;
    }
    const isPasswordValid = await bcrypt.compare(password, user[0].password);
    if (!isPasswordValid) {
        res.status(401).json({message: 'Invalid password'});
    }
    res.status(200).json({
        id: user[0].id,
        firstName: user[0].first_name,
        lastName: user[0].last_name,
        email: user[0].email
    });
});

app.post('/api/change-password', async (req, res) => {
    const {email, oldPassword, newPassword} = req.body;
    const user = await db`select * from public."user" where email=${email}`;
    if (user.length === 0) {
        res.status(400).json({message: 'User not found'});
        return;
    }
    const isPasswordValid = await bcrypt.compare(oldPassword, user[0].password);
    if (!isPasswordValid) {
        res.status(401).json({message: 'Invalid password'});
        return;
    }
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    const updateResponse = await db`update public."user" set password=${hashedPassword} where email=${email}`;
    res.status(200).json(updateResponse);
});


app.listen(3000, () => {
    console.log('Server is running on port 3000');
});
