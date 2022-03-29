const express = require("express");

const shopController = require("../controllers/shop");
const isAuth = require("../middlewares/is-Auth");

const router = express.Router();

router.get("/products", shopController.getProducts);

router.get("/products/:productId", shopController.getProduct);

router.post("/cart", isAuth, shopController.postCart);

router.get("/cart", isAuth, shopController.getCart);

router.post('/cart/delete-product', isAuth, shopController.postCartDeleteProduct)

router.get("/orders", isAuth, shopController.getOrders);

router.get("/checkout",isAuth, shopController.getCheckout);

router.get("/checkout/success",isAuth, shopController.getCheckoutSuccess);

router.get("/checkout/cancel",isAuth, shopController.getCheckout);

router.get("/invoice/:orderId", isAuth, shopController.getInvoice);

router.get("/", shopController.getIndex);

module.exports = router;
