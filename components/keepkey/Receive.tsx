import React, { useEffect, useState } from 'react';
import {
  Avatar,
  Box,
  Button,
  Flex,
  Text,
  Badge,
  VStack,
  HStack,
  Select,
  Spinner,
} from '@chakra-ui/react';
import { FaCopy } from 'react-icons/fa';
//@ts-ignore
import QRCode from 'qrcode';
import { toaster } from '../ui/toaster';
import { Table } from '@chakra-ui/react';

export function Receive({ onClose }: { onClose: () => void }) {
  const [walletType, setWalletType] = useState('');
  const [selectedAddress, setSelectedAddress] = useState('');
  const [pubkeys, setPubkeys] = useState<any[]>([]);
  const [assetContext, setAssetContext] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [hasCopied, setHasCopied] = useState(false);
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string | null>(null);

  // Fetch asset context and pubkeys from the backend (extension)
  useEffect(() => {
    const fetchAssetContextAndPubkeys = () => {
      setLoading(true);

      chrome.runtime.sendMessage({ type: 'GET_ASSET_CONTEXT' }, response => {
        if (chrome.runtime.lastError) {
          console.error('Error fetching asset context:', chrome.runtime.lastError.message);
          setLoading(false);
          return;
        }
        if (response && response.assets) {
          setAssetContext(response.assets);
          setPubkeys(response.assets.pubkeys || []);
          if (response.assets.pubkeys && response.assets.pubkeys.length > 0) {
            const initialAddress = response.assets.pubkeys[0].address || response.assets.pubkeys[0].master;
            setSelectedAddress(initialAddress);
            generateQrCode(initialAddress);
          }
        }
        setLoading(false);
      });
    };

    fetchAssetContextAndPubkeys();
  }, []);

  const handleAddressChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const address = event.target.value;
    setSelectedAddress(address);
    generateQrCode(address);
  };

  const copyToClipboard = () => {
    if (selectedAddress) {
      navigator.clipboard.writeText(selectedAddress).then(() => {
        setHasCopied(true);
        toaster.create({
          title: 'Address copied!',
          type: 'success',
        });
        setTimeout(() => setHasCopied(false), 2000);
      });
    }
  };

  const generateQrCode = (text: string) => {
    QRCode.toDataURL(text, { width: 150, margin: 2 }, (err, url) => {
      if (err) {
        console.error('Error generating QR code:', err);
        return;
      }
      setQrCodeDataUrl(url);
    });
  };

  if (loading) {
    return (
        <Flex align="center" justify="center" minHeight="200px">
          <Spinner size="lg" />
        </Flex>
    );
  }

  if (!assetContext) {
    return (
        <Flex align="center" justify="center" minHeight="200px">
          <Text>No asset context available</Text>
        </Flex>
    );
  }

  return (
      <VStack spacing={6} align="center">
        {/* Avatar and Title */}
        <Avatar size="xl" src={assetContext?.icon} />
        <Text fontSize="xl" fontWeight="bold" textAlign="center">
          Receive {assetContext?.name}
        </Text>

        {/* Chain and Address Selector using Chakra 3 Table structure */}
        <Table.Root size="sm">
          <Table.Header>
            <Table.Row>
              <Table.ColumnHeader>Property</Table.ColumnHeader>
              <Table.ColumnHeader>Value</Table.ColumnHeader>
            </Table.Row>
          </Table.Header>
          <Table.Body>
            <Table.Row>
              <Table.Cell>
                <Text fontWeight="bold">Chain</Text>
              </Table.Cell>
              <Table.Cell>
                <Badge>{assetContext?.chain}</Badge>
              </Table.Cell>
            </Table.Row>
            <Table.Row>
              <Table.Cell>
                <Text fontWeight="bold">Address</Text>
              </Table.Cell>
              <Table.Cell>
                <Select value={selectedAddress} onChange={handleAddressChange}>
                  {pubkeys.map((pubkey, index) => (
                      <option key={index} value={pubkey.address || pubkey.master}>
                        {pubkey.address || pubkey.master}
                      </option>
                  ))}
                </Select>
              </Table.Cell>
            </Table.Row>
          </Table.Body>
        </Table.Root>

        {/* Address Display Box */}
        {selectedAddress && (
            <>
              <Box p={4} borderRadius="md" border="1px solid" borderColor="gray.300" width="full" textAlign="center">
                <Text wordBreak="break-all" fontSize="sm">
                  {selectedAddress}
                </Text>
              </Box>

              {/* QR Code */}
              <Box mt={4}>
                {qrCodeDataUrl ? <img src={qrCodeDataUrl} alt="QR Code" style={{ margin: 'auto' }} /> : <Spinner />}
              </Box>

              {/* Copy Button */}
              <HStack spacing={4} mt={4}>
                <Button colorScheme="blue" onClick={copyToClipboard} leftIcon={<FaCopy />}>
                  {hasCopied ? 'Copied' : 'Copy Address'}
                </Button>
              </HStack>
            </>
        )}
      </VStack>
  );
}

export default Receive;
