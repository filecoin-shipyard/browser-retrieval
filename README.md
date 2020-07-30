# filecoin-retrieval-browser-extension

The Filecoin Rerieval Browser Extension is a browser-based p2p network for performing retrievals from the Filecoin network. End users will be able to use this tool to retrieve files from a marketplace of competing proviers of data. Retrieval miners will be able to use this tool to generate income by providing files for retrieval.

The tool is currently unfinished, but we hope to launch it in Q3 of 2020.  Get in touch if you'd like to [get involved](#contributing).

- [Install](#install)
- [Add it to your browser](#add-it-to-your-browser)
- [Development status](#development-status)
- [Contributing](#contributing)
- [License](#license)

## Install

```
yarn
```

then

```
yarn build
```

## Add it to your browser

- Chrome

  - Open the Extension Management page by navigating to `chrome://extensions`.
  - Enable Developer Mode by clicking the toggle switch next to “Developer mode“.
  - Click the “Load unpacked“ button
  - Select the extension’s `build/` directory.

- Firefox

  - Navigate to `about:debugging`)
  - Click “This Firefox”
  - Click “Load Temporary Add-on”
  - Open the extension’s `build/` directory and select **any file** inside the folder.

- Edge

  - Open the Extension Management page by navigating to `edge://extensions/`.
  - Enable Developer Mode by clicking the toggle switch next to “Developer mode“.
  - Click the “Load Unpacked“ button
  - Select the extension’s `build/` directory.

## Development Status

| **Payment Channels (PCH)**                      |  API Demonstrated  |
| ----------------------------------------------- | :----------------: |
| Basic browser extension                         | :white_check_mark: |
| Peer to peer networking                         | :white_check_mark: |
| CID discovery by gossipsub (request+response)   | :white_check_mark: |
| Local CID inventory, retrieval deal status      | :white_check_mark: |
| Data transfer (bitswap)                         | :white_check_mark: |
| Can create payment channels + vouchers on chain | :x:                |
| Retrieval from stoage miners                    | :x:                |

## Contributing

Contributions are welcome!  Start by checking the [issues](/issues), or propose a better way to implement this crate.

## License

Dual-licensed under [MIT](https://github.com/filecoin-project/lotus/blob/master/LICENSE-MIT) + [Apache 2.0](https://github.com/filecoin-project/lotus/blob/master/LICENSE-APACHE)