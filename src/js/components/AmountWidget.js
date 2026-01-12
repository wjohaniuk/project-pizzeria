import { settings, select } from '../settings.js';

export class AmountWidget {
	constructor(element) {
		const thisWidget = this;
		thisWidget.element = element;
		this.getElements(thisWidget);
		thisWidget.setValue(thisWidget.input.value);
		thisWidget.initActions();
	}

	getElements() {
		const thisWidget = this;
		thisWidget.input = thisWidget.element.querySelector(
			select.widgets.amount.input
		);
		thisWidget.linkDecrease = thisWidget.element.querySelector(
			select.widgets.amount.linkDecrease
		);
		thisWidget.linkIncrease = thisWidget.element.querySelector(
			select.widgets.amount.linkIncrease
		);
	}

	setValue(value) {
		const thisWidget = this;
		let newValue = parseInt(value);

		if (isNaN(newValue)) {
			newValue = settings.amountWidget.defaultValue;
		}
		if (newValue < settings.amountWidget.defaultMin) {
			newValue = settings.amountWidget.defaultMin;
		}
		if (newValue > settings.amountWidget.defaultMax) {
			newValue = settings.amountWidget.defaultMax;
		}

		if (newValue === thisWidget.value) {
			thisWidget.input.value = thisWidget.value;
			return;
		}

		thisWidget.value = newValue;
		thisWidget.input.value = thisWidget.value;
		thisWidget.announce();
	}

	initActions() {
		const thisWidget = this;
		thisWidget.input.addEventListener('change', function () {
			thisWidget.setValue(thisWidget.input.value);
		});

		thisWidget.linkDecrease.addEventListener('click', function (event) {
			event.preventDefault();
			thisWidget.setValue(thisWidget.value - 1);
		});
		thisWidget.linkIncrease.addEventListener('click', function (event) {
			event.preventDefault();
			thisWidget.setValue(thisWidget.value + 1);
		});
	}

	announce() {
		const thisWidget = this;
		const event = new CustomEvent('updated', {
			bubbles: true,
		});
		thisWidget.element.dispatchEvent(event);
	}
}

export default AmountWidget;