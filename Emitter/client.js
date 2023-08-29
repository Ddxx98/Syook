const ioClient = require('socket.io-client');
const CryptoJS = require('crypto-js');
const socket = ioClient('http://localhost:5000'); // Listener service URL

const data = require('./data.json');
const secretKey = 'syook';

function encryptData(data) {
    return CryptoJS.AES.encrypt(data, secretKey).toString();
}

function generateRandomData(i) {
    const item = data[i];

    const message = {
        name: item.name,
        origin: item.origin,
        destination: item.destination,
        secret_key: CryptoJS.SHA256(item.name + item.origin + item.destination).toString()
    };

    return JSON.stringify(message);
}

function sendEncryptedData() {
    for (let i = 0; i < data.length; i++) {
        const encryptedMessage = encryptData(generateRandomData(i));
        socket.emit('encryptedData', encryptedMessage);
    }
}

// Emit encrypted data every 10 seconds
setInterval(sendEncryptedData, 10000);
