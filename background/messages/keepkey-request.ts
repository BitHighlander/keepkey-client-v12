import type { PlasmoMessaging } from "@plasmohq/messaging"
import axios from 'axios';
import { onStartKeepkey } from '../keepkey';
import { ChainToNetworkId } from '@pioneer-platform/pioneer-caip';
import { Chain } from '@coinmasters/types';
import { requestStorage, web3ProviderStorage, assetContextStorage } from '@extension/storage';
import { EIP155_CHAINS } from '../chains';
const TAG = ' | keepkey-request | '
let APP = null
let KEEPKEY_STATE = 0
let ADDRESS = null

let onStart = async function(){
    let tag = TAG + ' | onStart | ';
    try{
        console.log(tag, 'Starting Keepkey');
        //
        APP = await onStartKeepkey()
        // await APP.getAssets();
        await APP.getPubkeys();
        await APP.getBalances();
        // await APP.getCharts();

        const pubkeysEth = APP.pubkeys.filter((e: any) => e.networks.includes(ChainToNetworkId[Chain.Ethereum]));
        if (pubkeysEth.length > 0) {
            console.log(tag, 'pubkeys:', pubkeysEth);
            const address = pubkeysEth[0].address || pubkeysEth[0].master;
            if (address) {
                console.log(tag, 'Ethereum address:', address);
                ADDRESS = address;
                KEEPKEY_STATE = 5;
                // updateIcon();
                // pushStateChangeEvent();
                console.log(tag,'KEEPKEY_STATE: ',KEEPKEY_STATE)
            }

            // const defaultProvider: any = {
            //     chainId: '0x1',
            //     caip: 'eip155:1/slip44:60',
            //     blockExplorerUrls: ['https://etherscan.io'],
            //     name: 'Ethereum',
            //     providerUrl: 'https://eth.llamarpc.com',
            //     fallbacks: [],
            // };
            // //get current provider
            // const currentProvider = await web3ProviderStorage.getWeb3Provider();
            // if (!currentProvider) {
            //     console.log(tag, 'No provider set, setting default provider');
            //     await web3ProviderStorage.saveWeb3Provider(defaultProvider);
            // }
            //if not set, set it to eth mainnet
        } else {
            console.error(tag, 'FAILED TO INIT, No Ethereum address found');
            //TODO retry?
            // setTimeout(() => {
            //   onStart();
            // }, 5000);
        }
    }catch(e){
        console.error(e)
    }
}
onStart()

const HIDDEN_NUMBER = 541

export type RequestBody = {
    input: number
}

export type RequestResponse = number

async function checkKeepKey() {
    try {
        const response = await axios.get('http://localhost:1646/docs');
        if (response.status === 200) {
            // updateIcon();
            if (KEEPKEY_STATE < 2) {
                KEEPKEY_STATE = 2; // Set state to connected
                // pushStateChangeEvent();
            }
        }
    } catch (error) {
        console.error('KeepKey endpoint not found:', error);
        KEEPKEY_STATE = 4; // Set state to errored
        // updateIcon();
        // pushStateChangeEvent();
    }
}
// Call checkKeepKey every 5 seconds
setInterval(checkKeepKey, 5000);

const handler: PlasmoMessaging.MessageHandler<RequestBody, RequestResponse> = async (req, res) => {
    const tag = TAG+" | handler | ";
    try {
        const { type, message } = req.body;
        console.log(`${TAG} - message:`, message);
        console.log(`${TAG} - type:`, type);

        switch (type) {
            case 'WALLET_REQUEST': {
                if (!APP) throw Error('APP not initialized');
                const { requestInfo } = message;
                const { method, params, chain } = requestInfo;

                if (method) {
                    try {
                        const result = await handleWalletRequest(requestInfo, chain, method, params, APP, ADDRESS);
                        res.send({ result });
                    } catch (error) {
                        res.send({ error: error.message });
                    }
                } else {
                    res.send({ error: 'Invalid request: missing method' });
                }
                break;
            }
            //OPEN_SIDEBAR
            case 'open_sidebar':
            case 'OPEN_SIDEBAR': {
                console.log(tag, 'Opening sidebar ** ');
                // Query all tabs across all windows
                chrome.tabs.query({}, tabs => {
                    if (chrome.runtime.lastError) {
                        console.error('Error querying tabs:', chrome.runtime.lastError);
                        return;
                    }

                    // Filter out extension pages and internal Chrome pages
                    const webPageTabs = tabs.filter(tab => {
                        return (
                            tab.url
                            // !tab.url.startsWith('chrome://') &&
                            // !tab.url.startsWith('chrome-extension://') &&
                            // !tab.url.startsWith('about:')
                        );
                    });

                    if (webPageTabs.length > 0) {
                        // Sort tabs by last accessed time to find the most recently active tab
                        webPageTabs.sort((a, b) => b.lastAccessed - a.lastAccessed);
                        const tab = webPageTabs[0];
                        const windowId = tab.windowId;

                        console.log(tag, 'Opening sidebar in tab:', tab);

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
                break;
            }

            case 'GET_KEEPKEY_STATE': {
                console.log("GET_KEEPKEY_STATE: ",KEEPKEY_STATE)
                res.send({ state: KEEPKEY_STATE });
                break;
            }

            case 'UPDATE_EVENT_BY_ID': {
                const { id, updatedEvent } = message.payload;

                // Update the event in storage
                const success = await requestStorage.updateEventById(id, updatedEvent);

                if (success) {
                    console.log(`Event with id ${id} has been updated successfully.`);
                } else {
                    console.error(`Failed to update event with id ${id}.`);
                }

                break;
            }

            case 'ON_START': {
                onStart();
                setTimeout(() => {
                    res.send({ state: KEEPKEY_STATE });
                }, 15000);
                break;
            }

            case 'RESET_APP': {
                console.log(tag, 'Resetting app...');
                chrome.runtime.reload();
                res.send({ result: true });
                break;
            }

            case 'GET_APP': {
                res.send({ app: APP });
                break;
            }

            case 'GET_ASSET_CONTEXT': {
                if (APP) {
                    res.send({ assets: APP.assetContext });
                } else {
                    res.send({ error: 'APP not initialized' });
                }
                break;
            }

            case 'GET_TX_INSIGHT': {
                if (APP) {
                    //get chainid
                    const assetContext = APP.assetContext;
                    if (!assetContext) throw new Error('Invalid asset context. Missing assetContext.');
                    const { tx, source } = message;
                    tx.chainId = assetContext.networkId.replace('eip155:', '');
                    console.log(tag, 'chainId: ', tx.chainId);
                    console.log(tag, 'GET_TX_INSIGHT', tx, source);
                    if (!tx) throw new Error('Invalid request: missing tx');
                    if (!source) throw new Error('Invalid request: missing source');

                    //result
                    const result = await APP.pioneer.Insight({ tx, source });
                    console.log(tag, 'GET_TX_INSIGHT', result);
                    res.send(result.data);
                } else {
                    res.send({ error: 'APP not initialized' });
                }
                break;
            }

            case 'GET_GAS_ESTIMATE': {
                if (APP) {
                    const providerInfo = await web3ProviderStorage.getWeb3Provider();
                    if (!providerInfo) throw Error('Failed to get provider info');
                    console.log('providerInfo', providerInfo);
                    const provider = new JsonRpcProvider(providerInfo.providerUrl);
                    const feeData = await provider.getFeeData();
                    res.send(feeData);
                } else {
                    res.send({ error: 'APP not initialized' });
                }
                break;
            }

            case 'GET_MAX_SPENDABLE': {
                if (APP) {
                    console.log(tag, 'GET_MAX_SPENDABLE');
                    const assetContext = APP.assetContext;
                    if (!assetContext) throw new Error('Invalid asset context. Missing assetContext.');

                    let pubkeys = await APP.pubkeys;
                    pubkeys = pubkeys.filter((pubkey: any) => pubkey.networks.includes(assetContext.networkId));
                    console.log('onStart Transfer pubkeys', pubkeys);

                    if (!assetContext.caip) throw new Error('Invalid asset context. Missing caip.');

                    const estimatePayload: any = {
                        feeRate: 10,
                        caip: assetContext.caip,
                        pubkeys,
                        memo: '',
                        recipient: '',
                    };

                    const maxSpendableAmount = await APP.swapKit.estimateMaxSendableAmount({
                        chain: assetContext.chain,
                        params: estimatePayload,
                    });

                    console.log('maxSpendableAmount', maxSpendableAmount);
                    console.log('maxSpendableAmount string value', maxSpendableAmount.getValue('string'));

                    res.send({ maxSpendable: maxSpendableAmount.getValue('string') });
                } else {
                    res.send({ error: 'APP not initialized' });
                }
                break;
            }

            case 'SET_ASSET_CONTEXT': {
                if (APP) {
                    const { asset } = message;
                    if (asset && asset.caip) {
                        try {
                            const response = await APP.setAssetContext(asset);
                            console.log('Asset context set:', response);
                            chrome.runtime.sendMessage({
                                type: 'ASSET_CONTEXT_UPDATED',
                                assetContext: response, // Notify frontend about the change
                            });
                            res.send(response);

                            const currentAssetContext = await APP.assetContext;
                            //if eip155 then set web3 provider
                            if (currentAssetContext.networkId.includes('eip155')) {
                                const newProvider = EIP155_CHAINS[currentAssetContext.networkId].provider;
                                console.log('newProvider', newProvider);
                                await web3ProviderStorage.saveWeb3Provider(newProvider);
                            }
                        } catch (error) {
                            console.error('Error setting asset context:', error);
                            res.send({ error: 'Failed to fetch assets' });
                        }
                    }
                } else {
                    res.send({ error: 'APP not initialized' });
                }
                break;
            }

            case 'GET_DAPPS_BY_NETWORKID': {
                if (APP) {
                    try {
                        //Assumed EVM*
                        const { networkId } = message;

                        const dappsResponse = await APP.pioneer.SearchDappsByNetworkId({ networkId });
                        console.log('dappsResponse:', dappsResponse.data);

                        res.send(dappsResponse.data);
                    } catch (error) {
                        console.error('Error fetching assets:', error);
                        res.send({ error: 'Failed to fetch assets' });
                    }
                } else {
                    res.send({ error: 'APP not initialized' });
                }
                break;
            }

            case 'DISCOVERY_DAPP': {
                if (APP) {
                    try {
                        //Assumed EVM*
                        const { networkId, url, name, description } = message;
                        const body = {
                            networks: [networkId],
                            url,
                            name,
                            description,
                        };
                        const dappsResponse = await APP.pioneer.DiscoverDapp(body);
                        console.log('dappsResponse:', dappsResponse.data);

                        res.send(dappsResponse.data);
                    } catch (error) {
                        console.error('Error fetching assets:', error);
                        res.send({ error: 'Failed to fetch assets' });
                    }
                } else {
                    res.send({ error: 'APP not initialized' });
                }
                break;
            }

            case 'GET_ASSET_BALANCE': {
                if (APP) {
                    try {
                        console.log(tag, 'GET_ASSET_BALANCE');
                        //Assumed EVM*
                        const { networkId } = message;
                        const chainId = networkId.replace('eip155:', '');
                        console.log('chainId:', chainId);
                        const nodeInfoResponse = await APP.pioneer.SearchNodesByNetworkId({ chainId });
                        console.log('nodeInfoResponse:', nodeInfoResponse.data);

                        //TODO
                        //test all services
                        //give ping
                        //remmove broken services
                        //TODO push broken to api

                        const service = nodeInfoResponse?.data[0]?.service;
                        if (service) {
                            console.log(tag, 'service:', service);
                            if (!ADDRESS) throw new Error('ADDRESS not set');
                            const provider = new JsonRpcProvider(nodeInfoResponse.data[0].service);
                            const params = [ADDRESS, 'latest'];
                            //get balance
                            const balance = await provider.getBalance(params[0], params[1]);
                            console.log('balance:', balance);
                            res.send('0x' + balance.toString(16));
                        } else {
                            res.send('0');
                        }
                    } catch (error) {
                        console.error('Error fetching assets:', error);
                        res.send({ error: 'Failed to fetch balances' });
                    }
                } else {
                    res.send({ error: 'APP not initialized' });
                }
                break;
            }

            case 'GET_ASSETS_INFO': {
                if (APP) {
                    try {
                        //Assumed EVM*
                        const { networkId } = message;
                        const chainId = networkId.replace('eip155:', '');
                        console.log('chainId:', chainId);
                        const nodeInfoResponse = await APP.pioneer.SearchNodesByNetworkId({ chainId });
                        console.log('nodeInfoResponse:', nodeInfoResponse.data);
                        const caip = networkId + '/slip44:60';
                        console.log('caip:', caip);
                        const marketInfoResponse = await APP.pioneer.MarketInfo({ caip });
                        console.log('marketInfoResponse:', marketInfoResponse.data);

                        console.log('nodeInfoResponse fetched:', nodeInfoResponse);
                        res.send(nodeInfoResponse);
                    } catch (error) {
                        console.error('Error fetching assets:', error);
                        res.send({ error: 'Failed to fetch assets' });
                    }
                } else {
                    res.send({ error: 'APP not initialized' });
                }
                break;
            }

            case 'GET_ASSETS': {
                if (APP) {
                    try {
                        let assets = await APP.assetsMap;
                        const arrayOfObjects = Array.from(assets, ([key, value]) => ({ key, value }));
                        console.log('arrayOfObjects:', arrayOfObjects);
                        res.send({ assets:arrayOfObjects });
                    } catch (error) {
                        console.error('Error fetching assets:', error);
                        res.send({ error: 'Failed to fetch assets' });
                    }
                } else {
                    res.send({ error: 'APP not initialized' });
                }
                break;
            }

            case 'GET_APP_PUBKEYS': {
                if (APP) {
                    res.send({ balances: APP.pubkeys });
                } else {
                    res.send({ error: 'APP not initialized' });
                }
                break;
            }

            case 'GET_APP_BALANCES': {
                if (APP) {
                    console.log(tag,' APP.balances: ', APP.balances)
                    res.send({ balances: APP.balances });
                } else {
                    res.send({ error: 'APP not initialized' });
                }
                break;
            }

            default:
                res.send({ error: 'Unknown message type' });
        }

        // //switch on event type
        // console.log('APP: ', APP)
        // //@ts-ignore
        // res.send({ state: KEEPKEY_STATE });
    } catch (error) {
        console.error(`${TAG} - Error:`, error);
        res.send({ error: "An error occurred while processing the request." });
    }
};

export default handler;
