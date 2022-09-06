let express = require('express');
// const multer = require('multer');
var files = require('../controllers/pdfControllers');
// const uploadPFD = require('../service/firbase')

let pdfRouter = express.Router();


// const Multer = multer({
// storage:multer.memoryStorage(),
// limits:1024 *1024
// })

let pdfController = require('../controllers/pdfControllers');


// pdfRouter.post('/firebasestore',Multer.single(`${files.sendData}`),uploadPFD.uploadPDF)
pdfRouter.post('/createInvoiceBillPdf',  pdfController.postPdf);
pdfRouter.get('/getInvoiceBillPdf', pdfController.getPdf);

module.exports = pdfRouter;