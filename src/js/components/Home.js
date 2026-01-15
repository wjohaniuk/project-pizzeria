import { select, templates, settings } from '../settings.js';

class Home {
  constructor(wrapper){
    const thisHome = this;

    thisHome.render(wrapper);
    thisHome.initActions();
  }
  render(wrapper){
    const thisHome = this,
      weekStart = settings.hours.weekStart,
      weekEnd = settings.hours.weekEnd,
      openHour = settings.hours.open + ':00',
      closeHour = settings.hours.close + ':00';

    const generatedHTML = templates.homePage(),
      generatedText = weekStart + '-' + weekEnd + ', ' + openHour + ' - ' + closeHour;

    thisHome.dom = {};

    thisHome.dom.wrapper = wrapper;
    thisHome.dom.wrapper.innerHTML = generatedHTML;

    thisHome.dom.openingHours = thisHome.dom.wrapper.querySelector(select.homePage.openingHours);
    thisHome.dom.openingHours.innerHTML = generatedText;

    thisHome.dom.orderLink = thisHome.dom.wrapper.querySelector(select.homePage.orderLink);
    thisHome.dom.bookingLink = thisHome.dom.wrapper.querySelector(select.homePage.bookingLink);

    thisHome.dom.carousel = thisHome.dom.wrapper.querySelector(select.homePage.mainCarousel);
  }
  initActions(){
    const thisHome = this;

    thisHome.carousel = new Splide(select.homePage.mainCarousel, { //eslint-disable-line no-undef
      type: 'loop',
      autoplay: true,
      interval: 3000,
      arrows: false,
      easing: 'ease',
    });
    
    thisHome.carousel.mount();
  }
}

export default Home;