import React, { useEffect, useState } from 'react';
import {
  Box,
  Text,
  Flex,
  Button,
  Spinner,
  Badge,
  SimpleGrid,
  Image,
  IconButton,
  Tooltip,
  Accordion,
} from '@chakra-ui/react';

import {
  AccordionItem,
  AccordionItemContent,
  AccordionItemTrigger,
  AccordionRoot,
} from "../ui/accordion";

import { Checkbox } from '../ui/checkbox';
import { FaTrashAlt, FaInfoCircle } from 'react-icons/fa';
import { formatDistanceToNow, format } from 'date-fns';
import { toaster } from '../ui/toaster';
import { requestStorage } from '@extension/storage';
import { motion, AnimatePresence } from 'framer-motion';

interface HistoryProps {
  transactionContext: any;
}

const MotionBox = motion(Box);

const History: React.FC<HistoryProps> = ({ transactionContext }) => {
  const [events, setEvents] = useState<any[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [assets, setAssets] = useState<any[]>([]);
  const [hideFailed, setHideFailed] = useState(false);
  const [selectedNetwork, setSelectedNetwork] = useState('');
  const [showUnix, setShowUnix] = useState(false);
  const [expandedRawJson, setExpandedRawJson] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const itemsPerPage = 10;

  const loadEvents = async () => {
    try {
      const data = await requestStorage.getEvents();
      if (!data || data.length === 0) {
        setIsLoading(false);
        return;
      }
      const sortedEvents = data.sort(
          (a: any, b: any) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
      );
      setEvents(sortedEvents);
      setIsLoading(false);
    } catch (error) {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadEvents();

    const unsubscribe = requestStorage.subscribe(() => {
      loadEvents();
    });

    fetchAssets();

    return () => {
      unsubscribe();
    };
  }, [transactionContext]);

  const fetchAssets = async () => {
    try {
      const response = await fetch('/api/GET_ASSETS');
      const data = await response.json();
      setAssets(data);
    } catch (error) {
      console.error('Error fetching assets:', error);
    }
  };

  const getAssetIcon = (networkId: string) => {
    const asset = assets.find((a: any) => a.networkId === networkId);
    return asset ? asset.iconUrl : null;
  };

  const getStatusColor = (event: any) => {
    if (!event.txid) return 'red.500';
    if (event.blockHeight) return 'green.500';
    return 'gray.500';
  };

  const handleDelete = async (id: string) => {
    await requestStorage.removeEventById(id);
    setEvents(events.filter((event: any) => event.id !== id));
    toaster.create({
      title: 'Transaction deleted.',
      type: 'success',
    });
  };

  const toggleTimestamp = () => setShowUnix(!showUnix);

  const totalPages = Math.ceil(events.length / itemsPerPage);
  const filteredEvents = events
      .filter((event: any) => !hideFailed || event.txid)
      .filter((event: any) => !selectedNetwork || event.networkId === selectedNetwork);

  const currentItems = filteredEvents.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const toggleRawJson = (id: string) => {
    setExpandedRawJson(prevId => (prevId === id ? null : id));
  };

  return (
      <Box>
        <Flex justifyContent="space-between" alignItems="center" mb={4}>
          <Text fontSize="md" fontWeight="bold">
            Total Transactions: {filteredEvents.length}
          </Text>
        </Flex>

        <Flex justifyContent="space-between" alignItems="center" mb={4}>
          <Checkbox isChecked={hideFailed} onChange={e => setHideFailed(e.target.checked)} mb={4}>
            Hide Failed
          </Checkbox>
          <Flex alignItems="center">
            <Text fontSize="sm">Show Unix Timestamp</Text>
            <Checkbox isChecked={showUnix} onChange={toggleTimestamp} ml={2} size="sm" />
          </Flex>
        </Flex>

        {isLoading ? (
            <Flex justifyContent="center" mt={10}>
              <Spinner size="xl" />
            </Flex>
        ) : currentItems.length > 0 ? (
            <Accordion allowMultiple>
              <AnimatePresence>
                {currentItems.map((event: any) => (
                    <MotionBox
                        key={event.id}
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        transition={{ duration: 0.2 }}
                        mb={4}
                    >
                      <AccordionRoot collapsible defaultValue={["b"]}>
                        <AccordionItem borderRadius="md" border="1px solid" borderColor={getStatusColor(event)} boxShadow="md">
                          <AccordionItemTrigger style={{ padding: '1rem', borderRadius: 'md' }}>
                            <Flex justifyContent="space-between" flex="1" alignItems="center">
                              <Badge colorScheme={event.blockHeight ? 'green' : 'yellow'}>
                                {event.blockHeight ? 'Confirmed' : 'Pending'}
                              </Badge>
                              <Text fontSize="sm">
                                {showUnix
                                    ? format(new Date(event.timestamp), 't')
                                    : formatDistanceToNow(new Date(event.timestamp))}{' '}
                                ago
                              </Text>
                              {!event.blockHeight && (
                                  <Spinner thickness="2px" speed="0.65s" emptyColor="gray.200" color="blue.500" size="sm" />
                              )}
                            </Flex>
                          </AccordionItemTrigger>
                          <AccordionItemContent>
                            <SimpleGrid columns={1} spacing={4} padding="1rem">
                              <Flex alignItems="center">
                                <strong>Network:</strong>
                                {getAssetIcon(event.networkId) && (
                                    <Image src={getAssetIcon(event.networkId)} alt="network icon" boxSize="20px" ml={2} />
                                )}
                                <Text ml={2}>{event.networkId}</Text>
                              </Flex>
                              <Text>
                                <strong>Txid:</strong> {event.txid}
                              </Text>
                              <Text>
                                <strong>Status:</strong>{' '}
                                {event.blockHeight ? (
                                    <Badge colorScheme="green">Confirmed</Badge>
                                ) : (
                                    <Badge colorScheme="yellow">Pending</Badge>
                                )}
                              </Text>
                              <Text>
                                <strong>Site URL:</strong> {event.siteUrl}
                              </Text>
                            </SimpleGrid>
                          </AccordionItemContent>
                        </AccordionItem>
                      </AccordionRoot>
                    </MotionBox>
                ))}
              </AnimatePresence>
            </Accordion>
        ) : (
            <Text>No history available.</Text>
        )}

        <Flex justifyContent="space-between" mt={4} alignItems="center">
          <Button onClick={() => setCurrentPage(currentPage - 1)} isDisabled={currentPage === 1} mr={2}>
            Previous
          </Button>
          <Text>
            Page {currentPage} / {totalPages}
          </Text>
          <Button onClick={() => setCurrentPage(currentPage + 1)} isDisabled={currentPage === totalPages} ml={2}>
            Next
          </Button>
        </Flex>
      </Box>
  );
};

export default History;
