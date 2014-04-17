module.exports = function (options) {
  var scaleX = options.scaleX || 1;
  var scaleY = options.scaleY || 1;
  var steps = options.steps || 12;
  var step = options.step || 0;

  var rad = ((step * 1.0) / steps) * (2 * Math.PI)

  return {
    x: scaleX * Math.cos(rad),
    y: scaleY * Math.sin(rad),
  };
};