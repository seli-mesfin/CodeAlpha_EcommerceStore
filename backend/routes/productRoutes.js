import express from 'express';
import Product from '../models/Product.js';
import { protect, admin } from '../middleware/authMiddleware.js';

const router = express.Router();

// @desc    Get all catalog items
// @route   GET /api/products
router.get('/', async (req, res) => {
    try {
        const products = await Product.find({});
        res.json(products);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @desc    Create product (Protected, Admin Only)
// @route   POST /api/products
router.post('/', protect, admin, async (req, res) => {
    try {
        const { name, price, description, image, category, countInStock } = req.body;

        const product = new Product({
            name,
            price: Number(price),
            description,
            image: image || 'https://images.unsplash.com/photo-1546868871-7041f2a55e12?w=500',
            category,
            countInStock: Number(countInStock)
        });

        const createdProduct = await product.save();
        res.status(201).json(createdProduct);
    } catch (error) {
        res.status(500).json({ message: 'Catalog creation failed: ' + error.message });
    }
});

// @desc    Delete item (Protected, Admin Only)
// @route   DELETE /api/products/:id
router.delete('/:id', protect, admin, async (req, res) => {
    try {
        const product = await Product.findById(req.params.id);
        if (product) {
            await product.deleteOne();
            res.json({ message: 'Item permanently deleted from warehouse.' });
        } else {
            res.status(404).json({ message: 'Catalog matching index target not found.' });
        }
    } catch (error) {
        res.status(500).json({ message: 'Deletion sequence interrupted: ' + error.message });
    }
});

export default router;