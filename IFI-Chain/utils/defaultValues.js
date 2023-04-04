const DIFFICULTY = 4;
const MINE_RATE = 3000 //in milliseconds
const INITIAL_BALANCE = 500;
const TRANSACTION_THRESHOLD = 3;

const FIXEDTRANSACTION = [{
    id: "12aa63f0-ab56-4313-9efd-0a530576a7a6",
    input: {
        timestamp: 1548907555886,
        amount: 500,
        address:
            "041fe3c9432f674ecf996f36cc7652d30ad191d82ed5550b0c9ac1f5f6dc7f5bf7e411f65ec202fba8eda89e792844438065b3dd7c5e3ab8f8ece76a9f516759c1",
        signature: {
            r: "562025949be9272061c44542f8702556fcc34cff6a3f98c03702954624662c03",
            s: "b4f98bd7220a3a613964aa52778c4b0a0dfdc48007ddc790e98eaff14d829e8f",
            recoveryParam: 0
        }
    },
        outputs: [
        {
            amount: 500,
            address:
                "041fe3c9432f674ecf996f36cc7652d30ad191d82ed5550b0c9ac1f5f6dc7f5bf7e411f65ec202fba8eda89e792844438065b3dd7c5e3ab8f8ece76a9f516759c1"
        },
        {
            amount: 0,
            address:
                "045408775c00eb80e8b40cb91c4e52669af96be21c59e30b54a0d9eb7e6691f62f6498afcd708a914e64e727112800945ec4f32a6946d8d9d1e8da5b28dc356e35"
        }
    ]
}];

module.exports = {
    DIFFICULTY,
    MINE_RATE,
    INITIAL_BALANCE,
    TRANSACTION_THRESHOLD,
    FIXEDTRANSACTION
}