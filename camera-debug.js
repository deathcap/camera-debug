'use strict';

var createDatgui = require('dat-gui');

module.exports = function(game, opts) {
  return new CameraDebug(game, opts);
};
module.exports.pluginInfo = {
  loadAfter: ['voxel-plugins-ui', 'voxel-shader']
};

function CameraDebug(game, opts) {
  this.gui = opts.gui || (game.plugins && game.plugins.get('voxel-plugins-ui') ? game.plugins.get('voxel-plugins-ui').gui : new createDatgui.GUI());

  this.shader = game.plugins.get('voxel-shader');
  if (!this.shader) throw new Error('camera-debug requires voxel-shader');

  this.enable();
}

CameraDebug.prototype.enable = function() {
  this.folder = this.gui.addFolder('camera');

  var updateProjectionMatrix = this.shader.updateProjectionMatrix.bind(this.shader);

  this.folder.add(this.shader, 'cameraFOV', 45, 110).onChange(updateProjectionMatrix);
  this.folder.add(this.shader, 'cameraNear', 0.1, 10, 0.1).onChange(updateProjectionMatrix);
  this.folder.add(this.shader, 'cameraFar', 10, 1000).onChange(updateProjectionMatrix);
};

CameraDebug.prototype.disable = function() {
  // TODO: remove folder
};

