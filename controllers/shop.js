const path = require("path");
const fs = require("fs");

const stripe = require("stripe")(
  process.env.STRIPE_KEY
);

const PDFDocument = require("pdfkit");

const Product = require("../models/product");
const Order = require("../models/order");

const PRODUCTS_PER_PAGE = 3;

exports.getProducts = (req, res, next) => {
  const page = +req.query.page || 1;
  let totalProducts;
  Product.find()
    .countDocuments()
    .then((totalItems) => {
      totalProducts = totalItems;
      return Product.find()
        .skip((page - 1) * PRODUCTS_PER_PAGE)
        .limit(PRODUCTS_PER_PAGE);
    })
    .then((products) => {
      res.render("shop/product-list", {
        prods: products,
        pageTitle: "All Products",
        path: "/products",
        isAuthenticated: req.session.isLoggedIn,
        currentPage: page,
        previousPage: page - 1,
        nextPage: page + 1,
        hasNextPage: totalProducts > page * PRODUCTS_PER_PAGE,
        hasPreviousPage: page > 1,
        lastPage: Math.ceil(totalProducts / PRODUCTS_PER_PAGE),
        firstPage: 1,
      });
    })
    .catch((err) => {
      // console.log(err);
      const error = new Error(err);
      error.statusCode = 500;
      return next(error);
    });
  // Product.find()
  //   .then((products) => {
  //     res.render("shop/product-list", {
  //       prods: products,
  //       pageTitle: "All Products",
  //       path: "/products",
  //       isAuthenticated: req.session.isLoggedIn,
  //     });
  //   })
  //   .catch((err) => {
  //     const error = new Error(err);
  //     error.statusCode = 500;
  //     return next(error);
  //   });
};

exports.getProduct = (req, res, next) => {
  const productId = req.params.productId;

  Product.findById(productId)
    .then((product) => {
      res.render("shop/product-detail", {
        pageTitle: product.title,
        path: "/products",
        product: product,
        isAuthenticated: req.session.isLoggedIn,
      });
    })
    .catch((err) => {
      const error = new Error(err);
      error.statusCode = 500;
      return next(error);
    });
};

exports.getIndex = (req, res, next) => {
  const page = +req.query.page || 1;
  let totalProducts;
  Product.find()
    .countDocuments()
    .then((totalItems) => {
      totalProducts = totalItems;
      return Product.find()
        .skip((page - 1) * PRODUCTS_PER_PAGE)
        .limit(PRODUCTS_PER_PAGE);
    })
    .then((products) => {
      res.render("shop/index", {
        prods: products,
        pageTitle: "Shop",
        path: "/",
        isAuthenticated: req.session.isLoggedIn,
        currentPage: page,
        previousPage: page - 1,
        nextPage: page + 1,
        hasNextPage: totalProducts > page * PRODUCTS_PER_PAGE,
        hasPreviousPage: page > 1,
        lastPage: Math.ceil(totalProducts / PRODUCTS_PER_PAGE),
        firstPage: 1,
      });
    })
    .catch((err) => {
      // console.log(err);
      const error = new Error(err);
      error.statusCode = 500;
      return next(error);
    });
};

exports.postCart = (req, res, next) => {
  const productId = req.body.productId;

  Product.findById(productId)
    .then((product) => {
      return req.user.addToCart(product);
    })
    .then((result) => {
      res.redirect("/cart");
    })
    .catch((err) => {
      const error = new Error(err);
      error.statusCode = 500;
      return next(error);
    });
};

exports.getCart = (req, res, next) => {
  req.user
    .populate("cart.items.productId")
    .then((user) => {
      return user.cart.items;
    })
    .then((products) => {
      res.render("shop/cart", {
        pageTitle: "Your Cart",
        path: "/cart",
        products: products,
        isAuthenticated: req.session.isLoggedIn,
      });
    })
    .catch((err) => {
      const error = new Error(err);
      error.statusCode = 500;
      return next(error);
    });
};

exports.postCartDeleteProduct = (req, res, next) => {
  const productId = req.body.productId;
  req.user
    .removeFromCart(productId)
    .then((result) => {
      res.redirect("/cart");
    })
    .catch((err) => {
      const error = new Error(err);
      error.statusCode = 500;
      return next(error);
    });
};

exports.getCheckout = (req, res, next) => {
  req.user
    .populate("cart.items.productId")
    .then((user) => {
      return user.cart.items;
    })
    .then((products) => {
      let total = 0;
      products.forEach((p) => {
        total += p.quantity * p.productId.price;
      });

      total = total.toFixed(2) * 1;
      console.log(typeof(total));
      return stripe.checkout.sessions
        .create({
          payment_method_types: ["card"],
          line_items: products.map((p) => {
            return {
              name: p.productId.title,
              description: p.productId.description,
              amount: Math.round(p.productId.price * 100),
              currency: "inr",
              quantity: p.quantity,
            };
          }),
          success_url:
            req.protocol + "://" + req.get("host") + "/checkout/success",
          cancel_url:
            req.protocol + "://" + req.get("host") + "/checkout/cancel",
        })
        .then((session) => {
          res.render("shop/checkout", {
            pageTitle: "Checkout",
            path: "/checkout",
            products: products,
            totalSum: total,
            sessionId: session.id,
          });
        });
    })
    .catch((err) => {
      const error = new Error(err);
      error.statusCode = 500;
      return next(error);
    });
};

exports.getCheckoutSuccess = (req, res, next) => {
  req.user
    .populate("cart.items.productId")
    .then((user) => {
      // return user.cart.items;
      const products = user.cart.items.map((i) => {
        return { product: { ...i.productId._doc }, quantity: i.quantity };
      });
      return products;
    })
    .then((products) => {
      const order = new Order({
        user: {
          userId: req.user,
          email: req.user.email,
        },
        products: products,
      });
      return order.save();
    })
    .then((result) => {
      return req.user.clearCart();
    })
    .then(() => {
      res.redirect("/orders");
    })
    .catch((err) => {
      const error = new Error(err);
      error.statusCode = 500;
      return next(error);
    });
};

exports.getOrders = (req, res, next) => {
  Order.find({ "user.userId": req.user._id })
    .then((orders) => {
      res.render("shop/orders", {
        pageTitle: "Your Orders",
        path: "/orders",
        orders: orders,
        isAuthenticated: req.session.isLoggedIn,
      });
    })
    .catch((err) => {
      const error = new Error(err);
      error.statusCode = 500;
      return next(error);
    });
};

exports.getInvoice = (req, res, next) => {
  const orderId = req.params.orderId;
  const invoiceName = "invoice-" + orderId + ".pdf";
  const invoicePath = path.join("data", "invoices", invoiceName);

  Order.findById(orderId)
    .then((order) => {
      if (!order) return next(new Error("No order found"));

      if (order.user.userId.toString() !== req.user._id.toString())
        return next(new Error("Unauthorised"));

      const doc = new PDFDocument();
      res.setHeader("Content-Type", "application/pdf");
      res.setHeader("Content-Disposition", `inline; filename=${invoiceName}`);

      let totalAmount = 0;
      doc.pipe(fs.createWriteStream(invoicePath));
      doc.pipe(res);
      doc.fontSize(25).text("Invoice", {
        align: "center",
      });
      doc
        .fontSize(15)
        .text(
          "------------------------------------------------------------------",
          {
            align: "center",
            lineGap: 30,
          }
        );
      order.products.forEach((p) => {
        totalAmount += p.quantity * p.product.price;
        doc
          .fontSize(12)
          .text(
            `Product: ${p.product.title}      Amount: $${
              p.product.price
            }     Quantity: $${p.quantity}            Total: $${
              p.quantity * p.product.price
            }`,
            {
              align: "center",
              lineGap: 10,
            }
          );
      });
      doc
        .fontSize(10)
        .text(
          "------------------------------------------------------------------",
          {
            align: "center",
            lineGap: 10,
          }
        );
      doc.fontSize(15).text(`Total Amount : $${totalAmount.toFixed(2)}`, {
        align: "center",
      });

      doc.end();

      // fs.readFile(invoicePath, (err, data) => {
      //   if (err) {
      //     return next(err);
      //   }
      //   res.setHeader("Content-Type", "application/pdf");
      //   res.setHeader("Content-Disposition", `inline; filename=${invoiceName}`);
      //   // res.setHeader("Content-Disposition", "inline; filename="+invoiceName);
      //   res.send(data);
      // });

      // const file = fs.createReadStream(invoicePath);
      // file.pipe(res);
    })
    .catch((err) => next(err));
};
