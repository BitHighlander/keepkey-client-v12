import React, { useState, useEffect } from 'react';
import { Flex, Spinner, Box, Text, Badge, Stack } from '@chakra-ui/react';
import { Card } from "@chakra-ui/react";
import { Avatar } from "../ui/avatar";
import { Button } from "../ui/button";

import AssetSelect from './AssetSelect'; // Import AssetSelect component
import { blockchainDataStorage, blockchainStorage } from '@extension/storage';
import { COIN_MAP_LONG } from '@pioneer-platform/pioneer-coins';
import { NetworkIdToChain } from '@coinmasters/types';
import { sendToBackground } from "@plasmohq/messaging";

const Balances = ({ setShowBack }: any) => {
  const [balances, setBalances] = useState<any[]>([]);
  const [assets, setAssets] = useState<any[]>([]);
  const [assetContext, setAssetContext] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [showAssetSelect, setShowAssetSelect] = useState(false);

  const addAddedAssets = async () => {
    try {
      let addedAssets = [];
      const savedChains = await blockchainStorage.getAllBlockchains();

      for (let networkId of savedChains) {
        const chainName = (COIN_MAP_LONG as any)[(NetworkIdToChain as any)[networkId]] || 'unknown';

        let blockchain = {
          networkId,
          name: chainName,
          image: `https://pioneers.dev/coins/${chainName}.png`,
          isEnabled: true,
        };

        if (chainName === 'unknown') {
          try {
            const assetData = await blockchainDataStorage.getBlockchainData(networkId);
            if (assetData?.name) {
              blockchain.name = assetData.name;
              blockchain.image = assetData.image || `https://pioneers.dev/coins/${assetData.name.toLowerCase()}.png`;
            }
          } catch (error) {
            console.error(`Error fetching asset data for networkId ${networkId}:`, error);
          }
        }

        let asset = {
          networkId,
          caip: networkId + '/slip44:60',
          name: blockchain.name,
          icon: blockchain.image,
          manual: true,
        };

        addedAssets.push(asset);
      }
      return addedAssets;
    } catch (e) {
      console.error(e);
      return [];
    }
  };

  const formatBalance = (balance: string) => {
    const [integer, decimal] = balance.split('.');
    const largePart = decimal?.slice(0, 4) || '0000';
    const smallPart = decimal?.slice(4, 6) || '00';
    return { integer, largePart, smallPart };
  };

  const formatUsd = (value: string) => {
    return parseFloat(value).toFixed(2);
  };

  useEffect(() => {
    const fetchAssetsAndBalances = async () => {
      setLoading(true);
      let tag = " | fetchAssetsAndBalances | "
      try {
        //@ts-ignore
        const assetsResponse = await sendToBackground({ name: "keepkey-request", body: { type: 'GET_ASSETS' } });
        //@ts-ignore
        const balancesResponse = await sendToBackground({ name: "keepkey-request", body: { type: 'GET_APP_BALANCES' } });
        //@ts-ignore
        const assetContextResponse = await sendToBackground({ name: "keepkey-request", body: { type: 'GET_ASSET_CONTEXT' } });

        if (assetsResponse?.assets) {
          const addedAssets = await addAddedAssets();
          setAssets([...assetsResponse.assets, ...addedAssets]);
        } else {
          console.error('Error: No assets found in the response');
        }

        console.log(tag, 'balancesResponse:', balancesResponse.balances);
        console.log(tag, 'balancesResponse:', typeof(balancesResponse.balances));
        if (Array.isArray(balancesResponse.balances)) {
          console.log(tag, 'balancesResponse:', balancesResponse);
          setBalances(balancesResponse.balances);
        } else {
          let keys = Object.keys(balancesResponse)
          console.log(tag, 'keys:', keys);

          console.error('Error: balancesResponse is not an array');
        }

        if (assetContextResponse?.assetContext) {
          setAssetContext(assetContextResponse.assetContext);
          setShowBack(true);
        }
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchAssetsAndBalances();
  }, []);

  const onSelect = async (asset: any) => {
    console.log('Asset selected:', asset);
    try {
      //@ts-ignore
      const response = await sendToBackground({
        name: "keepkey-request",
        body: { type: 'SET_ASSET_CONTEXT', message:{asset} }
      });
      if (response?.error) {
        console.error('Error setting asset context:', response.error);
      } else {
        console.log('Asset context set successfully:', response);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const sortedAssets = [...assets]
      .filter(asset => balances.find(balance => balance.caip === asset.caip) || asset.manual)
      .sort((a: any, b: any) => {
        const balanceA = balances.find(balance => balance.caip === a.caip);
        const balanceB = balances.find(balance => balance.caip === b.caip);
        return (parseFloat(balanceB?.valueUsd || '0') - parseFloat(balanceA?.valueUsd || '0'));
      });

  if (showAssetSelect) {
    return <AssetSelect setShowBack={setShowBack} setShowAssetSelect={setShowAssetSelect} />;
  }

  return (
      <Flex flex="1" overflowY="auto" width="100%">
        <Stack width="100%">
          {loading ? (
              <Flex justifyContent="center" alignItems="center" width="100%">
                <Spinner size="xl" />
                Loading....
              </Flex>
          ) : assetContext ? (
              <Asset />
          ) : (
              <>
                {sortedAssets.length === 0 ? (
                    <Flex justifyContent="center" alignItems="center" width="100%">
                      <Text>No assets found</Text>
                    </Flex>
                ) : (
                    sortedAssets.map((asset: any, index: any) => {
                      const balance = balances.find(b => b.caip === asset.caip);
                      const { integer, largePart, smallPart } = formatBalance(balance?.balance || '0.00');

                      return (
                          <Card.Root key={index} borderRadius="md" p={4} mb={1} width="100%">
                            <Card.Body>
                              <Flex align="center" width="100%">
                                <Avatar src={asset.icon} />
                                <Box ml={3} flex="1" minWidth="0">
                                  <Text fontWeight="bold" isTruncated>
                                    {asset.name}
                                  </Text>
                                  <Text as="span" fontSize="lg">
                                    {integer}.{largePart}
                                    {largePart === '0000' && (
                                        <Text as="span" fontSize="sm">
                                          {smallPart}
                                        </Text>
                                    )}
                                    <Badge ml={2} colorScheme="teal">
                                      {asset.symbol}
                                    </Badge>
                                    <br />
                                    <Badge colorScheme="green">USD {formatUsd(balance?.valueUsd || '0.00')}</Badge>
                                  </Text>
                                </Box>
                                <Button ml="auto" onClick={() => onSelect(asset)} size="md">
                                  Select
                                </Button>
                              </Flex>
                            </Card.Body>
                          </Card.Root>
                      );
                    })
                )}
                <Card.Root borderRadius="md" p={4} mb={1} width="100%" bg="gray.100" border="2px dashed teal">
                  <Card.Body>
                    <Flex align="center" width="100%" justifyContent="center">
                      <Button colorScheme="teal" size="lg" onClick={() => setShowAssetSelect(true)}>
                        Add Blockchain
                      </Button>
                    </Flex>
                  </Card.Body>
                </Card.Root>
              </>
          )}
        </Stack>
      </Flex>
  );
};

export default Balances;
