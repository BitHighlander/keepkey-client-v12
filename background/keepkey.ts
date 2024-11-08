/*
    KeepKey Wallet
 */
import { AssetValue } from '@pioneer-platform/helpers';
import { WalletOption, availableChainsByWallet, ChainToNetworkId, getChainEnumValue } from '@coinmasters/types';
import { getPaths } from '@pioneer-platform/pioneer-coins';
import { keepKeyApiKeyStorage, pioneerKeyStorage } from '@extension/storage'; // Re-import the storage
// @ts-ignore
import { SDK } from '@coinmasters/pioneer-sdk';
// @ts-ignore
// import DB from '@coinmasters/pioneer-db';
// const db = new DB({});
import { v4 as uuidv4 } from 'uuid';

const TAG = ' | KeepKey | ';
interface KeepKeyWallet {
  type: string;
  icon: string;
  chains: string[];
  wallet: any;
  status: string;
  isConnected: boolean;
}

const connectKeepKey = async function () {
  try {
  } catch (e) {
    console.error(e);
  }
};

export const onStartKeepkey = async function () {
  let tag = TAG + ' | onStartKeepkey | ';
  try {
    let chains = [
      'ARB',
      'AVAX',
      'BSC',
      'BTC',
      'BCH',
      'GAIA',
      'OSMO',
      'XRP',
      'DOGE',
      'DASH',
      'ETH',
      'LTC',
      'MATIC',
      'THOR',
      'MAYA',
      // 'GNO',
      'BASE',
      'OP',
    ];

    // await db.init({});
    // //console.log(tag, 'Database initialized');
    // let txs = await db.getAllTransactions();
    // console.log(tag, 'txs: ', txs);
    //
    // let pubkeys = await db.getPubkeys({});
    // console.log(tag, 'pubkeys: ', pubkeys);
    //
    // let balances = await db.getBalances({});
    // console.log(tag, 'balances: ', balances);

    // let db = []
    // let txs = []
    // let pubkeys = []

    const allByCaip = chains.map(chainStr => {
      const chain = getChainEnumValue(chainStr);
      if (chain) {
        return ChainToNetworkId[chain];
      }
      return undefined;
    });
    console.log(tag, 'allByCaip: ', allByCaip);
    const paths = getPaths(allByCaip);

    //add paths to keepkey
    //add account 0 p2sh segwit
    paths.push({
      note: 'Bitcoin account 0 segwit (p2sh)',
      networks: ['bip122:000000000019d6689c085ae165831e93'],
      script_type: 'p2sh-p2wpkh',
      available_scripts_types: ['p2pkh', 'p2sh', 'p2wpkh', 'p2sh-p2wpkh'],
      type: 'xpub',
      addressNList: [0x80000000 + 49, 0x80000000 + 0, 0x80000000 + 0],
      addressNListMaster: [0x80000000 + 49, 0x80000000 + 0, 0x80000000 + 0, 0, 0],
      curve: 'secp256k1',
      showDisplay: false, // Not supported by TrezorConnect or Ledger, but KeepKey should do it
    });

    //add account1
    paths.push({
      note: 'Bitcoin account 0 Native Segwit (Bech32)',
      blockchain: 'bitcoin',
      symbol: 'BTC',
      symbolSwapKit: 'BTC',
      networks: ['bip122:000000000019d6689c085ae165831e93'],
      script_type: 'p2wpkh', //bech32
      available_scripts_types: ['p2pkh', 'p2sh', 'p2wpkh', 'p2sh-p2wpkh'],
      type: 'zpub',
      addressNList: [0x80000000 + 84, 0x80000000 + 0, 0x80000000 + 1],
      addressNListMaster: [0x80000000 + 84, 0x80000000 + 0, 0x80000000 + 1, 0, 0],
      curve: 'secp256k1',
      showDisplay: false, // Not supported by TrezorConnect or Ledger, but KeepKey should do it
    });

    paths.push({
      note: 'Bitcoin account 1 legacy',
      networks: ['bip122:000000000019d6689c085ae165831e93'],
      script_type: 'p2pkh',
      available_scripts_types: ['p2pkh', 'p2sh', 'p2wpkh', 'p2sh-p2wpkh'],
      type: 'xpub',
      addressNList: [0x80000000 + 44, 0x80000000 + 0, 0x80000000 + 1],
      addressNListMaster: [0x80000000 + 44, 0x80000000 + 0, 0x80000000 + 1, 0, 0],
      curve: 'secp256k1',
      showDisplay: false, // Not supported by TrezorConnect or Ledger, but KeepKey should do it
    });

    //add account1
    paths.push({
      note: 'Bitcoin account 1 Native Segwit (Bech32)',
      blockchain: 'bitcoin',
      symbol: 'BTC',
      symbolSwapKit: 'BTC',
      networks: ['bip122:000000000019d6689c085ae165831e93'],
      script_type: 'p2wpkh', //bech32
      available_scripts_types: ['p2pkh', 'p2sh', 'p2wpkh', 'p2sh-p2wpkh'],
      type: 'zpub',
      addressNList: [0x80000000 + 84, 0x80000000 + 0, 0x80000000 + 1],
      addressNListMaster: [0x80000000 + 84, 0x80000000 + 0, 0x80000000 + 1, 0, 0],
      curve: 'secp256k1',
      showDisplay: false, // Not supported by TrezorConnect or Ledger, but KeepKey should do it
    });

    paths.push({
      note: 'Bitcoin account 1 legacy',
      networks: ['bip122:000000000019d6689c085ae165831e93'],
      script_type: 'p2pkh',
      available_scripts_types: ['p2pkh', 'p2sh', 'p2wpkh', 'p2sh-p2wpkh'],
      type: 'xpub',
      addressNList: [0x80000000 + 44, 0x80000000 + 0, 0x80000000 + 2],
      addressNListMaster: [0x80000000 + 44, 0x80000000 + 0, 0x80000000 + 2, 0, 0],
      curve: 'secp256k1',
      showDisplay: false, // Not supported by TrezorConnect or Ledger, but KeepKey should do it
    });

    //add account3
    paths.push({
      note: 'Bitcoin account 1 Native Segwit (Bech32)',
      blockchain: 'bitcoin',
      symbol: 'BTC',
      symbolSwapKit: 'BTC',
      networks: ['bip122:000000000019d6689c085ae165831e93'],
      script_type: 'p2wpkh', //bech32
      available_scripts_types: ['p2pkh', 'p2sh', 'p2wpkh', 'p2sh-p2wpkh'],
      type: 'zpub',
      addressNList: [0x80000000 + 84, 0x80000000 + 0, 0x80000000 + 1],
      addressNListMaster: [0x80000000 + 84, 0x80000000 + 0, 0x80000000 + 1, 0, 0],
      curve: 'secp256k1',
      showDisplay: false, // Not supported by TrezorConnect or Ledger, but KeepKey should do it
    });

    paths.push({
      note: 'Bitcoin account 3 legacy',
      blockchain: 'bitcoin',
      symbol: 'BTC',
      symbolSwapKit: 'BTC',
      networks: ['bip122:000000000019d6689c085ae165831e93'],
      script_type: 'p2pkh',
      available_scripts_types: ['p2pkh', 'p2sh', 'p2wpkh', 'p2sh-p2wpkh'],
      type: 'xpub',
      addressNList: [0x80000000 + 44, 0x80000000 + 0, 0x80000000 + 3],
      addressNListMaster: [0x80000000 + 44, 0x80000000 + 0, 0x80000000 + 3, 0, 0],
      curve: 'secp256k1',
      showDisplay: false, // Not supported by TrezorConnect or Ledger, but KeepKey should do it
    });

    //get username from storage
    let keepkeyApiKey = (await keepKeyApiKeyStorage.getApiKey()) || 'key:123';
    let username = await pioneerKeyStorage.getUsername();
    let queryKey = await pioneerKeyStorage.getUsername();
    let spec = (await pioneerKeyStorage.getPioneerSpec()) || 'https://pioneers.dev/spec/swagger.json';
    let wss = (await pioneerKeyStorage.getPioneerWss()) || 'wss://pioneers.dev';
    if (!queryKey) {
      queryKey = `key:${uuidv4()}`;
      pioneerKeyStorage.saveQueryKey(queryKey);
    }
    if (!username) {
      username = `user:${uuidv4()}`;
      username = username.substring(0, 13);
      pioneerKeyStorage.saveUsername(username);
    }
    console.log(tag, 'keepkeyApiKey:', keepkeyApiKey);
    console.log(tag, 'username:', username);
    console.log(tag, 'queryKey:', queryKey);
    console.log(tag, 'spec:', spec);
    console.log(tag, 'wss:', wss);
    //let spec = 'https://pioneers.dev/spec/swagger.json'

    let config: any = {
      appName: 'KeepKey Client',
      appIcon: 'https://pioneers.dev/coins/keepkey.png',
      username,
      queryKey,
      spec,
      keepkeyApiKey,
      wss,
      paths,
      blockchains: allByCaip,
    };

    let app = new SDK(spec, config);

    const walletsVerbose: any = [];

    let resultInit = await app.init(walletsVerbose, {});
    console.log(tag, 'resultInit:', resultInit);
    console.log(tag, 'wallets: ', app.wallets.length);
    if (app.keepkeyApiKey !== keepkeyApiKey) {
      console.log('SAVING API KEY. ');
      keepKeyApiKeyStorage.saveApiKey(app.keepkeyApiKey);
    }

    //TODO get paths from storage

    //get paths for wallet

    paths.push({
      note:"Bitcoin account 0 segwit (p2sh)",
      networks: ['bip122:000000000019d6689c085ae165831e93'],
      script_type:"p2sh",
      available_scripts_types:['p2pkh','p2sh','p2wpkh','p2sh-p2wpkh'],
      type:"zpub",
      addressNList: [0x80000000 + 84, 0x80000000 + 0, 0x80000000 + 0],
      addressNListMaster: [0x80000000 + 84, 0x80000000 + 0, 0x80000000 + 0, 0, 0],
      curve: 'secp256k1'
    })

    await app.setPaths(paths)

    //get status

    // let app = {}
    return app;
  } catch (e) {
    console.error(e);
    throw e;
  }
};
