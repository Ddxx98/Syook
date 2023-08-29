const express = require('express');
const mongoose = require('mongoose');
const CryptoJS = require('crypto-js');
const app = express(); 
const http = require('http').Server(app);
const path = require('path');
const io = require("socket.io")(http);

const PORT = process.env.PORT || 5000
const secretKey = 'syook';


const MONGO_URI = 'mongodb+srv://deexith2016:9BcPF6lMARj8RySY@cluster0.bbhxwwb.mongodb.net/?retryWrites=true&w=majority'
mongoose.connect(process.env.MONGO_URI || MONGO_URI,{
    useNewUrlParser:true
})
    .then(()=>{console.log("Connected to database")}).catch((err)=>{
    console.log("Error")
});

const timeseriesSchema = new mongoose.Schema({
    minute: Date,
    data: [{
        name: String,
        origin: String,
        destination: String,
        timestamp: Date
    }]
});
const TimeseriesModel = mongoose.model('Timeseries', timeseriesSchema);

io.on('connection', (socket) => {
    console.log('Emitter connected');

    socket.on('encryptedData', (encryptedData) => {
        const decryptedData = CryptoJS.AES.decrypt(encryptedData, secretKey).toString(CryptoJS.enc.Utf8);
        try {
            const message = JSON.parse(decryptedData);
            if (validateMessage(message)) {
                saveToDatabase(message);
            } else {
                console.log('Data integrity compromised, discarding operation');
            }
        } catch (error) {
            console.error('Error processing data:', error);
        }
    });
});

function validateMessage(message) {
    const calculatedHash = CryptoJS.SHA256(message.name + message.origin + message.destination).toString();
    return calculatedHash === message.secret_key;
}

function saveToDatabase(message) {
    const now = new Date();
    const currentMinute = new Date(now.getFullYear(), now.getMonth(), now.getDate(), now.getHours(), now.getMinutes());

    TimeseriesModel.findOneAndUpdate(
        { minute: currentMinute },
        {
            $push: {
                data: {
                    name: message.name,
                    origin: message.origin,
                    destination: message.destination,
                    timestamp: new Date()
                }
            }
        },
        { upsert: true, new: true }
    )
    .then(() => {
        console.log('Data saved:', message);
    })
    .catch((err) => {
        console.error('Error saving timeseries:', err);
    });
}

app.use(express.static(path.join(__dirname, 'src')));
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname,'src/index.html'))
});

app.get('/data',async(req,res)=>{
    const posts = await TimeseriesModel.find({})
    console.log(posts)
    res.status(200).json({
        posts
    }) 
})

http.listen(PORT,()=>{  
    console.log(`App listening on port ${PORT}`);
})