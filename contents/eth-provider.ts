import type { PlasmoCSConfig } from "plasmo";
import { sendToBackgroundViaRelay } from "@plasmohq/messaging";
import { type EIP1193Provider, announceProvider } from "mipd";
import { RequestMethod } from "~utils/constants";
import { v4 as uuidv4 } from "uuid";
import KEEPKEY_ICON_RAW_SVG from "~/assets/keepkey.svg";

export const config: PlasmoCSConfig = {
  matches: ["<all_urls>"],
  world: "MAIN",
  run_at: "document_start",
};

enum EventMethod {
  ACCOUNTS_CHANGED = "ACCOUNTS_CHANGED",
  CONNECT = "CONNECT",
  DISCONNECT = "DISCONNECT",
}

type RequestArguments = {
  method: string;
  params?: Record<string, any>[];
};

interface EthereumProvider {
  isMetaMask: boolean;
  _events: Record<string, Function[]>;
  enable(): Promise<string[]>;
  isConnected(): boolean;
  on(event: string, callback: (data: any) => void): void;
  removeListener(event: string, callback: Function): void;
  request(args: RequestArguments): Promise<string | string[]>;
  _emit(event: string, data: any): void;
  _connect(): void;
  _disconnect(error?: { code: number; message: string }): void;
}

const ethereumProvider: EthereumProvider = {
  isMetaMask: true,
  _events: {},

  isConnected: () => true,

  request: (args) => {
    return new Promise((resolve) => {
      if (args.method === RequestMethod.ETH_REQUEST_ACCOUNTS) {
        resolve(["0x141D9959cAe3853b035000490C03991eB70Fc4aC"]);
      } else if (args.method === RequestMethod.ETH_CHAIN_ID) {
        resolve("0x1"); // Mock chain ID
      } else {
        resolve("Mock response");
      }
    });
  },

  enable: () => {
    return ethereumProvider.request({ method: RequestMethod.ETH_REQUEST_ACCOUNTS });
  },

  on: (event, callback) => {
    if (!ethereumProvider._events[event]) {
      ethereumProvider._events[event] = [];
    }
    ethereumProvider._events[event].push(callback);
  },

  removeListener: (event, callback) => {
    const listeners = ethereumProvider._events[event];
    if (!listeners) return;
    ethereumProvider._events[event] = listeners.filter((listener) => listener !== callback);
  },

  _emit: (event, data) => {
    const listeners = ethereumProvider._events[event];
    if (listeners && listeners.length > 0) {
      listeners.forEach((callback) => {
        try {
          callback(data);
        } catch (error) {
          console.error(`Error in ${event} event listener:`, error);
        }
      });
    }
  },

  _connect: () => {
    ethereumProvider._emit(EventMethod.CONNECT, { chainId: "0x1" });
  },

  _disconnect: (error) => {
    ethereumProvider._emit(EventMethod.DISCONNECT, error || { code: 4900, message: "Provider disconnected" });
  },
};

ethereumProvider._connect();
window.ethereum = ethereumProvider;

announceProvider({
  info: {
    icon: KEEPKEY_ICON_RAW_SVG,
    name: "Keepkey",
    rdns: "com.keepkey",
    uuid: uuidv4(),
  },
  provider: ethereumProvider as EthereumProvider as EIP1193Provider,
});
