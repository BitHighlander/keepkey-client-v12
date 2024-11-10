import { startHub } from "@plasmohq/messaging/pub-sub";
import { requestStorage, exampleSidebarStorage, web3ProviderStorage } from '@extension/storage';
import { onStartKeepkey } from './keepkey';
import axios from 'axios';
import type { PlasmoMessaging } from '@plasmohq/messaging';
import { ChainToNetworkId } from '@pioneer-platform/pioneer-caip';
import {Chain} from "@coinmasters/types";

const TAG = ' | background/index.ts | ';
const tag = TAG;

const KEEPKEY_STATES = {
    0: 'unknown',
    1: 'disconnected',
    2: 'connected',
    3: 'busy',
    4: 'errored',
    5: 'paired',
};
let KEEPKEY_STATE = 0;

let ADDRESS = '';
let APP: any = null;

// let onStart = async () => {
//     try{
//
//         console.log(tag, 'Starting...');
//         APP = await onStartKeepkey();
//         console.log(tag, 'APP:', APP);
//         if (!APP) throw Error('Failed to INIT!');
//
//     }catch(e){
//         console.error('e: ',e)
//     }
// }
// onStart()

if (chrome.action) {
    chrome.action.onClicked.addListener((tab: chrome.tabs.Tab) => {
        console.log(tag, 'Action clicked:', tab);

        chrome.tabs.query({}, (tabs) => {
            if (chrome.runtime.lastError) {
                console.error('Error querying tabs:', chrome.runtime.lastError);
                return;
            }

            const webPageTabs = tabs.filter((tab) =>
                    tab.url
                // !tab.url.startsWith('chrome://') &&
                // !tab.url.startsWith('chrome-extension://') &&
                // !tab.url.startsWith('about:')
            );

            if (webPageTabs.length > 0) {
                webPageTabs.sort((a, b) => b.lastAccessed - a.lastAccessed);
                const recentTab = webPageTabs[0];
                const windowId = recentTab.windowId;

                console.log(tag, 'Opening sidebar in tab:', recentTab);

                chrome.sidePanel.open({ windowId }, () => {
                    if (chrome.runtime.lastError) {
                        console.error('Error opening side panel:', chrome.runtime.lastError);
                    } else {
                        console.log('Side panel opened successfully.');
                    }
                });
            } else {
                console.error('No suitable web page tabs found to open the side panel.');
            }
        });
    });
} else {
    console.error('chrome.action not found!');
}

// Message Handler for 'get-keepkey-state'
// const handler: PlasmoMessaging.MessageHandler<RequestBody, RequestResponse> = async (req, res) => {
//     let tag = TAG + " | handler | ";
//     try {
//         console.log("Listen to message!")
//         // const { input } = req.body;
//         // await checkKeepKey();
//         // console.log(tag, 'input:', input);
//         //
//         // console.log('APP:', APP);
//         //
//         // if (APP) {
//         //     const pubkeysEth = APP.pubkeys.filter((e: any) =>
//         //         e.networks.includes(ChainToNetworkId['ethereum'])
//         //     );
//         //     console.log(tag, 'pubkeysEth:', pubkeysEth);
//         //     const address = pubkeysEth[0]?.address;
//         //     if (address) {
//         //         console.log(tag, 'Ethereum address:', address);
//         //         KEEPKEY_STATE = 5;
//         //     } else {
//         //         KEEPKEY_STATE = 2;
//         //     }
//         //
//         //     res.send({ state: KEEPKEY_STATE });
//         // } else {
//         //     res.send({ state: 4 });
//         // }
//     } catch (e) {
//         console.error('Error:', e);
//         res.send({ state: 4 });
//     }
// };
// PlasmoMessaging.listen('get-keepkey-state', handler);

async function checkKeepKey() {
    try {
        console.log("checkKeepKey: ")
        const response = await axios.get('http://localhost:1646/docs');

        if (response.status === 200) {
            KEEPKEY_STATE = 2; // Set state to connected
            console.log('KEEPKEY_STATE: ',KEEPKEY_STATE)
            if (KEEPKEY_STATE < 2) {
                KEEPKEY_STATE = 2; // Set state to connected
            }
        }
    } catch (error) {
        console.error('KeepKey endpoint not found:', error);
        KEEPKEY_STATE = 4; // Set state to errored
    }
}

// chrome.runtime.onConnect.addListener((port) => {
//     console.log("Port connected:", port.name);
//
//     // Handle messages coming through the port
//     port.onMessage.addListener(async (message) => {
//         console.log("Port message:", message);
//         console.log("Port message:", message.body);
//         console.log("Port message:", message.body.name);
//         switch (message.body.name) {
//             case 'WALLET_REQUEST': {
//                 if (!APP) throw Error('APP not initialized');
//                 const { requestInfo } = message;
//                 const { method, params, chain } = requestInfo;
//
//                 if (method) {
//                     try {
//                         const result = await handleWalletRequest(requestInfo, chain, method, params, APP, ADDRESS);
//                         port.postMessage({ result });
//                     } catch (error) {
//                         port.postMessage({ error: error.message });
//                     }
//                 } else {
//                     port.postMessage({ error: 'Invalid request: missing method' });
//                 }
//                 break;
//             }
//             //OPEN_SIDEBAR
//             case 'open_sidebar':
//             case 'OPEN_SIDEBAR': {
//                 console.log(tag, 'Opening sidebar ** ');
//                 // Query all tabs across all windows
//                 chrome.tabs.query({}, tabs => {
//                     if (chrome.runtime.lastError) {
//                         console.error('Error querying tabs:', chrome.runtime.lastError);
//                         return;
//                     }
//
//                     // Filter out extension pages and internal Chrome pages
//                     const webPageTabs = tabs.filter(tab => {
//                         return (
//                             tab.url &&
//                             !tab.url.startsWith('chrome://') &&
//                             !tab.url.startsWith('chrome-extension://') &&
//                             !tab.url.startsWith('about:')
//                         );
//                     });
//
//                     if (webPageTabs.length > 0) {
//                         // Sort tabs by last accessed time to find the most recently active tab
//                         webPageTabs.sort((a, b) => b.lastAccessed - a.lastAccessed);
//                         const tab = webPageTabs[0];
//                         const windowId = tab.windowId;
//
//                         console.log(tag, 'Opening sidebar in tab:', tab);
//
//                         chrome.sidePanel.open({ windowId }, () => {
//                             if (chrome.runtime.lastError) {
//                                 console.error('Error opening side panel:', chrome.runtime.lastError);
//                             } else {
//                                 console.log('Side panel opened successfully.');
//                             }
//                         });
//                     } else {
//                         console.error('No suitable web page tabs found to open the side panel.');
//                     }
//                 });
//                 break;
//             }
//             case "get-keepkey-state" :
//             case 'GET_KEEPKEY_STATE': {
//                 port.postMessage({ state: KEEPKEY_STATE });
//                 break;
//             }
//
//             case 'UPDATE_EVENT_BY_ID': {
//                 const { id, updatedEvent } = message.payload;
//
//                 // Update the event in storage
//                 const success = await requestStorage.updateEventById(id, updatedEvent);
//
//                 if (success) {
//                     console.log(`Event with id ${id} has been updated successfully.`);
//                 } else {
//                     console.error(`Failed to update event with id ${id}.`);
//                 }
//
//                 break;
//             }
//
//             case 'ON_START': {
//                 onStart();
//                 setTimeout(() => {
//                     port.postMessage({ state: KEEPKEY_STATE });
//                 }, 15000);
//                 break;
//             }
//
//             case 'RESET_APP': {
//                 console.log(tag, 'Resetting app...');
//                 chrome.runtime.reload();
//                 port.postMessage({ result: true });
//                 break;
//             }
//
//             case 'GET_APP': {
//                 port.postMessage({ app: APP });
//                 break;
//             }
//
//             case 'GET_ASSET_CONTEXT': {
//                 if (APP) {
//                     port.postMessage({ assets: APP.assetContext });
//                 } else {
//                     port.postMessage({ error: 'APP not initialized' });
//                 }
//                 break;
//             }
//
//             case 'GET_TX_INSIGHT': {
//                 if (APP) {
//                     //get chainid
//                     const assetContext = APP.assetContext;
//                     if (!assetContext) throw new Error('Invalid asset context. Missing assetContext.');
//                     const { tx, source } = message;
//                     tx.chainId = assetContext.networkId.replace('eip155:', '');
//                     console.log(tag, 'chainId: ', tx.chainId);
//                     console.log(tag, 'GET_TX_INSIGHT', tx, source);
//                     if (!tx) throw new Error('Invalid request: missing tx');
//                     if (!source) throw new Error('Invalid request: missing source');
//
//                     //result
//                     const result = await APP.pioneer.Insight({ tx, source });
//                     console.log(tag, 'GET_TX_INSIGHT', result);
//                     port.postMessage(result.data);
//                 } else {
//                     port.postMessage({ error: 'APP not initialized' });
//                 }
//                 break;
//             }
//
//             case 'GET_GAS_ESTIMATE': {
//                 if (APP) {
//                     const providerInfo = await web3ProviderStorage.getWeb3Provider();
//                     if (!providerInfo) throw Error('Failed to get provider info');
//                     console.log('providerInfo', providerInfo);
//                     const provider = new JsonRpcProvider(providerInfo.providerUrl);
//                     const feeData = await provider.getFeeData();
//                     port.postMessage(feeData);
//                 } else {
//                     port.postMessage({ error: 'APP not initialized' });
//                 }
//                 break;
//             }
//
//             case 'GET_MAX_SPENDABLE': {
//                 if (APP) {
//                     console.log(tag, 'GET_MAX_SPENDABLE');
//                     const assetContext = APP.assetContext;
//                     if (!assetContext) throw new Error('Invalid asset context. Missing assetContext.');
//
//                     let pubkeys = await APP.pubkeys;
//                     pubkeys = pubkeys.filter((pubkey: any) => pubkey.networks.includes(assetContext.networkId));
//                     console.log('onStart Transfer pubkeys', pubkeys);
//
//                     if (!assetContext.caip) throw new Error('Invalid asset context. Missing caip.');
//
//                     const estimatePayload: any = {
//                         feeRate: 10,
//                         caip: assetContext.caip,
//                         pubkeys,
//                         memo: '',
//                         recipient: '',
//                     };
//
//                     const maxSpendableAmount = await APP.swapKit.estimateMaxSendableAmount({
//                         chain: assetContext.chain,
//                         params: estimatePayload,
//                     });
//
//                     console.log('maxSpendableAmount', maxSpendableAmount);
//                     console.log('maxSpendableAmount string value', maxSpendableAmount.getValue('string'));
//
//                     port.postMessage({ maxSpendable: maxSpendableAmount.getValue('string') });
//                 } else {
//                     port.postMessage({ error: 'APP not initialized' });
//                 }
//                 break;
//             }
//
//             case 'SET_ASSET_CONTEXT': {
//                 if (APP) {
//                     const { asset } = message;
//                     if (asset && asset.caip) {
//                         try {
//                             const response = await APP.setAssetContext(asset);
//                             console.log('Asset context set:', response);
//                             chrome.runtime.sendMessage({
//                                 type: 'ASSET_CONTEXT_UPDATED',
//                                 assetContext: response, // Notify frontend about the change
//                             });
//                             port.postMessage(response);
//
//                             const currentAssetContext = await APP.assetContext;
//                             //if eip155 then set web3 provider
//                             if (currentAssetContext.networkId.includes('eip155')) {
//                                 const newProvider = EIP155_CHAINS[currentAssetContext.networkId].provider;
//                                 console.log('newProvider', newProvider);
//                                 await web3ProviderStorage.setWeb3Provider(newProvider);
//                             }
//                         } catch (error) {
//                             console.error('Error setting asset context:', error);
//                             port.postMessage({ error: 'Failed to fetch assets' });
//                         }
//                     }
//                 } else {
//                     port.postMessage({ error: 'APP not initialized' });
//                 }
//                 break;
//             }
//
//             case 'GET_DAPPS_BY_NETWORKID': {
//                 if (APP) {
//                     try {
//                         //Assumed EVM*
//                         const { networkId } = message;
//
//                         const dappsResponse = await APP.pioneer.SearchDappsByNetworkId({ networkId });
//                         console.log('dappsResponse:', dappsResponse.data);
//
//                         port.postMessage(dappsResponse.data);
//                     } catch (error) {
//                         console.error('Error fetching assets:', error);
//                         port.postMessage({ error: 'Failed to fetch assets' });
//                     }
//                 } else {
//                     port.postMessage({ error: 'APP not initialized' });
//                 }
//                 break;
//             }
//
//             case 'DISCOVERY_DAPP': {
//                 if (APP) {
//                     try {
//                         //Assumed EVM*
//                         const { networkId, url, name, description } = message;
//                         const body = {
//                             networks: [networkId],
//                             url,
//                             name,
//                             description,
//                         };
//                         const dappsResponse = await APP.pioneer.DiscoverDapp(body);
//                         console.log('dappsResponse:', dappsResponse.data);
//
//                         port.postMessage(dappsResponse.data);
//                     } catch (error) {
//                         console.error('Error fetching assets:', error);
//                         port.postMessage({ error: 'Failed to fetch assets' });
//                     }
//                 } else {
//                     port.postMessage({ error: 'APP not initialized' });
//                 }
//                 break;
//             }
//
//             case 'GET_ASSET_BALANCE': {
//                 if (APP) {
//                     try {
//                         console.log(tag, 'GET_ASSET_BALANCE');
//                         //Assumed EVM*
//                         const { networkId } = message;
//                         const chainId = networkId.replace('eip155:', '');
//                         console.log('chainId:', chainId);
//                         const nodeInfoResponse = await APP.pioneer.SearchNodesByNetworkId({ chainId });
//                         console.log('nodeInfoResponse:', nodeInfoResponse.data);
//
//                         //TODO
//                         //test all services
//                         //give ping
//                         //remmove broken services
//                         //TODO push broken to api
//
//                         const service = nodeInfoResponse?.data[0]?.service;
//                         if (service) {
//                             console.log(tag, 'service:', service);
//                             if (!ADDRESS) throw new Error('ADDRESS not set');
//                             const provider = new JsonRpcProvider(nodeInfoResponse.data[0].service);
//                             const params = [ADDRESS, 'latest'];
//                             //get balance
//                             const balance = await provider.getBalance(params[0], params[1]);
//                             console.log('balance:', balance);
//                             port.postMessage('0x' + balance.toString(16));
//                         } else {
//                             port.postMessage('0');
//                         }
//                     } catch (error) {
//                         console.error('Error fetching assets:', error);
//                         port.postMessage({ error: 'Failed to fetch balances' });
//                     }
//                 } else {
//                     port.postMessage({ error: 'APP not initialized' });
//                 }
//                 break;
//             }
//
//             case 'GET_ASSETS_INFO': {
//                 if (APP) {
//                     try {
//                         //Assumed EVM*
//                         const { networkId } = message;
//                         const chainId = networkId.replace('eip155:', '');
//                         console.log('chainId:', chainId);
//                         const nodeInfoResponse = await APP.pioneer.SearchNodesByNetworkId({ chainId });
//                         console.log('nodeInfoResponse:', nodeInfoResponse.data);
//                         const caip = networkId + '/slip44:60';
//                         console.log('caip:', caip);
//                         const marketInfoResponse = await APP.pioneer.MarketInfo({ caip });
//                         console.log('marketInfoResponse:', marketInfoResponse.data);
//
//                         console.log('nodeInfoResponse fetched:', nodeInfoResponse);
//                         port.postMessage(nodeInfoResponse);
//                     } catch (error) {
//                         console.error('Error fetching assets:', error);
//                         port.postMessage({ error: 'Failed to fetch assets' });
//                     }
//                 } else {
//                     port.postMessage({ error: 'APP not initialized' });
//                 }
//                 break;
//             }
//
//             case 'GET_ASSETS': {
//                 if (APP) {
//                     try {
//                         const assets = await APP.getAssets();
//                         console.log('Assets fetched:', assets);
//                         port.postMessage({ assets });
//                     } catch (error) {
//                         console.error('Error fetching assets:', error);
//                         port.postMessage({ error: 'Failed to fetch assets' });
//                     }
//                 } else {
//                     port.postMessage({ error: 'APP not initialized' });
//                 }
//                 break;
//             }
//
//             case 'GET_APP_PUBKEYS': {
//                 if (APP) {
//                     port.postMessage({ balances: APP.pubkeys });
//                 } else {
//                     port.postMessage({ error: 'APP not initialized' });
//                 }
//                 break;
//             }
//
//             case 'GET_APP_BALANCES': {
//                 if (APP) {
//                     port.postMessage({ balances: APP.balances });
//                 } else {
//                     port.postMessage({ error: 'APP not initialized' });
//                 }
//                 break;
//             }
//
//             default:
//                 port.postMessage({ error: 'Unknown message type' });
//         }
//
//         // if (message.type === "WALLET_REQUEST") {
//         //     // const instance = await initializeKeepKey();
//         //     // port.postMessage({ status: "initialized", data: instance.getData() });
//         // }
//         //
//         // if (message.type === "get-keepkey-state") {
//         //     await checkKeepKey()
//         //     console.log(tag,'input: ', input);
//         //     // let APP = await getApp();
//         //     console.log('APP: ',APP)
//         //
//         //     if (APP) {
//         //
//         //         //
//         //         const pubkeysEth = APP.pubkeys.filter((e: any) => e.networks.includes(ChainToNetworkId[Chain.Ethereum]));
//         //         console.log(tag, 'pubkeysEth: ', pubkeysEth);
//         //         const address = pubkeysEth[0].address;
//         //         if (address) {
//         //             console.log(tag, 'Ethereum address:', address);
//         //             KEEPKEY_STATE = 5;
//         //         } else {
//         //             KEEPKEY_STATE = 2;
//         //         }
//         //
//         //         // Access the state or any other property/method from the app
//         //         // const state = app.getState();
//         //         //@ts-ignore
//         //         res.send({ state: KEEPKEY_STATE });
//         //     } else {
//         //         console.error()
//         //         //@ts-ignore
//         //         res.send({ state: 4 });
//         //     }
//         //
//         //     port.postMessage({ status: "success", data });
//         // }
//     });
// });

