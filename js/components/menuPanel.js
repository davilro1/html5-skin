const React = require('react');
const CustomScrollArea = require('./customScrollArea');
const AccessibleMenu = require('./higher-order/accessibleMenu');
const MenuPanelItem = require('./menuPanelItem');
const classNames = require('classnames');
const PropTypes = require('prop-types');
const Utils = require('./utils');
const CONSTANTS = require('../constants/constants');

class MenuPanel extends React.Component {

  constructor(props) {
    super(props);
    this.onMenuItemClick = this.onMenuItemClick.bind(this);
  }

  /**
   * Handles menu item clicks.
   * @private
   * @param {String} itemValue The value of the menu item that was clicked
   */
  onMenuItemClick(itemValue) {
    this.props.onMenuItemClick(itemValue);

    if (typeof this.props.onClose === 'function') {
      this.props.onClose({ restoreToggleButtonFocus: true });
    }
  }

  /**
   * Maps a menu item object to a MenuPanelItem component.
   * @private
   * @param {Object} item The object that we want to map
   * @param {String} selectedValue The value of the item that is currently selected within the menu
   * @param {String} accentColor The accent color to use for selected items
   * @return {Component} A MenuPanelItem component whose properties are mapped to the given menu item object
   */
  renderMenuItem(item = {}, selectedValue, accentColor) {
    const { isPopover, skinConfig } = this.props;

    return (
      <MenuPanelItem
        itemValue={item.value}
        selectedValue={selectedValue}
        itemLabel={item.label}
        ariaLabel={item.ariaLabel}
        focusId={CONSTANTS.FOCUS_IDS.MENU_ITEM + item.value}
        accentColor={accentColor}
        showCheckmark={isPopover}
        skinConfig={skinConfig}
        onClick={this.onMenuItemClick} />
    );
  }

  render() {
    const {
      className,
      title,
      selectedValue,
      isPopover,
      skinConfig,
      menuItems,
    } = this.props;

    const menuClassName = classNames('oo-menu-panel', className, {
      'oo-menu-popover': isPopover,
      'oo-content-panel': !isPopover
    });

    const accentColor = Utils.getPropertyValue(
      skinConfig,
      'general.accentColor',
      null
    );

    return (
      <div className={menuClassName}>

        <CustomScrollArea
          className="oo-menu-panel-content"
          speed={isPopover ? CONSTANTS.UI.POPOVER_SCROLL_RATE : 1}>

          {title &&
            <div className="oo-menu-title">{title}</div>
          }

          <ul role="menu">
            {menuItems.map(menuItem =>
              this.renderMenuItem(menuItem, selectedValue, accentColor)
            )}
          </ul>

        </CustomScrollArea>

      </div>
    );
  }
}

MenuPanel.propTypes = {
  className: PropTypes.string,
  title: PropTypes.string,
  selectedValue: PropTypes.string.isRequired,
  isPopover: PropTypes.bool,
  onMenuItemClick: PropTypes.func.isRequired,
  onClose: PropTypes.func,
  menuItems: PropTypes.arrayOf(
    PropTypes.shape({
      value: PropTypes.string.isRequired,
      label: PropTypes.string.isRequired,
      ariaLabel: PropTypes.string.isRequired
    })
  ).isRequired,
  skinConfig: PropTypes.shape({
    general: PropTypes.shape({
      accentColor: PropTypes.string
    }),
  })
};

module.exports = AccessibleMenu(MenuPanel);