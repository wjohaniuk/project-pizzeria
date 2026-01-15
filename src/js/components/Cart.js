import { select, classNames, templates, settings } from '../settings.js';
import CartProduct from './CartProduct.js';
import utils from '../utils.js';

class Cart {
  constructor(element){
    const thisCart = this;

    thisCart.products = [];
    thisCart.getElements(element);
    thisCart.initActions();
  }
  getElements(element){
    const thisCart = this;

    thisCart.dom = {};
    thisCart.dom.wrapper = element;

    thisCart.dom.toggleTrigger = thisCart.dom.wrapper.querySelector(select.cart.toggleTrigger);
    thisCart.dom.productList = thisCart.dom.wrapper.querySelector(select.cart.productList);
    
    thisCart.dom.deliveryFee = thisCart.dom.wrapper.querySelector(select.cart.deliveryFee);
    thisCart.dom.subTotalPrice = thisCart.dom.wrapper.querySelector(select.cart.subtotalPrice);
    thisCart.dom.totalPrice = thisCart.dom.wrapper.querySelectorAll(select.cart.totalPrice);
    thisCart.dom.totalNumber = thisCart.dom.wrapper.querySelector(select.cart.totalNumber);
    
    thisCart.dom.form = thisCart.dom.wrapper.querySelector(select.cart.form);
    thisCart.dom.phone = thisCart.dom.wrapper.querySelector(select.cart.phone);
    thisCart.dom.address = thisCart.dom.wrapper.querySelector(select.cart.address);
  }
  initActions(){
    const thisCart = this;

    thisCart.dom.toggleTrigger.addEventListener('click', function(){
      thisCart.dom.wrapper.classList.toggle(classNames.cart.wrapperActive);
    });

    thisCart.dom.productList.addEventListener('updated', function(){
      thisCart.update();
    });

    thisCart.dom.productList.addEventListener('remove', function(event){
      thisCart.remove(event.detail.cartProduct);
    });

    thisCart.dom.phone.addEventListener('change', function(){
      if(!thisCart.phoneIsValid(thisCart.dom.phone.value)){

        if(thisCart.dom.phone.classList.contains(classNames.cart.inputValid)){
          thisCart.dom.phone.classList.remove(classNames.cart.inputValid);
        }
        if(!thisCart.dom.phone.classList.contains(classNames.cart.inputInvalid)){
          thisCart.dom.phone.classList.add(classNames.cart.inputInvalid);
        }
      } else {

        if(thisCart.dom.phone.classList.contains(classNames.cart.inputInvalid)){
          thisCart.dom.phone.classList.remove(classNames.cart.inputInvalid);
        }
        if(!thisCart.dom.phone.classList.contains(classNames.cart.inputValid)){
          thisCart.dom.phone.classList.add(classNames.cart.inputValid);
        }
      }
    });

    thisCart.dom.address.addEventListener('change', function(){
      if(!thisCart.addressIsValid(thisCart.dom.address.value)){

        if(thisCart.dom.address.classList.contains(classNames.cart.inputValid)){
          thisCart.dom.address.classList.remove(classNames.cart.inputValid);
        }
        if(!thisCart.dom.address.classList.contains(classNames.cart.inputInvalid)){
          thisCart.dom.address.classList.add(classNames.cart.inputInvalid);
        }
      } else {

        if(thisCart.dom.address.classList.contains(classNames.cart.inputInvalid)){
          thisCart.dom.address.classList.remove(classNames.cart.inputInvalid);
        }
        if(!thisCart.dom.address.classList.contains(classNames.cart.inputValid)){
          thisCart.dom.address.classList.add(classNames.cart.inputValid);
        }
      }
    });

    thisCart.dom.form.addEventListener('submit', function(event){
      event.preventDefault();

      if(thisCart.phoneIsValid(thisCart.dom.phone.value) && thisCart.addressIsValid(thisCart.dom.address.value) && thisCart.products.length != 0){
        thisCart.sendOrder();
        thisCart.emptyCart();
        thisCart.update();
      }
    });
  }
  add(menuProduct){
    const thisCart = this,
      generatedHTML = templates.cartProduct(menuProduct),
      generatedDOM = utils.createDOMFromHTML(generatedHTML);

    thisCart.dom.productList.appendChild(generatedDOM);
    thisCart.products.push(new CartProduct(menuProduct, generatedDOM));
    thisCart.update(menuProduct);
  }
  update(){
    const thisCart = this;

    thisCart.totalPrice = 0;
    thisCart.totalNumber = 0;
    thisCart.subTotalPrice = 0;

    for(let product of thisCart.products){
      thisCart.totalNumber += product.amount;
      thisCart.subTotalPrice += product.price;
    }
    if(thisCart.totalNumber != 0){
      thisCart.deliveryFee = settings.cart.defaultDeliveryFee;
      thisCart.totalPrice = thisCart.subTotalPrice + thisCart.deliveryFee;
    } else {
      thisCart.deliveryFee = 0;
    }
      
    thisCart.dom.deliveryFee.innerHTML = thisCart.deliveryFee;
    thisCart.dom.subTotalPrice.innerHTML = thisCart.subTotalPrice;
    thisCart.dom.totalNumber.innerHTML = thisCart.totalNumber;

    [].forEach.call(thisCart.dom.totalPrice, function(totalWrapper) {
      totalWrapper.innerHTML = '';
      totalWrapper.innerHTML = thisCart.totalPrice;
    });
  }
  remove(product){
    const thisCart = this,
      productIndex = thisCart.products.indexOf(product);

    product.dom.wrapper.innerHTML = '';
    thisCart.products.splice(productIndex, 1);
    thisCart.update();
  }
  phoneIsValid(){
    const thisCart = this,
      textOnly = Array.from(thisCart.dom.phone.value).filter(function(phone) { return /\S/.test(phone); });

    if(textOnly.length == settings.cart.phoneMinLenght){
      return true;
    } else {
      return false;
    }
  }
  addressIsValid(){
    const thisCart = this,
      textOnly = Array.from(thisCart.dom.address.value).filter(function(address) { return /\S/.test(address); });

    if(textOnly.length > 1){
      return true;
    } else {
      return false;
    }
  }
  emptyCart(){
    const thisCart = this;

    thisCart.products.splice(0, thisCart.products.length);
    thisCart.dom.productList.innerHTML = '';

    thisCart.dom.phone.value = '';
    thisCart.dom.phone.classList.remove(classNames.cart.inputValid);
    thisCart.dom.phone.classList.remove(classNames.cart.inputInvalid);

    thisCart.dom.address.value = '';
    thisCart.dom.address.classList.remove(classNames.cart.inputValid);
    thisCart.dom.address.classList.remove(classNames.cart.inputInvalid);
    
    thisCart.dom.wrapper.classList.toggle(classNames.cart.wrapperActive);
  }
  sendOrder(){
    const orderTimeISO = new Date().toISOString();
    const thisCart = this,
      url = settings.db.url + '/' + settings.db.orders,
      payload = {
        status: 'ordered',
        address: thisCart.dom.address.value,
        phone: thisCart.dom.phone.value,
        orderTime: orderTimeISO,
        totalPrice: thisCart.totalPrice,
        subTotalPrice: thisCart.subTotalPrice,
        totalNumber: thisCart.totalNumber,
        deliveryFee: thisCart.deliveryFee,
        products: [],
      };

    console.log('orderTime', payload.orderTime);

    for(let prod of thisCart.products) {
      payload.products.push(prod.getData());
    }

    const options = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    };
    
    fetch(url, options);
  }
}

export default Cart;