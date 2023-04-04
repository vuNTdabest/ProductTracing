const Common = require('../utils/common');
const common = new Common();

class Transaction {
    constructor() {
        this.id = common.id();
        this.input = null;
        this.outputs = [];
    }

    update(senderWallet, recipient, amount, type, data) {
        const senderOutput = this.outputs.find(output => output.address === senderWallet.publicKey);

        if (amount > senderWallet.amount) {
            console.log(15, `Amount ${amount} exceeds the current balance`);
            return;
        }

        senderOutput.amount = senderOutput.amount - amount;
        if (type !== "Buy") {
            this.outputs.push({ type: type, amount: amount, address: recipient });
        } else {
            this.outputs.push({ type: type, amount: amount, address: recipient, data: data });
        }
        this.signTransaction(this, senderWallet);

        return this;
    }

    newTransaction(senderWallet, recipient, amount, type, data) {
        if (amount > senderWallet.balance) {
            console.log(28, `The amount ${amount} exceeds the balance`);
            return;
        }
        if (type !== "Buy" && type !== "Import") {
            return this.transactionWithOutputs(senderWallet, [
                { amount: senderWallet.balance - amount, address: senderWallet.publicKey },
                { type: type, amount: amount, address: recipient }
            ]);
        } else {
            return this.transactionWithOutputs(senderWallet, [
                { amount: senderWallet.balance - amount, address: senderWallet.publicKey },
                { type: type, amount: amount, address: recipient, data: data }
            ]);
        }

    }

    transactionWithOutputs(senderWallet, outputs) {
        const transaction = new Transaction();
        transaction.outputs.push(...outputs);
        this.signTransaction(transaction, senderWallet);
        return transaction;
    }

    signTransaction(transaction, senderWallet) {
        transaction.input = {
            timestamp: Date.now(),
            amount: senderWallet.balance,
            address: senderWallet.publicKey,
            signature: senderWallet.sign(common.hash(transaction.outputs))
        }
    }

    verifyTransaction(transaction) {
        return common.verifySignature(
            transaction.input.address,
            transaction.input.signature,
            common.hash(transaction.outputs)
        );
    }
}
module.exports = Transaction;