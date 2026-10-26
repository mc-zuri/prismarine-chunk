/* eslint-env mocha */
const assert = require('assert')
const { Vec3 } = require('vec3')

// The columns of Bedrock 0.14 - 1.0 have no block states: a block's state id is its id and data value
for (const [version, height] of [['bedrock_0.14', 128], ['bedrock_0.15', 128], ['bedrock_1.0', 256]]) {
  describe(`${version} column`, () => {
    const Chunk = require('prismarine-chunk')(version)

    it('reads and writes blocks by state id', () => {
      const chunk = new Chunk({})
      const pos = new Vec3(1, 2, 3)
      chunk.setBlockStateId(pos, (35 << 4) | 14)
      assert.strictEqual(chunk.getBlockType(pos), 35)
      assert.strictEqual(chunk.getBlockData(pos), 14)
      assert.strictEqual(chunk.getBlockStateId(pos), (35 << 4) | 14)
    })

    it('tells its bounds and sections', () => {
      const chunk = new Chunk({})
      assert.strictEqual(chunk.minY, 0)
      assert.strictEqual(chunk.worldHeight, height)
      assert.strictEqual(chunk.sections.length, height / 16)
      assert.strictEqual(chunk.getBlockStateId(new Vec3(0, height, 0)), 0)
    })

    it('survives a JSON round trip', () => {
      const chunk = new Chunk({})
      const pos = new Vec3(4, 5, 6)
      chunk.setBlockStateId(pos, (17 << 4) | 2)
      const back = Chunk.fromJson(chunk.toJson())
      assert.strictEqual(back.getBlockStateId(pos), (17 << 4) | 2)
      assert.strictEqual(back.getBlock(pos).name, chunk.getBlock(pos).name)
    })
  })
}
