/*
     App
 */
// import { sendToBackgroundViaRelay } from "@plasmohq/messaging";
import React, { useState, useEffect } from 'react';
import {
    useDisclosure,
    Flex,
    Text,
    Box,
    Spinner,
} from '@chakra-ui/react';
import { Button } from './ui/button';
import { IconButton } from './ui/iconbutton';
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
} from "./ui/dialog";
import { FaChevronLeft, FaRedo, FaCog, FaCalendarAlt } from 'react-icons/fa';
import { sendToBackground, sendToContentScript } from "@plasmohq/messaging";
import Connect from './keepkey/Connect';
import Loading from './keepkey/Loading';
import Balances from './keepkey/Balances';
import Asset from './keepkey/Asset';
import History from './keepkey/History';
import Settings from './keepkey/Settings';

function App() {
    const [balances, setBalances] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [keepkeyState, setKeepkeyState] = useState<number | null>(null);
    const [assetContext, setAssetContext] = useState<any>(null);
    const [transactionContext, setTransactionContext] = useState<any>(null);
    const [showBack, setShowBack] = useState(false);
    const [isConnecting, setIsConnecting] = useState(false);
    const [isRefreshing, setIsRefreshing] = useState(false);

    const { onOpen: onSettingsOpen, onClose: onSettingsClose } = useDisclosure();

    const refreshBalances = async () => {
        try {
            setIsRefreshing(true);
            setKeepkeyState(null);
            //@ts-ignore
            await sendToBackground({
                name: "keepkey-request",
                body: {
                    type: 'ON_START'
                }
            });
            //@ts-ignore
            const resp = await sendToBackground({
                name: "keepkey-request",
                body: {
                    type: 'GET_KEEPKEY_STATE'
                }
            });
            setKeepkeyState(resp.state);
        } catch (e) {
            console.error(e);
        } finally {
            setTimeout(() => setIsRefreshing(false), 12000);
        }
    };

    const renderContent = () => {
        if (transactionContext) {
            return <History transactionContext={transactionContext} />;
        }

        switch (keepkeyState) {
            case 0:
            case 1:
            case 2:
            case 3:
                return <Loading setIsConnecting={setIsConnecting} keepkeyState={keepkeyState} />;
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
            setAssetContext(null);
            setTransactionContext(null);
            setShowBack(false);

            // chrome.runtime.sendMessage({ type: 'CLEAR_ASSET_CONTEXT' }, response => {
            //     if (response?.success) {
            //         console.log('Asset context cleared on backend');
            //     } else {
            //         console.error('Failed to clear asset context on backend:', response?.error);
            //     }
            // });
        } else {
            onSettingsOpen();
            setShowBack(true);
        }
    };

    const handleTransactionsClick = () => {
        try {
            setTransactionContext('none');
            setShowBack(true);
        } catch (e) {
            console.error(e);
        }
    };

    return (
        <Box p={4}>
            <Text fontWeight="bold">
                KeepKey State: {keepkeyState}
            </Text>

            <Flex alignItems="center" justifyContent="space-between" p={4} borderBottom="1px solid #ccc" width="100%">
                <DialogRoot size="cover" placement="center" motionPreset="slide-in-bottom">
                    {/* Left-aligned button (Settings or Back depending on showBack) */}
                    <DialogTrigger asChild>
                        <IconButton
                            icon={showBack ? <FaChevronLeft /> : <FaCog />}
                            aria-label={showBack ? 'Back' : 'Settings'}
                            onClick={showBack ? handleSettingsClick : onSettingsOpen}
                        />
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

                {/* Center-aligned Activity button */}
                <Box mx="auto">
                    <IconButton
                        color="white"
                        icon={<FaCalendarAlt />} // Activity Icon
                        aria-label="Activity"
                        onClick={handleTransactionsClick} // Handle transaction context
                    />
                </Box>

                {/* Right-aligned button (Refresh) */}
                <IconButton
                    icon={<FaRedo />}
                    aria-label="Refresh"
                    onClick={refreshBalances}
                />
            </Flex>
            <br/>
            {isConnecting ? (<div>connecting <Spinner></Spinner></div>) : (<div>not connecting</div>)}
            {/* Render the appropriate content */}
            {renderContent()}
        </Box>
    );
}

export default App;
