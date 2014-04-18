var d3 = require('d3');

var config = require('./config');
require('./index.css');

var circle = require('./js/circle');

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

var main = d3.select("main");

var svg;

var force = d3.layout.force()
.gravity(.01)
.linkDistance(function (link, index) {
  return (index * 4.5) + 100;
})
.charge(-250)
;

var width;
var height;

var graph;

var link;
var tagNode;
var photoNode;

var getGraph = function (photos, tag) {

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

var setupGraph = function (force, graph) {

  graph = graph || {};
  var nodes = graph.nodes || [];
  var links = graph.links || [];

  var tag = nodes[0];
  var photos = nodes.slice(1, nodes.length);

  if (tag) {
    tag.x = width / 2;
    tag.y = height / 2;
  }

  if (photos) {
    photos.forEach(function (node, index) {
      var c = circle({
        scaleX: width / 2,
        scaleY: height / 2,
        step: index,
        steps: photos.length,
      });
      node.x = (width / 2) + c.x;
      node.y = (height / 2) + c.y;
    });
  }

  force
  .size([width, height])
  .nodes(nodes)
  .links(links)
  .start()
  ;
};

var setupSvg = function (svg, graph) {

  graph = graph || {};
  var nodes = graph.nodes || [];
  var links = graph.links || [];

  var tag = nodes[0];
  var photos = nodes.slice(1, nodes.length);

  link = svg.selectAll(".link")
  .data(graph.links)
  .enter().append("line")
    .attr("class", "link")
  ;

  tagNode = svg.selectAll(".tag")
  .data([tag])
  .enter().append("g")
    .attr("class", "tag")
    .call(force.drag)
  ;

  tagNode.append("text")
  .text(function(d) { return d.name })
  ;

  photoNode = svg.selectAll(".photo")
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
}

var get = function (tag) {

  tag = tag.replace(/^#/, "");

  console.log(tag);

  flickr.photos.search({
    page: 1,
    per_page: 60,
    tags: [tag],
    sort: "interestingness-desc",
    extras: "url_t"
  }, function (err, result) {
    if (err) { throw err; }

    photos = result.photos.photo;

    graph = getGraph(photos, {
      x: (width / 2),
      y: (height / 2),
      name: tag,
    });

    setupGraph(force, graph);

    setupSvg(svg, graph);

  });
};

force.on("tick", function () {
  if (link) {
    link
    .attr("x1", function (d) { return d.source.x; })
    .attr("y1", function (d) { return d.source.y; })
    .attr("x2", function (d) { return d.target.x; })
    .attr("y2", function (d) { return d.target.y; })
    ;
  }

  if (tagNode) {
    tagNode
    .attr("transform", function(d) { return "translate(" + d.x + "," + d.y + ")"; })
    ;
  }

  if (photoNode) {
    photoNode
    .attr("transform", function(d) { return "translate(" + d.x + "," + d.y + ")"; })
    ;
  }

});

var resize = function () {
  width = window.innerWidth;
  height = window.innerHeight;

  svg
  .attr("width", width)
  .attr("height", height)
  ;

  setupGraph(force, graph);
};

var reset = function () {
  if (svg) { svg.remove(); }
  svg = main.append("svg");
}

d3.select(window).on("resize", resize);

var run = function (tag) {
  reset();
  resize();
  get(tag);
  window.location.hash = tag;
}

var tagInput = document.getElementById("tagInput");
tagInput.addEventListener("keyup", function (e) {
  if (e.keyCode === 13) {
    run(tagInput.value);
  }
});

if (window.location.hash) {
  run(window.location.hash);
}

