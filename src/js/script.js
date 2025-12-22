/* global Handlebars, utils, dataSource */ // eslint-disable-line no-unused-vars

{
	('use strict');

	const select = {
		templateOf: {
			menuProduct: '#template-menu-product',
		},
		containerOf: {
			menu: '#product-list',
			cart: '#cart',
		},
		all: {
			menuProducts: '#product-list > .product',
			menuProductsActive: '#product-list > .product.active',
			formInputs: 'input, select',
		},
		menuProduct: {
			clickable: '.product__header',
			form: '.product__order',
			priceElem: '.product__total-price .price',
			imageWrapper: '.product__images',
			amountWidget: '.widget-amount',
			cartButton: '[href="#add-to-cart"]',
		},
		widgets: {
			amount: {
				input: 'input[name="amount"]',
				linkDecrease: 'a[href="#less"]',
				linkIncrease: 'a[href="#more"]',
			},
		},
	};

	const classNames = {
		menuProduct: {
			wrapperActive: 'active',
			imageVisible: 'active',
		},
	};

	const settings = {
		amountWidget: {
			defaultValue: 1,
			defaultMin: 0,
			defaultMax: 10,
		},
	};

	const templates = {
		menuProduct: Handlebars.compile(
			document.querySelector(select.templateOf.menuProduct).innerHTML
		),
	};

	class Product {
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
			/* generate HTML based on template */
			const generatedHTML = templates.menuProduct(thisProduct.data);
			/* create element using utils.createElementFromHTML */
			thisProduct.element = utils.createDOMFromHTML(generatedHTML);
			/* find menu container */
			const menuContainer = document.querySelector(select.containerOf.menu);
			/* add element to menu */
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

			/* START: click event listener to trigger */
			this.accordionTrigger.addEventListener('click', function (event) {
				/* prevent default action for event */
				event.preventDefault();
				/* toggle active class on element of thisProduct */
				thisProduct.element.classList.toggle(
					classNames.menuProduct.wrapperActive
				);
				/* find all active products */
				const activeProducts = document.querySelectorAll(
					select.all.menuProductsActive
				);
				/* LOOP: for each active product */
				for (let activeProduct of activeProducts) {
					/* if the active product isn't the element of thisProduct */
					if (activeProduct !== thisProduct.element) {
						/* remove class active for the active product */
						activeProduct.classList.remove(
							classNames.menuProduct.wrapperActive
						);
					}
				}
			});
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
	}

	class AmountWidget {
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
			// Notify others (e.g., Product) that the widget updated
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
			const event = new CustomEvent('updated');
			thisWidget.element.dispatchEvent(event);
		}
	}

	const app = {
		initData: function () {
			const thisApp = this;
			thisApp.data = dataSource;
		},

		initMenu: function () {
			const thisApp = this;
			for (let productData in thisApp.data.products) {
				new Product(productData, thisApp.data.products[productData]);
			}
		},

		init: function () {
			const thisApp = this;
			thisApp.initData();
			thisApp.initMenu();
		},
	};

	app.init();
}
