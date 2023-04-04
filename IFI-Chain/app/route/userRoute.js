let router = require('express').Router();
const userController = require('../controller/userController');
const sellerControlller = require('../controller/sellerController');
const accountController = require('../controller/accountController');

router.route('/buy').post(sellerControlller.buy);
router.route('/pending_list/:publicKey').get(userController.getPendingList);
router.route('/requests_to_sellers/:publicKey').get(userController.getRequests);

router.route('/getAllUsers').get(accountController.getUserForCbb);

module.exports = router;