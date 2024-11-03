const TAG = ' | thorchainHandler | ';
import { JsonRpcProvider } from 'ethers';
import { Chain } from '@coinmasters/types';
import { AssetValue } from '@pioneer-platform/helpers';
import { EIP155_CHAINS } from '../chains';
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-expect-error
import { ChainToNetworkId, shortListSymbolToCaip, caipToNetworkId } from '@pioneer-platform/pioneer-caip';
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-expect-error
import { v4 as uuidv4 } from 'uuid';
import { requestStorage, web3ProviderStorage, assetContextStorage } from '@extension/storage';

interface ProviderRpcError extends Error {
  code: number;
  data?: unknown;
}

export const createProviderRpcError = (code: number, message: string, data?: unknown): ProviderRpcError => {
  const error = new Error(message) as ProviderRpcError;
  error.code = code;
  if (data) error.data = data;
  return error;
};

export const handleThorchainRequest = async (
  method: string,
  params: any[],
  requestInfo: any,
  ADDRESS: string,
  KEEPKEY_WALLET: any,
  requireApproval: (networkId: string, requestInfo: any, chain: any, method: string, params: any) => Promise<void>,
): Promise<any> => {
  const tag = TAG + ' | handleThorchainRequest | ';
  console.log(tag, 'method:', method);
  switch (method) {
    case 'request_accounts': {
      const pubkeys = KEEPKEY_WALLET.pubkeys.filter((e: any) => e.networks.includes(ChainToNetworkId[Chain.THORChain]));
      const accounts = [];
      for (let i = 0; i < pubkeys.length; i++) {
        const pubkey = pubkeys[i];
        const address = pubkey.master || pubkey.address;
        accounts.push(address);
      }
      console.log(tag, 'accounts: ', accounts);
      console.log(tag, method + ' Returning', accounts);
      //TODO preference on which account to return
      return [accounts[0]];
    }
    case 'request_balance': {
      //get sum of all pubkeys configured
      const balance = KEEPKEY_WALLET.balances.find((balance: any) => balance.caip === shortListSymbolToCaip['THOR']);

      //let pubkeys = await KEEPKEY_WALLET.swapKit.getBalance(Chain.Bitcoin);
      console.log(tag, 'balance: ', balance);
      return [balance];
    }
    case 'transfer': {
      const caip = shortListSymbolToCaip['RUNE'];
      await KEEPKEY_WALLET.setAssetContext({ caip });
      chrome.runtime.sendMessage({ type: 'ASSET_CONTEXT_UPDATED', assetContext: KEEPKEY_WALLET.assetContext });
      console.log(tag, 'caip: ', caip);
      const networkId = caipToNetworkId(caip);
      requestInfo.id = uuidv4();
      console.log(tag, 'requestInfo: ', requestInfo);
      //push event to ux
      chrome.runtime.sendMessage({
        action: 'TRANSACTION_CONTEXT_UPDATED',
        id: requestInfo.id,
      });

      // Require user approval
      const result = await requireApproval(networkId, requestInfo, 'thorchain', method, params[0]);
      console.log(tag, 'result:', result);

      if (result.success) {
        //send tx
        console.log(tag, 'params[0]: ', params[0]);
        const assetString = 'THOR.RUNE';
        await AssetValue.loadStaticAssets();
        console.log(tag, 'params[0].amount.amount: ', params[0].amount.amount);
        const assetValue = await AssetValue.fromString(assetString, parseFloat(params[0].amount.amount));
        const sendPayload = {
          from: params[0].from,
          assetValue,
          memo: params[0].memo || '',
          recipient: params[0].recipient,
        };
        console.log(tag, 'sendPayload: ', sendPayload);
        const txHash = await KEEPKEY_WALLET.swapKit.transfer(sendPayload);
        console.log(tag, 'txHash: ', txHash);

        const response = await requestStorage.getEventById(requestInfo.id);
        console.log(tag, 'response: ', response);
        response.txid = txHash;
        response.assetContext = KEEPKEY_WALLET.assetContext;
        await requestStorage.updateEventById(requestInfo.id, response);
        chrome.runtime.sendMessage({
          action: 'transaction_complete',
          txHash: txHash,
        });

        return txHash;
      } else {
        throw createProviderRpcError(4200, 'User denied transaction');
      }
    }
    default: {
      console.log(tag, `Method ${method} not supported`);
      throw createProviderRpcError(4200, `Method ${method} not supported`);
    }
  }
};