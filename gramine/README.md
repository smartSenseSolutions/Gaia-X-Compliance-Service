## GSC

```shell
cd ../gsc
source ../.env-multilined
docker build -t compliance:sgx ../gx-compliance
./gsc build compliance:sgx ../gx-compliance/gramine/compliance.manifest
./gsc sign-image compliance:sgx ~/.config/gramine/enclave-key.pem
docker run --device=/dev/sgx_enclave --privileged --env-file .env --env X509_CERTIFICATE=$X509_CERTIFICATE --env privateKey=$privateKey --name=sgx gsc-compliance:sgx
docker stop sgx && docker rm sgx
docker rmi gsc-compliance:sgx gsc-compliance:sgx-unsigned
docker system prune 
```

## Gramine

```shell
cd /root/gx-compliance
gramine-direct compliance2 dist/src/main.js ## test without SGX enclave but with gramine
gramine-sgx-sign --manifest gramine/compliance2.manifest --output gramine/compliance2.manifest.sgx
gramine-sgx compliance2 dist/src/main.js
```