import { settings, select } from './settings.js';
import Product from './components/Product.js';
import Cart from './components/Cart.js';

const app = {
	initData: function () {
		const thisApp = this;
		thisApp.data = {};
		const url = `${settings.db.url}/${settings.db.products}`;

		fetch(url)
			.then(function (rawResponse) {
				if (!rawResponse.ok) throw new Error();
				return rawResponse.json();
			})
			.then(function (parsedResponse) {
				//save parsedResponse as thisApp.data.products
				thisApp.data.products = parsedResponse;

				// execute initMenu method
				thisApp.initMenu();
			})
			.catch(function (err) {
				console.error(`new error: `, err);
			});
	},
	initMenu: function () {
		const thisApp = this;

		for (let productData in thisApp.data.products) {
			new Product(
				thisApp.data.products[productData].id,
				thisApp.data.products[productData]
			);
		}
	},
	init: function () {
		const thisApp = this;
		console.log('*** App starting ***');
		console.log('thisApp:', thisApp);

		thisApp.initData();
		this.initCart();
	},
	initCart() {
		const cartElem = document.querySelector(select.containerOf.cart);
		this.cart = new Cart(cartElem);

		this.productList = document.querySelector(select.containerOf.menu);
		this.productList.addEventListener('add-to-cart', event => {
			app.cart.add(event.detail.product);
		});
	},
};

app.init();
