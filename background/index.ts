import { EIP155_CHAINS } from './chains';
import { handleWalletRequest } from './methods';
import { onStartKeepkey } from './keepkey';
import { JsonRpcProvider } from 'ethers';
import { Chain } from '@coinmasters/types';

import { ChainToNetworkId } from '@pioneer-platform/pioneer-caip';
import { requestStorage, exampleSidebarStorage, web3ProviderStorage } from '@extension/storage'; // Re-import the storage
const TAG = ' | background/index.ts | ';
const tag = TAG + " | ";
let KEEPKEY_STATE = 0;
let ADDRESS = '';
let APP: any = null;

function updateIcon() {
    // let iconPath = './icon-128.png';
    // if (KEEPKEY_STATE === 2) iconPath = './icon-128-online.png';
    //
    // chrome.action.setIcon({ path: iconPath }, () => {
    //     if (chrome.runtime.lastError) {
    //         console.error('Error setting icon:', chrome.runtime.lastError);
    //     }
    // });
}

function pushStateChangeEvent() {
    chrome.runtime.sendMessage({
        type: 'KEEPKEY_STATE_CHANGED',
        state: KEEPKEY_STATE,
    });
}

const onStart = async function () {
    const tag = TAG + ' | onStart | ';
    try {
        console.log(tag, 'Starting...');
        APP = await onStartKeepkey();
        console.log(tag, 'APP:', APP);
        if (!APP) throw Error('Failed to INIT!');

        await APP.getPubkeys();
        await APP.getBalances();
        const pubkeysEth = APP.pubkeys.filter((e: any) => e.networks.includes(ChainToNetworkId[Chain.Ethereum]));
        if (pubkeysEth.length > 0) {
            console.log(tag, 'pubkeys:', pubkeysEth);
            const address = pubkeysEth[0].address;
            if (address) {
                console.log(tag, 'Ethereum address:', address);
                ADDRESS = address;
                KEEPKEY_STATE = 5;
                updateIcon();
                pushStateChangeEvent();
            }

            const defaultProvider: any = {
                chainId: '0x1',
                caip: 'eip155:1/slip44:60',
                blockExplorerUrls: ['https://etherscan.io'],
                name: 'Ethereum',
                providerUrl: 'https://eth.llamarpc.com',
                fallbacks: [],
            };
            //get current provider
            const currentProvider = await web3ProviderStorage.getWeb3Provider();
            if (!currentProvider) {
                console.log(tag, 'No provider set, setting default provider');
                await web3ProviderStorage.saveWeb3Provider(defaultProvider);
            }
            //if not set, set it to eth mainnet
        } else {
            console.error(tag, 'FAILED TO INIT, No Ethereum address found');
            //TODO retry?
            // setTimeout(() => {
            //   onStart();
            // }, 5000);
        }
    } catch (e) {
        KEEPKEY_STATE = 4; // errored
        updateIcon();
        pushStateChangeEvent();
        console.error(tag, 'Error:', e);
    }
};

setTimeout(() => {
    onStart();
}, 5000);

console.log('requestStorage: ',requestStorage)
console.log('chrome:', chrome);
console.log('chrome.contextMenus:', chrome.contextMenus);

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
