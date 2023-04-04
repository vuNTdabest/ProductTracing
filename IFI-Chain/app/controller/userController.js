const fs = require("fs");
const path = require("path");
const WalletAcc = require("../../accounts/walletAcc");
const P2PServer = require("../p2p-server");
const p2pServer = new P2PServer();
var listUserRequest = [];

exports.getPendingList = function (req, res) {
  const publicKey = req.params.publicKey;
  var list = [];

  p2pServer.transactionPool.transactions.forEach(transaction => {
    if (transaction.input.address === publicKey) {
      transaction.outputs.forEach(output => {
        if (output.address !== publicKey) {
          if (output.type === "Transfer") {
            let data =
              "You transfered " +
              output.amount +
              " coins to address " +
              output.address;
            list.push(data);
          } else if (output.type === "Buy") {
            let data =
              "You bought " +
              output.data.quantity +
              " " +
              output.data.productName +
              " with " +
              output.amount +
              " coins.";
            list.push(data);
          }
        }
      });
    }
  });
  return res.json(list);
};

exports.getRequests = function (req, res) {
  const publicKey = req.params.publicKey;
  var requests = [];
  let file = path.resolve("../backup/UserRequestList.txt");
  if (listUserRequest.length === 0) {
    if (fs.existsSync(file)) {
      const userRequests = fs.readFileSync(file, "utf8");
      var list;
      if (userRequests !== "") {
        list = JSON.parse(userRequests);
      } else {
        list = [];
      }
      list.forEach(request => {
        listUserRequest.push(request);
      });
    }
  } else {
    listUserRequest = [];
    if (fs.existsSync(file)) {
      const userRequests = fs.readFileSync(file, "utf8");
      var list;
      if (userRequests !== "") {
        list = JSON.parse(userRequests);
      } else {
        list = [];
      }
      list.forEach(request => {
        listUserRequest.push(request);
      });
    }
  }

  listUserRequest.forEach(request => {
    if (request.userAddress === publicKey) {
      let data =
        "You bought " +
        request.quantity +
        " " +
        request.productName +
        " with " +
        request.total +
        " coins.";
      requests.push(data);
    }
  });

  return res.json(requests);
};
