/* eslint-env mocha */

const assert = require('assert')
const BitArraySpan = require('../src/pc/common/BitArray')
const BitArrayNoSpan = require('../src/pc/common/BitArrayNoSpan')
const bitarrays = {
  BitArraySpan,
  BitArrayNoSpan
}
Object.entries(bitarrays).forEach(([name, BitArray]) => {
  describe(name, () => {
    /*
    it('throws when instantiating BitArray with bad bitsPerValue', () => {
      assert.throws(() => {
      // eslint-disable-next-line
      new BitArray({
          bitsPerValue: -1,
          capacity: 1
        })
      })
      assert.throws(() => {
      // eslint-disable-next-line
      new BitArray({
          bitsPerValue: 0,
          capacity: 1
        })
      })
      assert.throws(() => {
      // eslint-disable-next-line
      new BitArray({
          bitsPerValue: 65,
          capacity: 1
        })
      })
      assert.doesNotThrow(() => {
      // eslint-disable-next-line
      new BitArray({
          bitsPerValue: 1,
          capacity: 1
        })
        // eslint-disable-next-line
      new BitArray({
          bitsPerValue: 32,
          capacity: 1
        })
      })
    }) */

    it('writes and reads values correctly', () => {
      const bitArr = new BitArray({
        bitsPerValue: 5,
        capacity: 4096
      })
      for (let i = 0; i < 4096; ++i) {
        bitArr.set(i, 8)
        assert.strictEqual(bitArr.get(i), 8)
      }
    })

    it('does not overflow', () => {
      const bitArr = new BitArray({
        bitsPerValue: 4,
        capacity: 4096
      })
      for (let i = 0; i < 8; ++i) {
        bitArr.set(i, 15)
        assert.strictEqual(bitArr.get(i), 15)
      }
      assert(bitArr.data[0] > 0, `${bitArr.data[0]} is negative`)
    })

    /* it('throws when writing out of bounds', () => {
      const bitArr = new BitArray({
        bitsPerValue: 4,
        capacity: 10
      })
      assert.throws(() => {
        bitArr.set(-1, 2)
      })
      assert.throws(() => {
        bitArr.set(10, 2)
      })
      assert.doesNotThrow(() => {
        bitArr.set(0, 2)
      })
      assert.doesNotThrow(() => {
        bitArr.set(9, 2)
      })
    })

    it('throws when reading out of bounds', () => {
      const bitArr = new BitArray({
        bitsPerValue: 4,
        capacity: 10
      })
      assert.throws(() => {
        bitArr.get(-1, 2)
      })
      assert.throws(() => {
        bitArr.get(10, 2)
      })
      assert.doesNotThrow(() => {
        bitArr.get(0, 2)
      })
      assert.doesNotThrow(() => {
        bitArr.get(9, 2)
      })
    })

    it('throws when setting a larger value than allowed', () => {
      const bitArr = new BitArray({
        bitsPerValue: 3,
        capacity: 10
      })
      assert.throws(() => {
        bitArr.set(0, 8)
      })
      assert.doesNotThrow(() => {
        bitArr.set(0, 7)
      })
    }) */

    it('succeeds with resizing', () => {
      const bitArr = new BitArray({
        bitsPerValue: 4,
        capacity: 10
      })
      bitArr.set(0, 7)
      assert.doesNotThrow(() => {
        bitArr.resizeTo(3)
      })
    })
    /*
    it('fails when resizing', () => {
      const bitArr = new BitArray({
        bitsPerValue: 4,
        capacity: 10
      })
      bitArr.set(0, 8)
      assert.throws(() => {
        bitArr.resizeTo(3)
      })
    }) */
    it('convert from array cycle', () => {
      const array = []
      for (let i = 0; i < 4096; i++) array.push(i % 32)
      const bitArr = BitArray.fromArray(array, 5)
      const array2 = bitArr.toArray()
      assert.strictEqual(array.length, array2.length)
      assert.strictEqual(array.length, bitArr.capacity)
      for (let i = 0; i < 4096; i++) {
        assert.strictEqual(bitArr.get(i), array[i])
        assert.strictEqual(array[i], array2[i])
      }
    })

    it('no side-effects Or', () => {
      const a = BitArrayNoSpan.fromLongArray([[0, 1]], 1)
      const b = BitArrayNoSpan.fromLongArray([[0, 2]], 1)
      const c = BitArrayNoSpan.or(a, b)
      assert.strictEqual(a.data[0], 1)
      assert.strictEqual(b.data[0], 2)
      assert.strictEqual(c.data[0], 3)
    })
  })
})

describe('BitArrayNoSpan byte arrays (java.util.BitSet)', () => {
  it('reads bit i from bit i % 8 of byte i / 8', () => {
    const bitArr = BitArrayNoSpan.fromByteArray(Buffer.from([0x01, 0x82, 0x00, 0x02]), 1)
    const set = []
    for (let i = 0; i < bitArr.capacity; i++) if (bitArr.get(i)) set.push(i)
    assert.deepStrictEqual(set, [0, 9, 15, 25])
  })

  it('reads the same bits as the long array encoding', () => {
    const fromBytes = BitArrayNoSpan.fromByteArray(Buffer.from([0x01, 0x82, 0x00, 0x02]), 1)
    const fromLongs = BitArrayNoSpan.fromLongArray([[0, 0x02008201]], 1)
    for (let i = 0; i < 64; i++) assert.strictEqual(fromBytes.get(i), fromLongs.get(i), `bit ${i}`)
  })

  it('writes trailing zero bytes trimmed, like BitSet.toByteArray', () => {
    const bitArr = new BitArrayNoSpan({ capacity: 26, bitsPerValue: 1 })
    bitArr.set(1, 1)
    bitArr.set(10, 1)
    assert.deepStrictEqual(bitArr.toByteArray(), Buffer.from([0x02, 0x04]))
    assert.deepStrictEqual(new BitArrayNoSpan({ capacity: 26, bitsPerValue: 1 }).toByteArray(), Buffer.alloc(0))
  })

  it('cycles through bytes', () => {
    const bytes = Buffer.from([0xff, 0x00, 0x5a, 0x03])
    assert.deepStrictEqual(BitArrayNoSpan.fromByteArray(bytes, 1).toByteArray(), bytes)
  })
})
