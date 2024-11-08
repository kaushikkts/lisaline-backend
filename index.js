require('events').EventEmitter.defaultMaxListeners = 50;
const dotenv = require('dotenv');
const postgres = require('postgres');
const app = require('express')();
const { v4: uuidv4 } = require('uuid');
const bodyParser = require('body-parser');
const cors = require('cors');
const {parseExcel, parsePDF, upload, parseMasterCertificate} = require('./helpers/data-parser');
const {generatePDFs} = require("./helpers/generate-pdf");
const bcrypt = require('bcrypt');
const fs = require("fs");
const {sendEmailWithAttachment} = require("./helpers/email-helper");
const excel = require('node-excel-export');
const AWS = require("aws-sdk");
const s3 = new AWS.S3({
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY,
        secretAccessKey: process.env.AWS_SECRET_KEY

    }
})

app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));
dotenv.config();

const db = postgres({
    host: process.env.DB_HOST,
    port: 5432,
    database: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD
})

app.post('/api/batch', async (req, res) => {
    const {calibrationDate, quantity, inspector, batchNumber} = req.body;
    console.log("Entering /api/batch method: - ", calibrationDate, quantity, inspector, batchNumber);
    try {
        const insertResponse = await db`insert into public."batch" (id, batch_number, quantity, inspector, calibration_date) values (${uuidv4()}, ${batchNumber}, ${quantity}, ${inspector}, ${calibrationDate}) returning id`;
        console.log('Creating new batch: - ',insertResponse);
        res.status(200).json(insertResponse);
    } catch (e) {
        res.status(400).json({message: `Error while creating batch : - ${e}`});
    }
});

app.post('/api/batch/files/master-certificate/:id', upload.any(), async (req, res) => {
    const masterCertificate = req.files.find(file => file.mimetype === 'application/vnd.ms-excel'
        ||
        file.mimetype === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        ||
        file.mimetype === 'text/csv');
    if (masterCertificate) {
        try {
            let file = fs.readFileSync(masterCertificate?.path);
            const s3Upload = await s3.upload({
                Bucket: process.env.AWS_BUCKET_NAME,
                Key: `${Date.now()}-${req.params?.id}-pdfs.zip`,
                ACL: 'public-read',
                Body: file,
                ContentType: 'application/vnd.ms-excel'
            }).promise();
            await db`update public."batch" set master_cert=${s3Upload.Location} where id=${req.params?.id}`;
            await parseMasterCertificate(masterCertificate?.path, req.params?.id, db);
            const content = await db`select content from public."batch" where id=${req.params?.id}`;
            console.log("Logging content: - ", content);
            res.json({
                batchId: req.params?.id,
                message: "Master Certificate uploaded successfully, and data parsed",
                data: content
            });
        } catch (e) {
            res.status(400).json({message: `Error while uploading master certificate : - ${e}`});
        }
    }
});

app.post('/api/batch/files/jung-csv/:id', upload.any(), async (req, res) => {

    const jungCSVFile = req.files.find(file =>
        file.mimetype === 'application/vnd.ms-excel'
        ||
        file.mimetype === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        ||
        file.mimetype === 'text/csv'
    );
    const calibrationDate = jungCSVFile?.originalname.split('_').join(',').split('.')[0].split(',')[1];


    if (jungCSVFile) {
        // Check if master certificate is already uploaded
        const batch = await db`select * from public."batch" where id=${req.params?.id}`;
        if (!batch[0].master_cert) {
            res.status(400).json({message: 'Master certificate is required before uploading Jung CSV file'});
            return;
        }
        try {
            let file = fs.readFileSync(jungCSVFile?.path);
            const s3Upload = await s3.upload({
                Bucket: process.env.AWS_BUCKET_NAME,
                Key: `${Date.now()}-${req.params?.id}-pdfs.zip`,
                ACL: 'public-read',
                Body: file,
                ContentType: 'application/vnd.ms-excel'
            }).promise();
            await db`update public."batch" set jung_csv=${s3Upload.Location} where id=${req.params?.id}`;
            await parseExcel(jungCSVFile.path, req.params?.id, calibrationDate, db);
            res.json({
                batchId: req.params?.id,
                message: "Jung CSV uploaded successfully, and data parsed",
            });
        } catch (e) {
            res.status(400).json({message: `Error while uploading Jung CSV file : - ${e}`});

        }
    }
});

app.get('/api/review/:id', async (req, res) => {
    const batchId = req.params?.id;
    const result = await db`select * from public."certificate" where batchid=${batchId}`;
    res.json(result);
});


app.post('/api/generatePDF', async (req, res) => {
    const serialNumbers = req.body['Serial Numbers'];
    const email = req.body['Email'];
    console.log('Entering generate pdf method: - ', serialNumbers, email);
    const queryArray = serialNumbers.replace(/ /g,'').split(',').map((serialNumber) => `%${serialNumber}%`);
    try {
        const result = await db`select certificate.id,
                                                    certificate.date::date,
                                                    certificate.part_number,
                                                    certificate.serial_number,
                                                    batch.calibration_date::date,
                                                    batch.content,
                                                    u.first_name || ' ' || u.last_name as inspector
                                                      from public."certificate" inner join public."batch" on certificate.batchid = batch.id
                                                      inner join public."user" as u on batch.inspector = u.id
                                                      where certificate.serial_number like any(${queryArray})` ;
        generatePDFs(result, email, serialNumbers);
        res.status(200).json({message: 'PDF generation started. You will receive an email shortly.'});
    } catch (e) {
        res.status(400).json({message: `Error while generating PDFs : - ${e}`});
    }
});

app.post('/api/report', async (req, res) => {
    const {startDate, endDate, email} = req.body;
    console.log(startDate, endDate);
    try {
        const result = await db`select distinct c.part_number, count(c.part_number), b.created_at, b.arete_batch_number, b.remarks, b.batch_number, b.quantity, u.first_name || ' ' || u.last_name as full_name
                                    from batch as b inner join public."user" as u on b.inspector = u.id
                                    inner join public.certificate c on b.id = c.batchid
                                    where created_at between ${startDate} and ${endDate}
                                    group by b.created_at, b.arete_batch_number, b.remarks, b.batch_number, b.quantity, u.first_name, u.last_name, c.part_number;`
        const report = excel.buildExport([
            {
                name: 'Report',
                specification: {
                    part_number: {displayName: 'Part Number', headerStyle: 'header', width: 120},
                    count: {displayName: 'Count', headerStyle: 'header', width: 120},
                    created_at: {displayName: 'Created At', headerStyle: 'header', width: 120},
                    arete_batch_number: {displayName: 'Arete Batch Number', headerStyle: 'header', width: 120},
                    batch_number: {displayName: 'Batch Number', headerStyle: 'header', width: 120},
                    quantity: {displayName: 'Quantity', headerStyle: 'header', width: 120},
                    full_name: {displayName: 'Inspector', headerStyle: 'header', width: 120},
                },
                data: result
            }
        ]);
        let blob = new Buffer.from(report);
        fs.writeFileSync('report.xlsx', blob);
        await sendEmailWithAttachment(email, './report.xlsx');
        res.status(200).json({message: 'You will receive an email shortly with the requested report.', result: result});
    } catch (e) {
        res.status(400).json({message: `Error while generating report : - ${e}`});
    }
});

app.post('/api/update-batch', async (req, res) => {
    try {
        const {id, remarks, areteBatchNumber, quantity} = req.body;
        console.log(id, remarks, areteBatchNumber, quantity);
        await db`update public."batch" set remarks=${remarks}, quantity=${quantity}, arete_batch_number=${areteBatchNumber} where id=${id}`;
        res.status(200).json({message: 'Batch updated successfully'});
    } catch (e) {
        res.status(400).json({message: `Error while updating batch : - ${e}`});
    }


});

app.get('/health', (req, res) => {
    console.log('Health check success');
    parseMasterCertificate('', '', db);
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
        res.status(401).json({message: 'Wrong password entered.'});
        return
    }
    res.status(200).json({
        id: user[0].id,
        firstName: user[0].first_name,
        lastName: user[0].last_name,
        email: user[0].email
    });
});

app.put('/api/update-certificate-data/:id', async (req, res) => {
    const certificate = req.body;
    const batchId = req.params?.id;
    try {
        const updateResponse = await db`update public."batch" set content=${certificate} where id=${batchId}`;
        res.status(200).json(updateResponse);
    } catch (e) {
        res.status(400).json({message: `Error while updating certificate data: - ${e}`});
    }
});

app.get('/api/batch/:id', async (req, res) => {
    const inspectorId = req.params?.id;
    try {
        const result = await db`
            select 
                b.id,
                b.calibration_date,
                b.batch_number,
                b.arete_batch_number,
                b.quantity,
                b.remarks,
                b.discrepancy,
                b.master_cert,
                b.jung_csv,
                u.first_name || ' ' || u.last_name as inspectorName
                  from public."batch" as b inner join public."user" as u on b.inspector = u.id where b.inspector=${inspectorId}`;
        let batchData = [];
        for (let i = 0; i < result.length; i++) {
            const date = new Date(result[i].calibration_date);
            const formattedDate = date.toLocaleDateString('en-GB', {
                day: 'numeric', month: 'short', year: 'numeric'
            }).replace(/ /g, '-')
            batchData.push({
                id: result[i].id,
                batchNumber: result[i].batch_number,
                calibrationDate: formattedDate === 'Invalid-Date' ? null : formattedDate,
                areteBatchNumber: result[i].arete_batch_number,
                quantity: result[i].quantity,
                discrepancy: result[i].discrepancy,
                remarks: result[i].remarks,
                masterCertificate: result[i].master_cert,
                jungCSV: result[i].jung_csv,
                inspector: result[i].inspectorname
            })
        }
        res.json(batchData);
    } catch (e) {
        res.status(400).json({message: `Error while fetching batches : - ${e}`});
    }
});

app.post('/api/change-password', async (req, res) => {
    const {email, currentPassword, newPassword} = req.body;
    const user = await db`select * from public."user" where email=${email}`;
    if (user.length === 0) {
        res.status(400).json({message: 'User not found'});
        return;
    }
    const isPasswordValid = await bcrypt.compare(currentPassword, user[0].password);
    if (!isPasswordValid) {
        res.status(401).json({message: 'Invalid password'});
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
