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

```bash
# install dependencies
$ yarn install

# serve with hot reload at localhost:3000
$ yarn dev

# build for production and launch server
$ yarn build
$ yarn start

# generate static project
$ yarn generate
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
openssl pkcs12 -export -in 0.0.0.0.crt -inkey 0.0.0.0.key -out 0.0.0.0.p12
```
