import React from 'react';
import AnimateTrade from './AnimateTrade';
import { observer as globalObserver } from '../../../common/utils/observer';
import { translate } from '../../../common/i18n';
import Summary from './Summary';
import TradeTable from './TradeTable';
import useIsMounted from '../../../common/hooks/isMounted';
import api from '../deriv/api';

const TradeInfoPanel = () => {
    const [account_id, setAccountId] = React.useState('');
    const [account_id_list, setAccountIdList] = React.useState([]);

    const isMounted = useIsMounted();

    React.useEffect(() => {
        globalObserver.register('bot.info', ({ accountID: account_id_param }) => {
            if (isMounted()) {
                if (!account_id_list.includes(account_id_param)) {
                    setAccountIdList(prevList => [...prevList, account_id_param]);
                }
                if (!account_id) {
                    setAccountId(account_id_param);
                }
            }
        });
    }, []);

    return (
        <span id='summaryPanel' className='' title={translate('Summary')}>
            <div>
                <div className='content'>
                    
                    <div className='content-row'>
                        <AnimateTrade />
                    </div>
                    <div className='content-row'>
                        <div>
                            <div className='content-row-table'>
                                <TradeTable account_id={account_id} api={api} />
                            </div>
                        </div>
                    </div>
                    <div className='content-row'>
                        <Summary accountID={account_id} />
                    </div>
                    
                </div>
            </div>
        </span>
    );
};

export default TradeInfoPanel;
