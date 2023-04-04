const { TRANSACTION_THRESHOLD } = require('../utils/defaultValues');
const fs = require('fs');
const axios = require('axios');

class Miner {
    constructor(blockchain, transactionPool) {
        this.blockchain = blockchain;
        this.transactionPool = transactionPool;
    }

    mine() {

        if (this.blockchain.chain.length == 1) {
            let file = "../backup/chainPORT5000.txt";
            if (fs.existsSync(file)) {
                let listSuccess = fs.readFileSync(file, "utf8");
                if (listSuccess != "") {
                    let list = JSON.parse(listSuccess);
                    this.blockchain.chain = [];
                    list.forEach(transaction => {
                        this.blockchain.chain.push(transaction);
                    });
                }
            }
        };

        if (this.transactionPool.transactions.length == 0) {
            console.log(28, this.transactionPool.transactions.length);
            let file = "../backup/PendingList.txt";
            if (fs.existsSync(file)) {
                let listPending = fs.readFileSync(file, "utf8");
                console.log(32, listPending);
                if (listPending != "") {
                    let list = JSON.parse(listPending);
                    console.log(35, list);
                    list.forEach(transaction => {
                        this.transactionPool.transactions.push(transaction);
                    });
                }
            }
            console.log(41, this.transactionPool.transactions);
        }

        var invalidTransaction = [];
        var validTransactions = [];
        // if charge transactions, not check valid
        if (this.transactionPool.transactions.length !== 0) {
            for (let i = 0; i < this.transactionPool.transactions.length; i++) {
                if (this.transactionPool.transactions[i].input.address !== "Coin Base") {
                    if (this.transactionPool.checkValidTransaction(this.transactionPool.transactions[i])) {
                        validTransactions.push(this.transactionPool.transactions[i]);
                    } else {
                        invalidTransaction.push(this.transactionPool.transactions[i]);

                        // store fail transactions
                        fs.writeFile('../backup/FailList.txt', JSON.stringify(invalidTransaction), function (err) {
                            if (err) {
                                console.error(err);
                            }
                            console.log("store fail transactions successfully!");
                        });
                    }
                } else {
                    validTransactions.push(this.transactionPool.transactions[i]);
                }
            }
        }



        if (TRANSACTION_THRESHOLD >= 1 && typeof (TRANSACTION_THRESHOLD) === 'number') {

            const minedTransactions = validTransactions.slice(0, TRANSACTION_THRESHOLD);

            if (minedTransactions.length === TRANSACTION_THRESHOLD || minedTransactions.length !== 0) {
                this.blockchain.addBlock(minedTransactions);
                console.log(77, minedTransactions);
                let fileLog = '../backup/fileLog.txt';
                let data = "One block was just mined and added to the chain " ;
                fs.appendFile(fileLog, JSON.stringify(data), function (err) {
                    if (err) throw err;
                    console.log('already written in the file log');
                });
            }

            for (let i = 0; i < minedTransactions.length; i++) {
                if (minedTransactions[i]) {
                    this.transactionPool.clearById(minedTransactions[i].id);
                }
            }
            console.log(100, validTransactions);
            // store pending transactions
            fs.writeFile('../backup/PendingList.txt', JSON.stringify(this.transactionPool.transactions), function (err) {
                if (err) {
                    console.error(err);
                }
                console.log("store pending transactions successfully!");
            });
        } else {
            console.log("TRANSACTION_THRESHOLD is not valid!!!");
        }

        // backup success transactions
        let successTrans = [];
        for (let i = 1; i < this.blockchain.chain.length; i++) {
            successTrans.push(this.blockchain.chain[i].data);
        }
        // write success transactions to file SuccessTransactions.txt
        fs.writeFile('../backup/SuccessList.txt', JSON.stringify(successTrans), function (err) {
            if (err) {
                return console.error(err);
            }
            console.log("store success transaction successfully!");
        });
    }
}
module.exports = Miner;