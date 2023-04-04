const router = require('express').Router();
const productController = require('../controller/productController');
const userController = require('../controller/userController');

router.route('/')
    .get(productController.index)
    .post(productController.new);
router.route('/getProductFrDb/:productName/:maxResultCount/:pageNumber').get(productController.getListPackage);
router.route('/:productCode').get(productController.getProductInfo);
router.route('/product_detail').post(productController.getDetail);
router.route('/track_data/:publicKey/:requestId').get(productController.trackData);
router.route('/track_productCode/:productCode/:publicKey').get(productController.track_productCode);
router.route('/check_existed/:productCode').get(productController.findByProductCode);

module.exports = router;