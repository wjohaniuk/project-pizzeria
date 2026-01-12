import { templates, select, classNames, settings, utils } from '../settings.js';
import { CartProduct } from './CartProduct.js';

export class Cart {
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
		thisCart.dom.form = select.cart.form;
		thisCart.dom.productList = thisCart.dom.wrapper.querySelector(
			select.cart.productList
		);
		thisCart.dom.toggleTrigger = thisCart.dom.wrapper.querySelector(
			select.cart.toggleTrigger
		);
		thisCart.dom.totalNumber = thisCart.dom.wrapper.querySelector(
			select.cart.totalNumber
		);
		thisCart.dom.subtotalPrice = thisCart.dom.wrapper.querySelector(
			select.cart.subtotalPrice
		);
		thisCart.dom.totalPrice = thisCart.dom.wrapper.querySelector(
			select.cart.totalPrice
		);
		thisCart.dom.deliveryFee = thisCart.dom.wrapper.querySelector(
			select.cart.deliveryFee
		);
		thisCart.dom.form = thisCart.dom.wrapper.querySelector(select.cart.form);
		thisCart.dom.phone = thisCart.dom.wrapper.querySelector(select.cart.phone);
		thisCart.dom.address = thisCart.dom.wrapper.querySelector(
			select.cart.address
		);
	}

	initActions() {
		const thisCart = this;
		thisCart.dom.toggleTrigger.addEventListener('click', function (event) {
			event.preventDefault();
			thisCart.dom.wrapper.classList.toggle(classNames.cart.wrapperActive);
		});
		thisCart.dom.productList.addEventListener('updated', function () {
			thisCart.update();
		});
		thisCart.dom.productList.addEventListener('remove', function (event) {
			thisCart.remove(event.detail.cartProduct);
		});
		thisCart.dom.form.addEventListener('submit', function (event) {
			event.preventDefault();
			thisCart.sendOrder();
		});
	}

	add(product) {
		const thisCart = this;
		const generatedHTML = templates.cartProduct(product);
		const generatedDOM = utils.createDOMFromHTML(generatedHTML);
		thisCart.products.push(new CartProduct(product, generatedDOM));
		thisCart.dom.productList.appendChild(generatedDOM);
		this.update();
	}

	update() {
		const thisCart = this;
		const deliveryFee = settings.cart.defaultDeliveryFee;
		thisCart.totalNumber = 0;
		thisCart.subtotalPrice = 0;
		for (let cartProduct of thisCart.products) {
			thisCart.subtotalPrice += cartProduct.price;
			thisCart.totalNumber += cartProduct.amount;
		}
		if (thisCart.subtotalPrice > 0) {
			thisCart.totalPrice = thisCart.subtotalPrice + deliveryFee;
		} else {
			thisCart.totalPrice = 0;
		}
		thisCart.dom.totalNumber.innerHTML = thisCart.totalNumber;
		thisCart.dom.deliveryFee.innerHTML = deliveryFee;
		thisCart.dom.subtotalPrice.innerHTML = thisCart.subtotalPrice;
		thisCart.dom.totalPrice.innerHTML = thisCart.totalPrice;
	}

	remove(cartProduct) {
		const thisCart = this;
		const index = thisCart.products.indexOf(cartProduct);
		if (index !== -1) {
			thisCart.products.splice(index, 1);
		}
		cartProduct.dom.wrapper.remove();
		thisCart.update();
	}

	sendOrder() {
		const thisCart = this;
		const url = settings.db.url + '/' + settings.db.orders;

		const payload = {
			phone: thisCart.dom.phone.value,
			address: thisCart.dom.address.value,
			totalPrice: thisCart.totalPrice,
			subtotalPrice: thisCart.subtotalPrice,
			totalNumber: thisCart.totalNumber,
			deliveryFee: settings.cart.defaultDeliveryFee,
			products: [],
		};
		for (let prod of thisCart.products) {
			payload.products.push(prod.getData());
		}
		const options = {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
			},
			body: JSON.stringify(payload),
		};
		fetch(url, options)
			.then(function (response) {
				return response.json();
			})
			.then(function (parsedResponse) {
				console.log('parsedResponse', parsedResponse);
			});
	}
}

export default Cart;
