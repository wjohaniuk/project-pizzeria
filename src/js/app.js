import {settings, select, classNames} from './settings.js';
import Home from './components/Home.js';
import Product from './components/Product.js';
import Cart from './components/Cart.js';
import Booking from './components/Booking.js';

const app = {
  initPages: function(){
    const thisApp = this,
      idFromHash = window.location.hash.replace('#/', '');

    thisApp.pages = document.querySelector(select.containerOf.pages).children;
    thisApp.navLinks = document.querySelectorAll(select.nav.links);

    let pageMatchingHash = thisApp.pages[0].id;

    for(let page of thisApp.pages){
      if(page.id == idFromHash){
        pageMatchingHash = page.id;
        break;
      }
    }

    thisApp.activatePage(pageMatchingHash);

    for(let link of thisApp.navLinks){
      link.addEventListener('click', function(event){
        const clickedElement = this,
          id = clickedElement.getAttribute('href').replace('#', '');

        event.preventDefault();

        thisApp.activatePage(id);
        window.location.hash = '#/' + id;
      });
    }
  },
  activatePage: function(pageId){
    const thisApp = this;

    for(let page of thisApp.pages){
      page.classList.toggle(classNames.pages.active, page.id == pageId);
    }
    
    for(let link of thisApp.navLinks){
      link.classList.toggle(
        classNames.nav.active, 
        link.getAttribute('href') == '#' + pageId
      );
    }
  },
  initMenu: function(){
    const thisApp = this;

    for(let productData in thisApp.data.products){
      new Product(thisApp.data.products[productData].id, thisApp.data.products[productData]);
    }
  },
  initData: function(){
    const thisApp = this,
      url = settings.db.url + '/' + settings.db.products;

    thisApp.data = {};

    fetch(url)
      .then(function(rawResponse){
        return rawResponse.json();
      })
      .then(function(parsedResponse){
        thisApp.data.products = parsedResponse;
        thisApp.initMenu();
      });
  },
  initHome: function(){
    const thisApp = this;

    thisApp.homePageContainer = document.querySelector(select.containerOf.homePage);
    thisApp.home = new Home(thisApp.homePageContainer);

    thisApp.home.dom.orderLink.addEventListener('click', function(event){
      event.preventDefault();
      thisApp.activatePage(this.getAttribute('href').replace('#', ''));
    });

    thisApp.home.dom.bookingLink.addEventListener('click', function(event) {
      event.preventDefault();
      thisApp.activatePage(this.getAttribute('href').replace('#', ''));
    });
  },
  initCart: function(){
    const thisApp = this,
      cartElem = document.querySelector(select.containerOf.cart);

    thisApp.cart = new Cart(cartElem);
    thisApp.productList = document.querySelector(select.containerOf.menu);

    thisApp.productList.addEventListener('add-to-cart', function(event){
      app.cart.add(event.detail.product);
    });
  },
  initBooking: function(){
    const thisApp = this;

    thisApp.BookingWidgetContainer = document.querySelector(select.containerOf.booking);
    thisApp.booking = new Booking(thisApp.BookingWidgetContainer);
  },
  initTopButton: function(){
    const header = document.querySelector('.header'),
      headerHeight = header.offsetHeight,
      topButton = document.getElementById(select.nav.topButton);

    function scrollBehavior() {
      if (document.body.scrollTop > headerHeight || document.documentElement.scrollTop > headerHeight) {
        topButton.style.display = 'block';
      } else {
        topButton.style.display = 'none';
      }
    }
    
    window.onscroll = function() {scrollBehavior();};
  },
  init: function(){
    const thisApp = this;

    thisApp.initPages();
    thisApp.initData();
    thisApp.initHome();
    thisApp.initCart();
    thisApp.initBooking();
    thisApp.initTopButton();
  },
};

app.init();
