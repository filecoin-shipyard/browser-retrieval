# Filecoin Browser-based Retrieval Market

The Filecoin Browser Retrieval Market is a browser-based p2p network that functions like a CDN for content that was originally retrieved from the Filecoin storage network.

Users seeking content can use this tool to retrieve files from a marketplace of competing providers of Filecoin content. Retrieval miners who seek to earn income can use this tool to buy content from miners on the Filecoin storage network and then re-sell it here on the Retrieval Market.

**This tool is currently alpha software.** It can perform the functions described above, albeit with some limitations.  Get in touch if you'd like to [get involved](#contributing) with continuing to develop it.

- [Install](#install)
- [Add it to your browser](#add-it-to-your-browser)
- [Development status](#development-status)
- [The Network](#the-network)
- [Contributing](#contributing)
- [License](#license)

## Build

You'll need [yarn](https://classic.yarnpkg.com/en/) installed.

git clone this repo, and then

```
git checkout 0.1.0   # or latest tagged release
yarn
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

Caveat: This is alpha-stage software. There are bugs and **you can lose money**. Do not test with a wallet containing > 0.5 FIL.

Our roadmap is best visualized by installing [Zenhub](https://www.zenhub.com/) and then viewing the project's [Zenhub board](https://github.com/filecoin-shipyard/browser-retrieval/blob/master/README.md#zenhub).

## Contributing

The project is very welcoming to new contributors.  If you're looking for something to work on, pick up an [issue](/issue) or propose a new feature you would like to add.

## License

Dual-licensed under [MIT](https://github.com/filecoin-project/lotus/blob/master/LICENSE-MIT) + [Apache 2.0](https://github.com/filecoin-project/lotus/blob/master/LICENSE-APACHE)
