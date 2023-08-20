import { templates, select, classNames } from '../settings.js';
import utils from '../utils.js';
import AmountWidget from './AmountWidget.js';

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
		this.dom.formInputs = this.dom.form.querySelectorAll(select.all.formInputs);
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
					activeProduct.classList.remove(classNames.menuProduct.wrapperActive);
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
		this.amountWidget = new AmountWidget(this.amountWidgetElem, 1);
		this.amountWidgetElem.addEventListener('update', () => {
			this.processOrder();
		});
	}

	addToCart() {
		// app.cart.add(this.prepareCartProduct());

		const event = new CustomEvent('add-to-cart', {
			bubbles: true,
			detail: {
				product: this.prepareCartProduct(),
			},
		});

		this.element.dispatchEvent(event);
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

export default Product;
