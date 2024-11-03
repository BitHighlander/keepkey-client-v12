let tag = 'background/index.ts';
// chrome.runtime.onInstalled.addListener(() => {
//     // chrome.contextMenus.create({
//     //     id: 'open-sidebar',
//     //     title: 'Open Sidebar',
//     //     contexts: ['all'],
//     // });
// });

console.log('chrome: ',chrome)
// console.log('chrome: ',chrome.runtime)
console.log('chrome: ',chrome.contextMenus)

// chrome.contextMenus.onClicked.addListener((info, tab) => {
//     console.log('onClicked')
//     if (info.menuItemId === 'open-sidebar' && tab.id) {
//         chrome.sidePanel.open({ tabId: tab.id });
//         chrome.sidePanel.setOptions({
//             tabId: tab.id,
//             path: 'sidepanel.html',
//             enabled: true,
//         });
//     }
// });



if(chrome.action){
    chrome.action.onClicked.addListener((tab: any) => {
        console.log(tag, 'Action clicked:', tab);
        // chrome.tabs.query({active: true, currentWindow: true}, ([tab]) => {
        //     chrome.sidePanel.open({tabId: tab.id}, () => {
        //         if (chrome.runtime.lastError) {
        //             console.error('Error opening side panel:', chrome.runtime.lastError);
        //         }
        //     });
        // });


        chrome.tabs.query({}, tabs => {
            if (chrome.runtime.lastError) {
                console.error('Error querying tabs:', chrome.runtime.lastError);
                return;
            }

            // Filter out extension pages and internal Chrome pages
            const webPageTabs = tabs.filter(tab => {
                return (
                    tab.url &&
                    !tab.url.startsWith('chrome://') &&
                    !tab.url.startsWith('chrome-extension://') &&
                    !tab.url.startsWith('about:')
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

    })
} else {
    console.error('chrome.action not found!!');
}

