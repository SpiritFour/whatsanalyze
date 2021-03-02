# chat-analyzer-nuxt

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
