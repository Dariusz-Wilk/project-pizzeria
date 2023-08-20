import { select } from '../settings.js';
import AmountWidget from './AmountWidget.js';

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
		this.dom.remove = this.dom.wrapper.querySelector(select.cartProduct.remove);
	}

	initAmountWidget() {
		this.amountWidget = new AmountWidget(this.dom.amountWidget, this.amount);
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

export default CartProduct;
