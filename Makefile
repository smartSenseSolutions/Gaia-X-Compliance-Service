SHELL := /bin/bash

.PHONY: clean
clean:
	(docker stop sgx || true) && (docker rm sgx || true)
	(docker rmi gsc-compliance:sgx gsc-compliance:sgx-unsigned || true)
	(docker system prune -f || true)

.PHONY: build
build:
	source /root/.env-multilined
	docker build -t compliance:sgx .
	(cd /root/gsc && ./gsc build compliance:sgx /home/ubuntu/gx-compliance/gramine/compliance.manifest && ./gsc sign-image compliance:sgx /root/.config/gramine/enclave-key.pem)

.PHONY: run
run:
	source ../.env-multilined && docker run --device=/dev/sgx_enclave --privileged --env-file /root/.env --env X509_CERTIFICATE=$X509_CERTIFICATE --env privateKey=$privateKey -p 3000:3000 --name=sgx gsc-compliance:sgx
