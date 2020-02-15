const assert = require("assert");
const fs = require("fs");
const zhc = require("zigbee-herdsman-converters/ota/common");

const imageSignature = 0xe350;

const ebltagHeader = 0x0;
const ebltagProg = 0xfe01;
const ebltagMfgprog = 0x02fe;
const ebltagEraseprog = 0xfd03;
const ebltagEnd = 0xfc04;

const filename = process.argv[2];

const fileBuffer = fs.readFileSync(filename);

const imageData = zhc.parseImage(fileBuffer);

imageData.elements.forEach(element => {
  const eblData = parseEbl(element.data);

  console.log(eblData);
});

function parseEbl(buffer) {
  assert(buffer.length >= 16, "Not EBL data");

  const header = {
    tag: buffer.readUInt16BE(0),
    len: buffer.readUInt16BE(2),
    version: buffer.readUInt16BE(4),
    signature: buffer.readUInt16BE(6),
    flashAddr: buffer.readUInt32BE(8),
    aatCrc: buffer.readUInt32BE(12)
  };

  assert(
    header.tag === ebltagHeader && header.signature === imageSignature,
    "Not EBL data"
  );

  const data = buffer.slice(16, 4 + header.len);

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
    data,
    elements
  };
}

function parseEblSubElement(data, position) {
  const tag = data.readUInt16BE(position);
  const len = data.readUInt16BE(position + 2);

  switch (tag) {
    case ebltagProg:
    case ebltagMfgprog:
    case ebltagEraseprog:
      return {
        tag,
        len,
        flashAddr: data.readUInt32BE(position + 4),
        data: data.slice(position + 8, position + 4 + len)
      };

    case ebltagEnd:
      return {
        tag,
        len,
        eblCrc: data.readUInt32BE(position + 4)
      };

    default:
      throw new Error(
        "unknown tag 0x" + tag.toString(16) + " at position " + position
      );
  }
}
