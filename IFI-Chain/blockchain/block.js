const { DIFFICULTY, MINE_RATE } = require('../utils/defaultValues');
const Common = require('../utils/common');
const common = new Common();

class Block {
    constructor(index, timestamp, lastHash, hash, data, nonce, difficulty) {
        this.index = index;
        this.timestamp = timestamp;
        this.lastHash = lastHash;
        this.hash = hash;
        this.data = data;
        this.nonce = nonce;
        this.difficulty = difficulty || DIFFICULTY;
    }

    toString() {
        return `Block - 
        Index: ${this.index}
        Timestamp : ${this.timestamp}
        Last Hash : ${this.lastHash}
        Hash      : ${this.hash}
        Data      : ${this.data}
        Nonce     : ${this.nonce}
        Difficulty: ${this.difficulty}`;
    }

    static hash(index, timestamp, lastHash, data, nonce, difficulty) {
        return common.hash(`${index}${timestamp}${lastHash}${data}${nonce}${difficulty}`).toString();
    }

    mineBlock(lastBlock, data) {
        let index;
        let hash;
        let timestamp;
        const lastHash = lastBlock.hash;
        let { difficulty } = lastBlock;
        let nonce = 0;
        do {
            index = lastBlock.index + 1;
            nonce++;
            timestamp = Date.now();
            difficulty = Block.adjustDifficulty(lastBlock, timestamp);
            hash = Block.hash(index, timestamp, lastHash, data, nonce, difficulty);
        } while (hash.substring(0, difficulty) !== '0'.repeat(difficulty));

        return new Block(index, timestamp, lastHash, hash, data, nonce, difficulty);
    }

    blockHash(block) {
        const { index, timestamp, lastHash, data, nonce, difficulty } = block;

        return Block.hash(index, timestamp, lastHash, data, nonce, difficulty);
    }

    static adjustDifficulty(lastBlock, currentTime) {
        let { difficulty } = lastBlock;
        difficulty = lastBlock.timestamp + MINE_RATE > currentTime ? difficulty + 1 : difficulty - 1;
        return difficulty;
    }
}
module.exports = Block;