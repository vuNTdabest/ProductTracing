const WebSocket = require('ws');

const fs = require('fs');

const P2P_PORT = process.env.P2P_PORT || 5000;

const peers = process.env.PEERS ? process.env.PEERS.split(',') : [];

const Blockchain = require('../blockchain/blockchain');
const Miner = require('./miner');
const TransactionPool = require('../wallet/transaction-pool');

const transactionPool = new TransactionPool();
const blockchain = new Blockchain();
const miner = new Miner(blockchain, transactionPool);

const MESSAGE_TYPE = {
    chain: 'CHAIN',
    transaction: 'TRANSACTION'
}

class P2PServer {
    constructor() {
        this.blockchain = blockchain;
        this.sockets = [];
        this.transactionPool = transactionPool;
    }

    listen() {
        // this.backupChain();

        const server = new WebSocket.Server({ port: P2P_PORT });

        server.on('connection', socket => this.connectSocket(socket));

        this.connectToPeers();

        console.log(`Listening for peer to peer connection on  port ${P2P_PORT}`);

        this.mineAndSync();
    }

    mineAndSync() {
        // mine first block
        var count = 1;
        if (blockchain.chain.length === 0) {
            this.synChain();
            blockchain.mineFirstBlock();
        }

        // node automatically mine after INTERVAL senconds
        setInterval(() => {
            console.log(53, JSON.stringify(transactionPool.transactions));

            miner.mine();
            console.log("Chain's length: ", blockchain.chain.length)
            // if a new block is mined, write it to file
            if (blockchain.chain.length >= (count + 1)) {
                this.toFile();
                this.synChain();
                count++;
            }
        }, 10000);

    }

    toFile() {
        let fileName = '../backup/chainPORT' + P2P_PORT + '.txt';
        fs.writeFile(fileName, JSON.stringify(blockchain.chain), function (err) {
            if (err) throw err;
            console.log('writing successfully!!!');
        })
    }

    connectSocket(socket) {
        // if (socket) {
        this.sockets.push(socket);
        console.log(26, 'A socket connected');
        this.messageHandler(socket);
        this.sendChain(socket);
        // }

    }

    connectToPeers() {
        peers.forEach(peer => {
            // if (peer) {
            const socket = new WebSocket(peer);

            socket.on('open', () => this.connectSocket(socket));
            // }
        })
    }

    messageHandler(socket) {
        socket.on('message', message => {
            const data = JSON.parse(message);
            console.log(92, 'data', data.chain);

            switch (data.type) {
                case MESSAGE_TYPE.chain:
                    blockchain.replaceChain(data.chain);
                    break;
                case MESSAGE_TYPE.transaction:
                    transactionPool.updateOrAddTransaction(data.transaction);
                    break;

            }
        })
    }

    broadcastTransaction(transaction) {
        this.sockets.forEach(socket => {
            this.sendTransaction(socket, transaction);
        })
    }

    sendTransaction(socket, transaction) {
        socket.send(JSON.stringify({
            type: MESSAGE_TYPE.transaction,
            transaction: transaction
        }));
    }

    sendChain(socket) {
        socket.send(JSON.stringify({
            type: MESSAGE_TYPE.chain,
            chain: blockchain.chain
        }));
    }

    synChain() {
        this.sockets.forEach(socket => {
            this.sendChain(socket);
        });
    }
}
module.exports = P2PServer;