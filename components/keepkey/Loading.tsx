import React, { useEffect } from 'react';
import { Spinner, Text, Box, Button } from '@chakra-ui/react';
import { Card } from '@chakra-ui/react';

interface ConnectProps {
  setIsConnecting: (isConnecting: boolean) => void;
  keepkeyState: any;
}

const Loading: React.FC<ConnectProps> = ({ setIsConnecting, keepkeyState }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsConnecting(false);
    }, 3000);

    // Cleanup the timer on component unmount
    return () => clearTimeout(timer);
  }, [setIsConnecting]);

  return (
      <Box display="flex" justifyContent="center" alignItems="center" height="100vh">
        <Card.Root borderRadius="md" width="320px" p={6} boxShadow="lg">
          <Card.Body textAlign="center" gap="4">
            <Text fontWeight="bold" fontSize="lg">Status: {keepkeyState}</Text>
            <Spinner size="xl" />
            <Text mt={4}>Connecting to KeepKey...</Text>
          </Card.Body>
          <Card.Footer justifyContent="center" pt={4}>
            <Button variant="outline" onClick={() => setIsConnecting(false)}>
              Cancel
            </Button>
          </Card.Footer>
        </Card.Root>
      </Box>
  );
};

export default Loading;
