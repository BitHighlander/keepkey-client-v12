// background/state.ts

import { Chain } from '@coinmasters/types';
import { ChainToNetworkId } from '@pioneer-platform/pioneer-caip';
import { web3ProviderStorage } from '@extension/storage';
import { onStartKeepkey } from './keepkey';

const TAG = ' | background/state.ts | ';
const tag = TAG + ' | ';

export let KEEPKEY_STATE = 0; // Exported variable
export let ADDRESS = '';
export let APP: any = null;

// Function to update the browser action icon (optional)
export function updateIcon() {
    // Implement icon update logic if needed
    // Example:
    let iconPath = './icon-128.png';
    if (KEEPKEY_STATE === 5) iconPath = './icon-128-online.png';

    chrome.action.setIcon({ path: iconPath }, () => {
        if (chrome.runtime.lastError) {
            console.error('Error setting icon:', chrome.runtime.lastError);
        }
    });
}

// Function to push state change events (if using chrome.runtime messaging)
export function pushStateChangeEvent() {
    chrome.runtime.sendMessage({
        type: 'KEEPKEY_STATE_CHANGED',
        state: KEEPKEY_STATE,
    });
}

// Initialization function
export const onStart = async function () {
    const tag = TAG + ' | onStart | ';
    try {
        console.log(tag, 'Starting...');
        APP = await onStartKeepkey();
        console.log(tag, 'APP:', APP);
        if (!APP) throw Error('Failed to INIT!');

        await APP.getPubkeys();
        await APP.getBalances();

        const pubkeysEth = APP.pubkeys.filter((e: any) =>
            e.networks.includes(ChainToNetworkId[Chain.Ethereum])
        );

        if (pubkeysEth.length > 0) {
            const address = pubkeysEth[0].address;
            if (address) {
                console.log(tag, 'Ethereum address:', address);
                ADDRESS = address;
                KEEPKEY_STATE = 5; // Paired
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

            // Get current provider
            const currentProvider = await web3ProviderStorage.getWeb3Provider();
            if (!currentProvider) {
                console.log(tag, 'No provider set, setting default provider');
                await web3ProviderStorage.saveWeb3Provider(defaultProvider);
            }
        } else {
            console.error(tag, 'FAILED TO INIT, No Ethereum address found');
            // Optionally retry
        }
    } catch (e) {
        KEEPKEY_STATE = 4; // Errored
        updateIcon();
        pushStateChangeEvent();
        console.error(tag, 'Error:', e);
    }
};
