const BlockClass = require('./block');
const Block = new BlockClass();
const { FIXEDTRANSACTION } = require('../utils/defaultValues');

class BlockChain {
    constructor() {
        this.chain = [];
    }

    mineFirstBlock() {
        var genesisBlock = Block.mineBlock("", FIXEDTRANSACTION);
        genesisBlock.index = 0;
        genesisBlock.lastHash = "0000";

        this.chain.push(genesisBlock);
    }

    addBlock(data) {
        var block = Block.mineBlock(this.chain[this.chain.length - 1], data);
        this.chain.push(block);
    }

    isValidChain(chain) {
        if (chain.length > 1) {
            for (let i = 1; i < chain.length; i++) {
                const block = chain[i];
                const lastBlock = chain[i - 1];
                if ((block.lastHash !== lastBlock.hash) || (block.hash !== Block.blockHash(block)) || block.index !== (lastBlock.index + 1)) {
                    return false;
                }
                return true;
            }
        } else {
            return true;
        }
    }

    replaceChain(newChain) {
        if (newChain.length > this.chain.length && this.isValidChain(newChain)) {
            console.log("Synchronized!!!");
            this.chain = newChain;
        } else if (newChain.length === this.chain.length && this.isValidChain(newChain)) {
            if (newChain[newChain.length - 1].timestamp < this.chain[this.chain.length - 1].timestamp) {
                console.log("Synchronized!");
                this.chain = newChain;
            } else {
                console.log("Received chain's timestamp is less than the current chain's timestamp!");
                return;
            }
        } else {
            console.log("Received chain isn't longer than the current chain!");
            return;
        }
    }
}
module.exports = BlockChain;