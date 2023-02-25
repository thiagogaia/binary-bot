import React from 'react';
import { useSelector } from 'react-redux';
import Load from './components/load';
import Modal from '../../components/modal';
import { translate } from '../../../../../common/i18n';

import Popover from '../../components/popover/index';
import config from '../../../../../app.config';

const ShowModal = ({ modal, onClose, class_name }) => {
    if (!modal) return;
    const { component: Component, props, title } = modal;
    // eslint-disable-next-line consistent-return
    return (
        <Modal onClose={onClose} title={title} class_name={class_name}>
            <Component {...props} />
        </Modal>
    );
};

const ToolboxButton = ({ label, tooltip, classes, id, position = 'bottom' }) => (
    <span id={id}>
        <Popover content={tooltip} position={position}>
            <button className={classes}>{label}</button>
        </Popover>
    </span>
);

const ToolBox = () => {
    const [should_show_modal, setShowModal] = React.useState(false);
    const [selected_modal, updateSelectedModal] = React.useState('');
    const has_active_token = useSelector(state => !!state.client?.active_token);

    const onCloseModal = () => {
        setShowModal(false);
        updateSelectedModal('');
    };
    const onShowModal = modal => {
        setShowModal(true);
        updateSelectedModal(modal);
    };
    const MODALS = {
        load: {
            component: Load,
            title: translate('Load Blocks'),
            props: {
                closeDialog: onCloseModal
            },
        },
        
    };
    return (
        <div id='toolbox'>
            <Popover content={translate('Load new blocks (xml file)')} position='bottom'>
                <button
                    id='load-xml'
                    className='toolbox-button icon-browse'
                    onClick={() => {
                        onShowModal('load');
                    }}
                />
            </Popover>
            

            
            {/* Needs Refactor ClientInfo Structure */}
            <span className='toolbox-separator' />
            <Popover content={translate('Show/hide the summary pop-up')} position='bottom'>
                <button id='showSummary' className='toolbox-button icon-summary' />
            </Popover>
            <ToolboxButton id='runButton' classes='toolbox-button icon-run' tooltip={translate('Run the bot')} />
            <ToolboxButton id='stopButton' classes='toolbox-button icon-stop' tooltip={translate('Stop the bot')} />
            <Popover content={translate('Show log')} position='bottom'>
                <button id='logButton' className='toolbox-button icon-info' />
            </Popover>
            {has_active_token && <span className='toolbox-separator' />}
            {/* Needs resizeable modal */}
            <Popover content={translate('Show chart')} position='bottom'>
                <button id='chartButton' className='toolbox-button icon-chart-line' />
            </Popover>
            {config.trading_view_chart.url && (
                <Popover content={translate('Show Trading View')} position='bottom'>
                    <button id='tradingViewButton' className='toolbox-button icon-trading-view' />
                </Popover>
            )}
            {should_show_modal && (
                <ShowModal modal={MODALS[selected_modal]} onClose={onCloseModal} class_name={selected_modal} />
            )}
        </div>
    );
};

export default ToolBox;
