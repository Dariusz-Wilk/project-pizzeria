import { select, classNames, settings, templates } from '../settings.js';
import utils from '../utils.js';
import CartProduct from './CartProduct.js';

class Cart {
	constructor(element) {
		this.products = [];
		this.getElements(element);
		this.initActions();
		console.log(this);
	}

	getElements(element) {
		this.dom = {};
		this.dom.wrapper = element;
		this.dom.toggleTrigger = this.dom.wrapper.querySelector(
			select.cart.toggleTrigger
		);
		this.dom.productList = this.dom.wrapper.querySelector(
			select.cart.productList
		);
		this.dom.deliveryFee = this.dom.wrapper.querySelector(
			select.cart.deliveryFee
		);
		this.dom.subtotalPrice = this.dom.wrapper.querySelector(
			select.cart.subtotalPrice
		);
		this.dom.totalPrice = this.dom.wrapper.querySelectorAll(
			select.cart.totalPrice
		);
		this.dom.totalNumber = this.dom.wrapper.querySelector(
			select.cart.totalNumber
		);
		this.dom.form = this.dom.wrapper.querySelector(select.cart.form);
		this.dom.address = this.dom.wrapper.querySelector(select.cart.address);
		this.dom.phone = this.dom.wrapper.querySelector(select.cart.phone);
	}

	initActions() {
		const wholePage = document.body;
		console.log(wholePage);
		console.log(this.dom.wrapper);
		this.dom.toggleTrigger.addEventListener('click', () => {
			this.dom.wrapper.classList.toggle(classNames.cart.wrapperActive);
		});

		wholePage.addEventListener('click', e => {
			if (
				!e.target.closest('.cart') &&
				!e.target.classList.contains('cart-trash-icon')
			) {
				this.dom.wrapper.classList.remove('active');
			}
		});

		this.dom.productList.addEventListener('update', () => {
			this.update();
		});

		this.dom.productList.addEventListener('remove', () => {
			this.remove(event.detail.cartProduct);
		});

		this.dom.form.addEventListener('submit', e => {
			e.preventDefault();

			this.sendOrder();
		});
	}

	sendOrder() {
		const url = `${settings.db.url}/${settings.db.orders}`;

		const payload = {};
		payload.address = this.dom.address.value;
		payload.phone = this.dom.phone.value;
		payload.totalPrice = this.totalPrice;
		payload.subtotalPrice = this.totalPrice - settings.cart.defaultDeliveryFee;
		payload.totalNumber = this.totalNumber;
		payload.deliveryFee = settings.cart.defaultDeliveryFee;
		payload.products = [];

		for (let prod of this.products) {
			payload.products.push(prod.getData());
		}

		const options = {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
			},
			body: JSON.stringify(payload),
		};

		fetch(url, options)
			.then(function (response) {
				return response.json();
			})
			.then(function (parsedResponse) {
				console.log(parsedResponse);
			})
			.catch(function (err) {
				console.error(`new error: `, err);
			});
	}

	remove(cartProduct) {
		const delated = this.products.indexOf(cartProduct);
		this.products.splice(delated, 1);

		this.dom.productList.children[delated].remove();

		this.update();
	}

	add(menuProduct) {
		const generatedHTML = templates.cartProduct(menuProduct);

		this.element = utils.createDOMFromHTML(generatedHTML);

		this.dom.productList.appendChild(this.element);

		this.products.push(new CartProduct(menuProduct, this.element));

		this.update();
		console.log(this.products);
	}

	update() {
		const deliveryFee = settings.cart.defaultDeliveryFee;
		this.totalNumber = 0;
		let subtotalPrice = 0;
		this.totalPrice = 0;

		for (let product of this.products) {
			this.totalNumber += product.amount;
			subtotalPrice += product.price;
		}

		if (this.totalNumber === 0) {
			this.dom.deliveryFee.textContent = 0;
			this.totalPrice = 0;
		} else {
			this.dom.deliveryFee.textContent = deliveryFee;
			this.totalPrice = subtotalPrice + deliveryFee;
		}

		this.dom.totalNumber.textContent = this.totalNumber;
		this.dom.subtotalPrice.textContent = subtotalPrice;

		for (let price of this.dom.totalPrice) {
			price.textContent = this.totalPrice;
		}
	}
}

export default Cart;
