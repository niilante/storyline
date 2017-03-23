var d3 = {}
d3.axis = require('d3-axis');
d3.scale = require('d3-scale');
d3.selection = require('d3-selection');
d3.time = require('d3-time-format');

var Chart = function(dataObj, width, height, margin) {
    var AXIS_HEIGHT = 25;
    this.data = dataObj.data;
    this.bounds = dataObj.bounds;
    this.axes = dataObj.axes;
    this.markers = dataObj.markers;
    this.margin = margin || { 'top': 10, 'right': 50, 'bottom': 30, 'left': 20 };
    this.width = width - this.margin.right - this.margin.left;
    this.height = height - this.margin.top - this.margin.bottom - AXIS_HEIGHT;
    this.createChart();
};

Chart.prototype = {
  createChart: function() {
    this.setRange();
    this.setScale();
    this.setTranslation();
    this.createCanvas();
    this.drawAxes(d3);
    this.drawLine();
    this.drawMarkers();
  },
  drawAxes: function(d3) {
    var self = this;

    var x = d3.scale.scaleTime()
      .domain([this.bounds.minX.toDate(), this.bounds.maxX.toDate()])
      .range([0, this.width]);
    var xAxis = d3.axis.axisBottom(x)
      .tickSize(this.height)
      .tickFormat(d3.time.timeFormat(this.axes.timeFormat))

    var y = d3.scale.scaleLinear()
      .domain([this.bounds.minY, this.bounds.maxY])
      .range([this.height, 0])
    var yAxis = d3.axis.axisRight(y)
      .tickSize(this.width)
      .tickFormat(function(d){
        if(d > 1e6) {
          d = d/1e6
        }
        return this.parentNode.nextSibling ? "\xa0" + d : d
      })

    function customXAxis(g) {
      g.call(xAxis);
      g.select(".domain").remove();
      g.selectAll(".tick line").attr("stroke", "rgb(211, 211, 211)");
    }

    function customYAxis(g) {
      g.call(yAxis);
      g.select(".domain").remove();
      g.selectAll(".tick line").attr("stroke", "rgb(211, 211, 211)");
      g.selectAll(".tick text").attr("dy", -4).attr("text-anchor", "end");
    }

    d3.selection.select(this.elem)
    .append("g")
    .attr("transform", "translate(0,0)")
    .call(customXAxis)

    d3.selection.select(this.elem)
      .append("g")
      .call(customYAxis)
    .append("text")
      .attr("fill", "rgb(184, 184, 184)")
      .attr("x", this.width)
      .attr("y", 6)
      .attr("dy", "1.75em")
      .attr("text-anchor", "end")
      .text(this.axes.yLabel);
  },
  /**
   * sets the range of the chart
   *
   * @returns {undefined}
   */
  setRange: function() {
    this.rangeX = Math.abs(this.bounds.maxX.valueOf() - this.bounds.minX.valueOf());
    this.rangeY = Math.abs(this.bounds.maxY - this.bounds.minY);
  },
  /**
   * sets the scale to enlarge the data points by
   *
   * @returns {undefined}
   */
  setScale: function() {
    this.SCALEX = this.width/this.rangeX;
    this.SCALEY = this.height/this.rangeY;
  },
  /**
   * sets the degree of translation so the datapoints are made positive and within the view
   *
   * @returns {undefined}
   */
  setTranslation: function() {
    this.translateX = -1 * this.bounds.minX.valueOf() * this.SCALEX
    this.translateY = -1 * (this.bounds.minY * this.SCALEY)
  },
  /**
   * create individual significant markers on line associated with slides
   *
   * @param {num} x coord
   * @param {num} y coord
   * @param {num} counter to keep track of order of points
   * @returns {HTMLElement} <circle>
   */
  drawMarkers: function() {
    var self = this,
        markersArray = this.aggregateMarkers();

    self.markers = [];
    markersArray.map(function(marker) {
      var circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      circle.setAttribute('cx', marker.x);
      circle.setAttribute('cy', marker.y);
      circle.setAttribute('r', 5);
      circle.setAttribute('fill', 'grey');
      circle.setAttribute('class', 'marker-' + marker.markerCount);

    self.markers.push(circle);
    self.elem.appendChild(circle)
    })
  },
  /**
   * Collect data points as a string
   *
   * @returns {string} containing a stream of data points
   */
  aggregatePoints: function() {
    var line = "M";

    for(var i=0; i < this.data.length; i++) {
      var x = ((this.data[i][0].valueOf() * this.SCALEX) + this.translateX);
      var y = this.height - ((this.data[i][1] * this.SCALEY) + this.translateY);

      line += x + "," + y;
      if(i < this.data.length-1) {
        line += "L";
      }
    }
    return line;
  },
  /**
   * Collect significant markers
   *
   * @returns {array} contains significant markers as objects of data values
   */
  aggregateMarkers: function() {
    var markerArray = [],
        markerCount = 0,
        self = this;
    this.markers.map(function(marker) {
      var point, x, y, mark;

      point = self.data[marker]
      x = ((point[0].valueOf() * self.SCALEX) + self.translateX);
      y = self.height - ((point[1] * self.SCALEY) + self.translateY);

      mark = {
        x: x,
        y: y,
        markerCount: markerCount
      }

      markerArray.push(mark);
      markerCount++;
    })

    return markerArray;
  },
  /**
   * Draws the line graph and moves it based on the range so that the graph is within view
   *
   * @returns {undefined}
   */
  drawLine: function() {
   var lineEl = document.createElementNS('http://www.w3.org/2000/svg', 'path');

   lineEl.setAttribute('d', this.aggregatePoints());
   lineEl.setAttribute('stroke', 'grey');
   lineEl.setAttribute('fill', 'none');
   this.elem.appendChild(lineEl);

  },
  /**
   * create an empty svg object "canvas" where line graph will be drawn
   *
   * @returns {undefined}
   */
  createCanvas : function(){
    var canvasOuter = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    var canvasInner = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    canvasOuter.setAttribute('width', (this.width + this.margin.left + this.margin.right));
    canvasOuter.setAttribute('height', (this.height + this.margin.top + this.margin.bottom));
    canvasOuter.setAttribute('class', 'canvas');
    canvasInner.setAttribute('transform', `translate(${this.margin.right} ${this.margin.top})`)
    canvasOuter.append(canvasInner);
    this.canvas = canvasOuter;
    this.elem = canvasInner;
  },
}

module.exports = {
  Chart
}
