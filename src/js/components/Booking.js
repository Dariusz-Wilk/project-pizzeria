import { select, settings, templates } from '../settings.js';
import utils from '../utils.js';
import AmountWidget from './AmountWidget.js';
import DatePicker from './DatePicker.js';
import HourPicker from './HourPicker.js';

class Booking {
	constructor(element) {
		this.render(element);
		this.initWidgets();
		this.getData();

		console.log(this);
	}

	getData() {
		const startDateParam = `${settings.db.dateStartParamKey}=${this.datePickerWidget.correctValue}`;
		const endDateParam = `${settings.db.dateEndParamKey}=${utils.dateToStr(
			this.datePickerWidget.maxDate
		)}`;
		const params = {
			booking: [startDateParam, endDateParam],
			eventsCurrent: [settings.db.notRepeatParam, startDateParam, endDateParam],
			eventsRepeat: [settings.db.repeatParam, endDateParam],
		};

		console.log(`getData params`, params);
		const urls = {
			booking: `${settings.db.url}/${settings.db.booking}?${params.booking.join(
				'&'
			)}`,
			eventsCurrent: `${settings.db.url}/${
				settings.db.event
			}?${params.eventsCurrent.join('&')}`,
			eventsRepeat: `${settings.db.url}/${
				settings.db.event
			}?${params.eventsRepeat.join('&')}`,
		};

		console.log(urls.booking);

		Promise.all([
			fetch(urls.booking),
			fetch(urls.eventsCurrent),
			fetch(urls.eventsRepeat),
		])
			.then(function (allResponses) {
				const bookingResponse = allResponses[0];
				const eventsCurrentResponse = allResponses[1];
				const eventsRepeatResponse = allResponses[2];
				return Promise.all([
					bookingResponse.json(),
					eventsCurrentResponse.json(),
					eventsRepeatResponse.json(),
				]);
			})
			.then(function ([bookings, currentEv, repeatEv]) {
				console.log(bookings);
				console.log(currentEv);
				console.log(repeatEv);
			});
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
		this.dom.datePickerWidget = this.dom.wrapper.querySelector(
			select.widgets.datePicker.wrapper
		);
		this.dom.hourPickerWidget = this.dom.wrapper.querySelector(
			select.widgets.hourPicker.wrapper
		);
	}

	initWidgets() {
		this.peopleAmountWidget = new AmountWidget(this.dom.peopleAmount);
		this.hourAmountWidget = new AmountWidget(this.dom.hoursAmount);

		this.dom.peopleAmount.addEventListener('update', () => {});
		this.dom.hoursAmount.addEventListener('update', () => {});

		this.datePickerWidget = new DatePicker(this.dom.datePickerWidget);
		this.hourPickerWidget = new HourPicker(this.dom.hourPickerWidget);
	}
}

export default Booking;
