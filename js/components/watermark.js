/**
 * Watermark component
 *
 * @module Watermark
 */
var React = require('react'),
    CONSTANTS = require('../constants/constants'),
    Utils = require('../components/utils'),
    ClassNames = require('classnames');
var createReactClass = require('create-react-class');
var PropTypes = require('prop-types');

var Watermark = createReactClass({
  handleWatermarkClick: function() {
    if (this.props.playerState === CONSTANTS.STATE.PLAYING) {
      this.props.controller.togglePlayPause();
    }
  },

  render: function() {
    var watermarkUrl = Utils.getPropertyValue(this.props.skinConfig, 'general.watermark.imageResource.url');
    var clickUrl = Utils.getPropertyValue(this.props.skinConfig, 'general.watermark.clickUrl');
    var watermarkPosition = Utils.getPropertyValue(this.props.skinConfig, 'general.watermark.position');

    var watermarkTarget = Utils.getPropertyValue(this.props.skinConfig, 'general.watermark.target', '_blank');
    var watermarkTransparency = Utils.getPropertyValue(
      this.props.skinConfig,
      'general.watermark.transparency',
      1
    );
    var watermarkScalingOption = Utils.getPropertyValue(
      this.props.skinConfig,
      'general.watermark.scalingOption',
      'default'
    );
    var watermarkScalingPercentage = Utils.getPropertyValue(
      this.props.skinConfig,
      'general.watermark.scalingPercentage'
    );

    if (!watermarkUrl || !watermarkPosition) {
      return null;
    } else {
      var watermarkStyle = {};
      var watermarkImageStyle = {};
      watermarkStyle.opacity = watermarkTransparency;
      if (watermarkScalingOption === 'height') {
        watermarkStyle.height = watermarkScalingPercentage + '%';
        watermarkImageStyle.height = '100%';
      } else if (watermarkScalingOption === 'width') {
        watermarkStyle.width = watermarkScalingPercentage + '%';
        watermarkImageStyle.width = '100%';
      } else if (watermarkScalingOption === 'default') {
        watermarkStyle.width = CONSTANTS.WATERMARK.DEFAULT_SCALING_PERCENTAGE + '%';
        watermarkImageStyle.width = '100%';
      } else {
        watermarkStyle.width = 'auto';
      }
    }

    watermarkPosition = watermarkPosition.toLowerCase();

    // the position from db passed with the metadata uses 'right' instead of 'centerRight', etc.
    if (watermarkPosition === 'left' || watermarkPosition === 'right') {
      watermarkPosition = 'center' + watermarkPosition;
    }
    if (watermarkPosition === 'bottom' || watermarkPosition === 'top') {
      watermarkPosition = watermarkPosition + 'center';
    }

    var watermarkClass = ClassNames({
      'oo-watermark-container': true,
      'oo-watermark-no-clickURL': !clickUrl,
      'oo-watermark-top': watermarkPosition.indexOf('top') > -1,
      'oo-watermark-bottom': watermarkPosition.indexOf('bottom') > -1,
      'oo-watermark-bottom-cb': this.props.controlBarVisible && watermarkPosition.indexOf('bottom') > -1,
      'oo-watermark-left': watermarkPosition.indexOf('left') > -1,
      'oo-watermark-right': watermarkPosition.indexOf('right') > -1,
      'oo-watermark-center-horizontal':
        watermarkPosition.indexOf('bottomcenter') > -1 || watermarkPosition.indexOf('topcenter') > -1,
      'oo-watermark-center-vertical':
        watermarkPosition.indexOf('centerright') > -1 || watermarkPosition.indexOf('centerleft') > -1
    });

    var watermarkImageClass = ClassNames({
      'oo-blur': this.props.nonClickable,
      'oo-watermark': true
    });

    var watermarkImage = (
      <img
        className={watermarkImageClass}
        style={watermarkImageStyle}
        src={watermarkUrl}
        ref="watermarkImage"
      />
    );
    if (this.props.nonClickable || !clickUrl)
      return (
        <div className={watermarkClass} ref="watermark" style={watermarkStyle}>
          {watermarkImage}
        </div>
      );
    else
      return (
        <a
          className={watermarkClass}
          ref="watermark"
          style={watermarkStyle}
          href={this.props.skinConfig.general.watermark.clickUrl}
          target={watermarkTarget}
          onClick={this.handleWatermarkClick}
        >
          {watermarkImage}
        </a>
      );
  }
});

Watermark.propTypes = {
  controlBarVisible: PropTypes.bool,
  skinConfig: PropTypes.shape({
    general: PropTypes.shape({
      watermark: PropTypes.shape({
        imageResource: PropTypes.shape({
          url: PropTypes.string
        }),
        clickUrl: PropTypes.string,
        position: PropTypes.string,
        target: PropTypes.string,
        transparency: PropTypes.number,
        scalingOption: PropTypes.string,
        scalingPercentage: PropTypes.number,
        nonClickable: PropTypes.bool
      })
    })
  }),
  controller: PropTypes.shape({
    togglePlayPause: PropTypes.func
  })
};

Watermark.defaultProps = {
  controlBarVisible: false,
  skinConfig: {
    general: {
      watermark: {
        imageResource: {
          url: ''
        },
        clickUrl: '',
        position: 'bottomRight',
        target: '_blank',
        transparency: 1,
        scalingOption: 'default',
        scalingPercentage: 10,
        nonClickable: false
      }
    }
  },
  controller: {
    togglePlayPause: function() {}
  }
};

module.exports = Watermark;
