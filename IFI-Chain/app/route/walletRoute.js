let router = require('express').Router();
const walletController = require('../controller/walletController');

router.route('/update_balance/:walletId').get(walletController.updateBalance);
router.route('/success_list/:publicKey').get(walletController.getSuccessList);
router.route('/transfer').post(walletController.transfer);
router.route('/fail_list/:publicKey').get(walletController.getFailList);
//route of api for the admin
router.route('/charge').post(walletController.charge);
router.route('/charging_list').get(walletController.getListCharching);

module.exports = router;