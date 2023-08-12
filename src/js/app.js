import { settings, select, classNames } from './settings.js';
import Product from './components/Product.js';
import Cart from './components/Cart.js';
import Booking from './components/Booking.js';

const app = {
	initPages: function () {
		this.pages = document.querySelector(select.containerOf.pages).children;
		this.navLinks = document.querySelectorAll(select.nav.links);

		const idFromHash = window.location.hash.replace('#/', '');

		let pageMatchingHash = this.pages[0].id;

		for (let page of this.pages) {
			if (page.id == idFromHash) {
				pageMatchingHash = page.id;
				break;
			}
		}

		this.activatePage(pageMatchingHash);

		for (let link of this.navLinks) {
			link.addEventListener('click', e => {
				e.preventDefault();
				const linkId = link.hash.replace('#', '');
				this.activatePage(linkId);

				/* change URL hash */
				window.location.hash = '#/' + linkId;
			});
		}
	},

	activatePage: function (pageId) {
		/* add class 'active' to matching pages, remove it from non-matching */
		for (let page of this.pages) {
			page.classList.toggle(classNames.pages.active, page.id === pageId);
		}
		/* add class 'active' to matching links, remove it from non-matching */
		for (let link of this.navLinks) {
			const linkId = link.hash.replace('#', '');
			link.classList.toggle(classNames.nav.active, linkId === pageId);
		}
	},
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

		this.initPages();
		thisApp.initData();
		this.initCart();
		this.initBooking();
	},
	initCart() {
		const cartElem = document.querySelector(select.containerOf.cart);
		this.cart = new Cart(cartElem);

		this.productList = document.querySelector(select.containerOf.menu);
		this.productList.addEventListener('add-to-cart', event => {
			app.cart.add(event.detail.product);
		});
	},

	initBooking() {
		const bookingPageWrapper = document.querySelector(
			select.containerOf.booking
		);
		new Booking(bookingPageWrapper);
	},
};

app.init();
