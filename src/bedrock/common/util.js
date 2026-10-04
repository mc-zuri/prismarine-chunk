const xxhash = require('xxhash-wasm')
let hasher
module.exports = {
  // An NBT payload with the longs that JSON has as strings (ChunkColumn.toJson) back as bigints
  reviveLongs (type, value) {
    if (type === 'long') return typeof value === 'string' ? BigInt(value) : value
    if (type === 'list' && Array.isArray(value.value)) value.value = value.value.map(item => module.exports.reviveLongs(value.type, item))
    if (type === 'compound') for (const tag of Object.values(value)) tag.value = module.exports.reviveLongs(tag.type, tag.value)
    return value
  },

  async getChecksum (buffer) {
    if (!hasher) {
      hasher = await xxhash()
    }
    // with node 16, below would work
    // return hasher.h64Raw(buffer)
    // with node 14, no i64 wasm interface, need to read two u32s from Uint8Array
    const hash = hasher.h64Raw(buffer)
    const hi = BigInt((hash[0]) | ((hash[1]) << 8) | ((hash[2]) << 16) | ((hash[3]) << 24))
    const lo = BigInt((hash[4]) | ((hash[5]) << 8) | ((hash[6]) << 16) | ((hash[7]) << 24))
    return BigInt.asUintN(32, hi) << 32n | BigInt.asUintN(32, lo)
  }
}
