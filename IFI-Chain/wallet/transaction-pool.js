const TransactionClass = require('./transaction');
const Transaction = new TransactionClass();

class TransactionPool {
    constructor() {
        this.transactions = [];
    }

    updateOrAddTransaction(transaction) {
        let transactionWithId = this.transactions.find(t => t.id === transaction.id);

        if (transactionWithId) {
            this.transactions[this.transactions.indexOf(transactionWithId)] = transaction;
        } else {
            this.transactions.push(transaction);
        }
    }

    existingTransaction(address) {
        return this.transactions.find(t => t.input.address === address);
    }

    validTransactions() {
        return this.transactions.filter(transaction => {
            const outputTotal = transaction.outputs.reduce((total, output) => {
                console.log(26, `total: ${total}; output.amount: ${output.amount}`);
                return Number(total) + Number(output.amount);
            }, 0);
            if (transaction.input.amount !== outputTotal) {
                console.log(30, `input.amount: ${transaction.input.amount}`);
                console.log(28, `Invalid transaction from ${transaction.input.address}`);
                return;
            }
            if (!Transaction.verifyTransaction(transaction)) {
                console.log(32, `Invalid signature from ${transaction.input.address}`);
                return;
            }
            return transaction;
        });
    }

    // return true if transaction id valid
    checkValidTransaction(transactionColl) {
        for (let i = 0; i < transactionColl.length; i++) {
            const outputTotal = transactionColl[i].outputs.reduce((total, output) => {
                return total + output.amount;
            }, 0);

            if ((transactionColl[i].input.amount !== outputTotal) || (!transactionModel.verifyTransaction(transactionColl[i]))) {
                return false;
            }
        }
        return true;
    }

    clear() {
        this.transactions = [];
    }

    clearById(tranId) {
        let removedTransaction = this.transactions.find(transaction => transaction.id = tranId);

        let idx = this.transactions.indexOf(removedTransaction);

        this.transactions.splice(idx, 1);

        return this.transactions;
    }
}
module.exports = TransactionPool;