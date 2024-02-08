import {
  Address,
  PrivateKeyAccount,
  WalletClient,
  encodeFunctionData,
} from "viem";

export const generateApproveCallData = (paymasterAddress: Address) => {
  const approveData = encodeFunctionData({
    abi: [
      {
        inputs: [
          { name: "_spender", type: "address" },
          { name: "_value", type: "uint256" },
        ],
        name: "approve",
        outputs: [{ name: "", type: "bool" }],
        payable: false,
        stateMutability: "nonpayable",
        type: "function",
      },
    ],
    args: [
      paymasterAddress,
      0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffn,
    ],
  });

  return approveData;
};

export const generateTransferCallData = (to: Address, value: bigint) => {
  const transferData = encodeFunctionData({
    abi: [
      {
        inputs: [
          { name: "_to", type: "address" },
          { name: "_value", type: "uint256" },
        ],
        name: "transfer",
        outputs: [{ name: "", type: "bool" }],
        payable: false,
        stateMutability: "nonpayable",
        type: "function",
      },
    ],
    args: [to, value],
  });

  return transferData;
};

export const getERC20Decimals = async (
  erc20TokenAddress: string,
  publicClient: any
) => {
  const erc20Decimals = await publicClient.readContract({
    abi: [
      {
        inputs: [],
        name: "decimals",
        outputs: [{ type: "uint8" }],
        type: "function",
        stateMutability: "view",
      },
    ],
    address: erc20TokenAddress,
    functionName: "decimals",
  });

  return erc20Decimals;
};

export const getERC20Balance = async (
  erc20TokenAddress: string,
  publicClient: any,
  owner: string
) => {
  const senderERC20Balance = await publicClient.readContract({
    abi: [
      {
        inputs: [{ name: "_owner", type: "address" }],
        name: "balanceOf",
        outputs: [{ name: "balance", type: "uint256" }],
        type: "function",
        stateMutability: "view",
      },
    ],
    address: erc20TokenAddress,
    functionName: "balanceOf",
    args: [owner],
  });

  return senderERC20Balance;
};

export const transferERC20Token = async (
  erc20TokenAddress: string,
  publicClient: any,
  signer: PrivateKeyAccount,
  to: string,
  amount: bigint,
  walletClient: WalletClient
) => {
  const signerERC20Bal = await getERC20Balance(
    erc20TokenAddress,
    publicClient,
    signer.address
  );
  if (signerERC20Bal < amount) {
    console.log(
      "Signer does not have enough Tokens to transfer. Please transfer required funds."
    );
    process.exit(0);
  }

  const { request } = await publicClient.simulateContract({
    address: erc20TokenAddress,
    abi: [
      {
        inputs: [
          { name: "recipient", type: "address" },
          { name: "amount", type: "uint256" },
        ],
        name: "transfer",
        outputs: [{ name: "", type: "bool" }],
        type: "function",
        stateMutability: "public",
      },
    ],
    functionName: "transfer",
    args: [to, amount],
    account: signer,
  });

  await walletClient.writeContract(request);
};
