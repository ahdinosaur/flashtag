var Promise = require('bluebird');
var d3 = require('d3');

var config = require('./config');
require('./index.css');

/*
var xhr = Promise.promisify(require('xhr'));
var Url = require('url');
var extend = require('xtend');
var getPhotos = function (query) {
  return xhr({
    url: Url.format({
      protocol: "http",
      hostname: "api.flickr.com",
      path: "/services",
      query: extend({
        method: "flickr.photos.search",
        api_key: config.flickr_api_key,
        format: "json",
        nojsoncallback: "1",
      }, query),
    }),
  });
};
*/

// TODO get deglobalify working
require('flickrapi/browser/flickrapi.dev.js');
var flickr = new window.Flickr({
  api_key: config.flickr_api_key,
});

var getPhotos = Promise.promisify(
  flickr.photos.search
).bind(flickr);

var main = d3.select("main");

var svg = main.append("svg");

var sizeSvg = function () {
  svg
  .attr("width", document.innerWidth)
  .attr("height", document.innerHeight)
  ;
};
sizeSvg();
window.onsize = sizeSvg;

var force = d3.layout.force()
.gravity(.03)
.distance(150)
.charge(-100)
.size([svg.attr("width"), svg.attr("height")])
;

console.log(force.size())

var tagGraph = function (photos, tag) {

  var graph = {};
  var nodes = graph.nodes = [tag].concat(photos);
  var links = graph.links = [];

  photos.forEach(function (photo, index) {

    links.push({
      source: 0,
      target: index + 1,
    });
  });

  return graph;
};

var get = function (tag) {

  getPhotos({
    page: 1,
    per_page: 30,
    tags: [tag],
    sort: "interestingness-desc",
    extras: "url_t"
  }).then(function (result) {
    
    var photos = result.photos.photo;
    var tagObj = {
      name: tag,
      x: window.innerWidth / 2,
      y: window.innerHeight / 2,
    };
    var graph = tagGraph(photos, tagObj);

    console.log(graph);

    force
    .nodes(graph.nodes)
    .links(graph.links)
    .start()
    ;

    var link = svg.selectAll(".link")
    .data(graph.links)
    .enter().append("line")
      .attr("class", "link")
    ;

    var tagNode = svg.selectAll(".tag")
    .data([tagObj])
    .enter().append("g")
      .attr("class", "tag")
      .call(force.drag)
    ;

    tagNode.append("text")
    .attr("dx", 24)
    .attr("dy", "2em")
    .text(function(d) { return d.name })
    ;

    var photoNode = svg.selectAll(".photo")
    .data(photos)
    .enter().append("g")
      .attr("class", "photo")
      .call(force.drag)
    ;

    photoNode.append("image")
    .attr("xlink:href", function (p) { return p.url_t; })
    .attr("width", function (p) { return p.width_t; })
    .attr("height", function (p) { return p.height_t; })
    ;

    force.on("tick", function () {
      link
      .attr("x1", function (d) { return d.source.x; })
      .attr("y1", function (d) { return d.source.y; })
      .attr("x2", function (d) { return d.target.x; })
      .attr("y2", function (d) { return d.target.y; })
      ;

      tagNode
      .attr("transform", function(d) { return "translate(" + d.x + "," + d.y + ")"; })
      ;

      photoNode
      .attr("transform", function(d) { return "translate(" + d.x + "," + d.y + ")"; })
      ;

    }); 

  }).catch(function (err) {
    throw err;
  });
};

get("art");