/* global Handlebars, utils, dataSource */ // eslint-disable-line no-unused-vars

{
	('use strict');

	const select = {
		templateOf: {
			menuProduct: '#template-menu-product',
			cartProduct: '#template-cart-product',
		},
		containerOf: {
			menu: '#product-list',
			cart: '#cart',
		},
		all: {
			menuProducts: '#product-list > .product',
			menuProductsActive: '#product-list > .product.active',
			formInputs: 'input, select',
		},
		menuProduct: {
			clickable: '.product__header',
			form: '.product__order',
			priceElem: '.product__total-price .price',
			imageWrapper: '.product__images',
			amountWidget: '.widget-amount',
			cartButton: '[href="#add-to-cart"]',
		},
		widgets: {
			amount: {
				input: 'input.amount',
				linkDecrease: 'a[href="#less"]',
				linkIncrease: 'a[href="#more"]',
			},
		},
		cart: {
			productList: '.cart__order-summary',
			toggleTrigger: '.cart__summary',
			totalNumber: `.cart__total-number`,
			totalPrice:
				'.cart__total-price strong, .cart__order-total .cart__order-price-sum strong',
			subtotalPrice: '.cart__order-subtotal .cart__order-price-sum strong',
			deliveryFee: '.cart__order-delivery .cart__order-price-sum strong',
			form: '.cart__order',
			formSubmit: '.cart__order [type="submit"]',
			phone: '[name="phone"]',
			address: '[name="address"]',
		},
		cartProduct: {
			amountWidget: '.widget-amount',
			price: '.cart__product-price',
			edit: '[href="#edit"]',
			remove: '[href="#remove"]',
		},
	};

	const classNames = {
		menuProduct: {
			wrapperActive: 'active',
			imageVisible: 'active',
		},
		cart: {
			wrapperActive: 'active',
		},
	};

	const settings = {
		amountWidget: {
			defaultValue: 1,
			defaultMin: 0,
			defaultMax: 10,
		},
		cart: {
			defaultDeliveryFee: 20,
		},
		db: {
			url: '//localhost:3131',
			products: 'products',
			orders: 'orders',
		},
	};

	const templates = {
		menuProduct: Handlebars.compile(
			document.querySelector(select.templateOf.menuProduct).innerHTML
		),
		cartProduct: Handlebars.compile(
			document.querySelector(select.templateOf.cartProduct).innerHTML
		),
	};

	class Product {
		constructor(id, data) {
			this.id = id;
			this.data = data;

			this.renderInMenu();
			this.getElements();
			this.initAccorddion();
			this.initOrderForm();
			this.initAmountWidget();
			this.processOrder();
		}

		renderInMenu() {
			// const thisProduct = this;

			/* generate HTML based on template */
			const generatedHTML = templates.menuProduct(this.data);

			/* create element using utils.createElementFromHTML */
			this.element = utils.createDOMFromHTML(generatedHTML);

			/* find menu container */
			const menuContainer = document.querySelector(select.containerOf.menu);

			/* add element to menu */
			menuContainer.appendChild(this.element);
		}

		getElements() {
			this.dom = {};
			this.dom.accordionTrigger = this.element.querySelector(
				select.menuProduct.clickable
			);
			this.dom.form = this.element.querySelector(select.menuProduct.form);
			this.dom.formInputs = this.dom.form.querySelectorAll(
				select.all.formInputs
			);
			this.dom.cartButton = this.element.querySelector(
				select.menuProduct.cartButton
			);
			this.dom.priceElem = this.element.querySelector(
				select.menuProduct.priceElem
			);
			this.dom.imageWrapper = this.element.querySelector(
				select.menuProduct.imageWrapper
			);
			this.dom.amountWidgetElem = this.element.querySelector(
				select.menuProduct.amountWidget
			);
			this.amountWidgetElem = this.element.querySelector(
				select.menuProduct.amountWidget
			);
		}

		initAccorddion() {
			/* find the clickable trigger (the element that should react to clicking) */
			/* ==== thisProduct.accordionTrigger ==== */

			/* START: add event listener to clickable trigger on event click */
			this.dom.accordionTrigger.addEventListener('click', event => {
				/* prevent default action for event */
				event.preventDefault();
				/* find active product (product that has active class) */
				const activeProducts = document.querySelectorAll(
					select.all.menuProductsActive
				);
				/* if there is active product and it's not thisProduct.element, remove class active from it */
				for (let activeProduct of activeProducts) {
					if (activeProduct !== this.element) {
						activeProduct.classList.remove(
							classNames.menuProduct.wrapperActive
						);
					}
				}

				/* toggle active class on thisProduct.element */
				this.element.classList.toggle(classNames.menuProduct.wrapperActive);
			});
		}

		initOrderForm() {
			this.dom.form.addEventListener('submit', event => {
				event.preventDefault();
				this.processOrder();
			});

			for (let input of this.dom.formInputs) {
				input.addEventListener('change', () => {
					this.processOrder();
				});
			}

			this.dom.cartButton.addEventListener('click', event => {
				event.preventDefault();
				this.processOrder();
				this.addToCart();
			});
		}

		processOrder() {
			// covert form to object structure e.g. { sauce: ['tomato'], toppings: ['olives', 'redPeppers']}
			const formData = utils.serializeFormToObject(this.dom.form);

			// set price to default price
			let price = this.data.price;

			// for every category (param)...
			for (let paramId in this.data.params) {
				// determine param value, e.g. paramId = 'toppings', param = { label: 'Toppings', type: 'checkboxes'... }
				const param = this.data.params[paramId];

				// for every option in this category
				for (let optionId in param.options) {
					// determine option value, e.g. optionId = 'olives', option = { label: 'Olives', price: 2, default: true }
					const option = param.options[optionId];

					const selectedItem =
						paramId in formData && formData[paramId].includes(optionId);
					const image = this.dom.imageWrapper.querySelector(
						`.${paramId}-${optionId}`
					);

					if (image) {
						image.classList.toggle(
							classNames.menuProduct.imageVisible,
							selectedItem
						);
					}

					if (selectedItem) {
						if (!option.default) {
							price += option.price;
						}
					} else {
						if (option.default) {
							price -= option.price;
						}
					}
				}
			}
			this.priceSingle = price;

			// Multiply price by amount;
			price *= this.amountWidget.value;

			// update calculated price in the HTML
			this.dom.priceElem.innerHTML = price;
		}

		initAmountWidget() {
			this.amountWidget = new AmountWidget(this.amountWidgetElem);
			this.amountWidgetElem.addEventListener('update', () => {
				this.processOrder();
			});
		}

		addToCart() {
			app.cart.add(this.prepareCartProduct());
		}

		prepareCartProduct() {
			const productSummary = {};

			productSummary.id = this.id;
			productSummary.name = this.data.name;
			productSummary.amount = this.amountWidget.value;
			productSummary.priceSingle = this.priceSingle;
			productSummary.price = productSummary.amount * productSummary.priceSingle;
			productSummary.params = this.prepareCartProductParams();
			return productSummary;
		}

		prepareCartProductParams() {
			const formData = utils.serializeFormToObject(this.form);

			const productParamObj = {};

			// for every category (param)...
			for (let paramId in this.data.params) {
				// determine param value, e.g. paramId = 'toppings', param = { label: 'Toppings', type: 'checkboxes'... }
				const param = this.data.params[paramId];

				// for every option in this category
				for (let optionId in param.options) {
					// determine option value, e.g. optionId = 'olives', option = { label: 'Olives', price: 2, default: true }
					const option = param.options[optionId];

					const selectedItem =
						paramId in formData && formData[paramId].includes(optionId);

					if (selectedItem) {
						if (!productParamObj[paramId]) {
							productParamObj[paramId] = {
								label: param.label,
								options: {},
							};
						}
						productParamObj[paramId].options[optionId] = option.label;
					}
				}
			}

			return productParamObj;
		}
	}

	class AmountWidget {
		constructor(element) {
			this.value = settings.amountWidget.defaultValue;
			this.getElements(element);
			this.setValue(this.input.value);
			this.initAction();
		}

		getElements(element) {
			this.element = element;
			this.input = this.element.querySelector(select.widgets.amount.input);
			this.linkDecrease = this.element.querySelector(
				select.widgets.amount.linkDecrease
			);
			this.linkIncrease = this.element.querySelector(
				select.widgets.amount.linkIncrease
			);
		}

		setValue(value) {
			const newValue = parseInt(value);

			/* TODO: Add validation */

			if (
				this.value !== newValue &&
				!isNaN(newValue) &&
				newValue >= settings.amountWidget.defaultMin &&
				newValue <= settings.amountWidget.defaultMax
			) {
				this.value = newValue;
				this.announce();
			}

			this.input.value = this.value;
		}

		initAction() {
			this.input.addEventListener('change', () => {
				this.setValue(this.input.value);
			});
			this.linkDecrease.addEventListener('click', event => {
				event.preventDefault();
				console.log(this.input.value--);
				this.setValue(this.input.value--);
			});
			this.linkIncrease.addEventListener('click', event => {
				event.preventDefault();
				console.log(this.input.value++);
				this.setValue(this.input.value++);
			});
		}

		announce() {
			const event = new Event('update', {
				bubbles: true,
			});
			this.element.dispatchEvent(event);
		}
	}

	class Cart {
		constructor(element) {
			this.products = [];
			this.getElements(element);
			this.initActions();
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
			this.dom.toggleTrigger.addEventListener('click', () => {
				this.dom.wrapper.classList.toggle(classNames.cart.wrapperActive);
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
			payload.subtotalPrice =
				this.totalPrice - settings.cart.defaultDeliveryFee;
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

	class CartProduct {
		constructor(menuProduct, element) {
			this.amount = menuProduct.amount;
			this.id = menuProduct.id;
			this.name = menuProduct.name;
			this.params = menuProduct.params;
			this.price = menuProduct.price;
			this.priceSingle = menuProduct.priceSingle;

			this.getElements(element);
			this.initAmountWidget();
			this.initActions();
		}

		getElements(element) {
			this.dom = {};
			this.dom.wrapper = element;
			this.dom.amountWidget = this.dom.wrapper.querySelector(
				select.cartProduct.amountWidget
			);
			this.dom.price = this.dom.wrapper.querySelector(select.cartProduct.price);
			this.dom.edit = this.dom.wrapper.querySelector(select.cartProduct.edit);
			this.dom.remove = this.dom.wrapper.querySelector(
				select.cartProduct.remove
			);
		}

		initAmountWidget() {
			this.amountWidget = new AmountWidget(this.dom.amountWidget);
			this.dom.amountWidget.addEventListener('update', () => {
				this.newPrice();
			});
		}

		getData() {
			return {
				id: this.id,
				amount: this.amount,
				price: this.price,
				priceSingle: this.priceSingle,
				name: this.name,
				params: this.params,
			};
		}

		newPrice() {
			this.price = this.amountWidget.value * this.priceSingle;
			this.dom.price.textContent = this.price;
			this.amount = this.amountWidget.value;
		}

		remove() {
			const event = new CustomEvent('remove', {
				bubbles: true,
				detail: {
					cartProduct: this,
				},
			});

			this.dom.wrapper.dispatchEvent(event);
		}

		initActions() {
			this.dom.edit.addEventListener('click', e => {
				e.preventDefault();
			});

			this.dom.remove.addEventListener('click', e => {
				e.preventDefault();
				this.remove();
			});
		}
	}

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
		},
	};

	app.init();
}
