const Product = require('../product.detail/product');
const axios = require('axios');
const P2PServer = require("../p2p-server");
const p2pServer = new P2PServer();
const WalletAcc = require("../../accounts/walletAcc");

exports.index = function (req, res) {
  Product.get(function (err, products) {
    if (err) {
      res.json("Error");
    } else {
      res.json(products);
    }
  });
};

exports.getProductInfo = function (req, res) {
  const productCode = req.params.productCode;
  Product.findOne({ productCode: productCode }).exec(function (err, product) {
    if (err) return res.json({ message: err });
    else if (!product)
      return res.json({ message: "Could not find the product with code " + productCode });
    else
      return res.json({
        message: "successfully",
        data: product
      });
  });
}

exports.new = function (req, res) {
  var product = new Product();
  product.productCode = req.body.productCode;
  product.productName = req.body.productName;
  product.manufacturingDate = req.body.mfg;
  product.expiryDate = req.body.exp;
  product.manufacturer = req.body.manufacturer;
  product.totalAmount = req.body.totalAmount;
  product.quantityOfProduct = req.body.quantityOfProduct;

  function checkExisted() {
    return axios
      .get(`http://localhost:3000/product/check_existed/${product.productCode}`)
      .then(response => {
        return response.data;
      });
  }
  checkExisted().then(data => {
    if (data == null) {
      let checkInBlock;
      p2pServer.blockchain.chain.forEach(block => {
        block.data.forEach(transaction => {
          transaction.outputs.forEach(output => {
            if (output.type == "Import") {
              ((output.data).bill).forEach(detail => {
                if (detail.productCode == product.productCode) {
                  checkInBlock = "Existed";
                  console.log(123, checkInBlock);
                }
              })
            }
          })
        })
      })

      if (checkInBlock == null) {
        product.save(function (err) {
          if (err) return res.json({ message: err });
          else
            return res.json({
              typeMess: 'success',
              message: 'Successfully',
              data: product
            });
        });
      } else {
        return res.json({ typeMess: 'error', message: 'The productCode already existed' });
      }
    } else {
      return res.json({ typeMess: 'error', message: 'The productCode already existed' });
    }
  })
}

exports.findByProductCode = function (req, res) {
  const productCode = req.params.productCode;
  Product.findOne({ productCode: productCode }).exec(function (err, product) {
    if (err) throw err
    else if (!product)
      return res.json(null);
    else {
      return res.json("Existed");
    }
  })
}

exports.getListPackage = function (req, res) {
  const productName = req.params.productName;
  const recordNumer = Number(req.params.maxResultCount);
  const pageNumber = Number(req.params.pageNumber);

  let listPackages = [];
  let totalRecords = 0;
  let pageList = [];
  Product.find({ productName: productName }).exec(function (err, listPackage) {
    if (err) return res.json({ message: err });
    else if (!listPackage)
      return res.json({ message: "No available " + productName + " package" });
    else {
      listPackages = listPackage;
      if (listPackages != null) {
        totalRecords = listPackages.length;
        let start = (pageNumber - 1) * recordNumer;
        let slicedNumber = start + recordNumer;

        pageList = listPackages.slice(start, slicedNumber);
      }
      var result = { totalRecords, pageList };

      return res.json(result);
    }
  })


}


//blocks
exports.getDetail = function (req, res) {
  const productCode = req.body.productCode;
  function getBlocks() {
    return axios
      .get("http://localhost:3000/blockchain/blocks")
      .then(response => {
        return response.result;
      });
  }
  getBlocks().then(result => {
    result.forEach(block => {
      block.forEach(data => {
        data.forEach(transaction => {
          transaction.outputs.forEach(output => {
            if (output.data.productCode === productCode) {
              return res.json(output.data);
            }
          });
        })
      });
    });
  });
}

exports.trackData = function (req, res) {
  const publicKey = req.params.publicKey;
  const requestId = req.params.requestId;
  var listDataFromSupplier = [];

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
      p2pServer.blockchain.chain.forEach(block => {
        block.data.forEach(transaction => {
          inputAddress = transaction.input.address;
          if (inputAddress == publicKey) {
            transaction.outputs.forEach(output => {
              if (output.type == "Buy" && output.data.request.requestId == requestId) {
                const sellerPublicKey = output.data.request.seller;
                output.data.bill.forEach(detail => {

                  let productCode = detail.productCode;
                  var supplierInfo;
                  var sellerInfo;
                  p2pServer.blockchain.chain.forEach(block => {
                    block.data.forEach(transaction => {
                      transaction.outputs.forEach(output => {
                        if (output.type == "Import") {
                          output.data.bill.forEach(productInfo => {
                            if (productInfo.productCode == productCode) {
                              supplierInfo = { supplierInfo: output.data.request.supplier, productInfo: productInfo };
                            }
                          })
                        } else if (output.type == "Buy" && output.data.request.userAddress == sellerPublicKey) {
                          output.data.bill.forEach(productInfo => {
                            if (productInfo.productCode == productCode) {
                              sellerInfo = { sellerInfo: output.address, productInfo: productInfo }
                            }
                          })
                        }
                      });
                    });
                  });
                  let dataReturn = { productInfoFromSupplier: supplierInfo, productInfoFromSeller: sellerInfo };
                  listDataFromSupplier.push(dataReturn);
                });
                data = {
                  info: "You bought " + output.data.request.quantity + " " + output.data.request.productName + " with the total of coins " + output.amount,
                  transactedDate: output.data.soldDate,
                  productInfoFromSeller: output.data.bill,
                  productInfoFromSupplier: listDataFromSupplier,
                  type: "buy"
                }
              } else if (output.type == "Import" && output.data.request.requestId == requestId) {
                data = {
                  info: "You imported " + output.data.request.quantity + " pack(s) of " + output.data.request.productName + " with the total of coins " + output.amount,
                  transactedDate: output.data.soldDate,
                  productInfoFromSupplier: output.data.bill,
                  supplierInfo: output.data.request.supplier,
                  type: "import"
                }
              }
            });
          } else {
            transaction.outputs.forEach(output => {
              if (output.type == "Buy" && output.data.request.requestId == requestId) {

                const sellerPublicKey = output.data.request.seller;
                output.data.bill.forEach(detail => {

                  let productCode = detail.productCode;
                  var supplierInfo;
                  var sellerInfo;
                  p2pServer.blockchain.chain.forEach(block => {
                    block.data.forEach(transaction => {
                      transaction.outputs.forEach(output => {
                        if (output.type == "Import") {
                          output.data.bill.forEach(productInfo => {
                            if (productInfo.productCode == productCode) {
                              supplierInfo = { supplierInfo: output.data.request.supplier, productInfo: productInfo };
                            }
                          })
                        } else if (output.type == "Buy" && output.data.request.userAddress == sellerPublicKey) {
                          output.data.bill.forEach(productInfo => {
                            if (productInfo.productCode == productCode) {
                              sellerInfo = { sellerInfo: output.address, productInfo: productInfo }
                            }
                          })
                        }
                      });
                    });
                  });
                  let dataReturn = { productInfoFromSupplier: supplierInfo, productInfoFromSeller: sellerInfo };
                  listDataFromSupplier.push(dataReturn);
                });

                data = {
                  info: "You sold " + output.data.request.quantity + " " + output.data.request.productName + " with the total of coins " + output.amount,
                  transactedDate: output.data.soldDate,
                  productInfoFromSeller: output.data.bill,
                  consumerInfo: output.data.request.userAddress,
                  productInfoFromSupplier: listDataFromSupplier,
                  type: "sell"
                }
              } else if (output.type == "Import" && output.data.request.requestId == requestId) {
                data = {
                  info: "You exported " + output.data.request.quantity + " pack(s) of " + output.data.request.productName + " with the total of coins " + output.amount,
                  transactedDate: output.data.soldDate,
                  productInfoFromSupplier: output.data.bill,
                  type: "export"
                }
              }
            })
          }
        });
      });
      return res.json(data);
    }
  })
}

exports.track_productCode = function (req, res) {
  const productCode = req.params.productCode;
  const publicKey = req.params.publicKey;

  var supplierInfo;
  var sellerInfo;
  var dataReturn;

  console.log(227, productCode);
  console.log(228, publicKey);
  if (productCode != '') {
    var checkInBlock;

    p2pServer.blockchain.chain.forEach(block => {
      block.data.forEach(transaction => {
        transaction.outputs.forEach(output => {
          if (output.type == "Import") {
            ((output.data).bill).forEach(detail => {
              if (detail.productCode == productCode) {
                checkInBlock = "Existed";
                console.log(123, checkInBlock);
              }
            })
          }
        })
      })
    });


    if (checkInBlock == "Existed") {
      p2pServer.blockchain.chain.forEach(block => {
        block.data.forEach(transaction => {
          transaction.outputs.forEach(output => {
            if (output.type == "Import") {
              output.data.bill.forEach(productInfo => {
                if (productInfo.productCode == productCode) {
                  supplierInfo = { supplierInfo: output.data.request.supplier, transactedDate: output.data.soldDate, productInfo: productInfo };
                }
              })
            } else if (output.type == "Buy" && (output.data.request.userAddress == publicKey || output.data.request.seller == publicKey)) {
              output.data.bill.forEach(productInfo => {
                if (productInfo.productCode == productCode) {
                  sellerInfo = { sellerInfo: output.address, transactedDate: output.data.soldDate, productInfo: productInfo }
                }
              })
            }
          });
        });
      });

      console.log(276, supplierInfo, sellerInfo)

      if (supplierInfo !== undefined && sellerInfo !== undefined) {
        dataReturn = { type: "bothSide", productInfoFromSupplier: supplierInfo, productInfoFromSeller: sellerInfo };
      } else if (sellerInfo == undefined) {
        dataReturn = { type: "oneSide", productInfoFromSupplier: supplierInfo }
      }
      return res.json(dataReturn);

    } else {
      return res.json({ type: 'error', message: 'The product code is not existed' });
    }
  }

}