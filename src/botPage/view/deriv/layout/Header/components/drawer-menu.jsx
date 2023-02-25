import React from 'react';
import classNames from 'classnames';
import { translate } from '../../../../../../common/utils/tools';
import MenuLinks from './menu-links.jsx';
import PlatformDropdown from './platform-dropdown.jsx';
import config from '../../../../../../app.config';

const DrawerMenu = ({
    updateShowDrawerMenu,
    setIsPlatformSwitcherOpen,
    isPlatformSwitcherOpen,
    hideDropdown,
    platformDropdownRef,
    is_logged,
}) => {
    const drawer_ref = React.useRef();
    React.useEffect(() => {
        function handleClickOutside(event) {
            if (drawer_ref.current && !drawer_ref.current.contains(event.target)) {
                updateShowDrawerMenu(false);
            }
        }
        window.addEventListener('click', handleClickOutside);

        return () => window.removeEventListener('click', handleClickOutside);
    });
    return (
        <div className='header__drawer-wrapper'>
            <div className='header__drawer' ref={drawer_ref}>
                <div className='header__drawer-top'>
                    <img
                        src='image/deriv/ic-close.svg'
                        className='header__drawer-close'
                        onClick={() => {
                            updateShowDrawerMenu(false);
                        }}
                    />
                    <img className='header__logo' src={config.app_logo} />
                    <div className='platform__switcher-header'>{config.app_title}</div>
                </div>
                <div className='header__drawer-content'>
                    
                </div>
            </div>
        </div>
    );
};

export default DrawerMenu;
