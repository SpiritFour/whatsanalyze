# WhatsAnalyze

- Analyze your WhatsApp Chat in Seconds
- Reveal insights & get statistics, while all data stays on your device.
- No chat data is sent to a server it runs only locally in your browser.
 
This is an open-source tool to analyze your WhatsApp Chat and create pdfs from your chat. You can run the code locally on your device or visit whatsanalyze.com to see the hosted "main" branch. The website is hosted on github pages and all code is visible. 

No data about your chat is transferred to any server at all.

![Bildschirmfoto 2021-03-09 um 21 31 28](https://user-images.githubusercontent.com/32100482/110533954-d192e880-811e-11eb-9a0f-ba630014f350.png)

Dev deployment: https://whatsanalyze-80665.web.app

## Encountered an issue?

Please report bugs in the github issues.

# Running whatsanalyze locally

## Build Setup
We use node 16, with 18 we had issues with our linter. The project also needs python to be installed, but the version needs to be `3.11` or lower.

```bash
# install dependencies
$ pnpm install

# serve with hot reload at localhost:3000
$ pnpm dev

# build for production and launch server
$ pnpm build
$ pnpm start

# generate static project
$ pnpm generate
```

Search for prettier and eslint in pycharm to set it up on saving a file. 
You can also add .vue there for running stuff on Vue files as well.

For detailed explanation on how things work, check out [Nuxt.js docs](https://nuxtjs.org).

## HTTPS Certificate

https://letsencrypt.org/docs/certificates-for-localhost/
```bash
openssl req -x509 -out 0.0.0.0.crt -keyout 0.0.0.0.key -newkey rsa:2048 -nodes -sha256 -subj '/CN=localhost' -extensions EXT -config <( printf "[dn]\nCN=localhost\n[req]\ndistinguished_name = dn\n[EXT]\nsubjectAltName=DNS:localhost\nkeyUsage=digitalSignature\nextendedKeyUsage=serverAuth")
```
Also need to install the .crt file and trust it in your system settings

Code to generate certificate installable on android:
```bash
openssl pkcs12 -export -legacy -in localhost.pem -inkey localhost-key.pem -out 0.0.0.0.p12
```
Rename it to .txt and then send per bluetooth. (somehow .p12 is rejected as file format).
On phone need to accept, and then find the file in file app as most recent in downloads section.
Rename again to .p12 and tap to install.

brew install mkcert

mkcert localhost

to install on your mac:
mkcert -install

on android we have to install the root CA to trust the certificate:
- find root ca with mkcert -CAROOT
- transfer the rootCA.pem file to android device
  - might need to rename to .txt for bluetooth transfer
- go to settings > security > encryption and credentials > install certificate > CA certificate
- yes
- select the copied rootCA.pem file

forward port 3000 to android device with chrome on
chrome://inspect/#devices

on android go to https://localhost:3000
