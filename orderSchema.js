const mongoose = require("mongoose");

const orderSchema = new mongoose.Schema(
  {
    orderProducts: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Order",
      },
    ],
    // orderDate: {type: Date, default: new Date()},

    orderSum: Number,
    deliveryType: String,
    userId: {
      // user
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  { timestamps: true }
);



const Order = mongoose.model("Order", orderSchema);


module.exports = { Order };
