import PropTypes from 'prop-types';
import React from 'react';
import SAVE_LOAD_TYPE from '../../common/';
import * as style from '../../../../../style';
import { translate } from '../../../../../../../common/i18n';

const Load = ({ closeDialog }) => {
    const [load_type, setLoadType] = React.useState(SAVE_LOAD_TYPE.local);
    
    const onChange = e => setLoadType(e.target.value);

  const onSubmit = e => {
    e.preventDefault();
    // [TODO]: Refactor to use react
    document.getElementById('files').click();
    closeDialog();
    console.log('submit load.jsx');

  };

    return (
        <form id='load-dialog' className='dialog-content' style={style.content} onSubmit={onSubmit}>
            <div className='center-text input-row'>
                <input type="hidden" name={load_type} />
                <span className='integration-option'>
                    <input
                        type='radio'
                        id='load-local'
                        name='load-option'
                        value={SAVE_LOAD_TYPE.local}
                        defaultChecked
                        onChange={onChange}
                    />
                    <label htmlFor='load-local'>{translate('My computer')}</label>
                </span>
                
            </div>
            <div className='center-text input-row last'>
                <button id='load-strategy' type='submit' >
                    {translate('Load')}
                </button>
            </div>
        </form>
    );
};

Load.propTypes = {
    closeDialog: PropTypes.func.isRequired,
};

export default React.memo(Load);
