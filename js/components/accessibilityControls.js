var CONSTANTS = require('./../constants/constants');
var Utils = require('./utils');

var AccessibilityControls = function (controller) {
    this.controller = controller;
    this.state = {
      seekRate: 1,
      lastKeyDownTime: 0
    };
    this.keyEvent = this.handleKey.bind(this);
    document.addEventListener('keydown', this.keyEvent);
};

AccessibilityControls.prototype = {
  cleanUp : function() {
    document.removeEventListener('keydown', this.keyEvent);
  },

  handleKey: function(e) {
    if (!this.controller.state.accessibilityControlsEnabled) {
      return;
    }

    var targetTagName;
    if (e.target && typeof e.target.tagName === 'string') {
      targetTagName = e.target.tagName.toLowerCase();
    }
    // Slider interaction requires the arrow keys. When a slider is active we should
    // disable arrow key controls
    var sliderIsActive = document.activeElement && document.activeElement.getAttribute('role') === 'slider';

    switch (e.keyCode) {
      case CONSTANTS.KEYCODES.SPACE_KEY:
        // We override the default behavior when the target element is a button (pressing
        // the spacebar on a button should activate it).
        // Note that this is not a comprehensive fix for all clickable elements, this is
        // mostly meant to enable keyboard navigation on control bar elements.
        if (targetTagName !== 'button') {
          e.preventDefault();
          this.controller.togglePlayPause();
        }
        break;
      case CONSTANTS.KEYCODES.UP_ARROW_KEY:
      case CONSTANTS.KEYCODES.DOWN_ARROW_KEY:
        if (!sliderIsActive) {
          e.preventDefault();
          var increase = e.keyCode === CONSTANTS.KEYCODES.UP_ARROW_KEY ? true : false;
          this.changeVolumeBy(CONSTANTS.A11Y_CTRLS.VOLUME_CHANGE_DELTA, increase);
        }
        break;
      case CONSTANTS.KEYCODES.LEFT_ARROW_KEY:
      case CONSTANTS.KEYCODES.RIGHT_ARROW_KEY:
        if (!sliderIsActive && !this.controller.state.isPlayingAd) {
          e.preventDefault();
          var forward = e.keyCode === CONSTANTS.KEYCODES.RIGHT_ARROW_KEY ? true : false;
          this.seekBy(CONSTANTS.A11Y_CTRLS.SEEK_DELTA, forward);
        }
        break;
      default:
        break;
    }
  },

  /**
   * Increases or decreases the player volume by the specified percentage. Values beyond
   * the minimum or maximum will be constrained to appropriate values.
   * @public
   * @param {Number} percent A value from 0 to 100 that indicates how much to increase or decrease the volume.
   * @param {Boolean} increase True for volume increase, false for descrease.
   */
  changeVolumeBy: function(percent, increase) {
    var delta = Utils.constrainToRange(percent, 0, 100);

    if (delta) {
      var volume = 0;
      var currentVolume = Utils.ensureNumber(this.controller.state.volumeState.volume, 0);
      var currentVolumePercent = currentVolume * 100;

      if (increase) {
        volume = Utils.constrainToRange(currentVolumePercent + delta, 0, 100) / 100;
      } else {
        volume = Utils.constrainToRange(currentVolumePercent - delta, 0, 100) / 100;
      }
      if (volume !== currentVolume) {
        this.controller.setVolume(volume);
      }
    }
  },

  /**
   * Seeks the video by the specified number of seconds. The direction of the playhead
   * can be specified with the forward parameter. If a value exceeds the minimum or maximum
   * seekable range it will be constrained to appropriate values.
   * @public
   * @param {Number} seconds The number of seconds to increase or decrease relative to the current playhead.
   * @param {Boolean} forward True to seek forward, false to seek backward.
   */
  seekBy: function(seconds, forward) {
    var shiftSeconds = Utils.ensureNumber(seconds, 1);
    var shiftSign = forward ? 1 : -1; // Positive 1 for fast forward, negative for rewind
    var seekRateIncrease = 1.1;

    var currentTime = Date.now();
    var timeSinceLastSeek = currentTime - this.state.lastKeyDownTime;

    if (timeSinceLastSeek < 500) {
      // Increasing seek rate to go faster if key is pressed often
      if (this.state.seekRate < 300) {
        this.state.seekRate *= seekRateIncrease;
      }
    } else {
      this.state.seekRate = 1;
    }
    this.state.lastKeyDownTime = currentTime;

    // Calculate the new playhead
    var delta = shiftSeconds * shiftSign * this.state.seekRate;
    var seekTo = Utils.ensureNumber(this.controller.skin.state.currentPlayhead, 0) + delta;
    seekTo = Utils.constrainToRange(seekTo, 0, this.controller.skin.state.duration);

    // Refresh UI and then instruct the player to seek
    this.controller.updateSeekingPlayhead(seekTo);
    this.controller.seek(seekTo);
  }
};

module.exports = AccessibilityControls;
