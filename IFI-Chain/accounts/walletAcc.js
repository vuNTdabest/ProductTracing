const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const walletSchema = Schema({
    walletId: {
        type: String,
        required: true
    },
    publicKey: String,
    privateKey: String,
    balance: Number,
    createdTime: {
        type: Date,
        default: Date.now()
    }
});

const Wallet = module.exports = mongoose.model('wallet', walletSchema);
module.exports.get = function(callback, limit){
    Wallet.find(callback).limit(limit);
}