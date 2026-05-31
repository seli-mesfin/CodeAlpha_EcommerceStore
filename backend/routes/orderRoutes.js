import express from 'express';
import Order from '../models/Order.js';
import Product from '../models/Product.js';
import { protect, admin } from '../middleware/authMiddleware.js';

const router = express.Router();

// @desc    Create new purchase entry (Protected: User must be logged in)
// @route   POST /api/orders
// Added 'protect' middleware to identify the user
router.post('/', protect, async (req, res) => {
    try {
        const { orderItems, totalPrice, paymentMethod } = req.body;

        if (!orderItems || orderItems.length === 0) {
            return res.status(400).json({ message: 'Cart context resolution returned empty.' });
        }

        const order = new Order({ 
            orderItems, 
            totalPrice,
            paymentMethod: paymentMethod || 'Cash on Delivery',
            user: req.user._id,   // Link order to the logged-in user
            status: 'Pending'      // Automatically set to Pending for Admin review
        });

        const createdOrder = await order.save();

        for (const item of orderItems) {
            const product = await Product.findById(item.product);
            if (product) {
                product.countInStock = Math.max(0, product.countInStock - item.qty);
                await product.save();
            }
        }

        res.status(201).json(createdOrder);
    } catch (error) {
        res.status(500).json({ message: 'Order collection commit execution failure: ' + error.message });
    }
});

// @desc    Get master invoice array summaries (Protected, Admin Only)
router.get('/', protect, admin, async (req, res) => {
    try {
        // Use .populate('user', 'email') so we can get the email later for notifications
        const orders = await Order.find({}).populate('user', 'email').sort({ createdAt: -1 });
        const totalRevenue = orders.reduce((acc, order) => acc + order.totalPrice, 0);
        const totalSalesCount = orders.length;

        res.json({ orders, totalRevenue, totalSalesCount });
    } catch (error) {
        res.status(500).json({ message: 'Data pull blocked: ' + error.message });
    }
});

export default router;