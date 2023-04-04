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
var listUserRequest = [];
var listSellerRequest = [];
const User = require('../../accounts/userAcc');

exports.getSeller = function (req, res) {
    User.get(function (err, users) {
        if (err) {
            res.json(err);
        } else {
            var seller;
            var sellers = [];
            users.forEach(user => {
                if (user.role == "seller") {
                    seller = { username: user.username, walletId: user.walletId, publicKey: '' };

                    sellers.push(seller);
                }
            })

            res.json(sellers);
        }
    });
}

exports.getRequests = function (req, res) {
    const publicKey = req.params.publicKey;
    var requests = [];
    let file = path.resolve("../backup/SellerRequestList.txt");

    if (listSellerRequest.length === 0) {
        if (fs.existsSync(file)) {
            const sellerRequests = fs.readFileSync(file, "utf8");
            var list;
            if (sellerRequests !== "") {
                list = JSON.parse(sellerRequests);
            } else {
                list = [];
            }
            list.forEach(request => {
                listSellerRequest.push(request);
            });
        }
    } else {
        listSellerRequest = [];
        if (fs.existsSync(file)) {
            const sellerRequests = fs.readFileSync(file, "utf8");
            var list;
            if (sellerRequests !== "") {
                list = JSON.parse(sellerRequests);
            } else {
                list = [];
            }
            list.forEach(request => {
                listSellerRequest.push(request);
            });
        }
    }

    listSellerRequest.forEach(request => {
        if (request.userAddress === publicKey) {
            let data =
                "You imported " +
                request.quantity +
                " consignment(s) " +
                request.productName +
                " of the brand " +
                request.brand;
            requests.push(data);
        }
    });

    return res.json(requests);
};

exports.buy = function (req, res) {
    const product = req.body.userchoice;
    const quantity = req.body.quantity;
    const publicKey = req.body.publicKey;
    const uname = req.body.username;
    const seller = req.body.seller;
    var total;
    var balanceAvailable;

    if (product === "Abrica") {
        total = quantity * 20;
    } else if (product === "Robusta") {
        total = quantity * 10;
    } else if (product === "Culi") {
        total = quantity * 12;
    }

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
            let wallet = new WalletClass(walletAcc);
            if (p2pServer.transactionPool.transactions.length === 0) {
                balanceAvailable = wallet.calculateBalance(p2pServer.blockchain);
            } else {
                balanceAvailable = wallet.calculateBalanceAvailable(
                    p2pServer.transactionPool
                );
            }

            if (balanceAvailable < total) {
                return res.json({
                    message: "The amount exceeds the balance",
                    typeMess: 'error',
                });
            } else {
                let request = {
                    requestId: utils.id(),
                    userAddress: publicKey,
                    username: uname,
                    productName: product,
                    total: total,
                    quantity: quantity,
                    seller: seller
                };
                listUserRequest.push(request);
                const file = path.resolve("../backup/UserRequestList.txt");
                fs.writeFile(file, JSON.stringify(listUserRequest), function (err) {
                    if (err) {
                        return console.error(err);
                    }
                    console.log(163, "store UserRequestList  successfully!");
                });
                console.log(133, listUserRequest);
                return res.json({
                    message:
                        "You requested successfully. Please wait for the seller to accept",
                    typeMess: 'success',
                });
            }
        }
    });
};

exports.getListUserRequest = function (req, res) {
    const recordNumer = Number(req.params.maxResultCount);
    const pageNumber = Number(req.params.pageNumber);
    const seller = req.params.seller;
    let file = path.resolve("../backup/UserRequestList.txt");
    console.log(279, file);
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
                if (request.seller == seller) {
                    listUserRequest.push(request);
                }
            });
        }
    }

    let userRequests = [];
    let totalRecords = 0;
    let pageList = [];
    listUserRequest.forEach(req => {
        if (req.seller == seller) {
            userRequests.push(req);
        }
    })

    if (userRequests != null) {
        totalRecords = userRequests.length;
        let start = (pageNumber - 1) * recordNumer;
        let slicedNumber = start + recordNumer;

        pageList = userRequests.slice(start, slicedNumber);
    }
    var result = { totalRecords, pageList };

    return res.json(result);
};


exports.createTransaction = function (req, res) {
    const reqId = req.body.requestId;
    const soldDate = dateFormat(new Date(), "dd/mm/yyyy");
    const listData = req.body.listData;
    const receiver = req.body.receiver;
    const userAddress = req.body.userAddress;
    const type = "Buy";

    WalletAcc.findOne({ publicKey: userAddress }).exec(function (err, walletAcc) {
        if (err)
            return res.json({
                message: "Could not find the wallet because of some error", typeMess: "error"
            });
        else if (!walletAcc)
            return res.json({
                message: "Could not find the wallet with publicKey " + publicKey, typeMess: "error"
            });
        else {
            const wallet = new WalletClass(walletAcc);
            var requestOfUser;
            listUserRequest.forEach(request => {
                if (request.requestId == reqId) {
                    requestOfUser = request;
                }
            });
            const productName = requestOfUser.productName;
            console.log(228, productName);
            const amount = requestOfUser.total;

            function getProductAvailable() {
                return axios
                    .get(`http://localhost:3000/seller/check_quantities/${receiver}/${productName}`)
                    .then(response => {
                        return response.data;
                    });
            }
            getProductAvailable().then(data => {

                if (data.message == productName && data.product >= requestOfUser.quantity) {
                    let bill = {
                        soldDate: soldDate,
                        request: requestOfUser,
                        bill: listData
                    };
                    let transaction = wallet.createTransaction(
                        receiver,
                        amount,
                        p2pServer.transactionPool,
                        p2pServer.blockchain,
                        type,
                        bill
                    );
                    const balance = wallet.calculateBalance(p2pServer.blockchain);
                    console.log(73, `balance after mining ${balance}`);
                    listUserRequest.forEach(request => {
                        if (request.requestId === reqId) {
                            let requestIndex = listUserRequest.indexOf(request);

                            listUserRequest.splice(requestIndex, 1);
                        }
                    });
                    const file = path.resolve("../backup/UserRequestList.txt");
                    fs.writeFile(file, JSON.stringify(listUserRequest), function (err) {
                        if (err) {
                            return console.error(err);
                        }
                        console.log(163, "store UserRequestList successfully!");
                    });

                    console.log(271, data.product);

                    return res.json({
                        balance: balance,
                        message: "successfully",
                        transaction: transaction, typeMess: "success"
                    });
                } else {
                    return res.json({ message: "Sold out", typeMess: "error" })
                }
            });
        }
    });
};

exports.deleteUserRequest = function (req, res) {
    const reqId = req.body.requestId;

    listUserRequest.forEach(request => {
        if (request.requestId === reqId) {
            let requestIndex = listUserRequest.indexOf(request);

            listUserRequest.splice(requestIndex, 1);
        }
    });

    return res.json({ message: "Delete User's Resquest Successfully!", typeMess: "success" });
}


exports.getHistory = function (req, res) {
    const publicKey = req.params.publicKey;
    var list = [];

    p2pServer.transactionPool.transactions.forEach(transaction => {
        if (transaction.input.address === publicKey) {
            transaction.outputs.forEach(output => {
                if (output.address !== publicKey) {
                    if (output.type === "Transfer") {
                        let product =
                            "You transfered " +
                            output.amount +
                            " coins to address " +
                            output.address;
                        list.push(product);
                    } else if (output.type === "Buy") {
                        let product =
                            "You bought " +
                            output.product.quantity +
                            " " +
                            output.product.productName +
                            " with " +
                            output.amount +
                            " coins.";
                        list.push(product);
                    }
                }
            });
        } else {
            transaction.outputs.forEach(output => {
                if (output.address === publicKey) {
                    let product =
                        "You accepted to the user's request with " +
                        output.product.quantity +
                        " " +
                        output.product.productName +
                        " products with the total amount " +
                        output.amount +
                        " coins.";
                    list.push(product);
                }
            });
        }
    });
    return res.json(list);
};

exports.checkQuantity = function (req, res) {
    const publicKey = req.params.publicKey;
    const productName = req.params.productName;
    console.log(348, publicKey + " " + productName);
    WalletAcc.findOne({ publicKey: publicKey }).exec(function (err, walletAcc) {
        if (err)
            return res.json({
                message: "Could not find the wallet because of " + err, typeMess: "error"
            });
        else if (!walletAcc)
            return res.json({
                message: "Could not find the wallet with publicKey " + publicKey, typeMess: "error"
            });
        else {
            var inputAddress;
            var productSold = 0;
            var productImported = 0;
            var listImported = [];
            var listSold = [];
            var availableProducts = 0;
            var list = [];
            var productCode;

            p2pServer.blockchain.chain.forEach(block => {
                block.data.forEach(transaction => {
                    inputAddress = transaction.input.address;
                    if (inputAddress !== publicKey) {
                        transaction.outputs.forEach(output => {
                            if (output.type == "Buy" && output.address == publicKey) {
                                if (((output.data).request).productName == productName) {
                                    productSold += Number(((output.data).request).quantity);
                                    let product = { quantityOfProduct: output.data.request.quantity, bill: ((output.data).bill) };
                                    listSold.push(product);
                                }
                            }
                        });

                    } else {
                        transaction.outputs.forEach(output => {
                            if (output.type === "Import" && output.address !== publicKey) {
                                ((output.data).bill).forEach(detail => {
                                    if (detail.productName == productName) {
                                        productImported += Number(detail.quantityOfProduct);
                                        listImported.push(detail);
                                    }
                                })
                            }
                        })
                    }
                });
            });

            if (p2pServer.transactionPool.length != 0) {
                p2pServer.transactionPool.transactions.forEach(transaction => {
                    if (transaction.input.address !== publicKey) {
                        transaction.outputs.forEach(output => {
                            if (output.type == "Buy" && output.address == publicKey) {
                                if (((output.data).request).productName == productName) {
                                    productSold += Number(((output.data).request).quantity);
                                    let product = { quantityOfProduct: output.data.request.quantity, bill: ((output.data).bill) };
                                    listSold.push(product);
                                }
                            }
                        });

                    } else {
                        transaction.outputs.forEach(output => {
                            if (output.type === "Import" && output.address !== publicKey) {
                                ((output.data).bill).forEach(detail => {
                                    if (detail.productName == productName) {
                                        productImported += Number(detail.quantityOfProduct);
                                        listImported.push(detail);
                                    }
                                })
                            }
                        })
                    }
                })
            }

            console.log(425, listImported);
            console.log(426, JSON.stringify(listSold));
            if (listImported.length != 0 && listSold.length != 0) {
                listImported.forEach(importedTran => {
                    var soldProductsCode = 0;
                    listSold.forEach(soldTran => {
                        soldTran.bill.forEach(productDetail => {
                            if (importedTran.productCode == productDetail.productCode) {
                                soldProductsCode += Number(soldTran.quantityOfProduct);
                            }
                        });
                    });
                    availableProducts = Number(importedTran.quantityOfProduct) - Number(soldProductsCode);
                    console.log(438, availableProducts);
                    list.push({
                        productName: importedTran.productName,
                        productCode: importedTran.productCode,
                        quantity: availableProducts,
                        manufacturingDate: importedTran.manufacturingDate,
                        expiry: importedTran.expiryDate,
                        manufacturer: importedTran.manufacturer
                    });
                });
            } else {
                listImported.forEach(importedTran => {
                    list.push({
                        productName: importedTran.productName,
                        productCode: importedTran.productCode,
                        quantity: importedTran.quantityOfProduct,
                        manufacturingDate: importedTran.manufacturingDate,
                        expiry: importedTran.expiryDate,
                        manufacturer: importedTran.manufacturer
                    });
                });
            }

            if (productSold > productImported) {
                return res.json({ message: "Error", typeMess: "error" });
            } else if (productSold == productImported) {
                return res.json({ message: "Sold out", product: 0, typeMess: "error" });
            } else {
                return res.json({ message: productName, product: productImported - productSold, list: list });
            }
        }
    });
}

