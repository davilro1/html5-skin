/********************************************************************
  CONTROL BAR
*********************************************************************/
var React = require('react'),
  ReactDOM = require('react-dom'),
  CONSTANTS = require('../constants/constants'),
  ClassNames = require('classnames'),
  ScrubberBar = require('./scrubberBar'),
  Slider = require('./slider'),
  Utils = require('./utils'),
  Popover = require('../views/popover'),
  VolumeControls = require('./volumeControls'),
  VideoQualityPanel = require('./videoQualityPanel'),
  ClosedCaptionPopover = require('./closed-caption/closedCaptionPopover'),
  Logo = require('./logo'),
  Icon = require('./icon'),
  Tooltip = require('./tooltip');


var ControlBar = React.createClass({
  getInitialState: function () {
    this.isMobile = this.props.controller.state.isMobile;
    this.domNode = null;
    this.qualityBtnElement = null;
    this.qualityMenuOpenedWithKeyboard = false;
    this.responsiveUIMultiple = this.getResponsiveUIMultiple(this.props.responsiveView);
    this.moreOptionsItems = null;
    this.vr = null;
    if (this.props.controller && this.props.controller.videoVrSource && this.props.controller.videoVrSource.vr) {
      this.vr = this.props.controller.videoVrSource.vr;
    }
    return {};
  },

  componentDidMount: function () {
    window.addEventListener('orientationchange', this.closePopovers);
    document.addEventListener('keydown', this.handleControlBarKeyDown);
    this.restoreFocusedControl();
  },

  componentWillReceiveProps: function (nextProps) {
    // if responsive breakpoint changes
    if (nextProps.responsiveView != this.props.responsiveView) {
      this.responsiveUIMultiple = this.getResponsiveUIMultiple(nextProps.responsiveView);
    }
  },

  componentWillUnmount: function () {
    this.props.controller.cancelTimer();
    this.closePopovers();
    if (Utils.isAndroid()) {
      this.props.controller.hideVolumeSliderBar();
    }
    window.removeEventListener('orientationchange', this.closePopovers);
    document.removeEventListener('keydown', this.handleControlBarKeyDown);
  },

  /**
   * Restores the focus of a previously selected control bar item.
   * This is needed as a workaround because switching between play and pause states
   * currently causes the control bar to re-render.
   * @private
   */
  restoreFocusedControl: function() {
    if (!this.props.controller.state.focusedControl || !this.domNode) {
      return;
    }
    var selector = '[' + CONSTANTS.KEYBD_FOCUS_ID_ATTR + '="' + this.props.controller.state.focusedControl + '"]';
    var control = this.domNode.querySelector(selector);

    if (control && typeof control.focus === 'function') {
      control.focus();
      // If we got to this point it means that play was triggered using the spacebar
      // (since a click would've cleared the focused element) and we need to
      // trigger control bar auto hide
      if (this.props.playerState === CONSTANTS.STATE.PLAYING) {
        this.props.controller.startHideControlBarTimer();
      }
    }
  },

  getResponsiveUIMultiple: function (responsiveView) {
    var multiplier = this.props.skinConfig.responsive.breakpoints[responsiveView].multiplier;
    return multiplier;
  },

  handleControlBarMouseUp: function (evt) {
    if (evt.type == 'touchend' || !this.isMobile) {
      evt.stopPropagation(); // W3C
      evt.cancelBubble = true; // IE
      this.props.controller.state.accessibilityControlsEnabled = true;
      this.props.controller.startHideControlBarTimer();
    }
  },

  handleFullscreenClick: function (evt) {
    // On mobile, we get a following click event that fires after the Video
    // has gone full screen, clicking on a different UI element. So we prevent
    // the following click.
    evt.stopPropagation();
    evt.cancelBubble = true;
    evt.preventDefault();
    this.props.controller.toggleFullscreen();
  },

  handleStereoVrClick: function () {
    if (this.vr) {
      this.vr.stereo = !this.vr.stereo;
    }
    if(this.props.controller && typeof this.props.controller.toggleStereoVr === "function") {
      this.props.controller.toggleStereoVr();
    }
  },

  handleLiveClick: function (evt) {
    evt.stopPropagation();
    evt.cancelBubble = true;
    evt.preventDefault();
    this.props.controller.onLiveClick();
    this.props.controller.seek(this.props.duration);
  },

  handleVolumeIconClick: function (evt) {
    if (this.isMobile) {
      this.props.controller.startHideControlBarTimer();
      evt.stopPropagation(); // W3C
      evt.cancelBubble = true; // IE
      if (!this.props.controller.state.volumeState.volumeSliderVisible) {
        this.props.controller.showVolumeSliderBar();
      }
      else {
        this.props.controller.handleMuteClick();
      }
    }
    else {
      this.props.controller.handleMuteClick();
    }
  },

  handlePlayClick: function () {
    this.props.controller.togglePlayPause();
  },

  handleShareClick: function () {
    this.props.controller.toggleShareScreen();
  },

  handleQualityClick: function () {
    if (this.props.controller.state.videoQualityOptions.showVideoQualityPopover) {
      // Reset autoFocus property when closing the quality menu
      this.props.controller.state.videoQualityOptions.autoFocus = false;
    } else {
      // If the quality menu was activated via keyboard we should
      // autofocus on the first element
      this.props.controller.state.videoQualityOptions.autoFocus = this.qualityMenuOpenedWithKeyboard;
    }

    if (this.props.responsiveView == this.props.skinConfig.responsive.breakpoints.xs.id) {
      this.props.controller.toggleScreen(CONSTANTS.SCREEN.VIDEO_QUALITY_SCREEN);
    } else {
      this.toggleQualityPopover();
      this.closeCaptionPopover();
    }
  },

  /**
   * Fires when a key is pressed on the video quality button.
   * @private
   * @param {type} event The keydown event object.
   */
  handleQualityKeyDown: function(event) {
    switch (event.key) {
      case CONSTANTS.KEY_VALUES.SPACE:
      case CONSTANTS.KEY_VALUES.ENTER:
      // Ctrl and Alt are needed as a workaround for VoiceOver, which uses the
      // CTRL + OPTION + SPACE combination to activate buttons. VoiceOver actually
      // suppresses the spacebar keyboard event when this combination is used, so we
      // can only detect either CTRL or OPTION. This can obviously fail if the user
      // presses a different key after CTRL + OPTION, but a false positive is preferred.
      case CONSTANTS.KEY_VALUES.CONTROL:
      case CONSTANTS.KEY_VALUES.ALT:
        this.qualityMenuOpenedWithKeyboard = true;
        break;
      default:
        break;
    }
  },

  toggleQualityPopover: function () {
    this.props.controller.toggleVideoQualityPopOver();
  },

  closeQualityPopover: function (params) {
    params = params || {};

    if (this.props.controller.state.videoQualityOptions.showVideoQualityPopover === true) {
      // Re-focus on quality button when closing the quality popover if the latter was
      // originally opened with a key press.
      if (params.restoreToggleButtonFocus &&
          this.qualityMenuOpenedWithKeyboard &&
          this.qualityBtnElement &&
          typeof this.qualityBtnElement.focus === 'function') {
        this.qualityBtnElement.focus();
      }
      this.qualityMenuOpenedWithKeyboard = false;
      this.toggleQualityPopover();
    }
  },

  toggleCaptionPopover: function () {
    this.props.controller.toggleClosedCaptionPopOver();
  },

  closeCaptionPopover: function () {
    if (this.props.controller.state.closedCaptionOptions.showClosedCaptionPopover == true) {
      this.toggleCaptionPopover();
    }
  },

  closePopovers: function () {
    this.closeCaptionPopover();
    this.closeQualityPopover();
  },

  handleDiscoveryClick: function () {
    this.props.controller.toggleDiscoveryScreen();
  },

  handleMoreOptionsClick: function () {
    this.props.controller.toggleMoreOptionsScreen(this.moreOptionsItems);
  },

  handleClosedCaptionClick: function () {
    if (this.props.responsiveView == this.props.skinConfig.responsive.breakpoints.xs.id) {
      this.props.controller.toggleScreen(CONSTANTS.SCREEN.CLOSEDCAPTION_SCREEN);
    } else {
      this.toggleCaptionPopover();
      this.closeQualityPopover();
    }
  },

  //TODO(dustin) revisit this, doesn't feel like the "react" way to do this.
  highlight: function (evt) {
    if (!this.isMobile) {
      var iconElement = Utils.getEventIconElement(evt);
      if (iconElement) {
        var color = this.props.skinConfig.controlBar.iconStyle.active.color ? this.props.skinConfig.controlBar.iconStyle.active.color : this.props.skinConfig.general.accentColor;
        var opacity = this.props.skinConfig.controlBar.iconStyle.active.opacity;
        Utils.highlight(iconElement, opacity, color);
      }
    }
  },

  removeHighlight: function (evt) {
    var iconElement = Utils.getEventIconElement(evt);
    if (iconElement) {
      var color = this.props.skinConfig.controlBar.iconStyle.inactive.color;
      var opacity = this.props.skinConfig.controlBar.iconStyle.inactive.opacity;
      Utils.removeHighlight(iconElement, opacity, color);
    }
  },

  /**
   * Fires whenever an item is focused inside the control bar. Stores the id of
   * the focused control.
   * @private
   * @param {type} evt Focus event.
   */
  handleControlBarFocus: function(evt) {
    var focusId = evt.target ? evt.target.getAttribute(CONSTANTS.KEYBD_FOCUS_ID_ATTR) : null;
    if (focusId) {
      this.props.controller.state.focusedControl = focusId;
    }
  },

  /**
   * Clears the currently focused control.
   * @private
   */
  handleControlBarBlur: function(evt) {
    this.props.controller.state.focusedControl = null;
  },

  /**
   * Will handle the keydown event when the controlBar is active and it will restrict
   * tab navigation to elements that are within it when the player is in fullscreen mode.
   * Note that this only handles the edge cases that are needed in order to loop the tab
   * focus. Tabbing in between the elements is handled by the browser.
   * @private
   * @param {Object} evt Keydown event object.
   */
  handleControlBarKeyDown: function(evt) {
    if (
      evt.key !== CONSTANTS.KEY_VALUES.TAB ||
      !this.props.controller.state.fullscreen ||
      !this.domNode ||
      !evt.target
    ) {
      return;
    }
    // Focusable elements on the control bar (this.domNode) are expected to have the
    // data-focus-id attribute
    var focusableElements = this.domNode.querySelectorAll('[' + CONSTANTS.KEYBD_FOCUS_ID_ATTR + ']');

    if (focusableElements.length) {
      var firstFocusableElement = focusableElements[0];
      var lastFocusableElement = focusableElements[focusableElements.length - 1];
      // This indicates we're tabbing over the focusable control bar elements
      if (evt.target.hasAttribute(CONSTANTS.KEYBD_FOCUS_ID_ATTR)) {
        if (evt.shiftKey) {
          // Shift + tabbing on first element, focus on last
          if (evt.target === firstFocusableElement) {
            evt.preventDefault();
            lastFocusableElement.focus();
          }
        } else {
          // Tabbing on last element, focus on first
          if (evt.target === lastFocusableElement) {
            evt.preventDefault();
            firstFocusableElement.focus();
          }
        }
      // Keydown happened on a non-controlbar element
      } else {
        evt.preventDefault();

        if (evt.shiftKey) {
          lastFocusableElement.focus();
        } else {
          firstFocusableElement.focus();
        }
      }
    } else {
      OO.log('ControlBar: No focusable elements found');
    }
  },

  populateControlBar: function () {
    var dynamicStyles = this.setupItemStyle();
    var playIcon, playPauseAriaLabel;
    if (this.props.playerState == CONSTANTS.STATE.PLAYING) {
      playIcon = "pause";
      playPauseAriaLabel = CONSTANTS.ARIA_LABELS.PAUSE;
    } else if (this.props.playerState == CONSTANTS.STATE.END) {
      playIcon = "replay";
      playPauseAriaLabel = CONSTANTS.ARIA_LABELS.REPLAY;
    } else {
      playIcon = "play";
      playPauseAriaLabel = CONSTANTS.ARIA_LABELS.PLAY;
    }

    var volumeIcon, volumeAriaLabel;
    if (this.props.controller.state.volumeState.muted) {
      volumeIcon = "volumeOff";
      volumeAriaLabel = CONSTANTS.ARIA_LABELS.UNMUTE;
    } else {
      volumeIcon = "volume";
      volumeAriaLabel = CONSTANTS.ARIA_LABELS.MUTE;
    }

    var fullscreenIcon, fullscreenAriaLabel;
    if (this.props.controller.state.fullscreen) {
      fullscreenIcon = "compress";
      fullscreenAriaLabel = CONSTANTS.ARIA_LABELS.EXIT_FULLSCREEN;
    } else {
      fullscreenIcon = "expand";
      fullscreenAriaLabel = CONSTANTS.ARIA_LABELS.FULLSCREEN;
    }

    var stereoIcon, stereoAriaLabel;
    if (this.vr) {
      stereoIcon = "stereoOff";
      stereoAriaLabel = CONSTANTS.ARIA_LABELS.STEREO_OFF;
      if (this.vr.stereo) {
        stereoIcon = "stereoOn";
        stereoAriaLabel = CONSTANTS.ARIA_LABELS.STEREO_ON;
      }
    }

    var totalTime = 0;
    if (this.props.duration == null || typeof this.props.duration == 'undefined' || this.props.duration == "") {
      totalTime = Utils.formatSeconds(0);
    }
    else {
      totalTime = Utils.formatSeconds(this.props.duration);
    }

    // TODO - Replace time display logic with Utils.getTimeDisplayValues()
    var playheadTime = isFinite(parseInt(this.props.currentPlayhead)) ? Utils.formatSeconds(parseInt(this.props.currentPlayhead)) : null;
    var isLiveStream = this.props.isLiveStream;
    var durationSetting = { color: this.props.skinConfig.controlBar.iconStyle.inactive.color };
    var timeShift = this.props.currentPlayhead - this.props.duration;
    // checking timeShift < 1 seconds (not == 0) as processing of the click after we rewinded and then went live may take some time
    var isLiveNow = Math.abs(timeShift) < 1;
    var liveClick = isLiveNow ? null : this.handleLiveClick;
    var playheadTimeContent = isLiveStream ? (isLiveNow ? null : Utils.formatSeconds(timeShift)) : playheadTime;
    var totalTimeContent = isLiveStream ? null : <span className="oo-total-time">{totalTime}</span>;

    // TODO: Update when implementing localization
    var liveText = Utils.getLocalizedString(this.props.language, CONSTANTS.SKIN_TEXT.LIVE, this.props.localizableStrings);

    var liveClass = ClassNames({
      "oo-control-bar-item oo-live oo-live-indicator": true,
      "oo-live-nonclickable": isLiveNow
    });

    var closedCaptionPopover = this.props.controller.state.closedCaptionOptions.showClosedCaptionPopover ? <Popover popoverClassName="oo-popover oo-popover-pull-right"><ClosedCaptionPopover {...this.props} togglePopoverAction={this.toggleCaptionPopover} /></Popover> : null;

    var qualityClass = ClassNames({
      "oo-quality": true,
      "oo-control-bar-item": true,
      "oo-selected": this.props.controller.state.videoQualityOptions.showVideoQualityPopover
    });

    var captionClass = ClassNames({
      "oo-closed-caption": true,
      "oo-control-bar-item": true,
      "oo-selected": this.props.controller.state.closedCaptionOptions.showClosedCaptionPopover
    });

    var selectedStyle = {};
    selectedStyle["color"] = this.props.skinConfig.general.accentColor ? this.props.skinConfig.general.accentColor : null;

    var isTooltipEnabled = false;
    if (!this.isMobile) {
      isTooltipEnabled = this.props.skinConfig.controlBar.tooltips ? this.props.skinConfig.controlBar.tooltips.enabled : false;
    }

    var controlItemTemplates = {
      "playPause": (function (alignment) {
        return <button
          type="button"
          className="oo-play-pause oo-control-bar-item"
          onClick={this.handlePlayClick}
          onMouseUp={Utils.blurOnMouseUp}
          onMouseOver={this.highlight}
          onMouseOut={this.removeHighlight}
          key="playPause"
          data-focus-id="playPause"
          tabIndex="0"
          aria-label={playPauseAriaLabel}>
          <Icon {...this.props} icon={playIcon} style={dynamicStyles.iconCharacter} />
          <Tooltip enabled={isTooltipEnabled}
            alignment={alignment}
            responsivenessMultiplier={this.responsiveUIMultiple}
            bottom={this.responsiveUIMultiple * this.props.skinConfig.controlBar.height}
            text={this.props.playerState == CONSTANTS.STATE.PLAYING ? Utils.getLocalizedString(this.props.language, CONSTANTS.SKIN_TEXT.PAUSE, this.props.localizableStrings) :
              this.props.playerState == CONSTANTS.STATE.END ? Utils.getLocalizedString(this.props.language, CONSTANTS.SKIN_TEXT.REPLAY, this.props.localizableStrings) : Utils.getLocalizedString(this.props.language, CONSTANTS.SKIN_TEXT.PLAY, this.props.localizableStrings)}>
          </Tooltip>
        </button>
      }).bind(this),

      "live": (function (alignment) {
        return <a className={liveClass}
          ref="LiveButton"
          onClick={liveClick} key="live">
          <div className="oo-live-circle"></div>
          <span className="oo-live-text">{liveText}</span>
        </a>
      }).bind(this),

      "volume": (function (alignment) {
        return <div className="oo-volume oo-control-bar-item" key="volume">
          <button
            type="button"
            className="oo-mute-unmute oo-control-bar-item"
            onClick={this.handleVolumeIconClick}
            onMouseUp={Utils.blurOnMouseUp}
            onMouseOver={this.highlight}
            onMouseOut={this.removeHighlight}
            data-focus-id="muteUnmute"
            tabIndex="0"
            aria-label={volumeAriaLabel}>
            <Icon {...this.props} icon={volumeIcon} ref="volumeIcon"
              style={this.props.skinConfig.controlBar.iconStyle.inactive} />
            <Tooltip enabled={isTooltipEnabled}
              text={this.props.controller.state.volumeState.muted ? Utils.getLocalizedString(this.props.language, CONSTANTS.SKIN_TEXT.UNMUTE, this.props.localizableStrings) : Utils.getLocalizedString(this.props.language, CONSTANTS.SKIN_TEXT.MUTE, this.props.localizableStrings)}
              responsivenessMultiplier={this.responsiveUIMultiple} bottom={this.responsiveUIMultiple * this.props.skinConfig.controlBar.height} alignment={alignment}>
            </Tooltip>
          </button>
          <VolumeControls {...this.props} />
        </div>
      }).bind(this),

      "timeDuration": (function (alignment) {
        return <a className="oo-time-duration oo-control-bar-duration" style={durationSetting} key="timeDuration">
          <span>{playheadTimeContent}</span>{totalTimeContent}
        </a>
      }).bind(this),

      "flexibleSpace": (function (alignment) { return <div className="oo-flexible-space oo-control-bar-flex-space" key="flexibleSpace"></div> }).bind(this),

      "moreOptions": (function (alignment) {
        return <a className="oo-more-options oo-control-bar-item"
          onClick={this.handleMoreOptionsClick} key="moreOptions" aria-hidden="true">
          <Icon {...this.props} icon="ellipsis" style={dynamicStyles.iconCharacter}
            onMouseOver={this.highlight} onMouseOut={this.removeHighlight} />
          <Tooltip enabled={isTooltipEnabled} responsivenessMultiplier={this.responsiveUIMultiple} bottom={this.responsiveUIMultiple * this.props.skinConfig.controlBar.height}
            text={Utils.getLocalizedString(this.props.language, CONSTANTS.SKIN_TEXT.MORE_OPTIONS, this.props.localizableStrings)} alignment={alignment}>
          </Tooltip>
        </a>
      }).bind(this),

      "quality": (function (alignment) {
        return <div className="oo-popover-button-container" key="quality">
          <button
            type="button"
            ref={function(e) { this.qualityBtnElement = e }.bind(this)}
            className={qualityClass}
            style={selectedStyle}
            onMouseUp={Utils.blurOnMouseUp}
            onClick={this.handleQualityClick}
            onKeyDown={this.handleQualityKeyDown}
            data-focus-id="quality"
            tabIndex="0"
            aria-label={CONSTANTS.ARIA_LABELS.VIDEO_QUALITY}
            aria-haspopup="true"
            aria-expanded={this.props.controller.state.videoQualityOptions.showVideoQualityPopover ? true : null}>
            <Icon {...this.props} icon="quality" style={dynamicStyles.iconCharacter}
              onMouseOver={this.highlight} onMouseOut={this.removeHighlight} />
            <Tooltip enabled={isTooltipEnabled} text={Utils.getLocalizedString(this.props.language, CONSTANTS.SKIN_TEXT.VIDEO_QUALITY, this.props.localizableStrings)} bottom={this.responsiveUIMultiple * this.props.skinConfig.controlBar.height} alignment={alignment}
              responsivenessMultiplier={this.responsiveUIMultiple} />
          </button>
          {this.props.controller.state.videoQualityOptions.showVideoQualityPopover &&
            <Popover
              autoFocus={this.props.controller.state.videoQualityOptions.autoFocus}
              closeActionEnabled={this.props.controller.state.accessibilityControlsEnabled}
              closeAction={this.closeQualityPopover}>
              <VideoQualityPanel
                {...this.props}
                closeAction={this.closeQualityPopover}
                popover={true}/>
            </Popover>
          }
        </div>
      }).bind(this),

      "discovery": (function (alignment) {
        return <a className="oo-discovery oo-control-bar-item"
          onClick={this.handleDiscoveryClick} key="discovery" aria-hidden="true">
          <Icon {...this.props} icon="discovery" style={dynamicStyles.iconCharacter}
            onMouseOver={this.highlight} onMouseOut={this.removeHighlight} />
          <Tooltip enabled={isTooltipEnabled} text={Utils.getLocalizedString(this.props.language, CONSTANTS.SKIN_TEXT.DISCOVER, this.props.localizableStrings)} responsivenessMultiplier={this.responsiveUIMultiple} bottom={this.responsiveUIMultiple * this.props.skinConfig.controlBar.height} alignment={alignment} />
        </a>
      }).bind(this),

      "closedCaption": (function (alignment) {
        return (
          <div className="oo-popover-button-container" key="closedCaption">
            {closedCaptionPopover}
            <a className={captionClass} onClick={this.handleClosedCaptionClick} style={selectedStyle} aria-hidden="true">
              <Icon {...this.props} icon="cc" style={dynamicStyles.iconCharacter}
                onMouseOver={this.highlight} onMouseOut={this.removeHighlight} />
              <Tooltip enabled={isTooltipEnabled} text={Utils.getLocalizedString(this.props.language, CONSTANTS.SKIN_TEXT.CLOSED_CAPTIONS, this.props.localizableStrings)} responsivenessMultiplier={this.responsiveUIMultiple} bottom={this.responsiveUIMultiple * this.props.skinConfig.controlBar.height} alignment={alignment} />
            </a>
          </div>
        )
      }).bind(this),

      "share": (function (alignment) {
        return <a className="oo-share oo-control-bar-item"
          onClick={this.handleShareClick} key="share" aria-hidden="true">
          <Icon {...this.props} icon="share" style={dynamicStyles.iconCharacter}
            onMouseOver={this.highlight} onMouseOut={this.removeHighlight} />
          <Tooltip enabled={isTooltipEnabled} text={Utils.getLocalizedString(this.props.language, CONSTANTS.SKIN_TEXT.SHARE, this.props.localizableStrings)} responsivenessMultiplier={this.responsiveUIMultiple} bottom={this.responsiveUIMultiple * this.props.skinConfig.controlBar.height} alignment={alignment} />
        </a>
      }).bind(this),

      "stereoscopic": (function (alignment) {
        var checkStereoBtn = this.vr && this.isMobile;
        return (!checkStereoBtn) ? null :
          <button
            type="button"
            className="oo-video-type oo-control-bar-item oo-vr-stereo-button"
            onClick={this.handleStereoVrClick}
            onMouseUp={Utils.blurOnMouseUp}
            onMouseOver={this.highlight}
            onMouseOut={this.removeHighlight}
            key="stereo"
            data-focus-id="stereo"
            tabIndex="0"
            aria-label={stereoAriaLabel}>
            <Icon {...this.props} icon={stereoIcon} style={dynamicStyles.iconCharacter} />
            <Tooltip enabled={isTooltipEnabled} responsivenessMultiplier={this.responsiveUIMultiple}
              bottom={this.responsiveUIMultiple * this.props.skinConfig.controlBar.height} alignment={alignment} />
          </button>
      }).bind(this),

    "fullscreen": (function (alignment) {
        return <button
          type="button"
          className="oo-fullscreen oo-control-bar-item"
          onClick={this.handleFullscreenClick}
          onMouseUp={Utils.blurOnMouseUp}
          onMouseOver={this.highlight}
          onMouseOut={this.removeHighlight}
          key="fullscreen"
          data-focus-id="fullscreen"
          tabIndex="0"
          aria-label={fullscreenAriaLabel}>
          <Icon {...this.props} icon={fullscreenIcon} style={dynamicStyles.iconCharacter} />
          <Tooltip enabled={isTooltipEnabled} responsivenessMultiplier={this.responsiveUIMultiple} text={this.props.controller.state.fullscreen ?
            Utils.getLocalizedString(this.props.language, CONSTANTS.SKIN_TEXT.EXIT_FULL_SCREEN, this.props.localizableStrings) : Utils.getLocalizedString(this.props.language, CONSTANTS.SKIN_TEXT.FULL_SCREEN, this.props.localizableStrings)}
            bottom={this.responsiveUIMultiple * this.props.skinConfig.controlBar.height} alignment={alignment} />
        </button>
      }).bind(this),

      "logo": (function (alignment) {
        return <Logo key="logo" imageUrl={this.props.skinConfig.controlBar.logo.imageResource.url}
          clickUrl={this.props.skinConfig.controlBar.logo.clickUrl}
          target={this.props.skinConfig.controlBar.logo.target}
          width={this.props.responsiveView != this.props.skinConfig.responsive.breakpoints.xs.id ? this.props.skinConfig.controlBar.logo.width : null}
          height={this.props.skinConfig.controlBar.logo.height} />
      }).bind(this)
    }

    var controlBarItems = [];
    var defaultItems = this.props.controller.state.isPlayingAd ? this.props.skinConfig.buttons.desktopAd : this.props.skinConfig.buttons.desktopContent;

    //if mobile and not showing the slider or the icon, extra space can be added to control bar width. If volume bar is shown instead of slider, add some space as well:
    var volumeItem = null;
    var extraSpaceVolume = 0;

    for (var j = 0; j < defaultItems.length; j++) {
      if (defaultItems[j].name == "volume") {
        volumeItem = defaultItems[j];

        var extraSpaceVolumeSlider = (((volumeItem && this.isMobile && !this.props.controller.state.volumeState.volumeSliderVisible) || volumeItem && Utils.isIos()) ? parseInt(volumeItem.minWidth) : 0);
        var extraSpaceVolumeBar = this.isMobile ? 0 : parseInt(volumeItem.minWidth) / 2;
        extraSpaceVolume = extraSpaceVolumeSlider + extraSpaceVolumeBar;

        break;
      }
    }

    //if no hours, add extra space to control bar width:
    var hours = parseInt(this.props.duration / 3600, 10);
    var extraSpaceDuration = (hours > 0) ? 0 : 45;

    var controlBarLeftRightPadding = CONSTANTS.UI.DEFAULT_SCRUBBERBAR_LEFT_RIGHT_PADDING * 2;

    for (var k = 0; k < defaultItems.length; k++) {

      //filter out unrecognized button names
      if (typeof controlItemTemplates[defaultItems[k].name] === "undefined") {
        continue;
      }

      //filter out disabled buttons
      if (defaultItems[k].location === "none") {
        continue;
      }

      //do not show share button if not share options are available
      if (defaultItems[k].name === "share") {
        var shareContent = Utils.getPropertyValue(this.props.skinConfig, 'shareScreen.shareContent', []);
        var socialContent = Utils.getPropertyValue(this.props.skinConfig, 'shareScreen.socialContent', []);
        var onlySocialTab = shareContent.length === 1 && shareContent[0] === 'social';
        //skip if no tabs were specified or if only the social tab is present but no social buttons are specified
        if (this.props.controller.state.isOoyalaAds || !shareContent.length || (onlySocialTab && !socialContent.length)) {
          continue;
        }
      }

      //do not show CC button if no CC available
      if ((this.props.controller.state.isOoyalaAds || !this.props.controller.state.closedCaptionOptions.availableLanguages) && (defaultItems[k].name === "closedCaption")) {
        continue;
      }

      //do not show quality button if no bitrates available
      if ((this.props.controller.state.isOoyalaAds || !this.props.controller.state.videoQualityOptions.availableBitrates) && (defaultItems[k].name === "quality")) {
        continue;
      }

      //do not show discovery button if no related videos available
      if ((this.props.controller.state.isOoyalaAds || !this.props.controller.state.discoveryData) && (defaultItems[k].name === "discovery")) {
        continue;
      }

      //do not show logo if no image url available
      if (!this.props.skinConfig.controlBar.logo.imageResource.url && (defaultItems[k].name === "logo")) {
        continue;
      }

      if (Utils.isIos() && (defaultItems[k].name === "volume")) {
        continue;
      }

      //not sure what to do when there are multi streams
      if (defaultItems[k].name === "live" &&
        (typeof this.props.isLiveStream === 'undefined' ||
          !(this.props.isLiveStream))) {
        continue;
      }

      controlBarItems.push(defaultItems[k]);
    }

    var collapsedResult = Utils.collapse(this.props.componentWidth + this.responsiveUIMultiple * (extraSpaceDuration + extraSpaceVolume - controlBarLeftRightPadding), controlBarItems, this.responsiveUIMultiple);
    var collapsedControlBarItems = collapsedResult.fit;
    var collapsedMoreOptionsItems = collapsedResult.overflow;
    this.moreOptionsItems = collapsedMoreOptionsItems;

    finalControlBarItems = [];
    var lastItem = (this.props.controller.state.isOoyalaAds || collapsedMoreOptionsItems.length === 0) ? collapsedControlBarItems.length - 2 : collapsedControlBarItems.length - 1;
    for (var k = 0; k < collapsedControlBarItems.length; k++) {
      if (collapsedControlBarItems[k].name === "moreOptions" && (this.props.controller.state.isOoyalaAds || collapsedMoreOptionsItems.length === 0)) {
        continue;
      }
      var alignment = 'center';
      if (k === lastItem) {
        alignment = 'right'
      } else if (k === 0) {
        alignment = 'left';
      }
      finalControlBarItems.push(controlItemTemplates[collapsedControlBarItems[k].name](alignment));
    }
    return finalControlBarItems;
  },

  setupItemStyle: function () {
    var returnStyles = {};

    returnStyles.iconCharacter = {
      color: this.props.skinConfig.controlBar.iconStyle.inactive.color,
      opacity: this.props.skinConfig.controlBar.iconStyle.inactive.opacity

    };
    return returnStyles;
  },

  render: function () {
    var controlBarClass = ClassNames({
      "oo-control-bar": true,
      "oo-control-bar-hidden": !this.props.controlBarVisible
    });

    var controlBarItems = this.populateControlBar();

    var controlBarStyle = {
      height: this.props.skinConfig.controlBar.height
    };

    return (
      <div
        ref={function(domNode) { this.domNode = domNode; }.bind(this)}
        className={controlBarClass}
        style={controlBarStyle}
        onFocus={this.handleControlBarFocus}
        onBlur={this.handleControlBarBlur}
        onMouseUp={this.handleControlBarMouseUp}
        onTouchEnd={this.handleControlBarMouseUp}>
        <ScrubberBar {...this.props} />

        <div className="oo-control-bar-items-wrapper">
          {controlBarItems}
        </div>
      </div>
    );
  }
});

ControlBar.defaultProps = {
  isLiveStream: false,
  skinConfig: {
    responsive: {
      breakpoints: {
        xs: { id: 'xs' },
        sm: { id: 'sm' },
        md: { id: 'md' },
        lg: { id: 'lg' }
      }
    }
  },
  responsiveView: 'md'
};

module.exports = ControlBar;
