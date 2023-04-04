const uuidv1 = require('uuid');
const bcrypt = require('bcrypt');
const Common = require('../../utils/common');
const common = new Common();
const User = require('../../accounts/userAcc');
const Wallet = require('../../accounts/walletAcc');
const axios = require("axios");

exports.index = function (req, res) {
    User.get(function (err, users) {
        if (err) {
            res.json(err);
        } else {
            res.json(users);
        }
    });
}

exports.getUserForCbb = function (req, res) {
    console.log(20, "in")
    User.aggregate([
        {
            $lookup: {
                from: 'wallets',
                localField: 'walletId',
                foreignField: 'walletId',
                as: 'walletList'
            }
        }
    ], function (err, wallets) {
        var list = [];
        console.log(31, "in")
        if (err) throw err;
        wallets.forEach(wallet => {
            console.log(33, wallet)
            // if (wallet.role == role) {
                wallet.walletList.forEach(detail => {
                    let data = { username: wallet.username, publicKey: detail.publicKey, walletId: detail.walletId };
                    list.push(data);
                })
            // }
        })
        return res.json(list);
    });
}

exports.new = function (req, res) {
    const wallet = new Wallet();
    wallet.walletId = uuidv1();
    const keyPairEC = common.genKeyPair();
    wallet.publicKey = keyPairEC.getPublic().encode('hex');
    wallet.privateKey = keyPairEC.getPrivate('hex');
    wallet.balance = 0;

    wallet.save(function (err) {
        if (err) return res.json('Fail to create account because there is an error of the wallet');
        const account = new User();
        account.username = req.body.username ? req.body.username : account.username;
        account.password = req.body.password;
        account.role = req.body.role;
        account.walletId = wallet.walletId;
        // account.role = req.body.role;

        User.findOne({ username: account.username }).exec(function (err, existedAcc) {
            if (err) return res.json(err)
            else if (existedAcc) {
                let myQuery = { walletId: account.walletId };
                Wallet.deleteOne(myQuery, function (err) {
                    if (err) return false;
                    return true;
                });
                return res.json('This username is existed!!');
            } else {
                account.save(function (err) {
                    if (err) {
                        let myQuery = { walletId: account.walletId };
                        Wallet.deleteOne(myQuery, function (err) {
                            if (err) return false;
                            return true;
                        });
                        return res.json('Fail to create the account because of saving');
                    }
                });
                return res.json({
                    message: "Create User account successfully",
                    data: account
                });
            }
        })
    })
}

exports.login = function (req, res) {
    const username = req.body.username;
    const password = req.body.password;

    User.findOne({ username: username }).exec(function (err, user) {
        if (err) return res.json({ message: 'Fail to find the account because of ' + err });
        else if (!user) {
            return res.json({ message: 'Fail to login because there is no account with username ' + username });
        } else {
            bcrypt.compare(password, user.password, function (err, isMatch) {
                if (err) return res.json(err);
                else if (isMatch) {
                    Wallet.findOne({ walletId: user.walletId }).exec(function (err, wallet) {
                        if (err) return res.json({ message: 'Could not find the wallet because ' + err });
                        else if (!wallet) return res.json({ message: 'Could not find the wallet with id ' + walletId });
                        else {
                            return res.json({
                                username: user.username,
                                role: user.role,
                                walletId: user.walletId,
                                publicKey: wallet.publicKey,
                                balance: wallet.balance
                            });

                        }
                    })
                } else {
                    return res.json({ message: 'Login again because your username or password is wrong' });
                }
            });
        }
    });
}

exports.getUserWallet = function (req, res) {
    let walletId = req.params.id;
    Wallet.findOne({ walletId: walletId }).exec(function (err, wallet) {
        if (err) return res.json({ message: 'Could not find the wallet detail because of ' + err });
        else if (!wallet)
            return res.json({ message: 'Could not find the wallet with id ' + walletId });
        else
            return res.json(wallet);
    })
}

exports.delete = function (req, res) {
    let myQuery = { walletId: req.params.id };
    Wallet.deleteOne(myQuery, function (err) {
        if (err) return res.json(err);
        res.json('Deleted the wallet successfully');
    })
}

exports.getListFollowingRole = function (req, res) {
    const role = req.params.role;
    User.aggregate([
        {
            $lookup: {
                from: 'wallets',
                localField: 'walletId',
                foreignField: 'walletId',
                as: 'walletList'
            }
        }
    ], function (err, wallets) {
        var list = [];
        if (err) throw err;
        wallets.forEach(wallet => {
            if (wallet.role == role) {
                wallet.walletList.forEach(detail => {
                    let data = { username: wallet.username, publicKey: detail.publicKey, walletId: detail.walletId };
                    list.push(data);
                })
            }
        })
        return res.json(list);
    });
}

exports.getNameByPbKey = function (req, res) {
    const pbKey = req.params.publicKey;
    console.log(146, "in")

    User.aggregate([
        {
            $lookup: {
                from: 'wallets',
                localField: 'walletId',
                foreignField: 'walletId',
                as: 'walletList'
            }
        }
    ], function (err, wallets) {
        var name;

        if (err) throw err;
        wallets.forEach(wallet => {
            wallet.walletList.forEach(detail => {
                if (detail.publicKey == pbKey) {
                    name = wallet.username
                }
            })
        })
        return res.json(name);
    })
}
