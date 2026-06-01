/**
 * IEEE 802.3 CRC-32 polynomial in LSB-first (reflected) form.
 * MSB-first form is 0x04C11DB7.
 *
 * Used by Ethernet, ZIP, PNG, gzip, and other formats.
 *
 * @see https://en.wikipedia.org/wiki/Computation_of_cyclic_redundancy_checks
 * @see https://wiki.osdev.org/CRC32
 */
const CRC32_POLYNOMIAL = 0xedb88320;

/**
 * Processes a single bit of the CRC calculation.
 *
 * If the LSB is set, shift right and XOR with the polynomial.
 * Otherwise, just shift right.
 *
 * @param value - Current CRC value
 * @returns Next CRC value after processing one bit
 */
function processBit(value: number): number {
  const hasLowBit = (value & 1) === 1;
  const shifted = value >>> 1;
  return hasLowBit ? CRC32_POLYNOMIAL ^ shifted : shifted;
}

/**
 * Generates a single CRC32 lookup table entry.
 *
 * Each entry is computed by processing 8 bits (one byte value).
 *
 * @param byteValue - The byte value (0-255) to generate entry for
 * @returns The CRC32 table entry for this byte
 */
function generateTableEntry(byteValue: number): number {
  let crc = byteValue;
  for (let bit = 0; bit < 8; bit++) {
    crc = processBit(crc);
  }
  return crc >>> 0;
}

/**
 * Builds the complete CRC32 lookup table.
 *
 * The table contains 256 entries, one for each possible byte value.
 * Using a lookup table converts 8 bit operations into a single table lookup.
 *
 * @see https://github.com/Michaelangel007/crc32
 * @returns Pre-computed CRC32 lookup table
 */
export function buildCrc32Table(): Uint32Array {
  const table = new Uint32Array(256);
  for (let i = 0; i < 256; i++) {
    table[i] = generateTableEntry(i);
  }
  return table;
}

/**
 * Pre-computed CRC32 lookup table.
 * Computed once at module load time.
 */
export const CRC32_TABLE = buildCrc32Table();

/**
 * Calculates CRC32 checksum for the given data.
 *
 * Algorithm:
 * 1. Initialize CRC to 0xFFFFFFFF (all 1s)
 * 2. For each byte: XOR with CRC, lookup in table, XOR result with shifted CRC
 * 3. Finalize by inverting all bits (XOR with 0xFFFFFFFF)
 *
 * @see https://web.mit.edu/freebsd/head/sys/libkern/crc32.c
 * @param data - The data to calculate checksum for
 * @returns The CRC32 checksum as an unsigned 32-bit integer
 */
export function crc32(data: Uint8Array): number {
  let crc = 0xffffffff;
  for (let i = 0; i < data.length; i++) {
    const lookupIndex = (crc ^ data[i]) & 0xff;
    crc = (crc >>> 8) ^ CRC32_TABLE[lookupIndex];
  }
  return (crc ^ 0xffffffff) >>> 0;
}
