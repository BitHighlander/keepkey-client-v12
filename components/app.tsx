/*
     App
 */
import { sendToBackgroundViaRelay } from "@plasmohq/messaging"
import React, { useState, useEffect } from 'react';
import {
    useDisclosure,
    Flex,
    Text,
    Box,
    IconButton,
    Spinner,
    Button,
} from '@chakra-ui/react';

import {
    DialogBody,
    DialogBackdrop,
    DialogCloseTrigger,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogRoot,
    DialogTitle,
    DialogTrigger,
} from "./ui/dialog"
import { FaChevronLeft, FaRedo, FaCog, FaCalendarAlt } from 'react-icons/fa';
import { sendToBackground, sendToContentScript } from "@plasmohq/messaging"
import Connect from './keepkey/Connect';
import Loading from './keepkey/Loading';
import Balances from './keepkey/Balances';
import Asset from './keepkey/Asset';
import History from './keepkey/History';
import Settings from './keepkey/Settings';

const stateNames: { [key: number]: string } = {
    0: 'unknown',
    1: 'disconnected',
    2: 'connected',
    3: 'busy',
    4: 'errored',
    5: 'paired',
};

function App() {
    const [txHash, setTxHash] = useState(undefined)
    const [txInput, setTxInput] = useState(0)
    const [selector, setSelector] = useState("#itero")

    const [csResponse, setCsData] = useState("")
    const [manifestData, setManifestData] = useState()
    const [balances, setBalances] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [keepkeyState, setKeepkeyState] = useState<number | null>(null);
    const [assetContext, setAssetContext] = useState<any>(null);
    const [transactionContext, setTransactionContext] = useState<any>(null);
    const [showBack, setShowBack] = useState(false);
    const [isConnecting, setIsConnecting] = useState(false);
    const [isRefreshing, setIsRefreshing] = useState(false);

    const [a, setA] = useState(0)
    const [b, setB] = useState(4)
    const [addResult, setAddResult] = useState(0)

    const { isOpen: isSettingsOpen, onOpen: onSettingsOpen, onClose: onSettingsClose } = useDisclosure();

    const refreshBalances = async () => {
        try {
            setIsRefreshing(true);
            setKeepkeyState(null);
            chrome.runtime.sendMessage({ type: 'ON_START' }, response => {
                if (response?.success) {
                    console.log('Sidebar opened successfully');
                } else {
                    console.error('Failed to open sidebar:', response?.error);
                }
            });

            //@ts-ignore
            const resp = await sendToBackground({
                name: "get-keepkey-state",
                body: {
                    input: txInput
                }
            })
            console.log('resp: ', resp)
            setKeepkeyState(resp.state)
        } catch (e) {
            console.error(e);
        } finally {
            setTimeout(() => setIsRefreshing(false), 12000); // Stop the spinner after 2 seconds
        }
    };

    useEffect(() => {
        const messageListener = (message: any) => {
            console.log('Received message:', message);
            if (message.type === 'KEEPKEY_STATE_CHANGED' && message.state !== undefined) {
                setKeepkeyState(message.state);
            }
            if (message.type === 'ASSET_CONTEXT_UPDATED' && message.assetContext) {
                setAssetContext(message.assetContext);
                setShowBack(true);
            }
            if (message.type === 'TRANSACTION_CONTEXT_UPDATED' && message.id) {
                console.log('TRANSACTION_CONTEXT_UPDATED', message.id);
                setTransactionContext(message.id); // Show Activity page on transaction event
                setShowBack(true); // Ensure the "Back" button is shown
            }
        };

        chrome.runtime.onMessage.addListener(messageListener);
        return () => {
            chrome.runtime.onMessage.removeListener(messageListener);
        };
    }, []);

    const renderContent = () => {
        // If transactionContext is available, show the History view
        if (transactionContext) {
            return <History transactionContext={transactionContext} />;
        }

        switch (keepkeyState) {
            case 0:
            case 1:
            case 2:
            case 3:
                return <div>Loading</div>
                // return <Loading setIsConnecting={setIsConnecting} keepkeyState={keepkeyState} />;
            case 4:
                return <Connect setIsConnecting={setIsConnecting} />;
            case 5:
                if (assetContext) {
                    return <Asset asset={assetContext} onClose={() => setAssetContext(null)} />;
                } else {
                    return <Balances balances={balances} loading={loading} setShowBack={setShowBack} />;
                }
            default:
                return (
                    <Flex direction="column" justifyContent="center" alignItems="center" height="100%">
                        <Text fontSize="2xl" fontWeight="bold" textAlign="center" mb={4}>
                            Welcome to the KeepKey Browser Extension
                        </Text>
                        <Button
                            colorScheme="green"
                            size="lg"
                            onClick={refreshBalances}
                            isLoading={isRefreshing}
                            disabled={isRefreshing}>
                            {isRefreshing ? <Spinner size="md" color="white" /> : 'Begin'}
                        </Button>
                    </Flex>
                );
        }
    };

    const handleSettingsClick = () => {
        if (showBack) {
            // Clear assetContext on the frontend
            setAssetContext(null);
            setTransactionContext(null);
            setShowBack(false); // Hide the back button

            // Clear assetContext on the backend
            chrome.runtime.sendMessage({ type: 'CLEAR_ASSET_CONTEXT' }, response => {
                if (response?.success) {
                    console.log('Asset context cleared on backend');
                } else {
                    console.error('Failed to clear asset context on backend:', response?.error);
                }
            });
        } else {
            // Open settings
            onSettingsOpen();
            setShowBack(true); // Show the back button when settings are opened
        }
    };

    const handleTransactionsClick = () => {
        try {
            setTransactionContext('none'); // Switch to the transaction context
            setShowBack(true); // Show the back button
        } catch (e) {
            console.error(e);
        }
    };

    return (
        <Box p={4}>
            <Text fontWeight="bold">
                KeepKey State: {keepkeyState !== null ? keepkeyState : 'N/A'} -{' '}
                {keepkeyState !== null ? stateNames[keepkeyState] : 'unknown'}
            </Text>

            {/* Render the appropriate content */}
            {renderContent()}


            <div>
                <Button variant="outline" size="sm"
                    onClick={async () => {
                        console.log('Button Pushed')
                        //@ts-ignore
                        const resp = await sendToBackground({
                            name: "get-keepkey-state",
                            body: {
                                input: txInput
                            }
                        })
                        console.log('resp: ', resp)
                        setKeepkeyState(resp.state)
                    }}>
                    Get State
                </Button>


                {/*<input value={selector} onChange={(e) => setSelector(e.target.value)} />*/}

                {/*<button*/}
                {/*    onClick={async () => {*/}
                {/*        const csResponse = await sendToContentScript({*/}
                {/*            name: "query-selector-text",*/}
                {/*            body: selector*/}
                {/*        })*/}
                {/*        setCsData(csResponse)*/}
                {/*    }}>*/}
                {/*    Query Text on Web Page*/}
                {/*</button>*/}
                {/*<br />*/}
                {/*<label>Text Data:</label>*/}
                {/*<p>{csResponse}</p>*/}
            </div>

            <DialogRoot size="cover" placement="center" motionPreset="slide-in-bottom">
                <DialogTrigger asChild>
                    <Button variant="outline" size="sm">
                        Open Dialog
                    </Button>
                </DialogTrigger>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Dialog Title</DialogTitle>
                        <DialogCloseTrigger />
                    </DialogHeader>
                    <DialogBody>
                        <Text fontSize="lg" fontWeight="bold" textAlign="center">
                            Settings For Your KeepKey
                        </Text>
                        <Settings />
                    </DialogBody>
                </DialogContent>
            </DialogRoot>
        </Box>
    );
}

export default App;
