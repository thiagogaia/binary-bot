import React from 'react';
import Helmet from 'react-helmet';
import { useDispatch, useSelector } from 'react-redux';
import { useHistory } from 'react-router-dom';
import { TrackJS } from 'trackjs';
import { addTokenIfValid, AppConstants, queryToObjectArray } from '../../../../../common/appId';
import { getLanguage } from '../../../../../common/lang';
import { observer as globalObserver } from '../../../../../common/utils/observer';
import {
    convertForDerivStore,
    get as getStorage,
    getTokenList,
    isDone,
    removeAllTokens,
    set as setStorage,
} from '../../../../../common/utils/storageManager';
import { parseQueryString, translate } from '../../../../../common/utils/tools';
import _Blockly, { load } from '../../../blockly';
import LogTable from '../../../LogTable';
import TradeInfoPanel from '../../../TradeInfoPanel';
import api from '../../api';
import initialize, { applyToolboxPermissions, runBot, stopBlockly } from '../../blockly-worksace';
import SidebarToggle from '../../components/SidebarToggle';
import { updateActiveAccount, updateActiveToken, updateIsLogged } from '../../store/client-slice';
import { setShouldReloadWorkspace, updateShowTour } from '../../store/ui-slice';
import { getRelatedDeriveOrigin, isLoggedIn } from '../../utils';
import BotUnavailableMessage from '../Error/bot-unavailable-message-page.jsx';
// import ToolBox from '../ToolBox';

const Main = () => {
    const [blockly, setBlockly] = React.useState(null);
    const dispatch = useDispatch();
    const history = useHistory();
    const { should_reload_workspace } = useSelector(state => state.ui);

    React.useEffect(() => {
        if (should_reload_workspace) {
            // eslint-disable-next-line no-underscore-dangle
            const _blockly = new _Blockly();
            setBlockly(_blockly);
            init(_blockly);
            loginCheck().then(() => {
                initializeBlockly(_blockly);
            });
            dispatch(setShouldReloadWorkspace(false));
        }
    }, []);

    React.useEffect(() => {
        if (should_reload_workspace && blockly) {
            globalObserver.emit('bot.reload');
            dispatch(setShouldReloadWorkspace(false));
            applyToolboxPermissions();
        }
    }, [should_reload_workspace]);

    const [showSelectBot, setShowSelectBot] = React.useState(true);
    const [showStartBot, setshowStartBot] = React.useState(true);
    const init = () => {
        const local_storage_sync = document.getElementById('localstorage-sync');
        if (local_storage_sync) {
            local_storage_sync.src = `${getRelatedDeriveOrigin().origin}/localstorage-sync.html`;
        }

        const days_passed = Date.now() > (parseInt(getStorage('closedTourPopup')) || 0) + 24 * 60 * 60 * 1000;
        dispatch(updateShowTour(isDone('welcomeFinished') || days_passed));
    };

    // eslint-disable-next-line arrow-body-style
    const loginCheck = async () => {
        return new Promise(resolve => {
            const queryStr = parseQueryString();
            const tokenObjectList = queryToObjectArray(queryStr);

            if (!Array.isArray(getTokenList())) {
                removeAllTokens();
            }

            if (!getTokenList().length) {
                if (tokenObjectList.length) {
                    addTokenIfValid(tokenObjectList[0].token, tokenObjectList).then(() => {
                        const accounts = getTokenList();
                        if (accounts.length) {
                            setStorage(AppConstants.STORAGE_ACTIVE_TOKEN, accounts[0].token);
                            dispatch(updateActiveToken(accounts[0].token));
                            dispatch(updateActiveAccount(accounts[0].loginInfo));
                        }
                        dispatch(updateIsLogged(isLoggedIn()));
                        history.replace('/');
                        api.send({ balance: 1, account: 'all' }).catch(e => {
                            globalObserver.emit('Error', e);
                        });
                        applyToolboxPermissions();
                        resolve();
                    });
                }
                const active_account = getStorage('active_loginid') || '';
                let token_list = [];
                if (getStorage('client.accounts')?.length) {
                    token_list = JSON.parse(getStorage('client.accounts'));
                }
                if (active_account && token_list.length) {
                    const active_token = token_list.find(account => account.accountName === active_account).token;
                    setStorage('activeToken', active_token);
                    resolve();
                }
                setStorage('tokenList', JSON.stringify(token_list));
                setStorage('client.accounts', JSON.stringify(convertForDerivStore(token_list)));
            }
            resolve();
        });
    };

    const initializeBlockly = _blockly => {
        initialize(_blockly).then(() => {
            $('.show-on-load').show();
            $('.barspinner').hide();
            window.dispatchEvent(new Event('resize'));
            const userId = document.getElementById('active-account-name')?.value;
            if (userId) {
                TrackJS.configure({ userId });
            }
        });
    };

    async function loadBOT(name) {
        console.log('bot loaded', name);
        const response = await fetch(`https://atrium.ktalogue.com.br/xml/${name}.xml`);
        const respXML = await response.text();
        load(respXML);
        setShowSelectBot(false);
    }

    function botChange() {
        console.log('bot botChange');
        setShowSelectBot(true);
    }

    function botStart() {
        setshowStartBot(false);
        console.log('bot init');
        runBot(blockly);
    }

    function botStop() {
        setshowStartBot(true);
        console.log('bot stop');
        stopBlockly(blockly);
    }
    return (
        <div className='main'>
            <Helmet
                htmlAttributes={{
                    lang: getLanguage(),
                }}
                title={translate('Atrium 2.0 |  Bot – Deriv')}
                defer={false}
                meta={[
                    {
                        name: 'description',
                        content: translate(
                            'Automate your trades with Deriv’s bot trading platform, no coding needed. Trade now on forex, synthetic indices, commodities, stock indices, and more.'
                        ),
                    },
                ]}
            />
            <BotUnavailableMessage />
            <div id='bot-blockly'>
                {/* {blockly && <ToolBox />} */}
                {/* Blockly workspace will be injected here */}
                <div id='blocklyArea' style={{ display: 'none' }}>
                    <div id='blocklyDiv' style={{ position: 'absolute' }}></div>
                    <SidebarToggle />
                </div>
                <div className="redesign-2022 mx-auto mt-20 min-w-0 max-w-[40rem] 
                    lg:mt-0 lg:max-w-[50rem] lg:flex-auto prose-sm 
                    prose prose-slate prose-a:font-semibold prose-a:text-sky-500 hover:prose-a:text-sky-600">
                
                    {showSelectBot ? (
                        <>
                            <h1 className="text-base font-semibold leading-7 text-indigo-600">Seja bem vindo a Atrium 2.0</h1>
                            <p className="mt-4 text-base leading-7 text-slate-600">uma das melhores plataformas automatizadas de investimento</p>
                            <p className="mt-4 text-base leading-7 text-slate-600 mb-4">selecione um robô para começar a operar</p>
                            <div className="overflow-x-auto w-full">
                                <table className="table w-full">    
                                    <tbody>
                                        <tr onClick={() => loadBOT('conservador1')} className="cursor-pointer">
                                            <td>
                                            <div className="flex items-center space-x-3">
                                                <div className="flex gap-1 w-[15px]">
                                                <div className="w-2 h-12 bg-green-400 rounded-md"></div>
                                                </div>
                                                <div>
                                                <div className="font-bold">Robô 2 - Black Pro</div>
                                                <div className="text-sm opacity-50">conservador</div>
                                                </div>
                                            </div>
                                            </td>
                                            
                                            <td>
                                            <div className="flex justify-end">
                                                <svg width="49" height="24" viewBox="0 0 49 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                <path d="M17.0771 3.18457L31.0771 12.1846L17.0771 21.1846V3.18457Z" stroke="white" stroke-opacity="0.9" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                                                </svg>
                                            </div>
                                            
                                            </td>
                                        </tr>

                                        <tr onClick={() => loadBOT('conservador2')} className="cursor-pointer">
                                            <td>
                                            <div className="flex items-center space-x-3">
                                                <div className="flex gap-1 w-[15px]">
                                                <div className="w-2 h-12 bg-yellow-400 rounded-md"></div>
                                                <div className="w-2 h-12 bg-yellow-400 rounded-md"></div>
                                                </div>
                                                <div>
                                                <div className="font-bold">Robô 3 - Gray Max (atualizando)</div>
                                                <div className="text-sm opacity-50">conservador</div>
                                                </div>
                                            </div>
                                            </td>
                                            
                                            <td>
                                            <div className="flex justify-end">
                                                <svg width="49" height="24" viewBox="0 0 49 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                <path d="M17.0771 3.18457L31.0771 12.1846L17.0771 21.1846V3.18457Z" stroke="white" stroke-opacity="0.9" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                                                </svg>
                                            </div>
                                            
                                            </td>
                                        </tr>

                                        <tr onClick={() => loadBOT('moderado2')} className="cursor-pointer">
                                            <td>
                                            <div className="flex items-center space-x-3">
                                                <div className="flex gap-1 w-[15px]">
                                                <div className="w-2 h-12 bg-red-400 rounded-md"></div>
                                                <div className="w-2 h-12 bg-red-400 rounded-md"></div>
                                                <div className="w-2 h-12 bg-red-400 rounded-md"></div>
                                                </div>
                                                <div>
                                                <div className="font-bold">Robô 5 - White Hard</div>
                                                <div className="text-sm opacity-50">moderado</div>
                                                </div>
                                            </div>
                                            </td>
                                            
                                            <td>
                                            <div className="flex justify-end">
                                                <svg width="49" height="24" viewBox="0 0 49 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                <path d="M17.0771 3.18457L31.0771 12.1846L17.0771 21.1846V3.18457Z" stroke="white" stroke-opacity="0.9" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                                                </svg>
                                            </div>
                                            
                                            </td>
                                        </tr>

                                        <tr onClick={() => loadBOT('agressivo1')} className="cursor-pointer">
                                            <td>
                                            <div className="flex items-center space-x-3">
                                                <div className="flex gap-1 w-[15px]">
                                                <div className="w-2 h-12 bg-yellow-400 rounded-md"></div>
                                                <div className="w-2 h-12 bg-yellow-400 rounded-md"></div>
                                                </div>
                                                <div>
                                                <div className="font-bold">Robô 7 - PRO Max</div>
                                                <div className="text-sm opacity-50">agressivo</div>
                                                </div>
                                            </div>
                                            </td>
                                            
                                            <td>
                                            <div className="flex justify-end">
                                                <svg width="49" height="24" viewBox="0 0 49 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                <path d="M17.0771 3.18457L31.0771 12.1846L17.0771 21.1846V3.18457Z" stroke="white" stroke-opacity="0.9" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                                                </svg>
                                            </div>
                                            
                                            </td>
                                        </tr>

                                        <tr onClick={() => loadBOT('agressivo2')} className="cursor-pointer">
                                            <td>
                                            <div className="flex items-center space-x-3">
                                                <div className="flex gap-1 w-[15px]">
                                                <div className="w-2 h-12 bg-red-400 rounded-md"></div>
                                                <div className="w-2 h-12 bg-red-400 rounded-md"></div>
                                                <div className="w-2 h-12 bg-red-400 rounded-md"></div>
                                                </div>
                                                <div>
                                                <div className="font-bold">Robô 5 - White Hard</div>
                                                <div className="text-sm opacity-50">agressivo</div>
                                                </div>
                                            </div>
                                            </td>
                                            
                                            <td>
                                            <div className="flex justify-end">
                                                <svg width="49" height="24" viewBox="0 0 49 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                <path d="M17.0771 3.18457L31.0771 12.1846L17.0771 21.1846V3.18457Z" stroke="white" stroke-opacity="0.9" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                                                </svg>
                                            </div>
                                            
                                            </td>
                                        </tr>
                                    </tbody>
                                </table>
                                {/* <button onClick={() => loadBOT('agressivo1')}>agressivo1</button>
                                <button onClick={() => loadBOT('agressivo2')}>agressivo2</button>
                                <button onClick={() => loadBOT('moderado2')}>moderado2</button>
                                <button onClick={() => loadBOT('conservador1')}>conservador1</button>
                                <button onClick={() => loadBOT('conservador2')}>conservador2</button> */}
                            </div>
                        </>
                    ) : (
                        <>
                            {showStartBot ? (
                                <button onClick={botStart}>Iniciar robô</button>
                            ) : (
                                <button onClick={botStop}>Parar robô</button>
                            )}

                            <button onClick={botChange} disabled={!showStartBot}>
                                Trocar robô
                            </button>
                            {blockly && <LogTable />}
                            {blockly && <TradeInfoPanel />}
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Main;
