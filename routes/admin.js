const express = require("express");
const { body } = require("express-validator");

const adminController = require("../controllers/admin");
const isAuth = require("../middlewares/is-Auth");

const router = express.Router();

// /admin/add-product => GET
router.get("/add-product", isAuth, adminController.getAddProduct);

// /admin/products => GET
router.get("/products", isAuth, adminController.getProducts);

// /admin/add-product => POST
router.post(
  "/add-product",
  [
    body("title").isString().trim(),
    body("price").isNumeric().trim(),
    body("description").isString().trim().isLength({ min: 5, max: 200 }),
  ],
  isAuth,
  adminController.postAddProduct
);

router.get("/edit-product/:productId", isAuth, adminController.getEditProduct);

router.post(
  "/edit-product",
  [
    body("title").isString().trim().isLength({ min: 1 }),
    body("price").isNumeric().trim(),
    body("description").isString().trim().isLength({ min: 5, max: 200 }),
  ],
  isAuth,
  adminController.postEditProduct
);

router.delete("/delete-product/:productId", isAuth, adminController.deleteDeleteProduct);

module.exports = router;
