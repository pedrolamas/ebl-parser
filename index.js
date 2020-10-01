const assert = require("assert").strict;
const fs = require("fs");
const zhc = require("zigbee-herdsman-converters/ota/common");

const imageSignature = 0xe350;

const ebltagHeader = 0x0;
const ebltagMetadata = 0xf608;
const ebltagProg = 0xfe01;
const ebltagMfgprog = 0x02fe;
const ebltagEraseprog = 0xfd03;
const ebltagEnd = 0xfc04;

const ebltagEncHeader = 0xfb05;
const ebltagEncInit = 0xfa06;
const ebltagEncEblData = 0xf907;
const ebltagEncMac = 0xf709;

const filename = process.argv[2];

const fileBuffer = fs.readFileSync(filename);

// fix for IKEA OTA images
const start =
  fileBuffer.readUInt32LE(0) === 0x5349474e
    ? 12 + fileBuffer.readUInt16LE(12)
    : 0;

const imageData = zhc.parseImage(fileBuffer.slice(start));

imageData.elements.forEach((element) => {
  const eblData = parseEbl(element.data);

  console.log(eblData);
});

function parseEbl(buffer) {
  const header = parseEblHeader(buffer);

  assert.strictEqual(
    header.signature,
    imageSignature,
    "Not EBL data (failed signature check)"
  );

  let position = 4 + header.len;
  const elements = [];
  while (position < buffer.length) {
    const element = parseEblSubElement(buffer, position);

    elements.push(element);

    if (element.tag == ebltagEnd) {
      break;
    }

    position += 4 + element.len;
  }

  return {
    header,
    elements,
  };
}

function parseEblHeader(buffer) {
  const tag = buffer.readUInt16BE(0);

  assert.ok(
    tag === ebltagHeader || tag === ebltagEncHeader,
    `Unknown header tag 0x${tag.toString(16)}`
  );

  if (tag === ebltagHeader) {
    const size = 16;

    assert.ok(
      buffer.length >= size,
      `EBL header needs at least ${size} bytes, but buffer only has ${buffer.length}`
    );

    const len = buffer.readUInt16BE(2);

    return {
      tag,
      len,
      version: buffer.readUInt16BE(4),
      signature: buffer.readUInt16BE(6),
      flashAddr: buffer.readUInt32BE(8),
      aatCrc: buffer.readUInt32BE(12),
      aatBuff: buffer.slice(16, len + 4),
    };
  } else {
    const size = 10;

    assert.ok(
      buffer.length >= size,
      `EBL encrypted header needs at least ${size} bytes, but buffer only has ${buffer.length}`
    );

    const len = buffer.readUInt16BE(2);

    assert.strictEqual(len, 6, "Incorrect EBL encrypted header length");

    return {
      tag,
      len,
      version: buffer.readUInt16BE(4),
      encType: buffer.readUInt16BE(6),
      signature: buffer.readUInt16BE(8),
    };
  }
}

function parseEblSubElement(data, position) {
  const tag = data.readUInt16BE(position);
  const len = data.readUInt16BE(position + 2);

  switch (tag) {
    case ebltagProg:
    case ebltagMfgprog:
    case ebltagEraseprog:
      assert.ok(
        len >= 2 && len <= 65534,
        `Program subelement length should be between 2 and 65534, but was ${len}`
      );

      return {
        tag,
        len,
        flashAddr: data.readUInt32BE(position + 4),
        flashData: data.slice(position + 8, position + 4 + len),
      };

    case ebltagMetadata:
      assert.ok(
        len >= 1 && len <= 65534,
        `Metadata subelement length should be between 1 and 65534, but was ${len}`
      );

      return {
        tag,
        len,
        metadata: data.slice(position + 4, position + 4 + len),
      };

    case ebltagEncInit:
      return {
        tag,
        len,
        msgLen: data.readUInt32BE(position + 4),
        nonce: data.slice(position + 8, position + 20),
        associatedData: data.slice(position + 20, position + 4 + len),
      };

    case ebltagEncEblData:
      return {
        tag,
        len,
        data: data.slice(position + 4, position + 4 + len),
      };

    case ebltagEncMac:
      assert.ok(
        len === 16,
        `Encrypted Mac subelement length should be 16, but was ${len}`
      );

      return {
        tag,
        len,
        eblMac: data.slice(position + 4, position + 4 + len),
      };

    case ebltagEnd:
      assert.ok(len === 4, `End subelement length should be 4, but was ${len}`);

      return {
        tag,
        len,
        eblCrc: data.readUInt32BE(position + 4),
      };

    default:
      throw new Error(
        `unknown tag 0x${tag.toString(16)} at position ${position}`
      );
  }
}
