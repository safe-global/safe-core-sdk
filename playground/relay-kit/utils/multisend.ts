import { encodePacked, encodeFunctionData } from "viem";

export type InternalTx = {
  to: `0x${string}`;
  data: `0x${string}`;
  value: bigint;
  operation: 0 | 1;
};

const encodeInternalTransaction = (tx: InternalTx): string => {
  const encoded = encodePacked(
    ["uint8", "address", "uint256", "uint256", "bytes"],
    [
      tx.operation,
      tx.to,
      tx.value,
      BigInt(tx.data.slice(2).length / 2),
      tx.data,
    ]
  );
  return encoded.slice(2);
};

export const encodeMultiSend = (txs: InternalTx[]): `0x${string}` => {
  const data: `0x${string}` = `0x${txs
    .map((tx) => encodeInternalTransaction(tx))
    .join("")}`;

  return encodeFunctionData({
    abi: [
      {
        inputs: [
          { internalType: "bytes", name: "transactions", type: "bytes" },
        ],
        name: "multiSend",
        outputs: [],
        stateMutability: "payable",
        type: "function",
      },
    ],
    functionName: "multiSend",
    args: [data],
  });
};
