/* eslint-env mocha */

const assert = require('assert')
const { Vec3 } = require('vec3')

// 26.3 (protocol 777) changed the BitSet codec of the light masks from a long array to a byte array
const wireFormats = [
  { version: '26.2', maskType: 'long array', isWireMask: mask => Array.isArray(mask) && mask.every(long => Array.isArray(long)) },
  { version: '26.3', maskType: 'byte array', isWireMask: mask => Buffer.isBuffer(mask) }
]

for (const { version, maskType, isWireMask } of wireFormats) {
  const supported = require('minecraft-data')(version) !== null
  ;(supported ? describe : describe.skip)(`light masks on ${version} are a ${maskType}`, () => {
    const ChunkColumn = supported && require('prismarine-chunk')(version)
    const sectionLight = level => Buffer.alloc(2048, level * 0x11)

    it('dumpLight writes the masks in the wire format', () => {
      const column = new ChunkColumn()
      column.setSkyLight(new Vec3(0, -64, 0), 15)
      column.setBlockLight(new Vec3(0, 20, 0), 7)
      const light = column.dumpLight()
      for (const mask of ['skyLightMask', 'blockLightMask', 'emptySkyLightMask', 'emptyBlockLightMask']) {
        assert(isWireMask(light[mask]), `${mask} is ${JSON.stringify(light[mask])}`)
      }
    })

    it('cycles the masks through dumpLight and loadParsedLight', () => {
      const column = new ChunkColumn()
      column.setSkyLight(new Vec3(0, -64, 0), 15)
      column.setSkyLight(new Vec3(0, 100, 0), 15)
      column.setBlockLight(new Vec3(3, 20, 5), 7)
      const light = column.dumpLight()
      const column2 = new ChunkColumn()
      column2.loadParsedLight(light.skyLight, light.blockLight, light.skyLightMask, light.blockLightMask, light.emptySkyLightMask, light.emptyBlockLightMask)
      const light2 = column2.dumpLight()
      for (const mask of ['skyLightMask', 'blockLightMask', 'emptySkyLightMask', 'emptyBlockLightMask']) {
        assert.deepStrictEqual(light2[mask], light[mask], mask)
      }
      assert.strictEqual(light2.skyLight.length, 2)
      assert.strictEqual(light2.blockLight.length, 1)
    })

    if (version === '26.3') {
      it('loadParsedLight reads the sections a byte array mask names', () => {
        // bit 1: the first section of the world (y -64 to -49), bit 3: y -32 to -17; bit 0 is the section below the world
        const column = new ChunkColumn()
        column.loadParsedLight([sectionLight(15), sectionLight(9)], [], Buffer.from([0x0a]), Buffer.alloc(0), Buffer.alloc(0), Buffer.alloc(0))
        assert.strictEqual(column.getSkyLight(new Vec3(0, -64, 0)), 15)
        assert.strictEqual(column.getSkyLight(new Vec3(0, -48, 0)), 0)
        assert.strictEqual(column.getSkyLight(new Vec3(0, -32, 0)), 9)
      })
    }
  })
}
