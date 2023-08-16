class BaseWidget {
	constructor(wrapperElement, initialValue) {
		this.dom = {};
		this.dom.wrapper = wrapperElement;

		this.value = initialValue;
	}

	setValue(value) {
		const newValue = this.parseValue(value);

		if (this.value !== newValue && this.isValid(newValue)) {
			this.value = newValue;
			this.announce();
		}

		this.renderValue();
	}

	parseValue(value) {
		return parseInt(value);
	}

	isValid(value) {
		return !isNaN(value);
	}

	renderValue() {
		this.dom.wrapper.innerHTML = this.value;
	}

	announce() {
		const event = new Event('update', {
			bubbles: true,
		});
		this.dom.wrapper.dispatchEvent(event);
	}
}
export default BaseWidget;
