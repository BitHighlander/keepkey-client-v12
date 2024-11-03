import { bip32ToAddressNList } from '@pioneer-platform/pioneer-coins';

const TAG = ' | litecoinHandler | ';
import { JsonRpcProvider } from 'ethers';
import { Chain, DerivationPath } from '@coinmasters/types';
import { AssetValue } from '@pioneer-platform/helpers';
import { EIP155_CHAINS } from '../chains';
// @ts-ignore
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-expect-error
import { ChainToNetworkId, shortListSymbolToCaip, caipToNetworkId } from '@pioneer-platform/pioneer-caip';
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-expect-error
import { v4 as uuidv4 } from 'uuid';
import { requestStorage, web3ProviderStorage, assetContextStorage } from '@extension/storage';
// @ts-ignore
import * as coinSelect from 'coinselect';
//@ts-ignore
import * as coinSelectSplit from 'coinselect/split';

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

export const handleLitecoinRequest = async (
  method: string,
  params: any[],
  requestInfo: any,
  ADDRESS: string,
  KEEPKEY_WALLET: any,
  requireApproval: (networkId: string, requestInfo: any, chain: any, method: string, params: any) => Promise<void>,
): Promise<any> => {
  const tag = TAG + ' | handleLitecoinRequest | ';
  console.log(tag, 'method:', method);
  console.log(tag, 'params:', params);
  switch (method) {
    case 'request_accounts': {
      const pubkeys = KEEPKEY_WALLET.pubkeys.filter((e: any) => e.networks.includes(ChainToNetworkId[Chain.Litecoin]));
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
      const balance = KEEPKEY_WALLET.balances.find((balance: any) => balance.caip === shortListSymbolToCaip['LTC']);
      return [balance];
    }
    case 'transfer': {
      const caip = shortListSymbolToCaip['LTC'];
      console.log(tag, 'caip: ', caip);
      await KEEPKEY_WALLET.setAssetContext({ caip });
      chrome.runtime.sendMessage({ type: 'ASSET_CONTEXT_UPDATED', assetContext: KEEPKEY_WALLET.assetContext });
      const networkId = caipToNetworkId(caip);
      requestInfo.id = uuidv4();
      //push event to ux
      chrome.runtime.sendMessage({
        action: 'TRANSACTION_CONTEXT_UPDATED',
        id: requestInfo.id,
      });
      const pubkeys = KEEPKEY_WALLET.pubkeys.filter((e: any) => e.networks.includes(ChainToNetworkId[Chain.Litecoin]));
      console.log(tag, 'pubkeys: ', pubkeys);
      if (!pubkeys || pubkeys.length === 0) throw Error('Failed to locate pubkeys for chain ' + Chain.Litecoin);

      const wallet = await KEEPKEY_WALLET.swapKit.getWallet(Chain.Litecoin);
      if (!wallet) throw new Error('Failed to init swapkit');
      const walletAddress = await wallet.getAddress();
      console.log(tag, 'walletAddress: ', walletAddress);

      const buildTx = async function () {
        try {
          const utxos = [];
          for (let i = 0; i < pubkeys.length; i++) {
            const pubkey = pubkeys[i];
            let utxosResp = await KEEPKEY_WALLET.pioneer.ListUnspent({ network: 'LTC', xpub: pubkey.pubkey });
            utxosResp = utxosResp.data;
            console.log('utxosResp: ', utxosResp);
            utxos.push(...utxosResp);
          }
          console.log(tag, 'utxos: ', utxos);

          //get new change address
          let changeAddressIndex = await KEEPKEY_WALLET.pioneer.GetChangeAddress({
            network: 'LTC',
            xpub: pubkeys[0].pubkey || pubkeys[0].xpub,
          });
          changeAddressIndex = changeAddressIndex.data.changeIndex;
          console.log(tag, 'changeAddressIndex: ', changeAddressIndex);

          const path = DerivationPath['LTC'].replace('/0/0', `/1/${changeAddressIndex}`);
          console.log(tag, 'path: ', path);
          const customAddressInfo = {
            coin: 'Litecoin',
            script_type: 'p2pkh',
            address_n: bip32ToAddressNList(path),
          };
          const address = await wallet.getAddress(customAddressInfo);
          console.log('address: ', address);
          const changeAddress = {
            address: address,
            path: path,
            index: changeAddressIndex,
            addressNList: bip32ToAddressNList(path),
          };

          for (let i = 0; i < utxos.length; i++) {
            const utxo = utxos[i];
            //@ts-ignore
            utxo.value = Number(utxo.value);
          }
          console.log('utxos: ', utxos);

          const amountOut: number = Math.floor(Number(params[0].amount.amount) * 1e8);

          console.log(tag, 'amountOut: ', amountOut);
          //get feeRateFromNode
          let feeRateFromNode = await wallet.pioneer.GetFeeRate({ networkId });
          feeRateFromNode = feeRateFromNode.data;
          console.log(tag, 'feeRateFromNode:', feeRateFromNode);
          if (!feeRateFromNode) throw Error('Failed to get feeRateFromNode');
          const feeLevel = 5;
          let effectiveFeeRate;
          if (feeLevel > 3) {
            effectiveFeeRate = feeRateFromNode.fastest;
          } else if (feeLevel > 2) {
            effectiveFeeRate = feeRateFromNode.fast;
          } else if (feeLevel > 0) {
            effectiveFeeRate = feeRateFromNode.average;
          }
          if (!effectiveFeeRate) {
            throw Error('Unable to get fee rate for network ' + networkId);
          }
          console.log('utxos: ', utxos);
          let { inputs, outputs, fee } = coinSelect.default(
            utxos,
            [{ address: params[0].recipient, value: amountOut }],
            effectiveFeeRate,
          );
          if (!inputs || !outputs) {
            ({ inputs, outputs, fee } = coinSelectSplit.default(
              utxos,
              [{ address: params[0].recipient }], // No 'value' field for send-max
              effectiveFeeRate,
            ));
          }
          if (!inputs || !outputs || !fee) {
            chrome.runtime.sendMessage({
              action: 'utxo_build_tx_error',
              error: 'coinselect failed to find a solution. (OUT OF INPUTS) try a lower amount',
            });
          }
          console.log('inputs: ', inputs);
          console.log('outputs: ', outputs);
          console.log('fee: ', fee);

          const unsignedTx = await wallet.buildTx({
            inputs,
            outputs,
            memo: params[0].memo || '',
            changeAddress,
          });
          //push to front
          chrome.runtime.sendMessage({
            action: 'utxo_build_tx',
            unsignedTx: requestInfo,
          });

          const storedEvent = await requestStorage.getEventById(requestInfo.id);
          console.log(tag, 'storedEvent: ', storedEvent);
          storedEvent.assetContext = KEEPKEY_WALLET.assetContext;
          storedEvent.utxos = utxos;
          storedEvent.changeAddress = changeAddress;
          storedEvent.unsignedTx = unsignedTx;
          await requestStorage.updateEventById(requestInfo.id, storedEvent);
        } catch (e) {
          console.error(e);
        }
      };

      buildTx();

      // Proceed with requiring approval without waiting for buildTx to resolve
      const result = await requireApproval(networkId, requestInfo, 'litecoin', method, params[0]);
      console.log(tag, 'result:', result);

      const response = await requestStorage.getEventById(requestInfo.id);
      console.log(tag, 'response: ', response);

      if (result.success && response.unsignedTx) {
        const signedTx = await wallet.signTx(
          response.unsignedTx.inputs,
          response.unsignedTx.outputs,
          response.unsignedTx.memo,
        );

        response.signedTx = signedTx;
        await requestStorage.updateEventById(requestInfo.id, response);

        const txHash = await wallet.broadcastTx(signedTx);

        response.txid = txHash;
        await requestStorage.updateEventById(requestInfo.id, response);

        //push event
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
