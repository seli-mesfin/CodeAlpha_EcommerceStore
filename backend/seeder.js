import mongoose from 'mongoose';
import dotenv from 'dotenv';
import dns from 'node:dns';
import products from './products.js';
import Product from './models/Product.js';

// Network lookup fix for ISP roadblocks
dns.setServers(['1.1.1.1', '1.0.0.1']);

dotenv.config();

const importData = async () => {
    try {
        // Connect to the database
        await mongoose.connect(process.env.MONGO_URI);

        // Clear existing items in the database to prevent duplicate stacking
        await Product.deleteMany();

        // Insert the fresh dummy array
        await Product.insertMany(products);

        console.log('📦 Sample products imported successfully!');
        process.exit(); // Turn off the script execution
    } catch (error) {
        console.error(`❌ Error importing data: ${error.message}`);
        process.exit(1); // Turn off with failure code
    }
};

importData();