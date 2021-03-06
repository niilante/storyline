var Hammer = require('hammerjs');

var Slider = function(cards, startIndex, height, width) {
  this.activeCard = startIndex;
  this.cards = cards;
  this.MARGIN = 10;
  this.NAV_HEIGHT = 16 + 10; // actual height + margin height//
  this.height = height;
  this.width = width;
  this.createSlider();
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
        sliderView.style.width = this.width + "px";

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
            storyline.slider.goToCard(currentActiveCard)
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
    this.sliderWidth = w * this.cards.length;
    this.offsetPercent = offset/(w*this.cards.length) * 100
    this.offsets = this.getCardOffsets();
    this.cardsElem.style.width = this.sliderWidth + "px"
    this.cardsElem.style.transform = 'translateX(' + this.offsetPercent + '%)';
    for(var i = 0; i < this.cards.length; i++) {
      this.cardsElem.children[i].children[0].style.height = (this.height - this.NAV_HEIGHT - this.MARGIN*2) + "px";
      this.cardsElem.children[i].style.width = w + "px";
      this.cardsElem.children[i].style.border = this.MARGIN + "px solid white";
    }
  },
  goToCard: function(number) {
    //catches condition when number is not passed in//
    number = number!=undefined ? number : this.activeCard;
    var self = this;
    if(number < 0) {
      this.activeCard = 0;
    } else if(number > this.cards.length - 1) {
      this.activeCard = number - 1
    } else {
      this.setActiveCard(number, this.activeCard)
      this.activeCard = number;
    }

    this.cardsElem.classList.add('is-animating')
    var percentage = -(100 / this.cards.length) * this.activeCard;
    percentage = percentage + this.offsetPercent
    this.cardsElem.style.transform = 'translateX(' + percentage + '%)';
    clearTimeout(timer);
    var timer = setTimeout(function() {
      self.cardsElem.classList.remove( 'is-animating' );
    }, 700 );
    this.currentOffset = this.offsets[self.activeCard];
  },
  getCardOffsets: function() {
    var self = this;
    var offsets = [];
    this.cards.map(function(card, index) {
      var offset = -(100/self.cards.length * index - self.offsetPercent)
      offsets.push(offset);
    })
    return offsets;
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
    this.currentOffset = this.offsetPercent;
    var handleHammer = function(ev) {
      ev.preventDefault();
      switch(ev.type) {
        case 'tap':
          var clickMoveCardSpace = (window.innerWidth - self.cardWidth - (2*self.MARGIN))/2
          var prevCardBound = clickMoveCardSpace/window.innerWidth;
          var nextCardBound = (window.innerWidth - clickMoveCardSpace)/window.innerWidth
          if(ev.center.x/window.innerWidth < prevCardBound) {
            var newCard = self.activeCard - 1;
            self.currentOffset = self.offsets[newCard];
            self.goToCard(self.activeCard - 1);
          } else if(ev.center.x/window.innerWidth > nextCardBound) {
            var newCard = self.activeCard + 1;
            self.currentOffset = self.offsets[newCard];
            self.goToCard(self.activeCard + 1);
          }
        case 'panleft':
        case 'panright':
          percentage = (ev.deltaX/self.sliderWidth) * 100
          transformPercentage = percentage + self.currentOffset
          //make a check if first or last card to prevent crazy space//
          var t = ((self.cardWidth/2)/self.sliderWidth)*100;
          if(percentage > -100 && percentage < 20) {
            self.cardsElem.style.transform = 'translateX(' + transformPercentage + '%)';
            for(var i=0; i < self.offsets.length; i++) {
              if(transformPercentage >= self.offsets[i] - t) {
                self.setActiveCard(i, self.activeCard);
                break;
              }
            }
          }
          break;
        case 'panend':
          self.currentOffset = self.offsets[self.activeCard]
          self.goToCard(self.activeCard)
          break;
      }
    }

    var createHammer = function(v) {
      var mc = new Hammer.Manager(v, {})
      mc.add(new Hammer.Pan({
        direction: Hammer.DIRECTION_HORIZONTAL,
        threshold: 25
      }))
      mc.add(new Hammer.Tap({
        domEvents: true
      }))
      mc.on('panleft panright panend tap', handleHammer)
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
           "<h3><span class='h3-date'>{{ display_date }}</span>" +
           "{{ title }}</h3>" +
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
