const express = require("express");

const shopController = require("../controllers/shop");

const router = express.Router();

router.get("/products", shopController.getProducts);

router.get("/products/:productId", shopController.getProduct);

router.post("/cart", shopController.postCart);

router.get("/cart", shopController.getCart);

router.post('/cart/delete-product', shopController.postCartDeleteProduct)

router.get("/orders", shopController.getOrders);

router.post("/create-order", shopController.postOrder);

router.get("/checkout", shopController.getCheckout);

router.get("/", shopController.getIndex);

module.exports = router;
