const router = require('express').Router();
const accountController = require('../controller/accountController');

router.route('/')
    .get(accountController.index)
    .post(accountController.new);

router.route('/:id').get(accountController.getUserWallet);

router.route('/login').post(accountController.login);

router.route('/get_list/:role').get(accountController.getListFollowingRole);

router.route('/getUsername/:publicKey').get(accountController.getNameByPbKey);


module.exports = router;