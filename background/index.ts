// import { EIP155_CHAINS } from './chains';
// import { handleWalletRequest } from './methods';
// import { onStartKeepkey } from './keepkey';
// import { JsonRpcProvider } from 'ethers';
import { requestStorage, exampleSidebarStorage, web3ProviderStorage } from '@extension/storage'; // Re-import the storage
const tag = 'background/index.ts';


//
// background/index.ts
// import { relay } from "@plasmohq/messaging";
//
// // Mock Ethereum address for example
// const ETHEREUM_ADDRESS = "0x141D9959cAe3853b035000490C03991eB70Fc4aC";
//
// // Relay handler to respond with the Ethereum address
// relay(
//     { name: "get-ethereum-address" },
//     async () => {
//         return { address: ETHEREUM_ADDRESS };
//     }
// );

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
                tab.url &&
                !tab.url.startsWith('chrome://') &&
                !tab.url.startsWith('chrome-extension://') &&
                !tab.url.startsWith('about:')
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
