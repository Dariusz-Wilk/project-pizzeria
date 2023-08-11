import { select, settings } from '../settings.js';

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

export default AmountWidget;
