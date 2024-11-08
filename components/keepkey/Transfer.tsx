import React, { useCallback, useEffect, useState } from 'react';
import {
  Avatar,
  Badge,
  Box,
  Button,
  Flex,
  Grid,
  Heading,
  Input,
  Spinner,
  Text,
  VStack,
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogBody,
  DialogFooter,
  useDisclosure,
} from '@chakra-ui/react';
import { Field } from "../ui/field";
import { toaster } from '../ui/toaster';
import { NetworkIdToChain } from '@pioneer-platform/pioneer-caip';
import { COIN_MAP_LONG } from '@pioneer-platform/pioneer-coins';
//@ts-ignore
import confetti from 'canvas-confetti';

const TAG = ' | Transfer | ';

const convertToHex = (amountInEther: string) => {
  const weiMultiplier = BigInt(1e18);
  const amountInWei = BigInt(parseFloat(amountInEther || '0') * 1e18);
  return '0x' + amountInWei.toString(16);
};

export function Transfer({}: any): JSX.Element {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [inputAmount, setInputAmount] = useState('');
  const [inputAmountUsd, setInputAmountUsd] = useState('');
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [memo, setMemo] = useState('');
  const [assetContext, setAssetContext] = useState<any>({});
  const [recipient, setRecipient] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [priceUsd, setPriceUsd] = useState<number | null>(null);
  const [maxSpendable, setMaxSpendable] = useState('');
  const [loadingMaxSpendable, setLoadingMaxSpendable] = useState(true);
  const [useUsdInput, setUseUsdInput] = useState(false);
  const [isMax, setIsMax] = useState(false);

  const { isOpen, onOpen, onClose } = useDisclosure();

  useEffect(() => {
    chrome.runtime.sendMessage({ type: 'GET_ASSET_CONTEXT' }, response => {
      setAssetContext(response.assets);
      if (response?.assets.icon) setAvatarUrl(response.assets.icon);
      if (response?.assets.priceUsd) setPriceUsd(response.assets.priceUsd);
    });
  }, []);

  const onStart = async function () {
    chrome.runtime.sendMessage({ type: 'GET_MAX_SPENDABLE' }, maxSpendableResponse => {
      if (maxSpendableResponse && maxSpendableResponse.maxSpendable) {
        setMaxSpendable(maxSpendableResponse.maxSpendable);
        setLoadingMaxSpendable(false);
      } else {
        toaster.create({
          title: 'Error',
          description: 'Failed to fetch max spendable amount.',
          type: 'error',
        });
        setLoadingMaxSpendable(false);
      }
    });
  };

  useEffect(() => {
    onStart();
  }, []);

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;
    setIsMax(false);
    if (useUsdInput) {
      setInputAmountUsd(value);
      const parsedValue = parseFloat(value);
      if (!isNaN(parsedValue) && priceUsd) {
        setInputAmount((parsedValue / priceUsd).toFixed(4));
      } else {
        setInputAmount('');
      }
    } else {
      setInputAmount(value);
      const parsedValue = parseFloat(value);
      if (!isNaN(parsedValue) && priceUsd) {
        setInputAmountUsd((parsedValue * priceUsd).toFixed(2));
      } else {
        setInputAmountUsd('');
      }
    }
  };

  const handleRecipientChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRecipient(event.target.value);
  };

  const handleSend = useCallback(async () => {
    try {
      if (!inputAmount || !recipient) {
        alert('You MUST input both amount and recipient to send!');
        return;
      }
      setIsSubmitting(true);

      const sendPayload = {
        amount: {
          amount: inputAmount,
          denom: assetContext?.symbol,
        },
        recipient,
        to: recipient,
        memo,
        isMax: isMax,
      };

      let chain;
      if (assetContext?.networkId) {
        if (assetContext.networkId.includes('eip155')) {
          chain = 'ethereum';
        } else {
          const chainFromNetworkId = NetworkIdToChain[assetContext.networkId];
          if (chainFromNetworkId) {
            chain = chainFromNetworkId.toLowerCase();
            const coinMapEntry = COIN_MAP_LONG[chain.toUpperCase()];
            if (coinMapEntry) {
              chain = coinMapEntry.toLowerCase();
            } else {
              throw new Error('Unsupported chain' + chain);
            }
          } else {
            throw new Error('Unsupported network ID');
          }
        }
      } else {
        throw new Error('Network ID is undefined');
      }

      const requestInfo = {
        method: 'transfer',
        params: [sendPayload],
        chain,
        siteUrl: 'KeepKey Browser Extension',
      };

      chrome.runtime.sendMessage(
          {
            type: 'WALLET_REQUEST',
            requestInfo,
          },
          response => {
            if (response.txHash) {
              confetti();
              toaster.create({
                title: 'Transaction Successful',
                description: `Transaction ID: ${response.txHash}`,
                type: 'success',
              });
            } else if (response.error) {
              toaster.create({
                title: 'Error',
                description: response.error,
                type: 'error',
              });
            }
          },
      );
    } catch (error) {
      console.error(error);
      toaster.create({
        title: 'Error',
        description: error.toString(),
        type: 'error',
      });
    } finally {
      setIsSubmitting(false);
      onClose();
    }
  }, [inputAmount, recipient, memo, isMax, assetContext?.networkId]);

  const setMaxAmount = () => {
    const maxAmount = maxSpendable;
    setInputAmount(parseFloat(maxAmount).toFixed(4));
    setInputAmountUsd((parseFloat(maxAmount) * (priceUsd || 1)).toFixed(2));
    setIsMax(true);
  };

  const formatMaxSpendable = (amount: string) => {
    return parseFloat(amount).toFixed(4);
  };

  if (loadingMaxSpendable) {
    return (
        <Flex align="center" justify="center" height="100vh">
          <Box p={10} borderRadius="md" boxShadow="lg">
            <Flex align="center" justify="center">
              <Spinner size="xl" />
              <Text ml={4}>Calculating max spendable amount...</Text>
            </Flex>
          </Box>
        </Flex>
    );
  }

  return (
      <>
        <VStack align="start" borderRadius="md" p={4} spacing={4} margin="0 auto">
          <Heading as="h1" mb={2} size="md">
            Send Crypto!
          </Heading>

          <Flex align="center" direction="row" gap={4}>
            <Avatar size="md" src={avatarUrl} />
            <Box>
              <Text mb={1}>
                Asset: <Badge colorScheme="green">{assetContext?.name}</Badge>
              </Text>
              <Text mb={1}>
                Chain: <Badge colorScheme="green">{assetContext?.networkId}</Badge>
              </Text>
              <Text mb={1}>
                Symbol: <Badge colorScheme="green">{assetContext?.symbol}</Badge>
              </Text>
              <Text mb={1}>
                Max Spendable: {formatMaxSpendable(maxSpendable)} {assetContext?.symbol || 'Symbol'}
              </Text>
              <Badge colorScheme="teal" fontSize="sm">
                ${(parseFloat(maxSpendable) * (priceUsd || 1)).toFixed(2)} USD
              </Badge>
            </Box>
          </Flex>

          <Grid gap={6} templateColumns="repeat(1, 1fr)" w="full">
            <Field label="Recipient">
              <Input onChange={handleRecipientChange} placeholder="Address" value={recipient} />
            </Field>
            <Field label="Input Amount">
              <Flex align="center">
                <Input
                    onChange={handleInputChange}
                    placeholder="0.0000"
                    value={useUsdInput ? inputAmountUsd : inputAmount}
                />
                <Button ml={2} onClick={() => setUseUsdInput(!useUsdInput)}>
                  {useUsdInput ? 'USD' : assetContext?.symbol || 'Symbol'}
                </Button>
                <Button ml={2} onClick={setMaxAmount}>
                  Max
                </Button>
              </Flex>
            </Field>
          </Grid>

          <Dialog>
            <DialogTrigger asChild>
              <Button colorScheme="green" w="full" mt={4} isDisabled={isSubmitting || !inputAmount || !recipient}>
                {isSubmitting ? 'Sending...' : 'Send'}
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>Confirm Transaction</DialogHeader>
              <DialogBody>
                <Text>Recipient: {recipient}</Text>
                <Text>
                  Amount: {inputAmount} {assetContext?.symbol || 'Symbol'}
                </Text>
                <Text>Amount (USD): ${inputAmountUsd}</Text>
                {memo && <Text>Memo: {memo}</Text>}
              </DialogBody>
              <DialogFooter>
                <Button colorScheme="red" mr={3} onClick={onClose}>
                  Cancel
                </Button>
                <Button colorScheme="green" onClick={handleSend} isLoading={isSubmitting}>
                  Confirm
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </VStack>
      </>
  );
}

export default Transfer;
