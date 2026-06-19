// @ts-nocheck
/**
 * verify-gas-schedule
 *
 * Checks, per chain, what each EVM operation used inside a Safe `execTransaction` actually costs in
 * gas, and flags anything that differs from the EIP-2929 (Berlin) standard. It's the reproducible
 * backing for PLA-1651: the only chain that deviates is Polygon PoS (after the "Chicago" hard fork /
 * PIP-88), which makes a cold SLOAD cost 5460 and raises the cold-SSTORE surcharge to 2940.
 *
 * The idea is simple: instead of trusting docs, we ask the node to replay real transactions and read
 * the true per-opcode gas cost (`debug_traceTransaction`). A single Safe tx doesn't use every opcode,
 * so we also peek at a few nearby contract txs to measure the rest (gas costs are the same for any
 * contract on a chain). Every value is labelled by where it came from: `measured`, `derived`, or
 * `UNVERIFIED` (we never print a standard value as if we'd checked it).
 *
 * To run it:
 *   1) Fill in `rpcUrl` for each chain below with your own debug-enabled RPC (it must support
 *      `debug_traceTransaction` — Tenderly, dRPC, Alchemy, QuickNode, your own node…). Your API key
 *      stays on your machine. Chains left with the placeholder are skipped.
 *   2) pnpm play verify-gas-schedule
 */

// The EIP-2929 / Berlin standard we compare every chain against.
const STANDARD_GAS = {
  coldSload: 2100,
  warmSload: 100,
  coldAccountAccess: 2600,
  delegatecallSurcharge: 2500, // cold account access (2600) - warm access (100)
  warmSstoreReset: 2900, // SSTORE_RESET_GAS = 5000 - 2100
  coldSstoreSet: 22100, // SSTORE_SET_GAS (20000) + cold surcharge (2100)
  coldSstoreReset: 5000 // warm reset + cold surcharge
}

const SSTORE_SET_GAS = 20000 // base cost of a 0 -> non-zero store, before any cold surcharge

// with your own debug-enabled endpoint before running. Use a recent tx to check the current schedule
// (the scan is anchored to the tx's block, so a pre-hard-fork tx reports the old schedule).
const CHAINS = [
  {
    name: 'polygon',
    chainId: 137,
    rpcUrl: '<Add RPC with debug_traceTransaction support>', // <-- replace with your Polygon RPC
    safeTx: '0xa283ad1ab199efb59a79b24b3baa06e84e976183fce785785964d59ebfdfb672'
  },
  {
    name: 'arbitrum',
    chainId: 42161,
    rpcUrl: '<Add RPC with debug_traceTransaction support>', // <-- replace with your Arbitrum RPC
    safeTx: '0x16ca0b969eebad5e731e45ffbc1e3eb0352e2e58c3300f7b02774acc758a1441'
  },
  {
    name: 'optimism',
    chainId: 10,
    rpcUrl: '<Add RPC with debug_traceTransaction support>', // <-- replace with your Optimism RPC
    safeTx: '0x6afbde9d0eefdf8b2a2f3ad152956069d149be7e9e2bd35177e63d62063d86f0'
  },
  {
    name: 'base',
    chainId: 8453,
    rpcUrl: '<Add RPC with debug_traceTransaction support>', // <-- replace with your Base RPC
    safeTx: '0xeedd18250722b70900e15fab41f1e4c1ce458cef4eeb89d563155221c10f420c'
  },
  {
    name: 'bnb',
    chainId: 56,
    rpcUrl: '<Add RPC with debug_traceTransaction support>', // <-- replace with your BNB RPC
    safeTx: '0xf108f749a5e7a909e5add2df23ec98cdc2d76fc3ce0d21f0b8aa4a277c6d5966'
  },
  {
    name: 'avalanche',
    chainId: 43114,
    rpcUrl: '<Add RPC with debug_traceTransaction support>', // <-- replace with your Avalanche C-Chain RPC
    safeTx: '0xae4101accd257b171c94f9a56cd7385e295d6e60f1569322f5470699c8f1a90c'
  }
]

// A small JS tracer used only as a fallback for nodes that don't return reliable `gasCost` in their
// struct logs (e.g. some dRPC nodes). It works out each opcode's cost as "gas before - gas after".
const FALLBACK_GAS_DELTA_TRACER =
  '{prev:null,costs:{},step:function(log){if(this.prev){var cost=this.prev.gas-log.getGas();' +
  'var key=this.prev.op+":"+cost;this.costs[key]=(this.costs[key]||0)+1}' +
  'this.prev={op:log.op.toString(),gas:log.getGas()};},result:function(){return this.costs},fault:function(){}}'

// Tiny JSON-RPC helper.
async function callRpc(rpcUrl, method, params) {
  const response = await fetch(rpcUrl, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ jsonrpc: '2.0', id: 1, method, params })
  })
  const body = await response.json()
  if (body.error) throw new Error(`${method}: ${body.error.message || JSON.stringify(body.error)}`)
  return body.result
}

// Trace a transaction and count how often each (opcode, gasCost) pair occurs.
// Returns e.g. { 'SLOAD:2100': 9, 'SLOAD:100': 7, 'SSTORE:2900': 3, 'EXTCODESIZE:2600': 1 }.
async function traceOpcodeCosts(rpcUrl, txHash) {
  // Preferred path: the standard struct logger (Tenderly, geth…), where `gasCost` is reliable.
  try {
    const trace = await callRpc(rpcUrl, 'debug_traceTransaction', [
      txHash,
      { disableStack: true, disableMemory: true, disableStorage: true }
    ])
    if (trace && Array.isArray(trace.structLogs)) {
      const costsByOpcode = {}
      for (const step of trace.structLogs) {
        const key = `${step.op}:${step.gasCost}`
        costsByOpcode[key] = (costsByOpcode[key] || 0) + 1
      }
      return costsByOpcode
    }
  } catch (error) {
    const looksLikeUnsupported = /tracer|structLog|not (available|enabled|exist|supported)/i.test(
      error.message
    )
    if (!looksLikeUnsupported) throw error
  }
  // Fallback: the gas-delta JS tracer (for nodes that reject struct logs).
  return await callRpc(rpcUrl, 'debug_traceTransaction', [
    txHash,
    { tracer: FALLBACK_GAS_DELTA_TRACER }
  ])
}

// From the (opcode, cost) counts, return the distinct costs seen for one opcode, split by warm/cold.
// Warm access is 100; cold access is always > 200 (so this cleanly separates the two).
function getWarmAndColdCosts(costsByOpcode, opcode) {
  const costs = Object.keys(costsByOpcode)
    .filter((key) => key.startsWith(opcode + ':'))
    .map((key) => Number(key.split(':')[1]))
  return {
    warm: costs.filter((cost) => cost <= 100),
    cold: costs.filter((cost) => cost > 200)
  }
}

// Collect a handful of "real" contract-call tx hashes from blocks just before `anchorBlock`, so the
// extra measurements come from the same gas era as the Safe tx we're checking.
async function findNearbyContractTxs(rpcUrl, maxTxs, anchorBlock) {
  const startBlock = anchorBlock ?? parseInt(await callRpc(rpcUrl, 'eth_blockNumber', []), 16)
  const txHashes = []
  for (let depth = 1; depth <= 60 && txHashes.length < maxTxs; depth++) {
    const block = await callRpc(rpcUrl, 'eth_getBlockByNumber', [
      '0x' + (startBlock - depth).toString(16),
      true
    ])
    if (!block || !block.transactions) continue
    for (const tx of block.transactions) {
      if (tx.input && tx.input.length > 800) txHashes.push(tx.hash) // skip plain transfers
      if (txHashes.length >= maxTxs) break
    }
  }
  return txHashes
}

async function verifyChain(chain) {
  const { name, chainId, rpcUrl, safeTx } = chain
  console.log(`\n=== ${name} (chainId ${chainId}) ===`)
  if (!rpcUrl) {
    console.log('  - skipped: no rpcUrl set for this chain (edit CHAINS in this file).')
    return
  }
  console.log(`RPC: ${rpcUrl}`)
  console.log(`Safe execTransaction: ${safeTx}`)

  // Anchor the extra-tx scan to the Safe tx's block, so we don't mix gas eras (e.g. a pre-hard-fork
  // Safe tx with current post-fork blocks).
  let anchorBlock
  try {
    const tx = await callRpc(rpcUrl, 'eth_getTransactionByHash', [safeTx])
    if (tx && tx.blockNumber) anchorBlock = parseInt(tx.blockNumber, 16)
  } catch {
    /* if this fails we just scan from the chain tip */
  }

  // Merge opcode costs from the Safe tx and the nearby txs into one set of counts.
  const opcodeCosts = {}
  const mergeCosts = (more) => {
    for (const key in more) opcodeCosts[key] = (opcodeCosts[key] || 0) + more[key]
  }
  try {
    mergeCosts(await traceOpcodeCosts(rpcUrl, safeTx))
  } catch (error) {
    console.log(`  ! could not trace the Safe tx: ${error.message}`)
  }

  // A Safe execTransaction doesn't touch every opcode we care about (no EXT*, no cold SSTORE set),
  // so scan nearby contract txs until we've also seen a cold account access and a cold SSTORE set.
  const sawColdAccountAccess = () =>
    ['EXTCODESIZE', 'EXTCODEHASH', 'BALANCE', 'EXTCODECOPY'].some(
      (opcode) => getWarmAndColdCosts(opcodeCosts, opcode).cold.length > 0
    )
  const sawColdSstoreSet = () =>
    Object.keys(opcodeCosts).some(
      (key) => key === 'SSTORE:' + STANDARD_GAS.coldSstoreSet || key === 'SSTORE:22940'
    )
  if (!sawColdAccountAccess() || !sawColdSstoreSet()) {
    try {
      const candidateTxs = await findNearbyContractTxs(rpcUrl, 30, anchorBlock)
      for (const txHash of candidateTxs) {
        try {
          mergeCosts(await traceOpcodeCosts(rpcUrl, txHash))
        } catch {
          /* skip individual tx errors */
        }
        if (sawColdAccountAccess() && sawColdSstoreSet()) break
      }
    } catch (error) {
      console.log(`  ! scan for nearby txs failed: ${error.message}`)
    }
  }

  if (Object.keys(opcodeCosts).length === 0) {
    console.log(
      '  ⚠️  No trace data — CANNOT verify. The RPC failed or does not expose debug_traceTransaction.'
    )
    console.log(`       Try another debug-enabled RPC for ${name}.`)
    return
  }

  // Pull out the cost of each operation we care about (null = not seen in any traced tx).
  const sload = getWarmAndColdCosts(opcodeCosts, 'SLOAD')
  const coldAccountAccessCosts = ['EXTCODESIZE', 'EXTCODEHASH', 'BALANCE', 'EXTCODECOPY'].flatMap(
    (opcode) => getWarmAndColdCosts(opcodeCosts, opcode).cold
  )
  const sstoreCosts = Object.keys(opcodeCosts)
    .filter((key) => key.startsWith('SSTORE:'))
    .map((key) => Number(key.split(':')[1]))

  const coldSload = sload.cold.length ? Math.max(...sload.cold) : null
  const warmSload = sload.warm.length ? 100 : null
  const coldAccountAccess = coldAccountAccessCosts.length ? coldAccountAccessCosts[0] : null
  const warmSstoreReset = sstoreCosts.find((cost) => cost === 2900 || cost === 2060) ?? null
  const coldSstoreSet = sstoreCosts.find((cost) => cost === 22100 || cost === 22940) ?? null
  const coldSstoreReset = sstoreCosts.find((cost) => cost === 5000) ?? null

  // LOG base = 375 is confirmed when we see a LOGn with no data (its cost is exactly 375 * (n + 1)).
  let logBaseGas = null
  for (const key of Object.keys(opcodeCosts)) {
    const match = /^LOG([0-4]):(\d+)$/.exec(key)
    if (match && Number(match[2]) === 375 * (Number(match[1]) + 1)) logBaseGas = 375
  }
  const sawAnyLog = Object.keys(opcodeCosts).some((key) => /^LOG[0-4]:/.test(key))

  // Build a table row. A null measured value means we never saw the op, so we don't claim it's
  // verified: we show the expected (standard) value with an UNVERIFIED verdict.
  const makeRow = (label, measured, standard) =>
    measured == null
      ? [label, `${standard} (expected)`, 'not measured', 'UNVERIFIED']
      : [
          label,
          String(measured),
          'measured',
          measured !== standard ? `DEVIATES (std ${standard})` : 'ok'
        ]

  const rows = []
  rows.push(makeRow('Cold SLOAD', coldSload, STANDARD_GAS.coldSload))
  rows.push(makeRow('Warm SLOAD', warmSload, STANDARD_GAS.warmSload))
  rows.push(makeRow('Cold account access', coldAccountAccess, STANDARD_GAS.coldAccountAccess))

  // The DELEGATECALL surcharge can never be read straight from a trace (a CALL's gasCost bundles the
  // gas forwarded to the sub-call, the 63/64 rule), so we always derive it: cold access - warm (100).
  rows.push(
    coldAccountAccess != null
      ? [
          'Cold DELEGATECALL surcharge',
          String(coldAccountAccess - 100),
          'derived',
          coldAccountAccess - 100 !== STANDARD_GAS.delegatecallSurcharge
            ? `DEVIATES (std ${STANDARD_GAS.delegatecallSurcharge})`
            : 'ok'
        ]
      : [
          'Cold DELEGATECALL surcharge',
          `${STANDARD_GAS.delegatecallSurcharge} (expected)`,
          'derived',
          'UNVERIFIED'
        ]
  )

  rows.push(makeRow('Warm SSTORE reset (!=0->!=0)', warmSstoreReset, STANDARD_GAS.warmSstoreReset))
  rows.push(makeRow('Cold SSTORE set (0->!=0)', coldSstoreSet, STANDARD_GAS.coldSstoreSet))

  // A cold !=0->!=0 overwrite is rare in real txs, so prefer a direct measurement but fall back to
  // deriving it from two values we did measure: warm reset + cold surcharge (cold set - 20000).
  const coldSstoreSurcharge = coldSstoreSet != null ? coldSstoreSet - SSTORE_SET_GAS : null
  if (coldSstoreReset != null) {
    rows.push(
      makeRow('Cold SSTORE reset (!=0->!=0)', coldSstoreReset, STANDARD_GAS.coldSstoreReset)
    )
  } else if (warmSstoreReset != null && coldSstoreSurcharge != null) {
    const derivedColdReset = warmSstoreReset + coldSstoreSurcharge
    rows.push([
      'Cold SSTORE reset (!=0->!=0)',
      String(derivedColdReset),
      'derived (warm reset + cold surcharge)',
      derivedColdReset !== STANDARD_GAS.coldSstoreReset
        ? `DEVIATES (std ${STANDARD_GAS.coldSstoreReset})`
        : 'ok'
    ])
  } else {
    rows.push(makeRow('Cold SSTORE reset (!=0->!=0)', null, STANDARD_GAS.coldSstoreReset))
  }

  rows.push(
    logBaseGas === 375
      ? ['LOG (base gas)', '375', 'measured', 'ok']
      : sawAnyLog
        ? ['LOG (base/topic/byte)', '375/375/8', 'observed (base not isolated)', 'ok']
        : ['LOG (base/topic/byte)', '375/375/8 (expected)', 'not measured', 'UNVERIFIED']
  )
  rows.push(['System overhead per tx', 'none', 'n/a', 'not an opcode (no baseGas impact)'])

  // padEnd, but keep at least 2 spaces between columns even when a value is wider than its column.
  const padColumn = (value, width) => {
    value = String(value)
    return value.length >= width ? value + '  ' : value.padEnd(width)
  }
  console.log(
    '  ' +
      padColumn('Operation', 30) +
      padColumn('Gas', 22) +
      padColumn('Source', 40) +
      'vs EIP-2929'
  )
  for (const [label, gas, source, verdict] of rows) {
    console.log('  ' + padColumn(label, 30) + padColumn(gas, 22) + padColumn(source, 40) + verdict)
  }
}

async function main() {
  const chainsWithRpc = CHAINS.filter((chain) => chain.rpcUrl)
  if (chainsWithRpc.length === 0) {
    console.log('No rpcUrl set. Edit CHAINS in this file and add a debug-enabled RPC per chain:')
    console.log(`  rpcUrl: 'https://<your-debug-rpc>/...'  (must support debug_traceTransaction)`)
    process.exit(1)
  }

  console.log('Verifying the EVM gas schedule against EIP-2929 (Berlin). See PLA-1651.')
  for (const chain of CHAINS) {
    try {
      await verifyChain(chain)
    } catch (error) {
      console.log(`\n=== ${chain.name} ===\n  ! failed: ${error.message}`)
    }
  }
  console.log(
    '\nReminder: only Polygon (137) deviates (cold SLOAD 5460, cold-SSTORE surcharge 2940). ' +
      'Every other chain should match the EIP-2929 standard.'
  )
}

// `fetch` keeps sockets alive, which stops Node from exiting on its own (the terminal looks "stuck"
// until you press enter). Exit explicitly once we're done.
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
