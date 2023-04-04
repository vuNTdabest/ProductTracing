let router = require('express').Router();
const sellerController = require('../controller/sellerController');
const supplierController = require('../controller/supplierController')

router.route('/requests/:publicKey').get(sellerController.getRequests);
router.route('/user_requests/:seller/:maxResultCount/:pageNumber').get(sellerController.getListUserRequest);
router.route('/user_transaction').post(sellerController.createTransaction);
router.route('/history/:publicKey').get(sellerController.getHistory);
router.route('/check_quantities/:publicKey/:productName').get(sellerController.checkQuantity);
router.route('/requests_to_suppliers').post(supplierController.requestToSuppliers);
router.route('/getSellers').get(sellerController.getSeller);

module.exports = router;