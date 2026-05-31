import mongoose from 'mongoose';

const productSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'A product must have a name'],
        trim: true
    },
    description: {
        type: String,
        required: [true, 'A product must have a description']
    },
    price: {
        type: Number,
        required: [true, 'A product must have a price'],
        min: [0, 'Price cannot be negative']
    },
    image: {
        type: String,
        default: 'https://via.placeholder.com/150' // Placeholder if no image is uploaded
    },
    category: {
        type: String,
        required: [true, 'A product must belong to a category']
    },
    countInStock: {
        type: Number,
        required: [true, 'Stock count is required'],
        min: 0,
        default: 0
    }
}, {
    timestamps: true // Automatically creates "createdAt" and "updatedAt" fields
});

const Product = mongoose.model('Product', productSchema);
export default Product;