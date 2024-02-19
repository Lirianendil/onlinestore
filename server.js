const express = require("express");
const app = express();
const cors = require("cors");
const mongoose = require("mongoose");
const { User } = require("./userSchema");
const { protect } = require("./authMiddleware");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { Product } = require("./productSchema");
const { Order } = require("./orderSchema");

console.log(require('dotenv').config())

corsOptions = {
  origin: "*",
};

app.use(cors(corsOptions));

const PORT = process.env.PORT || 8080;

//  MongoDB connection
console.log(process.env.MONGODB_URL);
mongoose.set('strictQuery', false);
mongoose.connect(process.env.MONGODB_URL, { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => console.log("Connected to Database"))
    .catch((err) => console.error("Connection Error:", err));

app.use(express.json());


app.post("/register", async (req, res) => {
  try {
    const { name, password, email } = req.body;
    const salt = await bcrypt.genSalt(10);
    const hashedPwd = await bcrypt.hash(password, salt);

    const existedUser = await User.findOne({email});

    if (existedUser) {
      return res.status(401).json({message: 'User already exists', existedUser});
    }
    const user = await User.create({password: hashedPwd, name, email});

    res.status(200).json({
      id: user._id,
      name: user.name,
      password: user.password,
      email: user.email,
      age: user.age,
      token: jwt.sign({ id: user._id }, "abc123", { expiresIn: "7d" }),
    });
  } catch (error) {
    res.status(401).json({message: `${JSON.stringify(error)}`});
  }
});

// Вход пользователя
app.post("/login", async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email });

  if (user && (await bcrypt.compare(password, user.password))) {
    // Генерация JWT токена
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: "7d" });
    res.status(200).json({
      id: user._id,
      name: user.name,
      email: user.email,
      age: user.age,
      token: token,
    });
  } else {
    res.status(400).json({ message: "Wrong credentials" });
  }
});

app.get("/users", async (req, res) => {
  const users = await User.find();
  res.status(200).json(users);
});

app.post("/users", async (req, res) => {
  const userData = req.body;
  const user = await User.create(userData);
  res.status(201).json(user);
});

app.get("/users/search", async (req, res) => {
  const { searchString } = req.query;

  const users = await User.find({
    $or: [
      { name: new RegExp(searchString, "i") },
      { jobTitle: new RegExp(searchString, "i") },
    ],
  });

  res.status(200).json(users);
});

app.get("/users/:userId", async (req, res) => {
  const { userId } = req.params;

  const user = await User.findById(userId);

  res.status(200).json(user);
});

app.patch("/users/:userId", async (req, res) => {
  const { userId } = req.params;

  const userData = req.body;

  const updatedUser = await User.findByIdAndUpdate(userId, userData, {
    new: true,
  });

  res.status(200).json(updatedUser);
});

app.delete("/users/:userId", async (req, res) => {
  const { userId } = req.params;

  const user = await User.findByIdAndDelete(userId);

  res.status(200).json(user);
});

// Получение заказа по его ID
app.get("/orders/:orderId", async (req, res) => {
  try {
    const orderId = req.params.orderId;
    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }
    res.status(200).json(order);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

// заказ ID
app.patch("/orders/:orderId", async (req, res) => {
  try {
    const orderId = req.params.orderId;
    const updateData = req.body;
    const updatedOrder = await Order.findByIdAndUpdate(orderId, updateData, { new: true });
    if (!updatedOrder) {
      return res.status(404).json({ message: "Order not found" });
    }
    res.status(200).json(updatedOrder);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

app.post("/orders", async (req, res) => {
  try{
    const ordersData = req.body;
    console.log(ordersData.orders)
    const productsIds = ordersData.orders.map ((product) => {
      return product.productId;
    });

    // productsIds - массив айди по типу ["a234sdfz123xv", "c"]

    const products = await Product.find({ _id: { $in: productsIds } });

    // products - массив двух товаров

    let sum = 0;

    // цикл в цикле - find внутри forEach

    products.forEach(
        (product) =>
            (sum +=
                product.price *
                ordersData.orders.find(
                    (orderProduct) => orderProduct.productId == product._id
                ).amount)
    );

    await Promise.all(
        ordersData.orders.map((prod) => {
          return Product.findByIdAndUpdate(prod.productId, {
            $inc: { amount: -prod.amount },
          });
        })
    );

    const newOrder = await Order.create({
      deliveryType: ordersData.deliveryType,
      user: ordersData.user,
      orderSum: sum,
      orderProducts: productsIds,
    });

    res.status(201).json(newOrder);

  }
  catch (error){
    res.status(500).json({error:error?.message || error})
  }
});

app.post("/products", async (req, res) => {
  const product = await Product.create(req.body);
  res.status(201).json(product);
});

app.get("/products", async (req, res) => {
  const products = await Product.find();
  res.status(200).json(products);
});

app.patch("/products/:id", async (req, res) => {
  const { id } = req.params;
  const product = await Product.findByIdAndUpdate(id, req.body, { new: true });
  res.status(200).json(product);
});

app.listen(PORT, () => console.log("Сервер запущен на порту: " + PORT));
