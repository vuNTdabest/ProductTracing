const dateFormat = require("dateformat");
const Utils = require("../../utils/common");
const utils = new Utils();
const fs = require("fs");
const path = require("path");
const axios = require("axios");
const WalletClass = require("../../wallet/wallet");
const WalletAcc = require("../../accounts/walletAcc");
const P2PServer = require("../p2p-server");
const p2pServer = new P2PServer();
const Product = require("../product.detail/product");
var listSellerRequest = [];
var listInfo = [];
var failList = [];


exports.requestToSuppliers = function (req, res) {
  const product = req.body.productName;
  const quantityOfProduct = req.body.quantity;
  const publicKey = req.body.publicKey;
  const brand = req.body.brand;
  const username = req.body.username;
  const supplier = req.body.supplier;
  const supplierName = req.body.supplierName;

  WalletAcc.findOne({ publicKey: publicKey }).exec(function (err, walletAcc) {
    if (err)
      return res.json({
        message: "Could not find the wallet because of " + err,
        typeMess: 'error'
      });
    else if (!walletAcc)
      return res.json({
        message: "Could not find the wallet with publicKey " + publicKey,
        typeMess: 'error'
      });
    else {
      let request = {
        requestId: utils.id(),
        userAddress: publicKey,
        productName: product,
        quantity: quantityOfProduct,
        username: username,
        brand: brand,
        supplier: supplier,
        supplierName: supplierName
      };
      listSellerRequest.push(request);
      const file = path.resolve("../backup/SellerRequestList.txt");
      fs.writeFile(file, JSON.stringify(listSellerRequest), function (err) {
        if (err) {
          return console.error(err);
        }
      });
      console.log(64, "listSellerRequest " + listSellerRequest);
      return res.json({
        message:
          "You requested successfully. Please wait for the supplier to accept",
        typeMess: 'success',
        request: listSellerRequest
      });
    }
  });
};

exports.getSellerRequests = function (req, res) {
  var recordTotal = Number(req.params.maxResultCount);
  var currentPageNumber = Number(req.params.pageNumber);
  var supplier = req.params.supplier;
  const file = path.resolve("../backup/SellerRequestList.txt");
  if (listSellerRequest.length === 0) {
    if (fs.existsSync(file)) {
      let sellerRequests = fs.readFileSync(file, "utf8");
      if (sellerRequests !== "") {
        var list = JSON.parse(sellerRequests);
      } else {
        list = [];
      }

      list.forEach(request => {
        if (request.supplier == supplier) {
          listSellerRequest.push(request);
        }
      });
    }
  }

  let totalRecords = 0;
  let sellerRequests = [];
  let pageList = [];
  console.log(331, recordTotal, currentPageNumber);

  listSellerRequest.forEach(req => {
    if (req.supplier == supplier) {
      sellerRequests.push(req);
    }
  })

  if (sellerRequests != null) {

    totalRecords = sellerRequests.length;

    let start = (currentPageNumber - 1) * recordTotal;
    let slicedNumber = start + recordTotal;

    pageList = sellerRequests.slice(start, slicedNumber);
  }
  var result = { totalRecords, pageList };

  return res.json(result);
};

exports.deleteDetail = function (req, res) {
  const selectedConsignments = JSON.parse(req.params.selectedConsignments);
  var removedConsignment;
  for (let i = 0; i < selectedConsignments.length; i++) {
    listInfo.forEach(listDetail => {
      if (listDetail.productCode == selectedConsignments[i].productCode) {
        removedConsignment = listDetail;
      }
    })
    let idx = listInfo.indexOf(removedConsignment);

    console.log(135, idx)

    listInfo.splice(idx, 1);
  }


  console.log(139, listInfo);

  return res.json({
    message: "Delete successfully!",
    typeMess: 'success'
  });
}

exports.getDetail = function (req, res) {
  var recordTotal = Number(req.params.maxResultCount);
  var currentPageNumber = Number(req.params.pageNumber);

  var totalRecords = listInfo.length;

  let start = (currentPageNumber - 1) * recordTotal;
  let slicedNumber = start + recordTotal;

  var pageList = listInfo.slice(start, slicedNumber);
  var result = { totalRecords, pageList };

  console.log()
  return res.json(result);
}

exports.deleteSellerRequest = function (req, res) {
  const sellerRequest = JSON.parse(req.params.sellerRequest);

  var removedRequest;
  // for (let i = 0; i < sellerRequest.length; i++) {
  listSellerRequest.forEach(listReq => {
    if (listReq.requestId == sellerRequest.requestId) {
      removedRequest = listReq;
    }
  })
  let idx = listSellerRequest.indexOf(removedRequest);

  listSellerRequest.splice(idx, 1);
  // }


  console.log(139, listSellerRequest);

  return res.json({
    message: "Delete successfully!",
    typeMess: 'success'
  });
}

exports.makeTransaction = function (req, res) {
  const reqId = req.body.requestId;
  const publicKey = req.body.userAddress;
  const supplier = req.body.supplier;
  const soldDate = dateFormat(new Date(), "dd/mm/yyyy");
  const listData = req.body.listData;
  const type = "Import";
  var balanceAvailable;

  const failListPath = path.resolve("../backup/FailList.txt");
  const sellerRequestPath = path.resolve("../backup/SellerRequestList.txt");

  WalletAcc.findOne({ publicKey: publicKey }).exec(function (err, walletAcc) {
    if (err) return res.json({ message: err, typeMess: "error" });
    else if (!walletAcc)
      return res.json({
        message: "Could not find the wallet with public key " + publicKey,
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

      var requestOfSeller;
      for (var i = 0; i < listSellerRequest.length; i++) {
        if (listSellerRequest[i].requestId == reqId) {
          requestOfSeller = listSellerRequest[i];
        }
      }

      var totalAmount = 0;
      var totalOfPackage = 0;
      listData.forEach(package => {
        if (package.productName == requestOfSeller.productName) {
          totalAmount += Number(package.totalAmount);
          totalOfPackage += 1;
        }
      });

      if (totalAmount > balanceAvailable || totalAmount < 0) {
        let returnedData = {message: "The amount is larger than the available balance of the retailer. Hence request " + requestOfSeller.requestId + " could not be done",
                            requestDetail: requestOfSeller };
        failList.push(returnedData);
        console.log(301, failList)
        fs.writeFile(failListPath, JSON.stringify(failList), function (err) {
          if (err) {
            return console.error(err);
          }
        });
        console.log(303, "fail list " + failList);
        listSellerRequest.forEach(request => {
          if (request.requestId == reqId) {
            let requestIndex = listSellerRequest.indexOf(request);
            listSellerRequest.splice(requestIndex, 1);
          }
        })
 
        fs.writeFile(sellerRequestPath, JSON.stringify(listSellerRequest), function (err) {
          if (err) {
            return console.error(err);
          }
          console.log(163, "store listSellerRequest successfully!");
        });
        return res.json({message: "The retailer's balance is not enough to pay", typeMess: "error"});
      } else {
        if (totalOfPackage == requestOfSeller.quantity) {
          var bill = {
            soldDate: soldDate,
            request: requestOfSeller,
            bill: listData
          };

          transaction = wallet.createTransaction(
            supplier,
            totalAmount,
            p2pServer.transactionPool,
            p2pServer.blockchain,
            type,
            bill
          );
          balance = wallet.calculateBalance(p2pServer.blockchain);
          listSellerRequest.forEach(request => {
            if (request.requestId == reqId) {
              let requestIndex = listSellerRequest.indexOf(request);
              listSellerRequest.splice(requestIndex, 1);
            }
          })
   
          fs.writeFile(sellerRequestPath, JSON.stringify(listSellerRequest), function (err) {
            if (err) {
              return console.error(err);
            }
            console.log(163, "store listSellerRequest successfully!");
          });

          listData.forEach(package => {
            Product.deleteOne({ productCode: package.productCode }, function (err, message) {
              if (err) throw err;
              else
                console.log(348, "deleted successfully");
            })
          })

          var removedConsignment;
          for (let i = 0; i < listData.length; i++) {
            listInfo.forEach(listDetail => {
              if (listDetail.productCode == listData[i].productCode) {
                removedConsignment = listDetail;
              }
            })
            let idx = listInfo.indexOf(removedConsignment);

            console.log(135, idx)

            listInfo.splice(idx, 1);
          }

          return res.json({
            balance: balance,
            message: "Successfully",
            typeMess: "success",
            transaction: transaction,
            listInfo: listInfo
          });
        } else {
          return res.json({ message: "Bill is not matched with the quanity of consignments in the request", typeMess: "error" });
        }
      }
    }
  });
};

exports.getBill = function (req, res) {
  const currentPageNumber = req.params.pageNumber;
  const recordTotal = req.params.maxResultCount;
  const publicKey = req.params.publicKey;
  const productName = req.params.productName;

  WalletAcc.findOne({ publicKey: publicKey }).exec(function (err, walletAcc) {
    if (err) return res.json({ message: err, typeMess: "error" });
    else if (!walletAcc)
      return res.json({
        message: "Could not find the wallet with public key " + publicKey, typeMess: "error"
      });
    else {
      function getProductAvailable() {
        return axios
          .get(`http://localhost:3000/seller/check_quantities/${publicKey}/${productName}`)
          .then(response => {
            return response.data;
          });
      }
      getProductAvailable().then(data => {
        if (data.message == "Error" || data.message == "Sold out") {
          let pageList = 0;
          let totalRecords = 0;
          return res.json({ message: data.message, typeMess: "error", pageList, totalRecords });
        }
        var totalRecords = (data.list).length;
        let start = (currentPageNumber - 1) * recordTotal;
        let slicedNumber = start + recordTotal;

        var pageList = data.list.slice(start, slicedNumber);
        var result = { totalRecords, pageList };

        return res.json(result);
      });

    }
  })
}


