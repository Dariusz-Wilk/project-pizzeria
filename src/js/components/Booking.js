import { classNames, select, settings, templates } from '../settings.js';
import utils from '../utils.js';
import AmountWidget from './AmountWidget.js';
import DatePicker from './DatePicker.js';
import HourPicker from './HourPicker.js';

class Booking {
	constructor(element) {
		this.booked = {};
		this.render(element);
		this.initWidgets();

		this.getData();
		this.startersArray = [];
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
			});
	}

	parseData(bookings, eventsCurrent, eventsRepeat) {
		for (let event of bookings) {
			this.makeBooked(event.date, event.hour, event.duration, event.table);
		}
		for (let event of eventsCurrent) {
			this.makeBooked(event.date, event.hour, event.duration, event.table);
		}

		const minDate = this.datePickerWidget.minDate;
		const maxDate = this.datePickerWidget.maxDate;

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

		this.updateDOM();
	}

	checkSetColor() {
		this.dom.hourInputRange = this.dom.wrapper.querySelector(
			'[id^="js-rangeSlider"]'
		);
		this.dom.inputSlider = this.dom.wrapper.querySelector(
			'.rangeSlider__fill__horizontal'
		);
		let y = 1;
		const width = 4;
		const timesArr = [];
		let color = 'linear-gradient(to right, ';
		for (let time in this.booked[this.datePickerWidget.correctValue]) {
			timesArr.push(
				`${time} : ${
					this.booked[this.datePickerWidget.correctValue][time].length
				}`
			);
		}

		for (let time of timesArr.sort()) {
			if (time.charAt(time.length - 1) == 0) {
				color += `green ${y * width}%, `;
			} else if (time.charAt(time.length - 1) == 1) {
				color += `yellow ${y * width}%, `;
			} else if (time.charAt(time.length - 1) == 2) {
				color += `orange ${y * width}%, `;
			} else {
				color += `red ${y * width}%, `;
			}
			y++;
		}
		const inputGradient = color.slice(0, -2) + ')';

		this.dom.hourInputRange.style.background = inputGradient;
		this.dom.inputSlider.style.background = 'none';
	}

	createEmptyArrForEachHours(date) {
		if (typeof this.booked[date] == 'undefined') {
			this.booked[date] = {};
		}
		for (let hourBlock = 12; hourBlock < 24; hourBlock += 0.5) {
			if (typeof this.booked[date][hourBlock] == 'undefined') {
				this.booked[date][hourBlock] = [];
			}
		}
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
		this.createEmptyArrForEachHours(date);
	}

	updateDOM() {
		this.date = this.datePickerWidget.value;
		this.hour = utils.hourToNumber(this.hourPickerWidget.value);

		let allAvailable = false;

		if (
			typeof this.booked[this.date] == 'undefined' ||
			typeof this.booked[this.date][this.hour] == 'undefined'
		) {
			allAvailable = true;
		}

		for (let table of this.dom.tables) {
			let tableId = table.getAttribute(settings.booking.tableIdAttribute);
			if (!isNaN(tableId)) {
				tableId = parseInt(tableId);
			}

			if (
				!allAvailable &&
				this.booked[this.date][this.hour].includes(tableId)
			) {
				table.classList.add(classNames.booking.tableBooked);
			} else {
				table.classList.remove(classNames.booking.tableBooked);
			}

			table.classList.remove(classNames.booking.tableChosen);
		}

		this.checkSetColor();
	}

	selectTable(e) {
		const clickedTable = e.target.closest(select.booking.tables);
		for (let table of this.dom.tables) {
			if (table !== e.target) {
				table.classList.remove(classNames.booking.tableChosen);
			}
		}
		if (!clickedTable) {
			return;
		} else if (
			clickedTable.classList.contains(classNames.booking.tableBooked)
		) {
			alert('This table is already booked. Please select different one');
		} else {
			clickedTable.classList.toggle(classNames.booking.tableChosen);
			this.chosenTableId = parseInt(
				clickedTable.getAttribute(select.booking.tableID)
			);
		}
	}

	sendBooking() {
		const phone = this.dom.wrapper.querySelector(select.booking.phoneNum);
		const address = this.dom.wrapper.querySelector(select.booking.address);
		const bookload = {};
		bookload.date = this.datePickerWidget.value;
		bookload.hour = this.hourPickerWidget.value;
		bookload.table = this.chosenTableId;
		bookload.duration = this.hourAmountWidget.correctValue;
		bookload.ppl = this.peopleAmountWidget.correctValue;
		bookload.starters = this.startersArray;
		bookload.phone = phone.value;
		bookload.address = address.value;

		const url = `${settings.db.url}/${settings.db.booking}`;
		const options = {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
			},
			body: JSON.stringify(bookload),
		};

		fetch(url, options)
			.then(function (response) {
				return response.json();
			})
			.then(parsedResponse => {
				this.makeBooked(
					parsedResponse.date,
					parsedResponse.hour,
					parsedResponse.duration,
					parsedResponse.table
				);
				this.updateDOM();
				alert(
					`Your booking details:\n \nDate: ${parsedResponse.date} \nTime: ${parsedResponse.hour} \nPeople: ${parsedResponse.ppl} \nTable: ${parsedResponse.table}`
				);
				console.log(parsedResponse);
			})
			.catch(err => alert(err));
	}

	selectStarters(e) {
		const clickedStarter = e.target.closest('input[type="checkbox"]');
		if (!clickedStarter) {
			return;
		} else {
			if (clickedStarter.checked) {
				this.startersArray.push(clickedStarter.value);
			} else {
				const starterIndex = this.startersArray.indexOf(clickedStarter.value);
				this.startersArray.splice(starterIndex, 1);
			}
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
		this.dom.tables = this.dom.wrapper.querySelectorAll(select.booking.tables);
		this.dom.floorPlan = this.dom.wrapper.querySelector(
			select.booking.floorPlan
		);
		this.dom.sendBookingBtn = this.dom.wrapper.querySelector(
			select.booking.sendBookingBtn
		);
		this.dom.checkboxForm = this.dom.wrapper.querySelector(
			select.booking.checkboxForm
		);
	}

	initWidgets() {
		this.peopleAmountWidget = new AmountWidget(
			this.dom.peopleAmount,
			settings.amountWidget.defaultValue,
			20
		);
		this.hourAmountWidget = new AmountWidget(
			this.dom.hoursAmount,
			settings.amountWidget.defaultValue
		);

		this.dom.peopleAmount.addEventListener('update', () => {});
		this.dom.hoursAmount.addEventListener('update', () => {});

		this.datePickerWidget = new DatePicker(this.dom.datePickerWidget);
		this.hourPickerWidget = new HourPicker(this.dom.hourPickerWidget);

		this.dom.wrapper.addEventListener('update', e => {
			this.updateDOM();

			this.selectTable(e);
		});
		this.dom.floorPlan.addEventListener('click', e => {
			this.selectTable(e);
			console.log(this);
		});
		this.dom.sendBookingBtn.addEventListener('click', e => {
			e.preventDefault();
			this.sendBooking();
			console.log(this);
		});

		this.dom.checkboxForm.addEventListener('click', e => {
			this.selectStarters(e);
		});
	}
}

export default Booking;
