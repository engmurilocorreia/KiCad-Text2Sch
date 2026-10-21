/* Minimal ZIP writer using uncompressed entries; entirely local in the browser. */
(function attachZip(root, factory) {
  const api = factory();
  if (root) root.KiCadText2SchZip = api;
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function makeZip() {
  'use strict';
  const encoder = new TextEncoder();
  const crcTable = (() => {
    const table = new Uint32Array(256);
    for (let n = 0; n < 256; n += 1) {
      let c = n;
      for (let k = 0; k < 8; k += 1) c = (c & 1) ? (0xedb88320 ^ (c >>> 1)) : (c >>> 1);
      table[n] = c >>> 0;
    }
    return table;
  })();
  function crc32(bytes) {
    let crc = 0xffffffff;
    for (const byte of bytes) crc = crcTable[(crc ^ byte) & 0xff] ^ (crc >>> 8);
    return (crc ^ 0xffffffff) >>> 0;
  }
  function u16(value) { return [value & 0xff, (value >>> 8) & 0xff]; }
  function u32(value) { return [value & 0xff, (value >>> 8) & 0xff, (value >>> 16) & 0xff, (value >>> 24) & 0xff]; }
  function concat(chunks) {
    const total = chunks.reduce((sum, chunk) => sum + chunk.length, 0);
    const result = new Uint8Array(total);
    let offset = 0;
    for (const chunk of chunks) { result.set(chunk, offset); offset += chunk.length; }
    return result;
  }
  function createZip(files) {
    if (!Array.isArray(files) || !files.length) throw new Error('Não há arquivos para empacotar.');
    if (files.length > 100) throw new Error('O limite do exportador ZIP é de 100 arquivos.');
    const localRecords = [];
    const centralRecords = [];
    let offset = 0;
    for (const file of files) {
      const filename = String(file.filename || file.name || '').replace(/\\/g, '/').replace(/^\/+/, '');
      if (!filename || filename.split('/').some((piece) => piece === '..' || piece === '.')) throw new Error('Nome de arquivo ZIP inválido.');
      const nameBytes = encoder.encode(filename);
      const data = typeof file.content === 'string' ? encoder.encode(file.content) : new Uint8Array(file.content);
      const checksum = crc32(data);
      const localHeader = concat([
        new Uint8Array(u32(0x04034b50)), new Uint8Array(u16(20)), new Uint8Array(u16(0x0800)),
        new Uint8Array(u16(0)), new Uint8Array(u16(0)), new Uint8Array(u16(0)),
        new Uint8Array(u32(checksum)), new Uint8Array(u32(data.length)), new Uint8Array(u32(data.length)),
        new Uint8Array(u16(nameBytes.length)), new Uint8Array(u16(0)), nameBytes
      ]);
      localRecords.push(localHeader, data);
      const centralHeader = concat([
        new Uint8Array(u32(0x02014b50)), new Uint8Array(u16(20)), new Uint8Array(u16(20)),
        new Uint8Array(u16(0x0800)), new Uint8Array(u16(0)), new Uint8Array(u16(0)), new Uint8Array(u16(0)),
        new Uint8Array(u32(checksum)), new Uint8Array(u32(data.length)), new Uint8Array(u32(data.length)),
        new Uint8Array(u16(nameBytes.length)), new Uint8Array(u16(0)), new Uint8Array(u16(0)),
        new Uint8Array(u16(0)), new Uint8Array(u16(0)), new Uint8Array(u32(0)), new Uint8Array(u32(offset)), nameBytes
      ]);
      centralRecords.push(centralHeader);
      offset += localHeader.length + data.length;
    }
    const central = concat(centralRecords);
    const local = concat(localRecords);
    const end = concat([
      new Uint8Array(u32(0x06054b50)), new Uint8Array(u16(0)), new Uint8Array(u16(0)),
      new Uint8Array(u16(files.length)), new Uint8Array(u16(files.length)),
      new Uint8Array(u32(central.length)), new Uint8Array(u32(local.length)), new Uint8Array(u16(0))
    ]);
    return new Blob([local, central, end], { type: 'application/zip' });
  }
  return { createZip, crc32 };
});
