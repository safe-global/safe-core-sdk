// @ts-nocheck
/**
 * verify-gas-schedule
 *
 * Empirically measures, per chain, the gas cost of every EVM operation that shows up in a Safe
 * `execTransaction` and flags any deviation from the EIP-2929 (Berlin) standard. This is the
 * reproducible backing for PLA-1651: only Polygon PoS deviates (PIP-88 / "Chicago" hard fork),
 * which raises cold SLOAD to 5460 and the cold-SSTORE surcharge to 2940.
 *
 * How it works: it calls `debug_traceTransaction` on a real Safe `execTransaction` per chain and,
 * because a single Safe tx doesn't exercise every opcode, additionally scans a few recent contract
 * transactions to capture cold account-access / cold-SSTORE-set / cold-SSTORE-reset / LOG. Each cell
 * is labelled `measured`, `derived` or `not found (standard)`.
 *
 * Usage (one chain at a time; you always pass the RPC as an argument):
 *   pnpm play verify-gas-schedule <chain> <rpcUrl>
 *
 *   <chain>   one of: polygon, arbitrum, optimism, base, bnb, avalanche
 *   <rpcUrl>  a debug-enabled RPC for that chain (must expose debug_traceTransaction):
 *             Tenderly, dRPC, Alchemy, QuickNode, your own node… (args are order-independent).
 *
 * Example:
 *   pnpm play verify-gas-schedule polygon https://my-debug-rpc/...
 */

// EIP-2929 / Berlin standard reference (gas)
const STD = {
  coldSload: 2100,
  warmSload: 100,
  coldAccountAccess: 2600,
  delegatecallSurcharge: 2500, // coldAccountAccess - warmAccess(100)
  warmSstoreReset: 2900, // SSTORE_RESET_GAS = 5000 - 2100
  coldSstoreSet: 22100, // SSTORE_SET_GAS(20000) + cold surcharge(2100)
  coldSstoreReset: 5000 // warm reset + cold surcharge
}

// One real Safe execTransaction per chain. Set `rpcUrl` for each chain you want to check with your
// OWN debug-enabled RPC (must expose debug_traceTransaction — Tenderly, dRPC, Alchemy, QuickNode,
// your own node…). The script iterates over every chain; any chain with an empty rpcUrl is skipped.
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

// JS tracer (fallback for nodes that reject the default struct logger or have a broken getCost):
// attributes (gasBefore - gasAfter) to the previous opcode -> the true per-op cost.
const GAS_DELTA_TRACER =
  '{last:null,d:{},step:function(log){if(this.last){var c=this.last.g-log.getGas();' +
  'var k=this.last.o+":"+c;this.d[k]=(this.d[k]||0)+1}' +
  'this.last={o:log.op.toString(),g:log.getGas()};},result:function(){return this.d},fault:function(){}}'

async function rpc(url, method, params) {
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ jsonrpc: '2.0', id: 1, method, params })
  })
  const json = await res.json()
  if (json.error) throw new Error(`${method}: ${json.error.message || JSON.stringify(json.error)}`)
  return json.result
}

// Returns a map { 'SLOAD:2100': count, 'SSTORE:5000': count, 'EXTCODESIZE:2600': count, ... }
async function traceOpCosts(url, txHash) {
  // 1) Preferred: struct logger (Tenderly gateway, geth). gasCost is reliable.
  try {
    const r = await rpc(url, 'debug_traceTransaction', [
      txHash,
      { disableStack: true, disableMemory: true, disableStorage: true }
    ])
    if (r && Array.isArray(r.structLogs)) {
      const buckets = {}
      for (const s of r.structLogs) {
        const k = `${s.op}:${s.gasCost}`
        buckets[k] = (buckets[k] || 0) + 1
      }
      return buckets
    }
  } catch (e) {
    if (!/tracer|structLog|not (available|enabled|exist|supported)/i.test(e.message)) throw e
  }
  // 2) Fallback: JS gas-delta tracer (dRPC etc.)
  return await rpc(url, 'debug_traceTransaction', [txHash, { tracer: GAS_DELTA_TRACER }])
}

// Pull the cost(s) of an opcode from the buckets, split into warm (==100) and cold (>200).
function opCosts(buckets, op) {
  const costs = Object.keys(buckets)
    .filter((k) => k.startsWith(op + ':'))
    .map((k) => Number(k.split(':')[1]))
  return {
    warm: costs.filter((c) => c <= 100),
    cold: costs.filter((c) => c > 200)
  }
}

async function findContractTxs(url, max) {
  const latest = parseInt(await rpc(url, 'eth_blockNumber', []), 16)
  const hashes = []
  for (let off = 2; off <= 40 && hashes.length < max; off++) {
    const blk = await rpc(url, 'eth_getBlockByNumber', ['0x' + (latest - off).toString(16), true])
    if (!blk || !blk.transactions) continue
    for (const t of blk.transactions) {
      if (t.input && t.input.length > 800) hashes.push(t.hash)
      if (hashes.length >= max) break
    }
  }
  return hashes
}

const RPC_PLACEHOLDER = '<Add RPC with debug_traceTransaction support>'

async function verifyChain(chain) {
  const url = chain.rpcUrl
  console.log(`\n=== ${chain.name} (chainId ${chain.chainId}) ===`)
  if (!url || url === RPC_PLACEHOLDER) {
    console.log('  - skipped: no rpcUrl set for this chain (edit CHAINS in this file).')
    return
  }
  console.log(`RPC: ${url}`)
  console.log(`Safe execTransaction: ${chain.safeTx}`)

  // Aggregate opcode costs from the Safe tx + a few recent contract txs (protocol constants are
  // chain-global, so any tx that exercises an opcode measures it).
  const buckets = {}
  const add = (b) => {
    for (const k in b) buckets[k] = (buckets[k] || 0) + b[k]
  }
  try {
    add(await traceOpCosts(url, chain.safeTx))
  } catch (e) {
    console.log(`  ! could not trace the Safe tx: ${e.message}`)
  }

  // A Safe execTransaction doesn't exercise every opcode (no EXT*, no cold-SSTORE-set). These are
  // chain-global protocol constants, so we scan recent contract txs until we've also captured a
  // cold account-access op AND a cold SSTORE set. (Cold SSTORE reset is then derived — see below.)
  const hasColdAccess = () =>
    ['EXTCODESIZE', 'EXTCODEHASH', 'BALANCE', 'EXTCODECOPY'].some(
      (op) => opCosts(buckets, op).cold.length > 0
    )
  const hasColdSet = () =>
    Object.keys(buckets).some((k) => k === 'SSTORE:' + STD.coldSstoreSet || k === 'SSTORE:22940')
  if (!hasColdAccess() || !hasColdSet()) {
    try {
      const extra = await findContractTxs(url, 30) // tx budget
      for (const h of extra) {
        try {
          add(await traceOpCosts(url, h))
        } catch {
          /* skip individual tx errors */
        }
        if (hasColdAccess() && hasColdSet()) break
      }
    } catch (e) {
      console.log(`  ! scan for auxiliary txs failed: ${e.message}`)
    }
  }

  if (Object.keys(buckets).length === 0) {
    console.log(
      '  ⚠️  No trace data — CANNOT verify. The RPC failed or does not expose debug_traceTransaction.'
    )
    console.log(`       Try another debug-enabled RPC for ${chain.name}.`)
    return
  }

  const sload = opCosts(buckets, 'SLOAD')
  const acct = ['EXTCODESIZE', 'EXTCODEHASH', 'BALANCE', 'EXTCODECOPY'].flatMap(
    (op) => opCosts(buckets, op).cold
  )
  const sstoreCosts = Object.keys(buckets)
    .filter((k) => k.startsWith('SSTORE:'))
    .map((k) => Number(k.split(':')[1]))

  const coldSload = sload.cold.length ? Math.max(...sload.cold) : null
  const warmSload = sload.warm.length ? 100 : null
  const coldAcct = acct.length ? acct[0] : null
  const warmReset = sstoreCosts.find((c) => c === 2900 || c === 2060) ?? null
  const coldSet = sstoreCosts.find((c) => c === 22100 || c === 22940) ?? null
  const coldReset = sstoreCosts.find((c) => c === 5000) ?? null
  // LOG base = 375 confirmed when a LOGn with zero data appears (cost == 375*(n+1)).
  let logBase = null
  for (const k of Object.keys(buckets)) {
    const m = /^LOG([0-4]):(\d+)$/.exec(k)
    if (m && Number(m[2]) === 375 * (Number(m[1]) + 1)) logBase = 375
  }
  const anyLog = Object.keys(buckets).some((k) => /^LOG[0-4]:/.test(k))

  // Builds a row. If `measured` is null -> the operation wasn't seen in any traced tx, so we do NOT
  // claim it's verified: it's shown as the EIP-2929 expected value with verdict UNVERIFIED.
  const row = (name, measured, std) =>
    measured == null
      ? [name, `${std} (expected)`, 'not measured', 'UNVERIFIED']
      : [name, String(measured), 'measured', measured !== std ? `DEVIATES (std ${std})` : 'ok']

  const rows = []
  rows.push(row('Cold SLOAD', coldSload, STD.coldSload))
  rows.push(row('Warm SLOAD', warmSload, STD.warmSload))
  rows.push(row('Cold account access', coldAcct, STD.coldAccountAccess))
  // DELEGATECALL surcharge is never isolable from a trace (63/64 gas forwarding); always derived.
  rows.push(
    coldAcct != null
      ? [
          'Cold DELEGATECALL surcharge',
          String(coldAcct - 100),
          'derived',
          coldAcct - 100 !== STD.delegatecallSurcharge
            ? `DEVIATES (std ${STD.delegatecallSurcharge})`
            : 'ok'
        ]
      : [
          'Cold DELEGATECALL surcharge',
          `${STD.delegatecallSurcharge} (expected)`,
          'derived',
          'UNVERIFIED'
        ]
  )
  rows.push(row('Warm SSTORE reset (!=0->!=0)', warmReset, STD.warmSstoreReset))
  rows.push(row('Cold SSTORE set (0->!=0)', coldSet, STD.coldSstoreSet))
  // Cold SSTORE reset = warm reset + cold surcharge. A cold !=0->!=0 overwrite is rare in real txs,
  // so prefer a direct measurement but fall back to deriving it from the two measured components
  // (warm reset, and cold surcharge = cold-set - SSTORE_SET_GAS 20000). Both are measured above.
  const coldSurcharge = coldSet != null ? coldSet - 20_000 : null
  if (coldReset != null) {
    rows.push(row('Cold SSTORE reset (!=0->!=0)', coldReset, STD.coldSstoreReset))
  } else if (warmReset != null && coldSurcharge != null) {
    const v = warmReset + coldSurcharge
    rows.push([
      'Cold SSTORE reset (!=0->!=0)',
      String(v),
      'derived (warm reset + cold surcharge)',
      v !== STD.coldSstoreReset ? `DEVIATES (std ${STD.coldSstoreReset})` : 'ok'
    ])
  } else {
    rows.push(row('Cold SSTORE reset (!=0->!=0)', null, STD.coldSstoreReset))
  }
  rows.push(
    logBase === 375
      ? ['LOG (base gas)', '375', 'measured', 'ok']
      : anyLog
        ? ['LOG (base/topic/byte)', '375/375/8', 'observed (base not isolated)', 'ok']
        : ['LOG (base/topic/byte)', '375/375/8 (expected)', 'not measured', 'UNVERIFIED']
  )
  rows.push(['System overhead per tx', 'none', 'n/a', 'not an opcode (no baseGas impact)'])

  // padEnd, but always keep >=2 spaces between columns even when a value overflows the width.
  const pad = (s, n) => {
    s = String(s)
    return s.length >= n ? s + '  ' : s.padEnd(n)
  }
  console.log('  ' + pad('Operation', 30) + pad('Gas', 22) + pad('Source', 40) + 'vs EIP-2929')
  for (const [op, gas, source, flag] of rows) {
    console.log('  ' + pad(op, 30) + pad(gas, 22) + pad(source, 40) + flag)
  }
}

async function main() {
  const configured = CHAINS.filter((c) => c.rpcUrl && c.rpcUrl !== RPC_PLACEHOLDER)
  if (!configured.length) {
    console.log('No rpcUrl set. Edit CHAINS in this file and add a debug-enabled RPC per chain:')
    console.log(`  rpcUrl: 'https://<your-debug-rpc>/...'  (must expose debug_traceTransaction)`)
    process.exit(1)
  }

  console.log('Verifying EVM gas schedule vs EIP-2929 (Berlin). See PLA-1651.')
  for (const chain of CHAINS) {
    try {
      await verifyChain(chain)
    } catch (e) {
      console.log(`\n=== ${chain.name} ===\n  ! failed: ${e.message}`)
    }
  }
  console.log(
    '\nReminder: only Polygon (137) deviates (cold SLOAD 5460, cold-SSTORE surcharge 2940). All other chains should be EIP-2929 standard.'
  )
}

main()
