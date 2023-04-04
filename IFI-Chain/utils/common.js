const EC = require('elliptic').ec;
const ec = new EC('secp256k1');

const uuidV1 = require('uuid/v1');

const SHA256 = require('crypto-js/sha256');

class Common{
    genKeyPair(){
        return ec.genKeyPair();
    }

    id(){
        return uuidV1();
    }

    hash(data){
        return SHA256(JSON.stringify(data)).toString();
    }

    verifySignature(publicKey, signature, dataHash){
        return ec.keyFromPublic(publicKey, 'hex').verify(dataHash, signature);
    }
}
module.exports = Common;