const dateFormat = require("dateformat");
const Utils = require("../../utils/common");
const utils = new Utils();
const axios = require("axios");
const WalletClass = require("../../wallet/wallet");
const WalletAcc = require("../../accounts/walletAcc");
const UserAcc = require("../../accounts/userAcc");
const P2PServer = require("../p2p-server");
const p2pServer = new P2PServer();
const path = require('path');
const fs = require('fs');
var failList = []

exports.updateBalance = function (req, res) {
  let walletId = req.params.walletId;
  WalletAcc.findOne({ walletId: walletId }).exec(function (err, walletAcc) {
    if (err)
      return res.json({
        message: "Could not find the wallet detail because of " + err,
        typeMess: 'error'
      });
    else if (!walletAcc)
      return res.json({
        message: "Could not find the wallet with id " + walletId,
        typeMess: 'error'
      });
    else {
      let wallet = new WalletClass(walletAcc);
      let balance = wallet.calculateBalance(p2pServer.blockchain);
      return res.json(balance);
    }
  });
};

exports.getSuccessList = function (req, res) {
  const publicKey = req.params.publicKey;
  let list = [];
  function getBlocks() {
    return axios
      .get("http://localhost:3000/blockchain/blocks")
      .then(response => {
        return response.data;
      });
  }
  getBlocks().then(data => {
    data.forEach(block => {
      block.data.forEach(transactionData => {
        const sender = transactionData.input.address;
        if (transactionData.input.address === publicKey) {
          transactionData.outputs.forEach(output => {
            if (output.type === "Charge") {
              let data = "You charged " +
                output.amount +
                " coins to the address " +
                output.address
              list.push({ msg: data, type: "Charge" });
            } else if (output.type === "Transfer") {
              let data = "You transfered " +
                output.amount +
                " coins to the address " +
                output.address;
              list.push({ msg: data, type: "Transfer" });
            } else if (output.type === "Buy") {
              let data = {
                requestId: output.data.request.requestId, info: "You bought " +
                  output.data.request.quantity +
                  " " +
                  output.data.request.productName +
                  " with " +
                  output.amount +
                  " coins."
              }
              list.push({ msg: data, type: "Buy" });
            } else if (output.type === "Import") {
              let data = {
                requestId: output.data.request.requestId, info: "You imported " +
                  ((output.data).request).quantity +
                  " " + ((output.data).request).productName +
                  " consigments with " +
                  output.amount +
                  " coins."
              }
              list.push({ msg: data, type: "Import" });
            }
          });
        } else {
          transactionData.outputs.forEach(output => {
            if (output.address === publicKey) {
              if (output.type === "Charge") {
                let data =
                  "You received " +
                  output.amount +
                  " coins from the address " +
                  sender;
                list.push({ msg: data, type: "Charge" });
              } else if (output.type === "Transfer") {
                let data = "You received " +
                  output.amount +
                  " coins from the address " +
                  sender;
                list.push({ msg: data, type: "Transfer" });
              } else if (output.type === "Buy") {
                let data = {
                  requestId: output.data.request.requestId, info: "You sold the product: " +
                    output.data.request.productName +
                    " with the number: " +
                    output.data.request.quantity +
                    " and the total amount: " +
                    output.amount +
                    " coins to the user address " +
                    sender
                }
                list.push({ msg: data, type: "Buy" });
              } else if (output.type === "Import") {
                let data = {
                  requestId: output.data.request.requestId, info: "You exported " +
                    ((output.data).request).quantity +
                    " consignments of the product  " +
                    ((output.data).request).productName +
                    " from the " +
                    ((output.data).request).brand +
                    " manufacturer and the total amount is " +
                    output.amount +
                    " coins."
                }

                list.push({ msg: data, type: "Import" });
              }
            }
          });
        }
      });
    });
    return res.json(list);
  });
};


exports.transfer = function (req, res) {
  const amount = req.body.amount;
  const receiver = req.body.receiver;
  const publicKey = req.body.publicKey;
  const type = "Transfer";
  var balanceAvailable;

  WalletAcc.findOne({ publicKey: receiver }).exec(function (err, walletAcc) {
    if (err)
      return res.json({
        message: "Having some problems with finding the wallet",
        typeMess: 'error'
      });
    else if (!walletAcc)
      return res.json({
        message: "The receiver's address is not existed",
        typeMess: 'error'
      });
    else {
      WalletAcc.findOne({ publicKey: publicKey }).exec(function (
        err,
        walletAcc
      ) {
        if (err)
          return res.json({
            message: "Could not find the wallet because of some error",
            typeMess: 'error'
          });
        else if (!walletAcc)
          return res.json({
            message: "Could not find the wallet with publicKey " + publicKey,
            typeMess: 'error'
          });
        else {
          const wallet = new WalletClass(walletAcc);

          if (p2pServer.transactionPool.transactions.length === 0) {
            balanceAvailable = wallet.calculateBalance(p2pServer.blockchain);
          } else {
            balanceAvailable = wallet.calculateBalanceAvailable(
              p2pServer.transactionPool
            );
          }
          if (balanceAvailable < amount) {
            return res.json({ message: "The amount exceeds the balance", type: "error" });
          }
          wallet.createTransaction(
            receiver,
            amount,
            p2pServer.transactionPool,
            p2pServer.blockchain,
            type
          );
          const balance = wallet.calculateBalance(p2pServer.blockchain);
          console.log(73, `balance after mining ${balance}`);
          return res.json({
            typeMess: "success",
            balance: balance,
            message: "Transfered successfully",
            typeMess: 'success'
          });
        }
      });
    }
  });
};

exports.getFailList = function (req, res) {
  const file = path.resolve("../backup/FailList.txt");
  const publicKey = req.params.publicKey;

  if (failList.length === 0) {
    if (fs.existsSync(file)) {
      const list = fs.readFileSync(file, "utf8");
      var failTransactions;
      if (list !== "") {
        failTransactions = JSON.parse(list);
        failTransactions.forEach(transaction => {
          failList.push(transaction)
        });
      } else {
        failTransactions = [];
      }
    }
  } else {
    failList = [];
    if (fs.existsSync(file)) {
      const list = fs.readFileSync(file, "utf8");
      var failTransactions;
      if (list !== "") {
        failTransactions = JSON.parse(list);
        failTransactions.forEach(transaction => {
          failList.push(transaction)
        });
      } else {
        failTransactions = [];
      }
    }
  }

  var returnedList = [];
  failList.forEach(transaction => {
    if (transaction.requestDetail.userAddress == publicKey) {
      returnedList.push(transaction);
    }
  })
  return res.json(returnedList);
}
//Api for Admin
exports.charge = function (req, res) {
  const amountMoney = req.body.amount;
  const walletId = req.body.walletId;

  WalletAcc.findOne({ walletId: walletId }).exec(function (err, walletAcc) {
    if (err) return res.json({ message: "Could not find the wallet", typeMess: "error" });
    else if (!walletAcc)
      return res.json({
        message: "Could not find the wallet with id " + walletId,
        typeMess: 'error'
      });
    else {
      const wallet = new WalletClass(walletAcc);
      const publicKey = wallet.publicKey;
      const outputs = [
        { amount: 0, address: "Coin Base" },
        {
          typeMess: "Charge",
          amount: amountMoney,
          address: publicKey
        }
      ];
      const transactionCharge = {
        transactionId: utils.id(),
        input: {
          timestamp: Date.now(),
          amount: Number(amountMoney),
          address: "Coin Base",
          signature: wallet.sign(utils.hash(outputs))
        },
        outputs: outputs
      };
      p2pServer.transactionPool.updateOrAddTransaction(transactionCharge);
      return res.json({
        message: "Charged successfully",
        typeMess: 'success'
      });
    }
  });
};

exports.getListCharching = function (req, res) {
  let chargingList = [];
  p2pServer.transactionPool.transactions.forEach(transaction => {
    if (transaction.input.address === "Coin Base") {
      transaction.outputs.forEach(output => {
        if (output.address !== "Coin Base") {
          let chargeTransaction =
            "You charged " + output.amount + " coins to " + output.address;
          chargingList.push(chargeTransaction);
        }
      });
    }
  });
  return res.json(chargingList);
};
