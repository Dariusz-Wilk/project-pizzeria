import { select, settings } from '../settings.js';
import BaseWidget from './baseWidget.js';

class AmountWidget extends BaseWidget {
	constructor(element) {
		super(element, settings.amountWidget.defaultValue);
		this.getElements();
		this.initAction();
		this.renderValue();
	}

	getElements() {
		this.dom.input = this.dom.wrapper.querySelector(
			select.widgets.amount.input
		);
		this.dom.linkDecrease = this.dom.wrapper.querySelector(
			select.widgets.amount.linkDecrease
		);
		this.dom.linkIncrease = this.dom.wrapper.querySelector(
			select.widgets.amount.linkIncrease
		);
	}

	isValid(value) {
		return (
			!isNaN(value) &&
			value >= settings.amountWidget.defaultMin &&
			value <= settings.amountWidget.defaultMax
		);
	}

	renderValue() {
		this.dom.input.value = this.value;
	}

	initAction() {
		this.dom.input.addEventListener('change', () => {
			this.value = this.dom.input.value;
			// this.setValue(this.dom.input.value);
		});
		this.dom.linkDecrease.addEventListener('click', event => {
			event.preventDefault();
			this.setValue(+this.dom.input.value - 1);
		});
		this.dom.linkIncrease.addEventListener('click', event => {
			event.preventDefault();
			this.setValue(+this.dom.input.value + 1);
		});
	}
}

export default AmountWidget;
