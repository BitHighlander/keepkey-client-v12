import React, { useState, useEffect } from 'react';
import { Box, Flex, Text, VStack, Input, IconButton, Tooltip } from '@chakra-ui/react';
import { FaCopy } from 'react-icons/fa';
import { toaster } from '../ui/toaster';
import { Avatar } from '../ui/avatar';
const Context = () => {
  const [currentAssetContext, setCurrentAssetContext] = useState({
    icon: 'https://pioneers.dev/coins/ethereum.png',
    name: 'Ethereum',
  });
  const [address, setAddress] = useState('');

  useEffect(() => {
    const fetchAddress = async () => {
      try {
        chrome.runtime.sendMessage({ type: 'GET_ASSET_CONTEXT' }, response => {
          if (chrome.runtime.lastError) {
            console.error('Error fetching asset context:', chrome.runtime.lastError.message);
            return;
          }
          if (response && response.assets) {
            const asset = response.assets;
            setCurrentAssetContext(asset);
            const initialAddress = asset.pubkeys?.[0]?.address || asset.pubkeys?.[0]?.master || asset.address || '';
            setAddress(initialAddress);
          }
        });
      } catch (error) {
        console.error('Error fetching address:', error);
        toaster.create({
          title: 'Error fetching address',
          description: 'There was an error fetching the address',
          type: 'error',
        });
      }
    };

    fetchAddress();
  }, []);

  const copyToClipboard = () => {
    navigator.clipboard.writeText(address);
    toaster.create({
      title: 'Address copied',
      description: `${currentAssetContext.name} address copied to clipboard`,
      type: 'success',
    });
  };

  const getEllipsisAddress = (addr: string, start: number = 6, end: number = 4) => {
    if (!addr) return '';
    return addr.length > start + end ? `${addr.slice(0, start)}...${addr.slice(-end)}` : addr;
  };

  const clearAssetContext = async () => {
    chrome.runtime.sendMessage({ type: 'SET_ASSET_CONTEXT', asset: null }, response => {
      if (chrome.runtime.lastError) {
        console.error('Error clearing asset context:', chrome.runtime.lastError.message);
      } else {
        setCurrentAssetContext({ icon: 'https://pioneers.dev/coins/ethereum.png', name: 'Ethereum' });
        setAddress('');
      }
    });
  };

  return (
      <VStack align="start" borderRadius="md" p={6} spacing={5} width="100%">
        <Flex flex="1" textAlign="center" align="center" width="100%">
          <Box onClick={clearAssetContext} bg="gray.100" p={1} borderRadius="full">
            <Avatar size="md" src={currentAssetContext?.icon} />
          </Box>
          <Box flex="1" />
          <Flex align="center" width="100%">
            <Input
                value={getEllipsisAddress(address)}
                isReadOnly
                placeholder="Address"
                size="sm"
                width="120px"
                mr={2}
                sx={{
                  whiteSpace: 'nowrap',
                }}
            />
            <IconButton
                onClick={copyToClipboard}
                icon={<FaCopy />}
                aria-label="Copy address"
                size="sm"
            />
          </Flex>
        </Flex>
      </VStack>
  );
};

export default Context;
