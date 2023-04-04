const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const productSchema = Schema({
    productCode: {
        type: String,
        required: true
    },
    productName: String,
    manufacturingDate: String,
    expiryDate: String,
    manufacturer: String,
    totalAmount: Number,
    quantityOfProduct: Number,
    createdTime: {
        type: Date,
        default: Date.now()
    }
});

const Product = module.exports = mongoose.model('product', productSchema);
module.exports.get = function(callback, limit){
    Product.find(callback).limit(limit);
}