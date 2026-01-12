import { templates, select, classNames } from '../settings.js';
import { AmountWidget } from './AmountWidget.js';
import { utils } from '../utils.js';

export class Product {
	constructor(id, data) {
		const thisProduct = this;
		thisProduct.id = id;
		thisProduct.data = data;
		thisProduct.renderInMenu();
		thisProduct.getElements();
		thisProduct.initAccordion();
		thisProduct.initOrderForm();
		thisProduct.initAmountWidget();
		thisProduct.processOrder();
	}

	renderInMenu() {
		const thisProduct = this;
		const generatedHTML = templates.menuProduct(thisProduct.data);
		thisProduct.element = utils.createDOMFromHTML(generatedHTML);
		const menuContainer = document.querySelector(select.containerOf.menu);
		menuContainer.appendChild(thisProduct.element);
	}

	initAmountWidget() {
		const thisProduct = this;
		thisProduct.amountWidget = new AmountWidget(thisProduct.amountWidgetElem);
		thisProduct.amountWidgetElem.addEventListener('updated', function () {
			thisProduct.processOrder();
		});
	}

	getElements() {
		const thisProduct = this;

		thisProduct.accordionTrigger = thisProduct.element.querySelector(
			select.menuProduct.clickable
		);
		thisProduct.form = thisProduct.element.querySelector(
			select.menuProduct.form
		);
		thisProduct.formInputs = thisProduct.form.querySelectorAll(
			select.all.formInputs
		);
		thisProduct.cartButton = thisProduct.element.querySelector(
			select.menuProduct.cartButton
		);
		thisProduct.priceElem = thisProduct.element.querySelector(
			select.menuProduct.priceElem
		);
		thisProduct.imageWrapper = thisProduct.element.querySelector(
			select.menuProduct.imageWrapper
		);
		thisProduct.amountWidgetElem = thisProduct.element.querySelector(
			select.menuProduct.amountWidget
		);
	}

	initAccordion() {
		const thisProduct = this;
		this.accordionTrigger.addEventListener('click', function (event) {
			event.preventDefault();
			thisProduct.element.classList.toggle(
				classNames.menuProduct.wrapperActive
			);
			const activeProducts = document.querySelectorAll(
				select.all.menuProductsActive
			);
			for (let activeProduct of activeProducts) {
				if (activeProduct !== thisProduct.element) {
					activeProduct.classList.remove(classNames.menuProduct.wrapperActive);
				}
			}
		});
	}

	addToCart() {
		const thisProduct = this;
		const event = new CustomEvent('add-to-cart', {
			bubbles: true,
			detail: {
				product: thisProduct.prepareCartProduct(),
			},
		});
		thisProduct.element.dispatchEvent(event);
	}

	initOrderForm() {
		const thisProduct = this;
		thisProduct.form.addEventListener('submit', function (event) {
			event.preventDefault();
			thisProduct.processOrder();
		});

		for (let input of thisProduct.formInputs) {
			input.addEventListener('change', function () {
				thisProduct.processOrder();
			});
		}

		thisProduct.cartButton.addEventListener('click', function (event) {
			event.preventDefault();
			thisProduct.processOrder();
			thisProduct.addToCart();
		});
	}

	processOrder() {
		const thisProduct = this;
		let price = Number(thisProduct.data.price);
		const formData = utils.serializeFormToObject(thisProduct.form);
		const params = thisProduct.data.params || {};
		for (let paramId in params) {
			const param = params[paramId];

			for (let optionId in param.options) {
				const option = param.options[optionId];
				const optionSelected =
					formData[paramId] && formData[paramId].includes(optionId);
				const optionImage = thisProduct.imageWrapper.querySelector(
					'.' + paramId + '-' + optionId
				);

				if (optionImage) {
					if (optionSelected) {
						optionImage.classList.add(classNames.menuProduct.imageVisible);
					} else {
						optionImage.classList.remove(classNames.menuProduct.imageVisible);
					}
				}
				if (optionSelected) {
					if (!option.default) {
						price += option.price;
					}
				} else {
					if (option.default) {
						price -= option.price;
					}
				}
			}

			price *= thisProduct.amountWidget.value;
			thisProduct.priceElem.innerHTML = price;
		}
	}

	prepareCartProduct() {
		const thisProduct = this;
		// compute single item price with selected options
		let priceSingle = Number(thisProduct.data.price);
		const formData = utils.serializeFormToObject(thisProduct.form);
		const params = thisProduct.data.params || {};
		for (let paramId in params) {
			const param = params[paramId];
			for (let optionId in param.options) {
				const option = param.options[optionId];
				const optionSelected =
					formData[paramId] && formData[paramId].includes(optionId);
				if (optionSelected) {
					if (!option.default) {
						priceSingle += option.price;
					}
				} else {
					if (option.default) {
						priceSingle -= option.price;
					}
				}
			}
		}

		const amount = thisProduct.amountWidget.value;
		const productSummary = {
			id: thisProduct.id,
			name: thisProduct.data.name,
			amount: amount,
			priceSingle: priceSingle,
			price: priceSingle * amount,
			params: thisProduct.prepareCartProductParams(),
		};
		return productSummary;
	}

	prepareCartProductParams() {
		const thisProduct = this;
		const formData = utils.serializeFormToObject(thisProduct.form);
		const params = {};
		const productParams = thisProduct.data.params || {};
		for (let paramId in productParams) {
			const param = productParams[paramId];
			params[paramId] = {
				label: param.label,
				options: {},
			};
			for (let optionId in param.options) {
				if (formData[paramId] && formData[paramId].includes(optionId)) {
					params[paramId].options[optionId] = param.options[optionId].label;
				}
			}
		}
		return params;
	}
}

export default Product;
