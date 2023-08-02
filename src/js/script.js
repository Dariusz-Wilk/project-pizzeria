/* global Handlebars, utils, dataSource */ // eslint-disable-line no-unused-vars

{
	('use strict');

	const select = {
		templateOf: {
			menuProduct: '#template-menu-product',
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
				input: 'input[name="amount"]',
				linkDecrease: 'a[href="#less"]',
				linkIncrease: 'a[href="#more"]',
			},
		},
	};

	const classNames = {
		menuProduct: {
			wrapperActive: 'active',
			imageVisible: 'active',
		},
	};

	const settings = {
		amountWidget: {
			defaultValue: 1,
			defaultMin: 1,
			defaultMax: 9,
		},
	};

	const templates = {
		menuProduct: Handlebars.compile(
			document.querySelector(select.templateOf.menuProduct).innerHTML
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

			thisProduct.cartButton.addEventListener('click', function (event) {
				event.preventDefault();
				thisProduct.processOrder();
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

			// update calculated price in the HTML
			thisProduct.priceElem.innerHTML = price;
		}

		initAmountWidget() {
			this.amountWidget = new AmountWidget(this.amountWidgetElem);
		}
	}

	class AmountWidget {
		constructor(element) {
			console.log(`AmountWidget: ` + this);
			console.log(`Constructor arguments: `, element);

			this.getElements(element);
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

			if (this.value !== newValue && !isNaN(newValue)) {
				this.value = newValue;
			}

			this.input.value = this.value;
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
		},
	};

	app.init();
}