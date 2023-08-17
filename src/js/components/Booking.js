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
			.then(([bookings, eventsCurrent, eventsRepeat]) => {
				this.parseData(bookings, eventsCurrent, eventsRepeat);
				// console.log(bookings);
				// console.log(eventsCurrent);
				// console.log(repeatEv);
			});
	}

	parseData(bookings, eventsCurrent, eventsRepeat) {
		this.booked = {};

		for (let event of bookings) {
			this.makeBooked(event.date, event.hour, event.duration, event.table);
		}
		for (let event of eventsCurrent) {
			this.makeBooked(event.date, event.hour, event.duration, event.table);
		}

		// const minDate = utils.dateToStr(new Date());
		const minDate = this.datePickerWidget.minDate;
		const maxDate = this.datePickerWidget.maxDate;

		console.log(minDate);
		console.log(maxDate);

		for (let event of eventsRepeat) {
			if (event.repeat == 'daily') {
				for (
					let loopDate = minDate;
					loopDate <= maxDate;
					loopDate = utils.addDays(loopDate, 1)
				) {
					this.makeBooked(
						utils.dateToStr(loopDate),
						event.hour,
						event.duration,
						event.table
					);
				}
			}
		}

		console.log(`this.booked: `, this.booked);
	}

	makeBooked(date, hour, duration, table) {
		if (typeof this.booked[date] == 'undefined') {
			this.booked[date] = {};
		}

		const startHour = utils.hourToNumber(hour);

		for (
			let hourBlock = startHour;
			hourBlock < startHour + duration;
			hourBlock += 0.5
		) {
			if (typeof this.booked[date][hourBlock] == 'undefined') {
				this.booked[date][hourBlock] = [];
			}
			this.booked[date][hourBlock].push(table);
		}
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
