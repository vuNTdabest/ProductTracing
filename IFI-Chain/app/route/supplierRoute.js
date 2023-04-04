let router = require('express').Router();
const supplierController = require('../controller/supplierController')

//route of api for suppliers

router.route('/seller_requests/:supplier/:maxResultCount/:pageNumber').get(supplierController.getSellerRequests);
router.route('/getConsignment_detail/:maxResultCount/:pageNumber').get(supplierController.getDetail);
router.route('/seller_transaction').post(supplierController.makeTransaction);
router.route('/deleteConsignment/:selectedConsignments').delete(supplierController.deleteDetail);

router.route('/deleteRequest/:sellerRequest').delete(supplierController.deleteSellerRequest);

router.route('/products/:maxResultCount/:pageNumber/:publicKey/:productName').get(supplierController.getBill);


module.exports = router;