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
			const thisProduct = this;
			thisProduct.id = id;
			thisProduct.data = data;

			thisProduct.renderInMenu();
			thisProduct.getElements();
			thisProduct.initAccorddion();
			thisProduct.initOrderForm();
			this.initAmountWidget();
			thisProduct.processOrder();
			console.log(`New Product: `, thisProduct);
		}

		renderInMenu() {
			const thisProduct = this;

			/* generate HTML based on template */
			const generatedHTML = templates.menuProduct(thisProduct.data);

			/* create element using utils.createElementFromHTML */
			thisProduct.element = utils.createDOMFromHTML(generatedHTML);

			/* find menu container */
			const menuContainer = document.querySelector(select.containerOf.menu);

			/* add element to menu */
			menuContainer.appendChild(thisProduct.element);
		}

		getElements() {
			const thisProduct = this;

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

			thisProduct.accordionTrigger = thisProduct.element.querySelector(
				select.menuProduct.clickable
			);
			thisProduct.form = thisProduct.element.querySelector(
				select.menuProduct.form
			);
			thisProduct.formInputs = thisProduct.form.querySelectorAll(
				select.all.formInputs
			);
			thisProduct.cartButton = thisProduct.element.querySelector(
				select.menuProduct.cartButton
			);
			thisProduct.priceElem = thisProduct.element.querySelector(
				select.menuProduct.priceElem
			);
			thisProduct.imageWrapper = thisProduct.element.querySelector(
				select.menuProduct.imageWrapper
			);
			this.amountWidgetElem = this.element.querySelector(
				select.menuProduct.amountWidget
			);
		}

		initAccorddion() {
			const thisProduct = this;

			/* find the clickable trigger (the element that should react to clicking) */
			/* ==== thisProduct.accordionTrigger ==== */

			/* START: add event listener to clickable trigger on event click */
			thisProduct.accordionTrigger.addEventListener('click', function (event) {
				/* prevent default action for event */
				event.preventDefault();
				/* find active product (product that has active class) */
				const activeProducts = document.querySelectorAll(
					select.all.menuProductsActive
				);
				/* if there is active product and it's not thisProduct.element, remove class active from it */
				for (let activeProduct of activeProducts) {
					if (activeProduct !== thisProduct.element) {
						activeProduct.classList.remove(
							classNames.menuProduct.wrapperActive
						);
					}
				}

				/* toggle active class on thisProduct.element */
				thisProduct.element.classList.toggle(
					classNames.menuProduct.wrapperActive
				);
			});
		}

		initOrderForm() {
			const thisProduct = this;
			console.log(`InitOrderForm()`);

			thisProduct.form.addEventListener('submit', function (event) {
				event.preventDefault();
				thisProduct.processOrder();
			});

			for (let input of thisProduct.formInputs) {
				input.addEventListener('change', function () {
					thisProduct.processOrder();
				});
			}

			thisProduct.cartButton.addEventListener('click', event => {
				event.preventDefault();
				thisProduct.processOrder();
				this.addToCart();
			});
		}

		processOrder() {
			const thisProduct = this;

			// covert form to object structure e.g. { sauce: ['tomato'], toppings: ['olives', 'redPeppers']}
			const formData = utils.serializeFormToObject(thisProduct.form);
			console.log('formData', formData);

			// set price to default price
			let price = thisProduct.data.price;
			console.log(price);

			// for every category (param)...
			for (let paramId in thisProduct.data.params) {
				// determine param value, e.g. paramId = 'toppings', param = { label: 'Toppings', type: 'checkboxes'... }
				const param = thisProduct.data.params[paramId];
				console.log(paramId, param);

				// for every option in this category
				for (let optionId in param.options) {
					// determine option value, e.g. optionId = 'olives', option = { label: 'Olives', price: 2, default: true }
					const option = param.options[optionId];
					console.log(`optionID ` + optionId, option);

					const selectedItem =
						paramId in formData && formData[paramId].includes(optionId);
					const image = thisProduct.imageWrapper.querySelector(
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
			thisProduct.priceElem.innerHTML = price;
		}

		initAmountWidget() {
			this.amountWidget = new AmountWidget(this.amountWidgetElem);
			this.amountWidgetElem.addEventListener('update', () => {
				// how this instancy knows 'update' exist?
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
				console.log(paramId, param);

				// for every option in this category
				for (let optionId in param.options) {
					// determine option value, e.g. optionId = 'olives', option = { label: 'Olives', price: 2, default: true }
					const option = param.options[optionId];
					console.log(`optionID ` + optionId, option);

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
			console.log(`AmountWidget: ` + this);
			console.log(`Constructor arguments: `, element);

			this.getElements(element);
			this.setValue(settings.amountWidget.defaultValue);
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
			const event = new Event('update');
			this.element.dispatchEvent(event);
		}
	}

	class Cart {
		constructor(element) {
			this.products = [];
			this.getElements(element);
			this.initActions();
			console.log(`new Cart: `, this);
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
		}

		initActions() {
			document.addEventListener('click', e => {
				if (e.target.closest(select.cart.toggleTrigger)) {
					this.dom.wrapper.classList.toggle(classNames.cart.wrapperActive);
				}

				if (!e.target.closest(select.containerOf.cart)) {
					this.dom.wrapper.classList.remove(classNames.cart.wrapperActive);
				}
			});
		}

		add(menuProduct) {
			console.log(`adding product: `, menuProduct);

			const generatedHTML = templates.cartProduct(menuProduct);

			this.element = utils.createDOMFromHTML(generatedHTML);

			this.dom.productList.appendChild(this.element);

			this.products.push(new CartProduct(menuProduct, this.element));
			console.log(this.products);
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
			console.log(`CartProducts: `, this);
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
	}

	const app = {
		initData: function () {
			const thisApp = this;
			thisApp.data = dataSource;
		},
		initMenu: function () {
			const thisApp = this;
			console.log(`thisApp.data: `, thisApp.data);

			for (let productData in thisApp.data.products) {
				new Product(productData, thisApp.data.products[productData]);
			}
		},
		init: function () {
			const thisApp = this;
			console.log('*** App starting ***');
			console.log('thisApp:', thisApp);
			console.log('classNames:', classNames);
			console.log('settings:', settings);
			console.log('templates:', templates);

			thisApp.initData();
			thisApp.initMenu();
			this.initCart();
		},
		initCart() {
			const cartElem = document.querySelector(select.containerOf.cart);
			this.cart = new Cart(cartElem);
		},
	};

	app.init();
}
