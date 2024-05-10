## GSC

```shell
cd ../gsc
source ../.env-multilined
docker build -t compliance:sgx ../gx-compliance
./gsc build compliance:sgx ../gx-compliance/gramine/compliance.manifest
./gsc sign-image compliance:sgx ~/.config/gramine/enclave-key.pem
docker run --device=/dev/sgx_enclave --device=/dev/sgx_provision --volume /var/run/aesmd/aesm.socket:/var/run/aesmd/aesm.socket --privileged --env-file .env --env X509_CERTIFICATE=$X509_CERTIFICATE --env privateKey=$privateKey --name=sgx registry.gitlab.com/gaia-x/lab/compliance/gx-compliance:feat-build-for-gramine-sgx
docker stop sgx && docker rm sgx
docker system prune 
```

## Gramine

```shell
cd /root/gx-compliance
gramine-direct compliance2 dist/src/main.js ## test without SGX enclave but with gramine
gramine-sgx-sign --manifest gramine/compliance2.manifest --output gramine/compliance2.manifest.sgx
gramine-sgx compliance2 dist/src/main.js
```

## Using Docker Compose

Create your own environment script by copying & modifying `.env.example` and source it
This is due to the inability for docker-compose to read multi lined env files

```bash
cp .env.example .env
nano .env
source .env
 docker compose -f gramine/docker-compose-sgx.yaml up
 ```