require("dotenv").config();

const express = require("express");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const cors = require("cors");
const passport = require("passport");
const session = require("express-session");
const LocalStrategy = require("passport-local").Strategy;

const { HoldingsModel } = require("./model/HoldingsModel");
const { PositionsModel } = require("./model/PositionsModel");
const { OrdersModel } = require("./model/OrdersModel");
const { UserModel } = require("./model/UserModel");

const PORT = process.env.PORT || 3002;
const uri = process.env.MONGO_URL;
const isProduction = process.env.NODE_ENV === "production";
const allowedOrigins = [
  process.env.FRONTEND_URL,
  process.env.DASHBOARD_URL,
  "http://localhost:3000",
  "http://localhost:3001",
].filter(Boolean);

const app = express();
app.set("trust proxy", 1);
let dbConnected = false;

const demoUser = {
  _id: "demo-user",
  username: "demo",
  email: "demo@example.com",
  name: "Demo User",
};

const demoState = {
  holdings: [
    { name: "BHARTIARTL", qty: 2, avg: 538.05, price: 541.15, net: "+0.58%", day: "+2.99%" },
    { name: "HDFCBANK", qty: 2, avg: 1383.4, price: 1522.35, net: "+10.04%", day: "+0.11%" },
    { name: "HINDUNILVR", qty: 1, avg: 2335.85, price: 2417.4, net: "+3.49%", day: "+0.21%" },
    { name: "INFY", qty: 1, avg: 1350.5, price: 1555.45, net: "+15.18%", day: "-1.60%", isLoss: true },
    { name: "ITC", qty: 5, avg: 202.0, price: 207.9, net: "+2.92%", day: "+0.80%" },
    { name: "KPITTECH", qty: 5, avg: 250.3, price: 266.45, net: "+6.45%", day: "+3.54%" },
    { name: "M&M", qty: 2, avg: 809.9, price: 779.8, net: "-3.72%", day: "-0.01%", isLoss: true },
    { name: "RELIANCE", qty: 1, avg: 2193.7, price: 2112.4, net: "-3.71%", day: "+1.44%" },
    { name: "SBIN", qty: 4, avg: 324.35, price: 430.2, net: "+32.63%", day: "-0.34%", isLoss: true },
    { name: "SGBMAY29", qty: 2, avg: 4727.0, price: 4719.0, net: "-0.17%", day: "+0.15%" },
    { name: "TATAPOWER", qty: 5, avg: 104.2, price: 124.15, net: "+19.15%", day: "-0.24%", isLoss: true },
    { name: "TCS", qty: 1, avg: 3041.7, price: 3194.8, net: "+5.03%", day: "-0.25%", isLoss: true },
    { name: "WIPRO", qty: 4, avg: 489.3, price: 577.75, net: "+18.08%", day: "+0.32%" },
  ],
  positions: [
    { product: "CNC", name: "EVEREADY", qty: 2, avg: 316.27, price: 312.35, net: "+0.58%", day: "-1.24%", isLoss: true },
    { product: "CNC", name: "JUBLFOOD", qty: 1, avg: 3124.75, price: 3082.65, net: "+10.04%", day: "-1.35%", isLoss: true },
  ],
  orders: [],
  users: [demoUser],
};

app.use(
  cors({
    origin(origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      return callback(new Error(`CORS blocked for origin: ${origin}`));
    },
    credentials: true,
  })
);
app.use(bodyParser.json());

app.get("/", (req, res) => {
  res.json({ status: "ok", service: "zerodha-clone-api" });
});

app.get("/health", (req, res) => {
  res.json({
    status: "ok",
    database: dbConnected ? "mongodb" : "demo-fallback",
  });
});

// Passport and session setup
app.use(
  session({
    secret: process.env.SESSION_SECRET || "your-secret-key",
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: isProduction,
      httpOnly: true,
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
      sameSite: isProduction ? "none" : "lax",
    },
  })
);

app.use(passport.initialize());
app.use(passport.session());

passport.use(new LocalStrategy(UserModel.authenticate()));
passport.serializeUser(UserModel.serializeUser());
passport.deserializeUser(UserModel.deserializeUser());

// Authentication middleware
const requireAuth = (req, res, next) => {
  if (!dbConnected && req.session?.demoUser) {
    return next();
  }

  if (req.isAuthenticated()) {
    return next();
  }
  res.status(401).json({ error: "Authentication required" });
};

//app.get("/addHoldings", async (req, res) => {

/*
let tempHoldings = [
  {
    name: "BHARTIARTL",
    qty: 2,
    avg: 538.05,
    price: 541.15,
    net: "+0.58%",
    day: "+2.99%",
  },
  {
    name: "HDFCBANK",
    qty: 2,
    avg: 1383.4,
    price: 1522.35,
    net: "+10.04%",
    day: "+0.11%",
  },
  {
    name: "HINDUNILVR",
    qty: 1,
    avg: 2335.85,
    price: 2417.4,
    net: "+3.49%",
    day: "+0.21%",
  },
  {
    name: "INFY",
    qty: 1,
    avg: 1350.5,
    price: 1555.45,
    net: "+15.18%",
    day: "-1.60%",
    isLoss: true,
  },
  {
    name: "ITC",
    qty: 5,
    avg: 202.0,
    price: 207.9,
    net: "+2.92%",
    day: "+0.80%",
  },
  {
    name: "KPITTECH",
    qty: 5,
    avg: 250.3,
    price: 266.45,
    net: "+6.45%",
    day: "+3.54%",
  },
  {
    name: "M&M",
    qty: 2,
    avg: 809.9,
    price: 779.8,
    net: "-3.72%",
    day: "-0.01%",
    isLoss: true,
  },
  {
    name: "RELIANCE",
    qty: 1,
    avg: 2193.7,
    price: 2112.4,
    net: "-3.71%",
    day: "+1.44%",
  },
  {
    name: "SBIN",
    qty: 4,
    avg: 324.35,
    price: 430.2,
    net: "+32.63%",
    day: "-0.34%",
    isLoss: true,
  },
  {
    name: "SGBMAY29",
    qty: 2,
    avg: 4727.0,
    price: 4719.0,
    net: "-0.17%",
    day: "+0.15%",
  },
  {
    name: "TATAPOWER",
    qty: 5,
    avg: 104.2,
    price: 124.15,
    net: "+19.15%",
    day: "-0.24%",
    isLoss: true,
  },
  {
    name: "TCS",
    qty: 1,
    avg: 3041.7,
    price: 3194.8,
    net: "+5.03%",
    day: "-0.25%",
    isLoss: true,
  },
  {
    name: "WIPRO",
    qty: 4,
    avg: 489.3,
    price: 577.75,
    net: "+18.08%",
    day: "+0.32%",
  },
];

tempHoldings.forEach((item) => {
  let newHolding = new HoldingsModel({
    name: item.name,
    qty: item.qty,
    avg: item.avg,
    price: item.price,
    net: item.net,
    day: item.day,
  });
  newHolding.save();
});
res.send("Done!");
*/

// Authentication routes
app.post("/register", async (req, res) => {
  try {
    if (!dbConnected) {
      const { username, email, name } = req.body;
      const existingUser = demoState.users.find((user) => user.username === username);

      if (existingUser) {
        return res.status(400).json({ error: "A user with the given username is already registered" });
      }

      demoState.users.push({
        _id: `demo-user-${Date.now()}`,
        username,
        email,
        name,
      });

      return res.status(201).json({ message: "User registered successfully" });
    }

    const { username, email, name, password } = req.body;
    const user = new UserModel({ username, email, name });
    await UserModel.register(user, password);
    res.status(201).json({ message: "User registered successfully" });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.post("/login", (req, res, next) => {
  if (!dbConnected) {
    const user =
      demoState.users.find((savedUser) => savedUser.username === req.body.username) || demoUser;

    req.session.demoUser = user;
    return res.json({ message: "Logged in successfully", user });
  }

  passport.authenticate("local", (err, user, info) => {
    if (err) {
      return next(err);
    }

    if (!user) {
      return res.status(401).json({ error: info?.message || "Login failed" });
    }

    req.logIn(user, (loginErr) => {
      if (loginErr) {
        return next(loginErr);
      }

      return res.json({ message: "Logged in successfully", user: req.user });
    });
  })(req, res, next);
});

app.get("/logout", (req, res) => {
  if (!dbConnected) {
    req.session.demoUser = null;
    return res.json({ message: "Logged out successfully" });
  }

  req.logout((err) => {
    if (err) {
      return res.status(500).json({ error: "Logout failed" });
    }
    res.json({ message: "Logged out successfully" });
  });
});

app.get("/user", (req, res) => {
  if (!dbConnected && req.session?.demoUser) {
    return res.json({ user: req.session.demoUser });
  }

  if (req.isAuthenticated()) {
    res.json({ user: req.user });
  } else {
    res.status(401).json({ error: "Not authenticated" });
  }
});

/*
app.get("/addPositions", async (req, res) => {
let tempPositions = [
  {
    product: "CNC",
    name: "EVEREADY",
    qty: 2,
    avg: 316.27,
    price: 312.35,
    net: "+0.58%",
    day: "-1.24%",
    isLoss: true,
  },
  {
    product: "CNC",
    name: "JUBLFOOD",
    qty: 1,
    avg: 3124.75,
    price: 3082.65,
    net: "+10.04%",
    day: "-1.35%",
    isLoss: true,
  },
];

tempPositions.forEach((item) => {
  let newPosition = new PositionsModel({
    product: item.product,
    name: item.name,
    qty: item.qty,
    avg: item.avg,
    price: item.price,
    net: item.net,
    day: item.day,
    isLoss: item.isLoss,
  });

  newPosition.save();
});
res.send("Done!");
});
*/

app.get("/allHoldings", requireAuth, async (req, res) => {
  if (!dbConnected) {
    return res.json(demoState.holdings);
  }

  let allHoldings = await HoldingsModel.find({});
  res.json(allHoldings);
});

app.get("/allPositions", requireAuth, async (req, res) => {
  if (!dbConnected) {
    return res.json(demoState.positions);
  }

  let allPositions = await PositionsModel.find({});
  res.json(allPositions);
});

app.post("/newOrder", requireAuth, async (req, res) => {
  const order = {
    name: req.body.name,
    qty: Number(req.body.qty),
    price: Number(req.body.price),
    mode: req.body.mode,
  };

  if (!dbConnected) {
    demoState.orders.push(order);

    if (order.mode === "BUY") {
      const existingHolding = demoState.holdings.find((holding) => holding.name === order.name);

      if (existingHolding) {
        const totalQty = existingHolding.qty + order.qty;
        const totalValue = existingHolding.qty * existingHolding.avg + order.qty * order.price;

        existingHolding.qty = totalQty;
        existingHolding.avg = totalValue / totalQty;
        existingHolding.price = order.price;
      } else {
        demoState.holdings.push({
          name: order.name,
          qty: order.qty,
          avg: order.price,
          price: order.price,
          net: "0.00%",
          day: "0.00%",
        });
      }
    }

    if (order.mode === "SELL") {
      const existingHolding = demoState.holdings.find((holding) => holding.name === order.name);

      if (existingHolding && existingHolding.qty >= order.qty) {
        existingHolding.qty -= order.qty;
        existingHolding.price = order.price;

        if (existingHolding.qty === 0) {
          demoState.holdings = demoState.holdings.filter((holding) => holding.name !== order.name);
        }
      }
    }

    return res.json({ message: "Order saved and holdings updated!", order });
  }

  let newOrder = new OrdersModel({
    name: req.body.name,
    qty: req.body.qty,
    price: req.body.price,
    mode: req.body.mode,
  });
  newOrder.save();

  // Update holdings based on order
  if (req.body.mode === "BUY") {
    // Check if stock already exists in holdings
    let existingHolding = await HoldingsModel.findOne({ name: req.body.name });

    if (existingHolding) {
      // Update existing holding
      let totalQty = existingHolding.qty + req.body.qty;
      let totalValue =
        existingHolding.qty * existingHolding.avg +
        req.body.qty * req.body.price;
      let newAvg = totalValue / totalQty;

      await HoldingsModel.updateOne(
        { name: req.body.name },
        {
          qty: totalQty,
          avg: newAvg,
          price: req.body.price,
        }
      );
    } else {
      // Create new holding
      let newHolding = new HoldingsModel({
        name: req.body.name,
        qty: req.body.qty,
        avg: req.body.price,
        price: req.body.price,
        net: "0.00%",
        day: "0.00%",
      });
      await newHolding.save();
    }
  } else if (req.body.mode === "SELL") {
    // Check if stock exists in holdings
    let existingHolding = await HoldingsModel.findOne({ name: req.body.name });

    if (existingHolding && existingHolding.qty >= req.body.qty) {
      let newQty = existingHolding.qty - req.body.qty;

      if (newQty > 0) {
        // Update quantity
        await HoldingsModel.updateOne(
          { name: req.body.name },
          {
            qty: newQty,
            price: req.body.price,
          }
        );
      } else {
        // Remove holding if quantity becomes 0
        await HoldingsModel.deleteOne({ name: req.body.name });
      }
    }
  }

  res.json({
    message: "Order saved and holdings updated!",
    order: {
      name: req.body.name,
      qty: req.body.qty,
      price: req.body.price,
      mode: req.body.mode,
    },
  });
});

app.get("/allOrders", requireAuth, async (req, res) => {
  if (!dbConnected) {
    return res.json(demoState.orders);
  }

  let allOrders = await OrdersModel.find({});
  res.json(allOrders);
});

app.listen(PORT, async () => {
  console.log(`Backend server is running on port ${PORT}`);

  if (!uri) {
    console.log("MongoDB URL is missing. Using in-memory demo data.");
    return;
  }

  try {
    await mongoose.connect(uri);
    dbConnected = true;
    console.log("MongoDB connected");
  } catch (error) {
    dbConnected = false;
    console.log(`MongoDB unavailable (${error.code || error.message}). Using in-memory demo data.`);
  }
});
