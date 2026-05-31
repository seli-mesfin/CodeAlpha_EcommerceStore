import mongoose from 'mongoose';

const orderSchema = mongoose.Schema(
  {
    // Added user field to link orders to a customer
    user: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'User',
    },
    orderItems: [
      {
        name: { type: String, required: true },
        qty: { type: Number, required: true },
        image: { type: String, required: true },
        price: { type: Number, required: true },
        product: {
          type: mongoose.Schema.Types.ObjectId,
          required: true,
          ref: 'Product',
        },
      },
    ],
    totalPrice: {
      type: Number,
      required: true,
      default: 0.0,
    },
    paymentMethod: {
      type: String,
      required: true,
      default: 'Cash on Delivery'
    },
    isPaid: {
      type: Boolean,
      required: true,
      default: false,
    },
    // New status field for Admin approval workflow
    status: { 
      type: String, 
      required: true, 
      default: 'Pending', 
      enum: ['Pending', 'Approved', 'Declined'] 
    },
  },
  {
    timestamps: true,
  }
);

const Order = mongoose.model('Order', orderSchema);
export default Order;