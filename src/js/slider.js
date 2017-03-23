var Hammer = require('hammerjs');

var Slider = function(cards, startIndex, height) {
  this.activeCard = startIndex;
  this.cards = cards;
  this.MARGIN = 10;
  this.height = height;
  this.createSlider();
  this.slideCard();
}

Slider.prototype = {
  createSlider: function() {
    //create index key in slides for use in class naming by index in nav//
    //mustache should have something about iterating over index//
    for(var i in this.cards) {
      this.cards[i].index = i
    }
    this.cardsElem = this.renderTemplate('slider-cards-template', this)
    this.navElem = this.renderTemplate('nav-template', this)
    this.elem = this.createSliderView();
    this.attachClickHandler(this.navElem.children[0].children);
  },
  /**
   * creates the slider view and appends slides to it
   *
   * @returns {HTMLElement} complete slider
   */
  createSliderView: function() {
    var sliderView = document.createElement("div");
        sliderView.setAttribute('class', 'slider-view');
        sliderView.style.height = this.height + "px";

    sliderView.appendChild(this.cardsElem);
    sliderView.appendChild(this.navElem);

    return sliderView;
  },
  getTemplate: function(templateId) {
    return MUSTACHE_TEMPLATES[templateId];
  },
  renderTemplate: function(templateId, context) {
    var mustache = require('mustache'),
        templateContent = this.getTemplate(templateId),
        rendered = mustache.render(templateContent, context);

    var parser = new DOMParser(),
        doc = parser.parseFromString(rendered, "text/html");

    return doc.body.children[0];
  },
  attachClickHandler: function(div) {
    var pastActiveCard = this.activeCard;
    for(var i=0; i < div.length; i++) {
      div[i].onclick = function(event, self) {
        var classes = event.target.classList;

        for(var i in classes) {
          if(classes[i].indexOf("-") != -1) {
            var currentActiveCard = parseFloat(classes[i].split("-")[1]);
            var pastActiveCard = storyline.slider.activeCard
            storyline.slider.setTrayPosition(currentActiveCard, pastActiveCard)
            return false;
          }
        }
      }
    }
  },
  setActiveCard: function(currentActiveCard, pastActiveCard) {
    this.activeCard = currentActiveCard;
    if(this.cardsElem.children[pastActiveCard].classList.contains('active')) {
      this.cardsElem.children[pastActiveCard].classList.remove('active');
      this.navElem.children[0].children[pastActiveCard].classList.remove('active');
      storyline.chart.markers[pastActiveCard].classList.remove('active')
    }
    this.cardsElem.children[currentActiveCard].classList.add('active');
    this.navElem.children[0].children[currentActiveCard].classList.add('active');
    storyline.chart.markers[currentActiveCard].classList.add('active')
  },
  setTrayPosition: function(index, pastIndex) {
    index = index!=undefined ? index : this.activeCard;
    pastIndex = pastIndex | 0;

    var card = this.cardsElem.children[index];
    var move = ((card.offsetLeft/this.sliderWidth) * 100) - this.offsetPercent
    this.currentOffset = - move
    this.cardsElem.style.transform = 'translateX(' +  this.currentOffset  + "%)";

    this.setActiveCard(index, pastIndex)
  },
  /**
   * sets the width of the document
   *
   * @param w
   * @returns {undefined}
   */
  setWidth: function(w) {
    if(w <= 480) {
      w = w - (this.MARGIN*2)
    } else {
      w = 500;
    }
    this.viewportSize = this.cardsElem.parentElement.clientWidth;
    var offset = this.viewportSize/2 - w/2;
    this.cardWidth = w
    this.sliderWidth = w * this.cards.length
    this.offsetPercent = offset/(w*this.cards.length) * 100
    this.cardsElem.style.width = this.sliderWidth + "px"
    this.cardsElem.style.transform = 'translateX(' + this.offsetPercent + '%)';
    for(var i = 0; i < this.cards.length; i++) {
      this.cardsElem.children[i].style.width = w + "px";
      this.cardsElem.children[i].style.border = this.MARGIN + "px solid white";
    }
  },
  /**
   * Calculates position of slider offset based on dragging the card
   *
   * @returns {undefined}
   */
  slideCard: function() {
    var self = this;
    var offset;
    var transformPercentage = 0;
    var percentage = 0;
    var goToSlide = function(number) {
      if(number < 0) {
        self.activeCard = 0;
      } else if(number > self.cards.length - 1) {
        self.activeCard = number - 1
      } else {
        self.setActiveCard(number, self.activeCard)
        self.activeCard = number;
      }

      self.cardsElem.classList.add('is-animating')
      var percentage = -(100 / self.cards.length) * self.activeCard;
      percentage = percentage + self.offsetPercent
      self.cardsElem.style.transform = 'translateX(' + percentage + '%)';
      clearTimeout(timer);
      var timer = setTimeout(function() {
        self.cardsElem.classList.remove( 'is-animating' );
      }, 400 );
    }
    var handleHammer = function(ev) {
      ev.preventDefault();
      switch(ev.type) {
        case 'panleft':
        case 'panright':
          percentage = (ev.deltaX/self.sliderWidth) * 100
          transformPercentage = percentage + self.currentOffset
          if(percentage > -100 && percentage < 20) {
            self.cardsElem.style.transform = 'translateX(' + transformPercentage + '%)';
          }
          break;
        case 'panend':
          var dragPercentage = (ev.deltaX/self.viewportSize*100)
          if(dragPercentage < -50) {
            var newCard = self.activeCard + 1;
            self.currentOffset =  -(100/self.cards.length * newCard - self.offsetPercent)
            goToSlide(self.activeCard + 1);
          } else if(dragPercentage > 50) {
            var newCard = self.activeCard - 1;
            self.currentOffset =  -( 100/self.cards.length * newCard - self.offsetPercent)
            goToSlide(self.activeCard - 1);
          } else {
            self.currentOffset =  - (100/self.cards.length * self.activeCard - self.offsetPercent)
            goToSlide(self.activeCard);
          }
          break;
      }
    }

    var createHammer = function(v) {
      var mc = new Hammer.Manager(v, {})
      mc.add(new Hammer.Pan({
        direction: Hammer.DIRECTION_HORIZONTAL,
        threshold: 50
      }))
      mc.on('panleft panright panend', handleHammer)
    }

    Array.prototype.map.call(this.cardsElem.children, function(content) {
       content = content.children[0]
       createHammer(content)
    })
  }
}

module.exports = {
  Slider: Slider
}

const MUSTACHE_TEMPLATES = {
    "slider-cards-template":
      "<div class='slider-cards'>" +
       "{{#cards}}" +
       "<div class='slider-card {{class}}'>" +
         "<div class='slider-content'>" +
           "<h3>{{ title }}</h3>" +
           "<p>{{ text }}<p>" +
         "</div>" +
       "</div>" +
       "{{/cards}}" +
       "</div>",
    "nav-template":
      "<div class='nav'>" +
         "<ol>" +
           "{{#cards}}" +
             "<li class='nav nav-{{index}}'>" +
               "<a href='#'></a>" +
             "</li>" +
           "{{/cards}}" +
         "</ol>" +
       "</div>"
}
