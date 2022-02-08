# Ebl Parser

[![Project Maintenance](https://img.shields.io/maintenance/no/2020.svg)](https://github.com/pedrolamas/ebl-parser 'GitHub Repository')
[![License](https://img.shields.io/github/license/pedrolamas/ebl-parser.svg)](https://github.com/pedrolamas/ebl-parser/blob/master/LICENSE 'License')

[![Twitter Follow](https://img.shields.io/twitter/follow/pedrolamas?style=social)](https://twitter.com/pedrolamas '@pedrolamas')

> ## Deprecation notice
>
> This repo has been deprecated as it is legacy and no longer maintained.
>
> I recommend checking my [silabs-image-parser](https://github.com/pedrolamas/silabs-image-parser) as a replacement for this.

At the moment, this is mostly an investigation on how to parse sub-elements EBL data from a Zigbee OTA file parsed by [zigbee-herdsman-converters](https://github.com/Koenkk/zigbee-herdsman-converters)

## Usage

```sh
node.exe index.js <path-to-ota-file>
```

## References

- https://github.com/SiliconLabs/sdk_support/blob/ff45be117a5a1a20d27296628b0632523f65c66a/platform/base/hal/micro/cortexm3/common/ebl.h
- https://github.com/Koenkk/zigbee-herdsman-converters/blob/bda892b48a/ota/common.js
