import { templates, select, settings, classNames } from '../settings.js';
import utils from '../utils.js';
import AmountWidget from './AmountWidget.js';
import DatePicker from './DatePicker.js';
import HourPicker from './HourPicker.js';

class Booking {
  constructor(element){
    const thisBooking = this;

    thisBooking.selectedTable = [];

    thisBooking.render(element);
    thisBooking.initWidgets();
    thisBooking.getData();
  }
  getData(){
    const thisBooking = this,
      startDateParam = settings.db.dateStartParamKey + '=' + utils.dateToStr(thisBooking.datePicker.minDate),
      endDateParam = settings.db.dateEndParamKey + '=' + utils.dateToStr(thisBooking.datePicker.maxDate);

    const params = {
      bookings: [
        startDateParam,
        endDateParam,
      ],
      eventsCurrent: [
        settings.db.notRepeatParam,
        startDateParam,
        endDateParam,
      ],
      eventsRepeat: [
        settings.db.repeatParam,
        endDateParam,
      ],
    };

    const urls = {
      bookings:      settings.db.url + '/' + settings.db.bookings 
                                     + '?' + params.bookings.join('&'),
      eventsCurrent: settings.db.url + '/' + settings.db.events   
                                     + '?' + params.eventsCurrent.join('&'),
      eventsRepeat:  settings.db.url + '/' + settings.db.events   
                                     + '?' + params.eventsRepeat.join('&'),
    };

    Promise.all([
      fetch(urls.bookings),
      fetch(urls.eventsCurrent),
      fetch(urls.eventsRepeat),
    ])
      .then(function(allResponses){
        const bookingsResponse = allResponses[0],
          eventsCurrentResponse = allResponses[1],
          eventsRepeatResponse = allResponses[2];

        return Promise.all([
          bookingsResponse.json(),
          eventsCurrentResponse.json(),
          eventsRepeatResponse.json(),
        ]);
      })
      .then(function([bookings, eventsCurrent, eventsRepeat]){
        thisBooking.parseData(bookings, eventsCurrent, eventsRepeat);
      });
  }
  parseData(bookings, eventsCurrent, eventsRepeat){
    const thisBooking = this;

    thisBooking.booked = {};

    for(let item of bookings){
      thisBooking.makeBooked(item.date, item.hour, item.duration, item.table);
    }

    for(let item of eventsCurrent){
      thisBooking.makeBooked(item.date, item.hour, item.duration, item.table);
    }

    const minDate = thisBooking.datePicker.minDate,
      maxDate = thisBooking.datePicker.maxDate;

    for(let item of eventsRepeat){
      if(item.repeat === 'daily'){
        for(let loopDate = minDate; loopDate <= maxDate; loopDate = utils.addDays(loopDate, 1)){
          thisBooking.makeBooked(utils.dateToStr(loopDate), item.hour, item.duration, item.table);
        }
      }
    }

    thisBooking.updateDOM();
  }
  makeBooked(date, hour, duration, table){
    const thisBooking = this;

    if(typeof thisBooking.booked[date] == 'undefined'){
      thisBooking.booked[date] = {};
    }

    const startHour = utils.hourToNumber(hour);

    for(let hourBlock = startHour; hourBlock < startHour + duration; hourBlock += 0.5){

      if(typeof thisBooking.booked[date][hourBlock] == 'undefined'){
        thisBooking.booked[date][hourBlock] = [];
      }

      thisBooking.booked[date][hourBlock].push(table);
    }
  }
  updateDOM(){
    const thisBooking = this;
    let allAvailable = false;

    thisBooking.date = thisBooking.datePicker.value;
    thisBooking.hour = utils.hourToNumber(thisBooking.hourPicker.value);

    if(
      typeof thisBooking.booked[thisBooking.date] == 'undefined'
      ||
      typeof thisBooking.booked[thisBooking.date][thisBooking.hour] == 'undefined'
    ){
      allAvailable = true;
    }

    for(let table of thisBooking.dom.tables){
      let tableId = table.getAttribute(settings.booking.tableIdAttribute);

      if(!isNaN(tableId)){
        tableId = parseInt(tableId);
      }

      if(
        !allAvailable
        &&
        thisBooking.booked[thisBooking.date][thisBooking.hour].includes(tableId)
      ){
        table.classList.add(classNames.booking.tableBooked);
      } else {
        table.classList.remove(classNames.booking.tableBooked);
      }
    }

    thisBooking.unselectTables();
    thisBooking.selectedTable.pop();
  }
  render(element){
    const thisBooking = this,
      generatedHTML = templates.bookingWidget();

    thisBooking.dom = {};

    thisBooking.dom.wrapper = element;
    thisBooking.dom.wrapper.innerHTML = generatedHTML;

    thisBooking.dom.peopleAmount = thisBooking.dom.wrapper.querySelector(select.booking.peopleAmount);
    thisBooking.dom.hoursAmount = thisBooking.dom.wrapper.querySelector(select.booking.hoursAmount);
    thisBooking.dom.checkboxWater = thisBooking.dom.wrapper.querySelector(select.booking.checkboxWater);
    thisBooking.dom.checkboxBread = thisBooking.dom.wrapper.querySelector(select.booking.checkboxBread);

    thisBooking.dom.datePicker = thisBooking.dom.wrapper.querySelector(select.widgets.datePicker.wrapper);
    thisBooking.dom.hourPicker = thisBooking.dom.wrapper.querySelector(select.widgets.hourPicker.wrapper);
    
    thisBooking.dom.floorPlan = thisBooking.dom.wrapper.querySelector(select.booking.floorPlan);
    thisBooking.dom.tables = thisBooking.dom.wrapper.querySelectorAll(select.booking.tables);
    
    thisBooking.dom.submitBooking = thisBooking.dom.wrapper.querySelector(select.booking.formSubmit);
    thisBooking.dom.phone = thisBooking.dom.wrapper.querySelector(select.booking.phone);
    thisBooking.dom.address = thisBooking.dom.wrapper.querySelector(select.booking.address);
  }
  initWidgets(){
    const thisBooking = this;

    thisBooking.peopleAmount = new AmountWidget(thisBooking.dom.peopleAmount);
    thisBooking.hoursAmount = new AmountWidget(thisBooking.dom.hoursAmount);
    thisBooking.datePicker = new DatePicker(thisBooking.dom.datePicker);
    thisBooking.hourPicker = new HourPicker(thisBooking.dom.hourPicker);

    thisBooking.dom.wrapper.addEventListener('updated', function(){
      thisBooking.updateDOM();
    });

    thisBooking.dom.floorPlan.addEventListener('click', function(event){
      thisBooking.initTables(event);
    });

    thisBooking.dom.submitBooking.addEventListener('click', function(event){
      event.preventDefault();
      thisBooking.sendBooking();
    });
  }
  initTables(event){
    const thisBooking = this,
      clickedTable = event.target;

    if(clickedTable.classList.contains(classNames.booking.table)){

      if(clickedTable.classList.contains(classNames.booking.tableBooked)){

        tippy(clickedTable, { // eslint-disable-line no-undef
          content: 'This table is booked already !',
          showOnCreate: true,
          trigger: 'manual',
          duration: 200,
          placement: 'auto',
        });

      } else {
        thisBooking.selectedTable.pop();

        if(clickedTable.classList.contains(classNames.booking.tableSelected)){
          clickedTable.classList.remove(classNames.booking.tableSelected);
          
        } else {
          thisBooking.unselectTables();
          clickedTable.classList.add(classNames.booking.tableSelected);
          thisBooking.selectedTable.push(clickedTable.getAttribute(settings.booking.tableIdAttribute));
        }
      }
    }
  }
  unselectTables(){
    const thisBooking = this;

    for(let table of thisBooking.dom.tables){
      if(table.classList.contains(classNames.booking.tableSelected)){
        table.classList.remove(classNames.booking.tableSelected);
      }
    }
  }
  sendBooking(){
    const thisBooking = this,
      url = settings.db.url + '/' + settings.db.bookings,
      payload = {
        date: thisBooking.datePicker.value,
        hour: thisBooking.hourPicker.value,
        table: parseInt(thisBooking.selectedTable[0]),
        repeat: false,
        duration: thisBooking.hoursAmount.value,
        ppl: thisBooking.peopleAmount.value,
        starters: [],
        phone: thisBooking.dom.phone.value,
        address: thisBooking.dom.address.value,
      };
    const options = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    };

    if(thisBooking.dom.checkboxWater.checked){
      payload.starters.push(thisBooking.dom.checkboxWater.getAttribute('value'));
    }
    if(thisBooking.dom.checkboxBread.checked){
      payload.starters.push(thisBooking.dom.checkboxBread.getAttribute('value'));
    }
    
    fetch(url, options)
      .then(
        thisBooking.makeBooked(payload.date, payload.hour, payload.duration, payload.table),
        thisBooking.updateDOM()
      );
  }
}

export default Booking;