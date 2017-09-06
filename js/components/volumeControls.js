var React = require('react');
var ReactDOM = require('react-dom');
var ClassNames = require('classnames');
var Slider = require('./slider');
var Utils = require('./utils');
var CONSTANTS = require('../constants/constants');

var VolumeControls = React.createClass({

  handleVolumeClick: function(event) {
    event.preventDefault();
    var newVolume = parseFloat(event.target.dataset.volume);
    this.props.controller.setVolume(newVolume);
  },

  handleVolumeSliderChange: function(event) {
    var newVolume = parseFloat(event.target.value);
    this.props.controller.setVolume(newVolume);
  },

  handleVolumeSliderKeyDown: function(evt) {
    switch (evt.key) {
      case CONSTANTS.KEY_VALUES.ARROW_UP:
      case CONSTANTS.KEY_VALUES.ARROW_RIGHT:
        evt.preventDefault();
        this.props.controller.accessibilityControls.changeVolumeBy(CONSTANTS.A11Y_CTRLS.VOLUME_CHANGE_DELTA, true);
        break;
      case CONSTANTS.KEY_VALUES.ARROW_DOWN:
      case CONSTANTS.KEY_VALUES.ARROW_LEFT:
        evt.preventDefault();
        this.props.controller.accessibilityControls.changeVolumeBy(CONSTANTS.A11Y_CTRLS.VOLUME_CHANGE_DELTA, false);
        break;
      case CONSTANTS.KEY_VALUES.HOME:
        evt.preventDefault();
        this.props.controller.accessibilityControls.changeVolumeBy(100, false);
        break;
      case CONSTANTS.KEY_VALUES.END:
        evt.preventDefault();
        this.props.controller.accessibilityControls.changeVolumeBy(100, true);
        break;
      default:
        break;
    }
  },

  /**
   * Converts the current player volume value to a percentage.
   *
   * @return {String} A string that represents the volume as a percentage from 0 to 100.
   */
  getVolumePercent: function() {
    return (this.props.controller.state.volumeState.volume * 100).toFixed(0);
  },

  /**
   * Converts the current volume value to a screen reader friendly format.
   *
   * @return {String} The current volume in a screen reader friendly format (i.e. 20% volume).
   */
  getAriaValueText: function() {
    return CONSTANTS.ARIA_LABELS.VOLUME_PERCENT.replace('{volume}', this.getVolumePercent());
  },

  /**
   * Builds the volume bar controls that are shown on desktop.
   */
  renderVolumeBars: function() {
    var volumeBars = [];

    for (var i = 0; i < 10; i++) {
      // Create each volume tick separately
      var turnedOn = this.props.controller.state.volumeState.volume >= (i + 1) / 10;
      var volumeClass = ClassNames({
        'oo-volume-bar': true,
        'oo-on': turnedOn
      });
      var barStyle = {
        backgroundColor: this.props.skinConfig.controlBar.volumeControl.color ? this.props.skinConfig.controlBar.volumeControl.color : this.props.skinConfig.general.accentColor
      };

      volumeBars.push(
        <a data-volume={(i + 1) / 10}
          className={volumeClass}
          key={i}
          style={barStyle}
          onClick={this.handleVolumeClick}
          aria-hidden="true">
        </a>
      );
    }

    var volumePercent = this.getVolumePercent();
    var ariaValueText = this.getAriaValueText();

    return (
      <span
        className="oo-volume-controls"
        role="slider"
        aria-label={CONSTANTS.ARIA_LABELS.VOLUME_SLIDER}
        aria-valuemin="0"
        aria-valuemax="100"
        aria-valuenow={volumePercent}
        aria-valuetext={ariaValueText}
        data-focus-id="volumeControls"
        tabIndex="0"
        onMouseUp={Utils.blurOnMouseUp}
        onKeyDown={this.handleVolumeSliderKeyDown}>
        {volumeBars}
      </span>
    );
  },

  /**
   * Renders the volume slider that is shown on mobile web.
   */
  renderVolumeSlider: function() {
    var volumePercent = this.getVolumePercent();
    var ariaValueText = this.getAriaValueText();

    return (
      <div
        className="oo-volume-slider"
        role="slider"
        aria-label={CONSTANTS.ARIA_LABELS.VOLUME_SLIDER}
        aria-valuemin="0"
        aria-valuemax="100"
        aria-valuenow={volumePercent}
        aria-valuetext={ariaValueText}
        data-focus-id="volumeSlider"
        tabIndex="0"
        onMouseUp={this.blurOnMouseUp}
        onKeyDown={this.handleVolumeSliderKeyDown}>
        <Slider
          value={parseFloat(this.props.controller.state.volumeState.volume)}
          className="oo-slider oo-slider-volume"
          itemRef="volumeSlider"
          role="presentation"
          minValue="0"
          maxValue="1"
          step="0.1"
          onChange={this.handleVolumeSliderChange} />
      </div>
    );
  },

  render: function () {
    if (this.props.controller.state.isMobile) {
      if (this.props.controller.state.volumeState.volumeSliderVisible) {
        return this.renderVolumeSlider();
      } else {
        return null;
      }
    } else {
      return this.renderVolumeBars();
    }
  }
});

VolumeControls.propTypes = {
  controller: React.PropTypes.shape({
    state: React.PropTypes.shape({
      isMobile: React.PropTypes.bool.isRequired,
      volumeState: React.PropTypes.shape({
        volumeSliderVisible: React.PropTypes.bool.isRequired,
        volume: React.PropTypes.number.isRequired
      })
    }),
    setVolume: React.PropTypes.func.isRequired
  }),
  skinConfig: React.PropTypes.shape({
    general: React.PropTypes.shape({
      accentColor: React.PropTypes.string
    }),
    controlBar: React.PropTypes.shape({
      volumeControl: React.PropTypes.shape({
        color: React.PropTypes.string
      })
    })
  })
};

VolumeControls.defaultProps = {
  skinConfig: {
    general: {
      accentColor: '#448aff'
    },
    controlBar: {
      volumeControl: {
        color: '#448aff'
      }
    }
  }
};

module.exports = VolumeControls;