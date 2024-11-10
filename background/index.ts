
import { startHub } from "@plasmohq/messaging/pub-sub"
import { requestStorage, exampleSidebarStorage, web3ProviderStorage } from '@extension/storage'; // Re-import the storage
import { onStart } from './state';

const TAG = ' | background/index.ts | ';
const tag = TAG + " | ";

// Start the initialization after a delay
setTimeout(() => {
    onStart();
}, 5000);

//start pub/sub
console.log(`KeepKey - Starting Hub`)
startHub()

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
