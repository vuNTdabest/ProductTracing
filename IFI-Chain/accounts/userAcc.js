const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const SALT_WORK_FACTOR = 10;
const Schema = mongoose.Schema;

const userSchema = Schema({
    username: {
        type: String,
        index: {
            unique: true
        },
        required: true
    },
    password: {
        type: String,
        required: true
    },
    walletId: {
        type: String
    },
    role: {
        type: String,
        required: true
    },
    createdTime: {
        type: Date,
        default: Date.now()
    }
});

userSchema.pre('save', function(next){
    //store reference
    const user = this;
    //only hash the password if it has been modified (or is new)
    if (!user.isModified('password')){
        return next();
    }
    //generate a salt
    bcrypt.genSalt(SALT_WORK_FACTOR, function(err, salt){
        if (err) return next(err);
        //has the password using our new salt
        bcrypt.hash(user.password, salt, function(err, hash){
            if (err) return next(err);
            user.password = hash;
            next();
        });
    });
});
//method
userSchema.methods.comparePassword = function(candidatePassword, cb){
    bcrypt.compare(candidatePassword, this.password, function(err, isMatch){
        if (err) return cb(err);
        cb(null, isMatch);
    });
}

const User = module.exports = mongoose.model('user', userSchema);
module.exports.get = function(callback, limit){
    User.find(callback).limit(limit);
}