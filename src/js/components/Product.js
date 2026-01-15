import {templates, select, classNames, settings} from '../settings.js';
import utils from '../utils.js';
import AmountWidget from './AmountWidget.js';

class Product {
  constructor(id, data){
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
  renderInMenu(){
    const thisProduct = this,
      generatedHTML = templates.menuProduct(thisProduct.data),
      menuContainer = document.querySelector(select.containerOf.menu);

    thisProduct.element = utils.createDOMFromHTML(generatedHTML);
    menuContainer.appendChild(thisProduct.element);
  }
  getElements(){
    const thisProduct = this;
    
    thisProduct.dom = {};
    thisProduct.dom.accordionTrigger = thisProduct.element.querySelector(select.menuProduct.clickable);
    thisProduct.dom.form = thisProduct.element.querySelector(select.menuProduct.form);
    thisProduct.dom.formInputs = thisProduct.dom.form.querySelectorAll(select.all.formInputs);
    thisProduct.dom.cartButton = thisProduct.element.querySelector(select.menuProduct.cartButton);
    thisProduct.dom.priceElem = thisProduct.element.querySelector(select.menuProduct.priceElem);
    thisProduct.dom.imageWrapper = thisProduct.element.querySelector(select.menuProduct.imageWrapper);
    
    thisProduct.dom.amountWidgetElem = thisProduct.element.querySelector(select.menuProduct.amountWidget);
    thisProduct.dom.inputsRadio = thisProduct.element.querySelectorAll(select.menuProduct.inputsRadio);
    thisProduct.dom.inputsCheckbox = thisProduct.element.querySelectorAll(select.menuProduct.inputsCheckbox);
    thisProduct.dom.optionsSelect = thisProduct.element.querySelectorAll(select.menuProduct.selectOptions);
  }
  initAccordion(){
    const thisProduct = this;

    thisProduct.dom.accordionTrigger.addEventListener('click', function(event) {
      const activeProduct = document.querySelector(select.all.menuProductsActive);

      event.preventDefault();
      
      if (activeProduct && activeProduct !== thisProduct.element){
        activeProduct.classList.remove(classNames.menuProduct.wrapperActive);
      }

      thisProduct.element.classList.toggle(classNames.menuProduct.wrapperActive);
    });
  }
  initAmountWidget(){
    const thisProduct = this;

    thisProduct.amountWidget = new AmountWidget(thisProduct.dom.amountWidgetElem);
    
    thisProduct.dom.amountWidgetElem.addEventListener('updated', function(){
      thisProduct.processOrder();
    });
  }
  initOrderForm(){
    const thisProduct = this;

    thisProduct.dom.form.addEventListener('submit', function(event){
      event.preventDefault();
      thisProduct.processOrder();
    });

    for(let input of thisProduct.dom.formInputs){
      input.addEventListener('change', function(){
        thisProduct.processOrder();
      });
    }
    
    thisProduct.dom.cartButton.addEventListener('click', function(event){
      event.preventDefault();
      thisProduct.processOrder();
      thisProduct.addToCart();
      thisProduct.resetDefaults();
    });
  }
  processOrder(){
    const thisProduct = this,
      formData = utils.serializeFormToObject(thisProduct.dom.form);
    let price = thisProduct.data.price;

    for(let paramId in thisProduct.data.params) {
      const param = thisProduct.data.params[paramId];

      for(let optionId in param.options) {
        const option = param.options[optionId],
          optionSelected = formData[paramId] && formData[paramId].includes(optionId),
          optionImage = thisProduct.dom.imageWrapper.querySelector('.'+paramId+'-'+optionId);

        if(optionSelected) {
          if(!option.default) {
            price += option.price;
          }
        } else {
          if(option.default) {
            price -= option.price;
          }
        }

        if(optionImage) {
          if(optionSelected) {
            optionImage.classList.add(classNames.menuProduct.imageVisible);
          } else {
            optionImage.classList.remove(classNames.menuProduct.imageVisible);
          }
        }
      }
    }

    thisProduct.priceSingle = price;
    price *= thisProduct.amountWidget.value;
    thisProduct.dom.priceElem.innerHTML = price;
  }
  prepareCartProduct(){
    const thisProduct = this,
      productSummary = {};

    productSummary.id = thisProduct.id;
    productSummary.name = thisProduct.data.name;
    productSummary.amount = thisProduct.amountWidget.value;
    productSummary.priceSingle = thisProduct.priceSingle;
    productSummary.price = productSummary.priceSingle * productSummary.amount;
    productSummary.params = thisProduct.prepareCartProductParams();

    return productSummary;
  }
  prepareCartProductParams(){
    const thisProduct = this,
      formData = utils.serializeFormToObject(thisProduct.dom.form),
      params = {};

    for(let paramId in thisProduct.data.params) {
      const param = thisProduct.data.params[paramId];

      params[paramId] = {
        label: param.label,
        options: {}
      };

      for(let optionId in param.options) {
        const option = param.options[optionId],
          optionSelected = formData[paramId] && formData[paramId].includes(optionId);

        if(optionSelected) {
          params[paramId].options[optionId] = option.label;
        }
      }
    }
    return params;
  }
  addToCart(){
    const thisProduct = this;
    
    const event = new CustomEvent('add-to-cart', {
      bubbles: true,
      detail: {
        product: thisProduct.prepareCartProduct(),
      },
    });

    thisProduct.element.dispatchEvent(event);
  }
  resetDefaults(){
    const thisProduct = this;

    const inputsRadio = thisProduct.dom.inputsRadio,
      inputsCheckbox = thisProduct.dom.inputsCheckbox,
      optionsSelect = thisProduct.dom.optionsSelect;

    function resetInputChoice(nodeList){
      for(let node of nodeList){
        if(!node.defaultChecked){
          node.checked = false;
        } else {
          node.checked = true;
        }
      }
    }

    resetInputChoice(inputsRadio);
    resetInputChoice(inputsCheckbox);

    for(let optionSelect of optionsSelect){
      if(!optionSelect.defaultChecked){
        optionSelect.selected = false;
      } else {
        optionSelect.selected = true;
      }
    }

    thisProduct.amountWidget.setValue(settings.amountWidget.defaultValue);
    thisProduct.processOrder();
    thisProduct.element.classList.toggle(classNames.menuProduct.wrapperActive);
  }
}

export default Product;