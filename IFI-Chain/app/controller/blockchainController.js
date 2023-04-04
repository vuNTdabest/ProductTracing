const BlockChain = require('../../blockchain/blockchain');
const blockChain = new BlockChain();
const TransactionPool = require('../../wallet/transaction-pool');
const transactionPool = new TransactionPool();
const P2PServer = require('../p2p-server');
const p2pServer = new P2PServer();

exports.getBlocks = function (req, res) {
    res.json(p2pServer.blockchain.chain)
}

exports.getTransactions = function (req, res) {
    res.json(p2pServer.transactionPool.transactions);
}

exports.getTransactionsMasterNode = function (req, res) {
    res.json(transactionPool.transactions);
}