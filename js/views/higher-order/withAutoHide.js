const React = require('react');
const ReactDOM = require('react-dom');

const CONSTANTS = require('../../constants/constants');

const withAutoHide = function(ComposedComponent) {

  return class extends React.Component {
    constructor(props) {
      super(props);

      this.handleMouseOver = this.handleMouseOver.bind(this);
      this.hideControlBar = this.hideControlBar.bind(this);
      this.showControlBar = this.showControlBar.bind(this);

      this.handleKeyDown = this.handleKeyDown.bind(this);
      this.startHideControlBarTimer = this.startHideControlBarTimer.bind(this);
      this.cancelHideControlBarTimer = this.cancelHideControlBarTimer.bind(this);

      this.handlePlayerMouseMove = this.handlePlayerMouseMove.bind(this);

      this.composedComponentRef = React.createRef();
    }

    componentDidMount() {
      document.addEventListener('mousemove', this.handlePlayerMouseMove, false);
      document.addEventListener('touchmove', this.handlePlayerMouseMove, false);
      // for mobile or desktop fullscreen, hide control bar after 3 seconds
      if (this.props.controller.state.isMobile || this.props.fullscreen || this.props.controller.state.browserSupportsTouch) {
        this.startHideControlBarTimer();
      }
    }

    componentWillUnmount() {
      document.removeEventListener('mousemove', this.handlePlayerMouseMove);
      document.removeEventListener('touchmove', this.handlePlayerMouseMove);
      this.cancelHideControlBarTimer();
    }

    componentWillReceiveProps(nextProps) {
      if (nextProps.componentWidth !== this.props.componentWidth) {
        this.handleResize(nextProps);
      }
    }

    componentWillUpdate(nextProps) {
      if (nextProps) {
        if (!this.props.fullscreen && nextProps.fullscreen) {
          this.startHideControlBarTimer();
        }
        if (this.props.fullscreen && !nextProps.fullscreen && this.props.controller.state.isMobile) {
          this.props.controller.showControlBar();
          this.startHideControlBarTimer();
        }
      }
    }

    /**
     * call handleTouchEnd when touchend was called on selectedScreen
     * @param {Event} event - event object
     */
    handleTouchEnd(event) {
      event.preventDefault(); // to prevent mobile from propagating click to discovery shown on pause
      if (!this.props.controller.state.controlBarVisible) {
        this.showControlBar(event);
        this.startHideControlBarTimer();
      }
    }

    handlePlayerMouseMove(e) {
      if (!this.props.controller.state.isMobile && this.props.fullscreen) {
        this.showControlBar();
        this.startHideControlBarTimer();
      }
    }

    handleResize() {
      this.startHideControlBarTimer();
    }

    handleKeyDown(event) {
      // Show control bar when any of the following keys are pressed:
      // - Tab: Focus on next control
      // - Space/Enter: Press active control
      // - Arrow keys: Either seek forward/back, volume up/down or interact with focused slider
      switch (event.key) {
        case CONSTANTS.KEY_VALUES.TAB:
        case CONSTANTS.KEY_VALUES.SPACE:
        case CONSTANTS.KEY_VALUES.ENTER:
        case CONSTANTS.KEY_VALUES.ARROW_UP:
        case CONSTANTS.KEY_VALUES.ARROW_RIGHT:
        case CONSTANTS.KEY_VALUES.ARROW_DOWN:
        case CONSTANTS.KEY_VALUES.ARROW_LEFT:
          this.showControlBar();
          this.startHideControlBarTimer();
          break;
        default:
          break;
      }
    }

    /**
     * Handles the mouseover event.
     * @private
     * @param {Event} event The mouseover event object
     */
    handleMouseOver(event) {
      this.showControlBar();
    }

    showControlBar(event) {
      if (!this.props.controller.state.isMobile || (event && event.type === 'touchend')) {
        this.props.controller.showControlBar();
        ReactDOM.findDOMNode(this.refs.AutoHideScreen).style.cursor = 'auto';
      }
    }

    hideControlBar(event) {
      if (this.props.controlBarAutoHide === true && !(this.isMobile && event)) {
        this.props.controller.hideControlBar();
        ReactDOM.findDOMNode(this.refs.AutoHideScreen).style.cursor = 'none';
      }
    }

    startHideControlBarTimer() {
      this.props.controller.startHideControlBarTimer();
    }

    cancelHideControlBarTimer() {
      this.props.controller.cancelTimer();
    }

    render() {
      return (
        <div
          ref="AutoHideScreen"
          onMouseOver={this.handleMouseOver}
          onMouseOut={this.hideControlBar}
          onKeyDown={this.handleKeyDown}
        >
          <ComposedComponent
            {...this.props}
            hideControlBar={this.hideControlBar}
            showControlBar={this.showControlBar}
            startHideControlBarTimer={this.startHideControlBarTimer}
            cancelHideControlBarTimer={this.cancelHideControlBarTimer}
            ref={this.composedComponentRef}
          />
        </div>
      )
    }
  }
};

module.exports = withAutoHide;