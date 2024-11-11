import React, { useState } from 'react';
import {
  Input,
  Button,
  Text,
  Flex,
} from '@chakra-ui/react';
import {
  DialogRoot,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogBody,
  DialogFooter,
  DialogCloseTrigger,
} from "../ui/dialog";
import {Avatar} from "../ui/avatar";
import { toaster } from "../ui/toaster";
import { dappStorage } from '@extension/storage';

interface AddDappModalProps {
  isOpen: boolean;
  onClose: () => void;
  networkId: string;
  onSave: () => void;
}

export function AddDappModal({ networkId, isOpen, onClose, onSave }: AddDappModalProps) {
  const [url, setUrl] = useState('');
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const defaultIcon = 'https://pioneers.dev/coins/ethereum.png';

  const handleSave = async () => {
    if (!url || !name) {
      toaster.create({
        title: 'Name and URL are required',
        type: 'error',
      });
      return;
    }

    try {
      // Create new dApp with default icon
      const newDapp = { name, icon: defaultIcon, url, networks: [networkId] };
      await dappStorage.addDapp(newDapp);

      // Notify parent component and reset form
      onSave();
      setUrl('');
      setName('');
      setDescription('');
      onClose();
      toaster.create({
        title: 'Dapp added successfully',
        type: 'success',
      });
    } catch (error) {
      toaster.create({
        title: 'Failed to add dApp',
        type: 'error',
      });
    }
  };

  return (
      <DialogRoot open={isOpen} onOpenChange={onClose}>
        <DialogTrigger asChild>
          <Button variant="outline" size="sm">
            Open Dialog
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              <Flex align="center">
                <Avatar src="https://pioneers.dev/coins/pioneerMan.png" size="sm" mr={2} />
                <Text>Discovery</Text>
              </Flex>
            </DialogTitle>
          </DialogHeader>
          <DialogBody>
            <Input
                placeholder="Enter dApp Name"
                value={name}
                onChange={e => setName(e.target.value)}
                mb={3}
            />
            <Input
                placeholder="Enter dApp URL"
                value={url}
                onChange={e => setUrl(e.target.value)}
                type="url"
                mb={3}
            />
            <Input
                placeholder="Sample description"
                value={description}
                onChange={e => setDescription(e.target.value)}
                mb={3}
            />
          </DialogBody>
          <DialogFooter>
            <Button colorScheme="blue" mr={3} onClick={handleSave}>
              Save
            </Button>
            <DialogCloseTrigger asChild>
              <Button variant="ghost">Cancel</Button>
            </DialogCloseTrigger>
          </DialogFooter>
        </DialogContent>
      </DialogRoot>
  );
}
