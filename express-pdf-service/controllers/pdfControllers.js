var path = require("path");
var pdf = require('html-pdf');
var fs = require('fs');
const mv = require('mv');
var handlebars = require("handlebars");
var admin = require("firebase-admin");
// const puppeteer = require('puppeteer')
var serviceAccount = require("../config/firebase-key.json");
var UUID = require('uuid-v4');
let uuid = UUID()


admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: "https://power-x-user.firebaseio.com"
});


const DB = admin.firestore();


let getPdf = async (req, res, next) => {
    let userid = req.query.invoiceNo;
    DB.collection("pdfCollections").doc(userid).get().then((doc) => {
        if (doc.exists) {
            console.log("Document data:", doc.data(doc));
            return res.status(200).send(doc.data(doc))
        } else {
            // doc.data() will be undefined in this case
            console.log("No such document!");
            return res.status(400).send("no such pdf to get:")
        }
    }).catch((error) => {
        console.log("Failed to read data:", error);
        return res.status(500).send("Failed to read data:")
    });
}

let postPdf = async (req, res, next) => {
    try {
        let url = ""
        let data = req.body
        for (let i = 0; i < data.length; i++) {
            // console.log("data", data[i]);
            if (data[i].length === 0) {
                console.log("data not found");
            } else {
                const d_t = new Date();
                let year = d_t.getFullYear();
                let month = d_t.getMonth();
                let day = d_t.getDate();
                let hour = d_t.getHours();
                let minute = d_t.getMinutes();
                let millisec = d_t.getMilliseconds();
                // const filePath = path.join(__dirname + '/index.html'); //file path
                const filePath = path.join(__dirname + '/../tmp/index.html')
                const source = fs.readFileSync(path.resolve(__dirname, filePath), 'utf8').toString(); //file reading
                const template = handlebars.compile(source);//store file source in template
                let totalAmount = data[i].item
                let totalval=0;
                totalAmount.map(val=>{
                    totalval= totalval+(val.itemPrice*val.quantity)
                    // console.log("val.itemPrice",totalval);
                })
                let arr=[];
                let totqut;
                totalAmount.map((val,index)=>{
                    let obj = {}
                    totqut =val.itemPrice*val.quantity;
                    // console.log("val.itemPrice*val.quantity",totqut);
                    obj[`totalAmt`]=totqut
                    arr.push(obj);
                    // return totqut;
                })
                // console.log("totalval",arr);
                const replace = { //replace the data getting from the body
                    companyName: data[i].companyName,
                    companyAdress: data[i].companyAdress,
                    invoiceNo: data[i].invoiceNo,
                    item: data[i].item,
                    date: day+"/"+month+"/"+year,
                    total:arr,
                    subTotal:totalval
                };
                const htmlToSend = template(replace);//pass the repalce object in template 
                // console.log("htmlToSend",replace.total);
                var html;
                // const d_t = new Date();
                // let year = d_t.getFullYear();
                // let month = d_t.getMonth();
                // let day = d_t.getDate();
                // let hour = d_t.getHours();
                // let minute = d_t.getMinutes();
                // let millisec = d_t.getMilliseconds();

                var baseFileName = `${year}${month}${hour}${minute}${millisec}`;

                var options = { format: 'Letter', timeout: 540000 };
                var gerrateddoc = path.basename(`pdfFile${baseFileName}.pdf`)
                console.log("gerrateddoc", gerrateddoc);

                // process.env.LD_LIBRARY_PATH = path.join(process.cwd(), 'bins')
                // process.env.FONTCONFIG_PATH = path.join(process.cwd(), 'fonts')

                // pdf creating file
                pdf.create(htmlToSend,options).toFile(`./${gerrateddoc}`, function (err, data) {
                    if (err) return console.log(err);

                    let sendData = path.basename(`${data.filename}`)

                    const currentPath = sendData
                    // creating a exact path to store in the perticular folder
                    const destinationPath = path.join(__dirname, "../tmp", sendData);

                    mv(currentPath, destinationPath, function (err) {
                        if (err) {
                            console.log(err);
                        } else {
                            console.log("Successfully moved the file!");
                        }
                    });

                    let sourceFileName = path.join(__dirname, "../tmp", sendData);
                    // console.log("sourceFileName", sourceFileName);
                    // creating path for to store the pdf file in firestorage
                    const destdirname = "pdf-service/" + "codeswift/" + sendData;

                    const bucket = admin.storage().bucket('power-x-user.appspot.com');
                    // upload the pdf file in created path in fire storage
                    bucket.upload(sourceFileName, {
                        destination: destdirname,
                        public: true,
                        uploadType: "media",
                        metadata: {
                            contentType: 'application/pdf/text/csv/png',
                            metadata: {
                                firebaseUrl: uuid
                            }
                        }
                    }, (err, resp) => {
                        if (err) {
                            console.log(err);
                            return;
                        } else {
                            // console.log("publicUrl", res);
                            url = resp.metadata.mediaLink;
                            console.log(url);
                            // store the download url in firestore database
                            DB.collection("pdfCollections").doc(replace.invoiceNo).set({
                                pdflink: url,
                                timestamp: new Date()
                            }).then(() => {
                                console.log("Document successfully written!");
                            }).catch((error) => {
                                console.error("Error writing document: ", error);
                            });

                            // pdf created file delete after send to firestoredatabase
                            fs.unlink(sourceFileName, (err) => {
                                if (err) console.log(err);
                                console.log('path/file.pdf was deleted');
                            });
                            return res.status(200).json({ url })
                        }
                    })
                });
            }

        }
    } catch (err) {
        next(err)
    }
}


module.exports = { postPdf, getPdf }