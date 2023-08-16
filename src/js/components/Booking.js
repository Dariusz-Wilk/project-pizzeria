import { select, templates } from '../settings.js';
import AmountWidget from './AmountWidget.js';

class Booking {
	constructor(element) {
		this.render(element);
		this.initWidgets();
	}

	render(element) {
		const generatedHTML = templates.bookingWidget();

		this.dom = {};
		this.dom.wrapper = element;
		this.dom.wrapper.innerHTML = generatedHTML;

		this.dom.peopleAmount = this.dom.wrapper.querySelector(
			select.booking.peopleAmount
		);
		this.dom.hoursAmount = this.dom.wrapper.querySelector(
			select.booking.hoursAmount
		);
	}

	initWidgets() {
		this.peopleAmountWidget = new AmountWidget(this.dom.peopleAmount);
		this.hourAmountWidget = new AmountWidget(this.dom.hoursAmount);

		this.dom.peopleAmount.addEventListener('update', () => {});
		this.dom.hoursAmount.addEventListener('update', () => {});
	}
}

export default Booking;