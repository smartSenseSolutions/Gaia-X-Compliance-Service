# Gaia-X Lab Compliance Service

main
branch: [![main pipeline status](https://gitlab.com/gaia-x/lab/compliance/gx-compliance/badges/main/pipeline.svg)](https://gitlab.com/gaia-x/lab/compliance/gx-compliance/-/commits/main)

development
branch: [![development pipeline status](https://gitlab.com/gaia-x/lab/compliance/gx-compliance/badges/development/pipeline.svg)](https://gitlab.com/gaia-x/lab/compliance/gx-compliance/-/commits/development)

[[_TOC_]]

This repository contains the official implementation of the Gaia-X Compliance.

**Warning**: Gaia-X Compliance is not obtained by using a software but by using specific versions of the compliance
instances. See [GXDCH](https://gaia-x.eu/gxdch/).

## Try out

You can use an instance of the Gaia-X Wizard [here](https://wizard.lab.gaia-x.eu).

## Existing deployments

In addition to the [GXDCH](https://gaia-x.eu/gxdch/) instances, the Gaia-X Lab maintains several instances:

| Deployment URL                                                    | Usage                                                    | Content                                                                |
|-------------------------------------------------------------------|----------------------------------------------------------|------------------------------------------------------------------------|
| [`v1`, `v1.x.x`](https://compliance.lab.gaia-x.eu/v1/docs/)       | Used to verify and claim Gaia-X Compliance.              | Latest Tagus release.                                                  |
| [`v1-staging`](https://compliance.lab.gaia-x.eu/v1-staging/docs/) | Used to verify and claim Gaia-X Compliance.              | Latest Tagus release. Production rules not enforced (non-EV SSL valid) |
| [`v2`](https://compliance.lab.gaia-x.eu/v2/docs/)                 | Used to verify and claim Gaia-X Compliance.              | Latest Loire release. Production rules not enforced (non-EV SSL valid) |
| [main](https://compliance.lab.gaia-x.eu/main/docs/)               | Used for playground activities.                          | Latest stable (main branch)                                            |
| [development](https://compliance.lab.gaia-x.eu/development/docs/) | Used for playground activities.                          | Latest unstable (development branch)                                   |

## Images tags

This repo provides
several [images tags](https://gitlab.com/gaia-x/lab/compliance/gx-compliance/container_registry/3036427).

| tag           | content              | example |
|---------------|----------------------|---------|
| `vX`          | latest major version | v1      |
| `vX.Y`        | latest minor version | v1.1    |
| `vX.Y.Z`      | specific version     | v1.1.1  |
| `main`        | latest stable        |         |
| `development` | latest unstable      |         |

Feature branches are also build and push to the container registry.

## Deployment

A helm chart is provided inside <a href="k8s/gx-compliance">k8s/gx-compliance</a> folder.

It provides several environment variables for the application:

| Env Variable        | Name in values file            | Default value                                                                                   | Note                                                                                                            |
|---------------------|--------------------------------|-------------------------------------------------------------------------------------------------|-----------------------------------------------------------------------------------------------------------------|
| APP_PATH            | ingress.hosts[0].paths[0].path | /main                                                                                           | Deployment path of the application                                                                              |
| BASE_URL            |                                | https://<ingress.hosts[0].host>/<ingress.hosts[0].paths[0].path>                                | URL of the deployed application                                                                                 |
| REGISTRY_URL        | urls.registry                  | http://<ingress.hosts[0].host>.replace("compliance","registry")/<ingress.hosts[0].path[0].path> | defaulted to same namespace registry                                                                            |
| privateKey          | privateKey                     | base64 value of "empty"                                                                         | This value is assigned automatically and contains the privateKey content. Stored in a secret in the cluster     |
| X509_CERTIFICATE    | X509_CERTIFICATE               | base64 value of "empty"                                                                         | This value is assigned automatically and contains the x509 certificate chain. Stored in a secret in the cluster |
| SD_STORAGE_BASE_URL | urls.storage                   | https://example-storage.lab.gaia-x.eu                                                           |                                                                                                                 |
| SD_STORAGE_API_KEY  | storageApiKey                  | "Nothing"                                                                                       |                                                                                                                 |
| production          | production                     | true                                                                                            | Whether the component is deployed on production mode. Enables more checks                                       |
| dburl               | dburl                          | bolt://{{ include "gx-compliance.fullname" . \| trunc 50 \| trimSuffix "-"}}-memgraph:7687      | URL to connect to memgraph                                                                                      |
| ntpServers          | ntpServers                     | 0.pool.ntp.org,1.pool.ntp.org,2.pool.ntp.org,3.pool.ntp.org                                     | Array of NTP servers to call. Will be piped to toJson and quote                                                 |

Usage example:

```shell
helm upgrade --install -n "<branch-name>" --create-namespace gx-compliance ./k8s/gx-compliance --set "nameOverride=<branch-name>,ingress.hosts[0].host=compliance.lab.gaia-x.eu,ingress.hosts[0].paths[0].path=/<branch-name>,image.tag=<branch-name>,ingress.hosts[0].paths[0].pathType=Prefix,privateKey=$complianceKey,X509_CERTIFICATE=$complianceCert"
```

For a tag:

```shell
helm upgrade --install -n "v1" --create-namespace gx-compliance ./k8s/gx-compliance --set "nameOverride=v1,ingress.hosts[0].host=compliance.lab.gaia-x.eu,ingress.hosts[0].paths[0].path=/v1,image.tag=v1,ingress.hosts[0].paths[0].pathType=Prefix,privateKey=$complianceKey,X509_CERTIFICATE=$complianceCert"
```

Syntax for ntpServers
```shell
helm upgrade ... --set "...,ntpServers[0]=firstServer.com,ntpServers[1]=secondServer.com"
```

This component requires a memgraph database. It is provided in the deployment and can be deactivated by putting `memgraphEnabled` to false. Please use `dburl` to then point on your memgraph database

The deployment is triggered automatically on `development` and `main` branches, as well as on release. Please refer
to [Gaia-X Lab Compliance Service](#gaia-x-lab-compliance-service) for available instances.

## Containers signature

Containers are signed using [cosign](https://docs.gitlab.com/ee/ci/yaml/signing_examples.html). You can assert yourself
that the containers are signed using cosign client [verify](https://docs.gitlab.com/ee/ci/yaml/signing_examples.html#container-images-1)

Example verifying the signature of the image built for tag `v1.7.0`:

```shell
docker run -it bitnami/cosign:latest verify --certificate-identity "https://gitlab.com/gaia-x/lab/compliance/gx-compliance//.gitlab-ci.yml@refs/tags/v1.7.0" --certificate-oidc-issuer "https://gitlab.com" registry.gitlab.com/gaia-x/lab/compliance/gx-compliance:v1.7.0
```

### Cluster policy using Kyverno

The k8s folder contains a Kyverno ClusterPolicy ensuring the image you're deploying is properly signed and issued from Gaia-X AISBL

If you have deployed Kyverno on your cluster, this will be enforced automatically on each deployment.


[Demo policy](https://playground.kyverno.io/#/?content=N4IgDg9gNglgxgTxALhAQzDAagUwE4DOMEAdsgAQDWCAbviRAHTED0NAjADomUwkAmFAMJQArgQAu%2BAArR4CbgFscEtPzSrk3cuRJplFOnhgAzBAFoYitAHMc28mhINVE4iQJaSOnZFhwYHAJGaiMGZggWNwkoHApcYzNyAElrOwdfOQCgkNp6JlY4DRwbCDwECgBlCBMJAHc0PBxyStEwMCgEciEACzQ%2BFpw4UWMJBAAacgBRAGlK8gAhIIlyaTw0ODc4IIzyP3hA4ND8iJYCHCMYMYplfhhRRV397KO8vHDWAlEAIwArIYkFFk/CeWUOuTCBUiij4RiIpAo7EYAHZGAAGUH%2BcHHd5Qlj8IJwYxgNwI8gAPnMux0AFUiCQbOQJD1mkIIEQbN4wHgIP9NpMAPJCZLkKy2ILkaxdb7NDkkHD8JkQcg4DwjWVtDpdOB9PjU8jnYajLowAiS/okVR8BWMcgAFR67NlME5GnVZqK3hl5EuJkCiplJjKzTAoigsAZostEH1aHIcDEknwtodpr2WW1LLglDNzOdrok6vINUc3jFdnITUg8bQ4YV%2BpsPSJpxxDCiy3Mvos5eaEmVqq%2BTVFKz6ZplqoNLvlAa6Xb4Nn1VzNcrdQ9sFskTJZex5NBgBMVoe%2B/ioOAQKZ6aeeXXOeDoZrQD7L4fEEnWpO8Qbw%2BsddSV8dIP0bCLOMiBhKBGkrMNmicRU6hgcNKxwABHUQYCHKsIICSN4OZcgEAgEZRTSHAAAoCAASlLRVKDPYJuAIMAhi8HQaFrfcNHcAAxfoxCaABBTZ3AoVUv22Bxvg2SgbB5UQBAoExa3OBw8GgzxdnMXR9DiH18FMbsSP1awJB1FifHMpwKn1czNKaAhCLwbZ1O8czXPM3gBGctzvJ8TTgX1LtUnFLzvM0nsACUcBMfBVScsyfJ0WySlNN9zxsK4IO%2BRg4AgRQWBsfo0HMAAPFhMpYHLFA6GAnG2fLivMSrqtquIACprJ8RRRFcHAABEXWWCg31EewXJ8jQpEkMoQoS8hNNVN9Dni2bfNPBBYgIGaVrcr4/gBChOBAHoJAkMBPBYfKMrQLLKvywqSrK66Kty5qSDqmwGqa2AWouxh0pia7GpgRgEEUKAAAEmhMAgWHakAOu200vnwA6jpOs7kAu/7Muy3LDoRlamkoMplu2tyRigChjtO86WCJspGA5KamkYAkaG4EBxhAOyHO2FB0EwBJ4TIH0uB4PhBFWCAQRIZRVHUTQHEynAoC21SRYZPhiocPQDF0dKSG1lzdaCMANh0glFLDCQGKYuAzJyy0LXwLawpIigmnSyRyj%2Bq6btyu6aoe8qvpqt6cHqxqXu%2B8PkA4fUTYoTXDf1HmRji8hgAAX05kBoH4SL7PTnB%2Bdzx2pGKiR%2BcoH56BUIIzLhYTyAAciRAAmZEW%2B4bhy5wSuzPEehtIoFvu5cmTCIx8gAG0AF0VOgBvZ4XlyE1ffBwqXzwV517TGPNgAZa6VZ37OHAgJj32boRwqmfi7SmBx%2BHKcK5IUpTRu4EwIJsEKcrlMtHslQpyrhwJFSARA%2BzlFHuPHQ/dtgkncFtVU11YiS2GqNcyJsD7bFgQ4MSOAeIIXVLIfwCBkicmDMtVBx4FQf1VlgncEApCbAALJOHFAXIIvMG67FoeghhykXKexSjA3YtYoAQDqMkDwQx1RCKYb4MMUBKhDCaBIHe89dhEgVAtGqUAAASKsr5bUSuQS2aBrb6k0voNAAAvUgNjHD2PVM4/6PQfjuIgBAGwsQe4kDYsYNBy9s5l0Ai6fmGBsAu2bvHcW8lugRJsBwsASgVBqA0GgMyicqBvAYHvZQuCdKthjAILJZkBF9SilYqAEhIpe1Smw7qnEyQt0wXAixNTrYNLERUCxEBszJmIA4AAxABRQ1gDQ4DNu%2BBU5BYCSAcAgsQBIADislp4twIAgJMihkAMAJAQTp4zKpTPOLM4oipFk2xcis0QBI6TDyKfglypzcrnJmY0K5CyUrLOKuvAkW8NqvJ0O8yZoEvlzOuX8u5ALVk4BEBvPAwLl5jxUjw4uXEEJSEIBQAAPrsGerVxilPGK1Ve5kZ5TDoJacl5LKU%2BGJaS2u5gdl7IZUSklNcZTmCPP4TlY1Z7ctZYcnA5hYiPhwIKqlAA5aW0qSUUqJfxaQyQ1F3ngIqmVTK7QQFoiQSKe4cB1HpcqoVM9Wh7U2IJJyBAjWBFNUqxlOhLUqxMFavkEhbVBHtRcR1ZqXWzwWBLecgaiUQP8GgNREhw0Wv4vwGEm13AQLKLG51RKkVJjwAmpNwtU14HTTq11CwpKTzkvwSonoC1FvNVSrNuLS3ZnLQIKtTga1xvrYmXFqL6WlOQHWplDbN5LxDQIMN3L8kQAHUGt1mrti2sInSslpTZ1shIEBVJpKp3bshGu5JW6V1TvMHLYwcACCzt6jMqRoMFq7vyPe3Es6ABSEBviPoYB%2BiA5hHT6r5U0cwBJYhSFnbKlQdQyiUDIfIL9X7Z3An6gQVSSDSALAeXYWNR690RqXrB/tg7XWorHXcBkeGp0zqJWo3RmGd2lLZTQOAEITgEAY4wAjs8NV7m2GRyE9G4Czs41qnj%2BQ%2BMnpUGei9lH8BcZwGw0gVwyjCdxKJ28MmT3yegfB6WSmGDmEmhIOeZdXy5ULrwq9foSBXGQaXLm69s2meLgQGzIAEEzI/E51AIAs5AA===)

## See also

- [API Usage](./README-api.md)
- [Development and local testing](./README-developer.md)
