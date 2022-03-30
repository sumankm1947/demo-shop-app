const sharp = require("sharp");
const fs = require("fs");
const { validationResult } = require("express-validator");

const Product = require("../models/product");
const fileHelper = require("../utils/file");

exports.getAddProduct = (req, res, next) => {
  res.render("admin/edit-product", {
    pageTitle: "Add Product",
    path: "/admin/add-product",
    product: [],
    editing: false,
    hasError: false,
    errorMessage: "",
    validationErrors: [],
  });
};

exports.postAddProduct = (req, res, next) => {
  const title = req.body.title;
  const image = req.file;
  const price = req.body.price;
  const description = req.body.description;

  if (!image) {
    return res.status(422).render("admin/edit-product", {
      pageTitle: "Add Product",
      path: "/admin/add-product",
      product: {
        title: title,
        price: price,
        description: description,
      },
      hasError: true,
      editing: false,
      errorMessage: "Please choose a png/jpg/jpeg image file",
      validationErrors: [],
    });
  }

  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).render("admin/edit-product", {
      pageTitle: "Add Product",
      path: "/admin/add-product",
      product: {
        title: title,
        price: price,
        description: description,
      },
      hasError: true,
      editing: false,
      errorMessage: errors.array()[0].msg,
      validationErrors: errors.array(),
    });
  }
  const imageName = new Date().getTime() + "-" + image.originalname;

  const product = new Product({
    title: title,
    price: price,
    description: description,
    imageUrl: "\\images\\" + imageName,
    userId: req.user,
  });
  product
    .save()
    .then((result) => {
      console.log("Product Created");
      return sharp(req.file.buffer)
        .resize({ width: 300, height: 300 })
        .toFile(`./images/${imageName}`);
    })
    .then((result) => {
      res.redirect("/admin/products");
    })
    .catch((err) => {
      const error = new Error(err);
      error.statusCode = 500;
      return next(error);
    });
};

exports.getProducts = (req, res, next) => {
  Product.find({ userId: req.user._id })
    .then((products) => {
      res.render("admin/products", {
        prods: products,
        pageTitle: "Admin Products",
        path: "/admin/products",
      });
    })
    .catch((err) => {
      const error = new Error(err);
      error.statusCode = 500;
      return next(error);
    });
};

exports.getEditProduct = (req, res, next) => {
  // throw new Error("test");
  const editMode = req.query.edit;
  if (!editMode) {
    return res.redirect("/");
  }
  const productId = req.params.productId;

  Product.findById(productId)
    .then((product) => {
      if (!product) {
        return res.redirect("/");
      }
      res.render("admin/edit-product", {
        pageTitle: "Edit product",
        path: "/admin/edit-product",
        product: product,
        editing: editMode,
        hasError: false,
        errorMessage: "",
        validationErrors: [],
      });
    })
    .catch((err) => {
      const error = new Error(err);
      error.statusCode = 500;
      return next(error);
    });
};

exports.postEditProduct = (req, res, next) => {
  const productId = req.body.productId;
  const updatedTitle = req.body.title;
  const updatedImage = req.file;
  const updatedPrice = req.body.price;
  const updatedDescription = req.body.description;

  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).render("admin/edit-product", {
      pageTitle: "Edit Product",
      path: "/admin/edit-product",
      product: {
        _id: productId,
        title: updatedTitle,
        price: updatedPrice,
        description: updatedDescription,
      },
      hasError: true,
      editing: true,
      errorMessage: errors.array()[0].msg,
      validationErrors: errors.array(),
    });
  }
  const imageName = new Date().getTime() + "-" + updatedImage.originalname;

  Product.findById(productId)
    .then((product) => {
      if (product.userId.toString() !== req.user._id.toString()) {
        return res.redirect("/");
      }
      product.title = updatedTitle;
      product.price = updatedPrice;
      product.description = updatedDescription;
      if (updatedImage) {
        fileHelper.deleteFile(product.imageUrl.slice(1)); // other-wise it will look in root directory => E://images/...
        product.imageUrl = "\\images\\" + imageName;
      }
      return product.save();
    })
    .then(() => {
      return sharp(req.file.buffer)
        .resize({ width: 300, height: 300 })
        .toFile(`./images/${imageName}`);
    })
    .then((result) => {
      res.redirect("/admin/products");
    })
    .catch((err) => {
      const error = new Error(err);
      error.statusCode = 500;
      return next(error);
    });
};

exports.deleteDeleteProduct = (req, res, next) => {
  const productId = req.params.productId;

  Product.findById(productId)
    .then((product) => {
      if (!product) {
        next(new Error("Product not found"));
      }
      fileHelper.deleteFile(product.imageUrl.slice(1));
      return Product.deleteOne({ _id: productId, userId: req.user._id });
    })
    .then((result) => {
      console.log("DESTROYED");
      // res.status(200).json({ message: "Product Deletion Successful !" });
      res.redirect("/admin/products");
    })
    .catch((err) => {
      res
        .status(500)
        .json({ message: "Product Deletion Failed !", error: err });
    });
};
