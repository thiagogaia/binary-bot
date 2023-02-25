import './customBlockly';
import blocks from './blocks';
import {
    isMainBlock,
    save,
    disable,
    addLoadersFirst,
    cleanUpOnLoad,
    addDomAsBlock,
    backwardCompatibility,
    fixCollapsedBlocks,
    fixArgumentAttribute,
    removeUnavailableMarkets,
    strategyHasValidTradeTypeCategory,
    cleanBeforeExport,
    saveBeforeUnload,
    removeParam,
    updateRenamedFields,
} from './utils';
import Interpreter from '../../bot/Interpreter';
import { translate, xml as translateXml } from '../../../common/i18n';
import { observer as globalObserver } from '../../../common/utils/observer';
import { showDialog } from '../../bot/tools';
import { TrackJSError } from '../logger';
import { createDataStore } from '../../bot/data-collection';

import { getRelatedDeriveOrigin } from '../deriv/utils';
import { trackJSTrack } from '../../../common/integrations/trackJSTrack';

const disableStrayBlocks = () => {
    const topBlocks = Blockly.mainWorkspace.getTopBlocks();
    topBlocks.forEach(block => {
        if (
            !isMainBlock(block.type) &&
            ['block_holder', 'tick_analysis', 'loader', 'procedures_defreturn', 'procedures_defnoreturn'].indexOf(
                block.type
            ) < 0 &&
            !block.disabled
        ) {
            disable(block, translate('Blocks must be inside block holders, main blocks or functions'));
        }
    });
};

const marketsWereRemoved = xml => {
    if (!Array.from(xml.children).every(block => !removeUnavailableMarkets(block))) {
        trackJSTrack(new TrackJSError(translate('Invalid financial market')));
        showDialog({
            title: translate('Warning'),
            text: [translate('This strategy is not available in your country.')],
            buttons: [
                {
                    text: translate('OK'),
                    class: 'button-primary',
                    click() {
                        $(this).dialog('close');
                    },
                },
            ],
        })
            .then(() => {})
            .catch(() => {});
        return true;
    }
    return false;
};

const xmlToStr = xml => {
    const serializer = new XMLSerializer();
    return serializer.serializeToString(xml);
};

export const load = (blockStr, dropEvent = {}) => {
    console.log('quando vc é disparado');
    const unrecognisedMsg = () => translate('Unrecognized file format');

    try {
        const xmlDoc = new DOMParser().parseFromString(blockStr, 'application/xml');

        if (xmlDoc.getElementsByTagName('parsererror').length) {
            throw new Error();
        }
    } catch (err) {
        const error = new TrackJSError('FileLoad', unrecognisedMsg(), err);
        globalObserver.emit('Error', error);
        return;
    }

    let xml;
    try {
        xml = Blockly.Xml.textToDom(blockStr);
    } catch (e) {
        const error = new TrackJSError('FileLoad', unrecognisedMsg(), e);
        globalObserver.emit('Error', error);
        return;
    }

    const blocklyXml = xml.querySelectorAll('block');

    if (!blocklyXml.length) {
        globalObserver.emit('Error', translate('XML file contains unsupported elements. Please check or modify file.'));
        return;
    }

    if (xml.hasAttribute('is_dbot')) {
        showDialog({
            title: translate('Unsupported strategy'),
            text: [translate('Sorry, this strategy can’t be used with Binary Bot. You may only use it with DBot.')],
            buttons: [
                {
                    text: translate('Cancel'),
                    class: 'button-secondary',
                    click() {
                        $(this).dialog('close');
                        $(this).remove();
                    },
                },
                {
                    text: translate('Take me to DBot'),
                    class: 'button-primary',
                    click() {
                        window.location.href = `${getRelatedDeriveOrigin().origin}/bot`;
                    },
                },
            ],
        })
            .then(() => {})
            .catch(() => {});
        return;
    }

    const blockWithError = Array.from(blocklyXml).find(
        block => !Object.keys(Blockly.Blocks).includes(block.getAttribute('type'))
    );
    if (blockWithError) {
        globalObserver.emit('Error', translate('XML file contains unsupported elements. Please check or modify file.'));
        return;
    }

    removeParam('strategy');

    try {
        if (xml.hasAttribute('collection') && xml.getAttribute('collection') === 'true') {
            loadBlocks(xml, dropEvent);
        } else {
            console.log('vem daqui');
            loadWorkspace(xml);
        }
    } catch (e) {
        const error = new TrackJSError('FileLoad', translate('Unable to load the block file'), e);
        globalObserver.emit('Error', error);
    }
};

export const loadWorkspace = xml => {
    updateRenamedFields(xml);
    if (!strategyHasValidTradeTypeCategory(xml)) return;
    if (marketsWereRemoved(xml)) return;

    Blockly.Events.setGroup('load');
    Blockly.mainWorkspace.clear();

    Array.from(xml.children).forEach(block => {
        backwardCompatibility(block);
    });

    fixArgumentAttribute(xml);
    Blockly.Xml.domToWorkspace(xml, Blockly.mainWorkspace);
    addLoadersFirst(xml).then(
        () => {
            console.log('load workspace done');
            fixCollapsedBlocks();
            Blockly.Events.setGroup(false);
            globalObserver.emit('ui.log.success', translate('Blocks are loaded successfully'));
            console.log('deveria ir aqui');
        },
        e => {
            Blockly.Events.setGroup(false);
            throw e;
        }
    );
};

export const loadBlocks = (xml, dropEvent = {}) => {
    updateRenamedFields(xml);
    if (!strategyHasValidTradeTypeCategory(xml)) return;
    if (marketsWereRemoved(xml)) return;

    const variables = xml.getElementsByTagName('variables');
    if (variables.length > 0) {
        Blockly.Xml.domToVariables(variables[0], Blockly.mainWorkspace);
    }
    Blockly.Events.setGroup('load');
    addLoadersFirst(xml).then(
        loaders => {
            const addedBlocks = [
                ...loaders,
                ...Array.from(xml.children)
                    .map(block => addDomAsBlock(block))
                    .filter(b => b),
            ];
            console.log('acho q é aqui');
            cleanUpOnLoad(addedBlocks, dropEvent);
            fixCollapsedBlocks();
            globalObserver.emit('ui.log.success', translate('Blocks are loaded successfully'));
        },
        e => {
            throw e;
        }
    );
};

export default class _Blockly {
    constructor() {
        console.log('quando vc é disparado');
        this.generatedJs = '';
        // eslint-disable-next-line no-underscore-dangle
        Blockly.WorkspaceSvg.prototype.preloadAudio_ = () => {}; // https://github.com/google/blockly/issues/299
        this.initPromise = new Promise(() => {
            $.get('xml/toolbox.xml', toolboxXml => {
                blocks();
                const workspace = Blockly.inject('blocklyDiv', {
                    toolbox: xmlToStr(translateXml(toolboxXml.getElementsByTagName('xml')[0])),
                    zoom: {
                        wheel: false,
                    },
                    trashcan: false,
                });

                createDataStore(workspace);
            });
        });
    }
    /* eslint-disable class-methods-use-this */
    save(arg) {
        const { file_name, collection } = arg;

        saveBeforeUnload();

        const xml = Blockly.Xml.workspaceToDom(Blockly.mainWorkspace);
        cleanBeforeExport(xml);

        save(file_name, collection, xml);
    }
    run(limitations = {}) {
        console.log('run vaaaai');
        disableStrayBlocks();
        let code;
        try {
            code = `
                var BinaryBotPrivateInit;
                var BinaryBotPrivateStart;
                var BinaryBotPrivateBeforePurchase;
                var BinaryBotPrivateDuringPurchase;
                var BinaryBotPrivateAfterPurchase;
                var BinaryBotPrivateLastTickTime;
                var BinaryBotPrivateTickAnalysisList = [];

                function BinaryBotPrivateRun(f, arg) {
                    if (f) return f(arg);
                    return false;
                }

                function BinaryBotPrivateTickAnalysis() {
                    var currentTickTime = Bot.getLastTick(true).epoch
                    if (currentTickTime === BinaryBotPrivateLastTickTime) {
                        return
                    }
                    BinaryBotPrivateLastTickTime = currentTickTime
                    for (var BinaryBotPrivateI = 0; BinaryBotPrivateI < BinaryBotPrivateTickAnalysisList.length; BinaryBotPrivateI++) {
                        BinaryBotPrivateRun(BinaryBotPrivateTickAnalysisList[BinaryBotPrivateI]);
                    }
                }

                var BinaryBotPrivateLimitations = ${JSON.stringify(limitations)};

                ${Blockly.JavaScript.workspaceToCode(Blockly.mainWorkspace)}

                BinaryBotPrivateRun(BinaryBotPrivateInit);

                while(true) {
                    BinaryBotPrivateTickAnalysis();
                    BinaryBotPrivateRun(BinaryBotPrivateStart)
                    while(watch('before')) {
                        BinaryBotPrivateTickAnalysis();
                        BinaryBotPrivateRun(BinaryBotPrivateBeforePurchase);
                    }
                    while(watch('during')) {
                        BinaryBotPrivateTickAnalysis();
                        BinaryBotPrivateRun(BinaryBotPrivateDuringPurchase);
                    }
                    BinaryBotPrivateTickAnalysis();
                    if(!BinaryBotPrivateRun(BinaryBotPrivateAfterPurchase)) {
                        break;
                    }
                }
            `;
            this.generatedJs = code;
            if (code) {
                this.stop(true);
                this.interpreter = new Interpreter();
                this.interpreter.run(code).catch(e => {
                    globalObserver.emit('Error', e);
                    this.stop();
                });
            }
        } catch (e) {
            globalObserver.emit('Error', e);
            this.stop();
        }
    }
    stop(stopBeforeStart) {
        if (!stopBeforeStart) {
            const elRunButtons = document.querySelectorAll('#runButton, #summaryRunButton');
            const elStopButtons = document.querySelectorAll('#stopButton, #summaryStopButton');

            elRunButtons.forEach(el => {
                const elRunButton = el;
                elRunButton.style.display = 'initial';
            });
            elStopButtons.forEach(el => {
                const elStopButton = el;
                elStopButton.style.display = null;
            });
        }
        if (this.interpreter) {
            this.interpreter.stop();
            this.interpreter = null;
        }
    }
    /* eslint-disable class-methods-use-this */
    hasStarted() {
        return this.interpreter && this.interpreter.hasStarted();
    }
    /* eslint-enable */
}
