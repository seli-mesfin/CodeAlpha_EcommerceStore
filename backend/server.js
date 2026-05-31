import express from 'express';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import cors from 'cors';
import dns from 'node:dns';
import productRoutes from './routes/productRoutes.js';
import orderRoutes from './routes/orderRoutes.js';
import userRoutes from './routes/userRoutes.js';

dns.setServers(['1.1.1.1', '1.0.0.1']);
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors({
    origin: true, 
    credentials: true
}));
app.use(express.json());

app.get('/', (req, res) => {
    res.send('Secure Enterprise Core API is online...');
});

// Resource Route Configurations
app.use('/api/products', productRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/users', userRoutes);

mongoose.connect(process.env.MONGO_URI)
    .then(() => {
        console.log('🔌 MongoDB Atlas connected successfully!');
        app.listen(PORT, () => console.log(`🚀 Server flying high on port ${PORT}`));
    })
    .catch((err) => console.error('❌ DB Hook Error: ', err.message));