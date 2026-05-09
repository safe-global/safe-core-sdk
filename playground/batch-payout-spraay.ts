import Safe from "@safe-global/protocol-kit";
import SafeApiKit from "@safe-global/api-kit";
import { MetaTransactionData, OperationType } from "@safe-global/types-kit";
import { encodeFunctionData, parseUnits } from "viem";

// ─── Config ──────────────────────────────────────────────────────────

// USDC on Base
const USDC_ADDRESS = "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913";
// Spraay Batch Contract on Base
const SPRAAY_BATCH_CONTRACT = "0xYOUR_SPRAAY_BATCH_CONTRACT_ADDRESS";

// ERC-20 transfer ABI fragment
const ERC20_TRANSFER_ABI = [
  {
    name: "transfer",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [
      { name: "to", type: "address" },
      { name: "amount", type: "uint256" },
    ],
    outputs: [{ name: "", type: "bool" }],
  },
] as const;

// ─── Types ───────────────────────────────────────────────────────────

interface Recipient {
  address: string;
  amount: string; // Human-readable, e.g. "100.00"
  label?: string; // Optional label for logging
}

// ─── Example: DAO Quarterly Bonus Distribution ───────────────────────

/**
 * This playground script demonstrates how a DAO treasury (managed via Safe)
 * can execute batch payments to multiple recipients using Spraay's batch
 * payment infrastructure.
 *
 * The pattern:
 * 1. Define a list of recipients and amounts
 * 2. Encode each payment as an ERC-20 transfer
 * 3. Bundle them into a single Safe multi-send transaction
 * 4. Propose the transaction for multisig approval
 *
 * For production use, Spraay's batch contract handles this more efficiently
 * (single approve + single batch call vs N individual transfers), but this
 * script shows the Safe SDK integration pattern that works with either approach.
 */

async function main() {
  // ─── Initialize Safe SDK ─────────────────────────────────────────

  const SAFE_ADDRESS = process.env.SAFE_ADDRESS!;
  const SIGNER_PRIVATE_KEY = process.env.SIGNER_PRIVATE_KEY!;
  const RPC_URL = process.env.RPC_URL || "https://mainnet.base.org";

  if (!SAFE_ADDRESS || !SIGNER_PRIVATE_KEY) {
    console.error("Set SAFE_ADDRESS and SIGNER_PRIVATE_KEY in your environment");
    process.exit(1);
  }

  console.log("╔══════════════════════════════════════════════════╗");
  console.log("║  Safe + Spraay: Treasury Batch Payout            ║");
  console.log("║  Execute batch payments from your Safe multisig  ║");
  console.log("╚══════════════════════════════════════════════════╝\n");

  // Initialize Protocol Kit with the Safe
  const protocolKit = await Safe.init({
    provider: RPC_URL,
    signer: SIGNER_PRIVATE_KEY,
    safeAddress: SAFE_ADDRESS,
  });

  // Initialize API Kit for transaction service
  const apiKit = new SafeApiKit({
    chainId: 8453n, // Base
  });

  const owners = await protocolKit.getOwners();
  const threshold = await protocolKit.getThreshold();
  console.log(`Safe: ${SAFE_ADDRESS}`);
  console.log(`Owners: ${owners.length} | Threshold: ${threshold}\n`);

  // ─── Define Recipients ───────────────────────────────────────────

  // In production, this list would come from:
  // - A Superfluid stream query (bonus based on streamed amounts)
  // - A CSV upload in a Safe App UI
  // - An on-chain governance proposal
  // - Spraay's API for invoice settlements

  const recipients: Recipient[] = [
    { address: "0x1111111111111111111111111111111111111111", amount: "500.00", label: "Alice - Q2 Bonus" },
    { address: "0x2222222222222222222222222222222222222222", amount: "750.00", label: "Bob - Q2 Bonus" },
    { address: "0x3333333333333333333333333333333333333333", amount: "300.00", label: "Carol - Grant Milestone" },
    { address: "0x4444444444444444444444444444444444444444", amount: "1200.00", label: "Dave - Contractor Invoice" },
    { address: "0x5555555555555555555555555555555555555555", amount: "250.00", label: "Eve - Retroactive Reward" },
  ];

  const totalAmount = recipients.reduce(
    (sum, r) => sum + parseFloat(r.amount),
    0
  );

  console.log(`📋 Batch payout: ${recipients.length} recipients`);
  console.log(`💰 Total: $${totalAmount.toFixed(2)} USDC\n`);

  for (const r of recipients) {
    console.log(`   ${r.label || r.address}: $${r.amount} USDC`);
  }

  // ─── Option A: Direct ERC-20 Multi-Send ──────────────────────────
  // Bundle individual ERC-20 transfers into one Safe transaction.
  // Simple but costs more gas with many recipients.

  console.log("\n── Option A: Direct ERC-20 Multi-Send ──────────────\n");

  const transactions: MetaTransactionData[] = recipients.map((r) => ({
    to: USDC_ADDRESS,
    value: "0",
    data: encodeFunctionData({
      abi: ERC20_TRANSFER_ABI,
      functionName: "transfer",
      args: [r.address as `0x${string}`, parseUnits(r.amount, 6)],
    }),
    operation: OperationType.Call,
  }));

  // Create the multi-send transaction
  const safeTransaction = await protocolKit.createTransaction({
    transactions,
  });

  console.log(`Created multi-send transaction with ${transactions.length} transfers`);

  // Sign with first owner
  const signedTx = await protocolKit.signTransaction(safeTransaction);
  console.log("✅ Transaction signed by first owner");

  // Propose to Safe Transaction Service for other owners to approve
  const safeTxHash = await protocolKit.getTransactionHash(signedTx);
  const signerAddress = (await protocolKit.getSafeProvider().getSignerAddress())!;

  await apiKit.proposeTransaction({
    safeAddress: SAFE_ADDRESS,
    safeTransactionData: signedTx.data,
    safeTxHash,
    senderAddress: signerAddress,
    senderSignature: signedTx.getSignature(signerAddress)!.data,
  });

  console.log(`📤 Transaction proposed to Safe Transaction Service`);
  console.log(`   Safe TX Hash: ${safeTxHash}`);
  console.log(`   View: https://app.safe.global/transactions/tx?safe=base:${SAFE_ADDRESS}&id=${safeTxHash}`);

  // ─── Option B: Spraay Batch Contract (More Gas Efficient) ────────
  // Approve USDC to Spraay's batch contract, then call batchTransfer.
  // Single approve + single batch call = significantly cheaper for 10+ recipients.

  console.log("\n── Option B: Spraay Batch Contract ─────────────────\n");
  console.log("For 10+ recipients, use Spraay's batch contract for better gas efficiency:");
  console.log("1. Approve USDC to Spraay batch contract");
  console.log("2. Call batchTransfer(recipients[], amounts[])");
  console.log("3. Single transaction settles all payments\n");
  console.log("See: https://docs.spraay.app/batch-contracts");
  console.log("Contract: https://basescan.org/address/" + SPRAAY_BATCH_CONTRACT);

  // ─── Option C: Spraay Gateway API ────────────────────────────────
  // For cross-chain payouts or when you want Spraay to handle execution.

  console.log("\n── Option C: Spraay Gateway API ────────────────────\n");
  console.log("For multi-chain payouts, use the Spraay Gateway:");
  console.log("POST https://gateway.spraay.app/batch/send");
  console.log("Supports 13+ chains from a single API call\n");

  console.log("══════════════════════════════════════════════════");
  console.log("Transaction proposed! Other Safe owners can now");
  console.log("review and confirm at app.safe.global");
  console.log("══════════════════════════════════════════════════");
}

main().catch(console.error);
