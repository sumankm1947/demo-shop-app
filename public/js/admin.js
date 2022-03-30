// const deleteProduct = (btn) => {
//   const productId = btn.parentNode.querySelector("[name=productId]").value;
//   const csrf = btn.parentNode.querySelector("[name=_csrf]").value;
//   const productElement = btn.closest("article");

//   fetch(`/admin/delete-product/${productId}`, {
//     method: "DELETE",
//     headers: {
//       "csrf-token": csrf,
//     },
//   })
//     .then((result) => {
//       return result.json();
//     })
//     .then(body => {
//         // console.log(body);
//         productElement.parentNode.removeChild(productElement); // For all browsers
//         // productElement.remove()
//     })
//     .catch((err) => console.log(err));
// };
