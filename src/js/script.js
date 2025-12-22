/* global Handlebars, utils, dataSource */ // eslint-disable-line no-unused-vars
{
	('use strict');

	const select = {
		templateOf: {
			menuProduct: '#template-menu-product',
			cartProduct: '#template-cart-product', // CODE ADDED
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
				input: 'input.amount', // CODE CHANGED
				linkDecrease: 'a[href="#less"]',
				linkIncrease: 'a[href="#more"]',
			},
		},
		// CODE ADDED START
		cart: {
			productList: '.cart__order-summary',
			toggleTrigger: '.cart__summary',
			totalNumber: `.cart__total-number`,
			totalPrice:
				'.cart__total-price strong, .cart__order-total .cart__order-price-sum strong',
			subtotalPrice: '.cart__order-subtotal .cart__order-price-sum strong',
			deliveryFee: '.cart__order-delivery .cart__order-price-sum strong',
			form: '.cart__order',
			formSubmit: '.cart__order [type="submit"]',
			phone: '[name="phone"]',
			address: '[name="address"]',
		},
		cartProduct: {
			amountWidget: '.widget-amount',
			price: '.cart__product-price',
			edit: '[href="#edit"]',
			remove: '[href="#remove"]',
		},
		// CODE ADDED END
	};

	const classNames = {
		menuProduct: {
			wrapperActive: 'active',
			imageVisible: 'active',
		},
		// CODE ADDED START
		cart: {
			wrapperActive: 'active',
		},
		// CODE ADDED END
	};

	const settings = {
		amountWidget: {
			defaultValue: 1,
			defaultMin: 1,
			defaultMax: 9,
		}, // CODE CHANGED
		// CODE ADDED START
		cart: {
			defaultDeliveryFee: 20,
		},
		// CODE ADDED END
	};

	const templates = {
		menuProduct: Handlebars.compile(
			document.querySelector(select.templateOf.menuProduct).innerHTML
		),
		// CODE ADDED START
		cartProduct: Handlebars.compile(
			document.querySelector(select.templateOf.cartProduct).innerHTML
		),
		// CODE ADDED END
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
						activeProduct.classList.remove(
							classNames.menuProduct.wrapperActive
						);
					}
				}
			});
		}

		addToCart() {
			const thisProduct = this;
			app.cart.add(thisProduct.prepareCartProduct());
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

	class Cart {
		constructor(element) {
			const thisCart = this;
			thisCart.products = [];
			thisCart.getElements(element);
			thisCart.initActions();
		}
		getElements(element) {
			const thisCart = this;
			thisCart.dom = {};
			thisCart.dom.wrapper = element;
			thisCart.dom.productList = thisCart.dom.wrapper.querySelector(
				select.cart.productList
			);
			thisCart.dom.toggleTrigger = thisCart.dom.wrapper.querySelector(
				select.cart.toggleTrigger
			);
			
		}
		initActions() {
			const thisCart = this;
			thisCart.dom.toggleTrigger.addEventListener('click', function (event) {
				event.preventDefault();
				thisCart.dom.wrapper.classList.toggle(classNames.cart.wrapperActive);
			});
		}
		add(product) {
			const thisCart = this;
			thisCart.products.push(product);
			const generatedHTML = templates.cartProduct(product);
			const generatedDOM = utils.createDOMFromHTML(generatedHTML);
			thisCart.dom.productList.appendChild(generatedDOM);
		}
	}
	class CartProduct {}

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
			thisApp.initCart();
		},
		initCart: function () {
			const thisApp = this;
			const cartElem = document.querySelector(select.containerOf.cart);
			thisApp.cart = new Cart(cartElem);
		},
	};

	app.init();
}
