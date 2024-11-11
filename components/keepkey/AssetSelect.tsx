import React, { useState, useEffect } from 'react';
import { Box, Button, Flex, Text, Badge } from '@chakra-ui/react';
import { Avatar } from '../ui/avatar';
import { availableChainsByWallet, ChainToNetworkId, getChainEnumValue, NetworkIdToChain } from '@coinmasters/types';
// @ts-ignore
import { COIN_MAP_LONG } from '@pioneer-platform/pioneer-coins';
import { blockchainStorage, blockchainDataStorage } from '@extension/storage';
import { toaster } from '../ui/toaster';
import { Switch } from '../ui/switch'
// Styles for truncating text with ellipsis
const middleEllipsisStyle = {
  whiteSpace: 'nowrap',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  maxWidth: '100px',
};

// Function to fetch asset data from the backend via Chrome runtime
async function getAssetData(networkId: string): Promise<any> {
  return new Promise((resolve, reject) => {
    chrome.runtime.sendMessage({ type: 'GET_ASSETS_INFO', networkId }, response => {
      if (chrome.runtime.lastError) {
        console.error('Error fetching assets:', chrome.runtime.lastError.message);
        reject(chrome.runtime.lastError);
        return;
      }
      if (response) {
        console.log('Assets response:', response);
        resolve(response);
      } else {
        console.error('Error: No assets found in the response');
        reject(new Error('No assets found'));
      }
    });
  });
}

interface Chain {
  name: string;
  image: string;
  networkId: string;
  isEnabled: boolean;
}

interface AssetSelectProps {
  setShowAssetSelect: (show: boolean) => void;
}

export function AssetSelect({ setShowAssetSelect }: AssetSelectProps) {
  const [blockchains, setBlockchains] = useState<Chain[]>([]);
  const [walletOptions, setWalletOptions] = useState<string[]>(Object.keys(availableChainsByWallet));

  useEffect(() => {
    onStart();
  }, []);

  const onStart = async () => {
    const tag = ' | onStart | ';
    try {
      const blockchainsForContext = availableChainsByWallet['KEEPKEY'];
      const allByCaip = blockchainsForContext
          .map((chainStr: any) => {
            const chainEnum = getChainEnumValue(chainStr);
            const networkId = chainEnum ? ChainToNetworkId[chainEnum] : undefined;
            return networkId;
          })
          .filter((networkId: string | undefined): networkId is string => networkId !== undefined);

      let blockchainsEnabled = allByCaip;
      const savedChains = await blockchainStorage.getAllBlockchains();
      if (savedChains && savedChains.length > 0) {
        blockchainsEnabled = [...new Set([...blockchainsEnabled, ...savedChains])];
      }

      const newBlockchains = [];

      for (const networkId of blockchainsEnabled) {
        let blockchain: Chain = {
          networkId,
          name: COIN_MAP_LONG[(NetworkIdToChain as any)[networkId]] || 'unknown',
          image: `https://pioneers.dev/coins/${COIN_MAP_LONG[(NetworkIdToChain as any)[networkId]] || 'unknown'}.png`,
          isEnabled: true,
        };

        if (blockchain.name === 'unknown') {
          const assetData = await blockchainDataStorage.getBlockchainData(networkId);
          if (assetData && assetData.name) {
            blockchain.name = assetData.name;
            blockchain.image = assetData.image || `https://pioneers.dev/coins/${assetData.name.toLowerCase()}.png`;
          }
        }

        newBlockchains.push(blockchain);
      }

      setBlockchains(newBlockchains);
    } catch (error) {
      console.error('Error initializing blockchains:', error);
      toaster.create({
        title: 'Initialization Error',
        description: 'Failed to load blockchains.',
        type: 'error',
      });
    }
  };

  const toggleChain = async (networkId: string) => {
    const chain = blockchains.find(c => c.networkId === networkId);
    if (!chain) return;

    const isCurrentlyEnabled = chain.isEnabled;

    if (isCurrentlyEnabled) {
      try {
        await blockchainStorage.removeBlockchain(networkId);
        await blockchainDataStorage.removeBlockchainData(networkId);
        toaster.create({
          title: 'Chain Disabled',
          description: `${chain.name} has been disabled.`,
          type: 'info',
        });
      } catch (error) {
        console.error(`Failed to disable chain ${networkId}`, error);
        toaster.create({
          title: 'Error',
          description: `Failed to disable ${chain.name}.`,
          type: 'error',
        });
        return;
      }
    } else {
      try {
        await blockchainStorage.addBlockchain(networkId);
        const assetData = await getAssetData(networkId);
        console.log('assetData:', assetData);
        await blockchainDataStorage.addBlockchainData(networkId, assetData);
        toaster.create({
          title: 'Chain Enabled',
          description: `${chain.name} has been enabled.`,
          type: 'success',
        });
      } catch (error) {
        console.error(`Failed to enable chain ${networkId}`, error);
        toaster.create({
          title: 'Error',
          description: `Failed to enable ${chain.name}.`,
          type: 'error',
        });
        return;
      }
    }

    setBlockchains(prevBlockchains =>
        prevBlockchains.map(c => (c.networkId === networkId ? { ...c, isEnabled: !c.isEnabled } : c)),
    );
  };

  const selectAllChains = async () => {
    const tag = ' | selectAllChains | ';
    try {
      const allnetworkIds = blockchains.map(chain => chain.networkId);
      await blockchainStorage.addBlockchains(allnetworkIds);
      console.log(tag, 'All chains added to storage:', allnetworkIds);

      for (const networkId of allnetworkIds) {
        try {
          const assetData = await getAssetData(networkId);
          await blockchainDataStorage.addBlockchainData(networkId, assetData);
          console.log(tag, `Blockchain data added for ${networkId}`);
        } catch (error) {
          console.error(`Failed to fetch data for networkId ${networkId}`, error);
          toaster.create({
            title: 'Error',
            description: `Failed to fetch data for chain ${networkId}`,
            type: 'error',
          });
        }
      }

      setBlockchains(prevBlockchains =>
          prevBlockchains.map(chain => ({
            ...chain,
            isEnabled: true,
          })),
      );

      toaster.create({
        title: 'All Chains Selected',
        description: 'All available chains have been enabled.',
        type: 'success',
      });
    } catch (error) {
      console.error('Failed to select all chains', error);
      toaster.create({
        title: 'Error',
        description: 'Failed to select all chains.',
        type: 'error',
      });
    }
  };

  const unselectAllChains = async () => {
    const tag = ' | unselectAllChains | ';
    try {
      const allnetworkIds = blockchains.map(chain => chain.networkId);
      await blockchainStorage.removeBlockchains(allnetworkIds);
      console.log(tag, 'All chains removed from storage:', allnetworkIds);

      for (const networkId of allnetworkIds) {
        try {
          await blockchainDataStorage.removeBlockchainData(networkId);
          console.log(tag, `Blockchain data removed for ${networkId}`);
        } catch (error) {
          console.error(`Failed to remove data for networkId ${networkId}`, error);
          toaster.create({
            title: 'Error',
            description: `Failed to remove data for chain ${networkId}`,
            type: 'error',
          });
        }
      }

      setBlockchains(prevBlockchains =>
          prevBlockchains.map(chain => ({
            ...chain,
            isEnabled: false,
          })),
      );

      toaster.create({
        title: 'All Chains Unselected',
        description: 'All available chains have been disabled.',
        type: 'info',
      });
    } catch (error) {
      console.error('Failed to unselect all chains', error);
      toaster.create({
        title: 'Error',
        description: 'Failed to unselect all chains.',
        type: 'error',
      });
    }
  };

  const handleContinue = async () => {
    await loadEnabledChains();
    setShowAssetSelect(false);
    toaster.create({
      title: 'Selection Updated',
      description: 'Your asset selections have been updated.',
      type: 'success',
    });
  };

  const renderChain = (chain: Chain) => (
      <Flex
          key={chain.networkId}
          alignItems="center"
          justifyContent="space-between"
          p={2}
          borderBottomWidth="1px"
          borderColor="gray.200">
        <Flex alignItems="center">
          <Avatar size="sm" src={chain.image} mr={4} />
          <Text fontWeight="bold">{chain.name}</Text>
        </Flex>
        <Flex alignItems="center">
          <Badge mr={4}>
            <Text fontSize="xs" style={middleEllipsisStyle}>
              {chain.networkId}
            </Text>
          </Badge>
          <Switch isChecked={chain.isEnabled} onChange={() => toggleChain(chain.networkId)} />
        </Flex>
      </Flex>
  );

  const { UTXO, EVM, others } = blockchains.reduce(
      (acc: any, chain: Chain) => {
        if (chain.networkId.startsWith('bip122:')) acc.UTXO.push(chain);
        else if (chain.networkId.startsWith('eip155:')) acc.EVM.push(chain);
        else acc.others.push(chain);
        return acc;
      },
      { UTXO: [] as Chain[], EVM: [] as Chain[], others: [] as Chain[] },
  );

  const handleAddEvmChain = () => {
    console.log('Add EVM Chain button clicked');
    window.open('https://chainlist.org/', '_blank');
  };

  const handleRefresh = async () => {
    const tag = ' | handleRefresh | ';
    try {
      toaster.create({
        title: 'Refreshing',
        description: 'Refreshing the blockchain list...',
        type: 'info',
      });
      await onStart();
      toaster.create({
        title: 'Refreshed',
        description: 'Blockchain list has been refreshed.',
        type: 'success',
      });
    } catch (error) {
      console.error(tag, 'Error during refresh:', error);
      toaster.create({
        title: 'Refresh Error',
        description: 'Failed to refresh blockchain list.',
        type: 'error',
      });
    }
  };

  return (
      <Box>
        <Flex justifyContent="space-between" mb={4}>
          <Button size="sm" variant="outline" colorScheme="green" onClick={selectAllChains}>
            Select All
          </Button>
          <Button size="sm" variant="outline" colorScheme="red" onClick={unselectAllChains}>
            Unselect All
          </Button>
          <Button size="sm" variant="outline" colorScheme="blue" onClick={handleRefresh}>
            Refresh
          </Button>
        </Flex>

        {UTXO.length > 0 && (
            <>
              <Text fontSize="xl" mb={4}>
                UTXO Chains
              </Text>
              {UTXO.map(renderChain)}
            </>
        )}

        {EVM.length > 0 && (
            <>
              <Text fontSize="xl" my={4}>
                EVM Chains
              </Text>
              {EVM.map(renderChain)}
              <Button mt={2} colorScheme="blue" onClick={handleAddEvmChain}>
                Add an EVM Chain
              </Button>
            </>
        )}

        {others.length > 0 && (
            <>
              <Text fontSize="xl" my={4}>
                Other Chains
              </Text>
              {others.map(renderChain)}
            </>
        )}

        <Button colorScheme="blue" onClick={handleContinue} mt={4} width="100%">
          Continue/Update
        </Button>
      </Box>
  );
}

export default AssetSelect;
