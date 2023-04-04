let router = require('express').Router();
const blockChainController = require('../controller/blockchainController');

router.route('/blocks').get(blockChainController.getBlocks);


router.route('/transactions').get(blockChainController.getTransactions);

router.route('/getTransactions').get(blockChainController.getTransactionsMasterNode);

// router.route(`/getDataInBlock/:userAddress`).get(blockChainController.getDataBC);

module.exports = router;