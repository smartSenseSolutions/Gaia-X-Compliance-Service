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

| Deployment URL                                                              | Usage                                                    | Content                                                        |
|-----------------------------------------------------------------------------|----------------------------------------------------------|----------------------------------------------------------------|
| [`v1`, `v1.x.x`](https://compliance.lab.gaia-x.eu/v1/docs/)                 | Used to verify and claim Gaia-X Compliance.              | Latest stable release. Version deployed on the Clearing Houses |
| [`2206-unreleased`](https://compliance.lab.gaia-x.eu/2206-unreleased/docs/) | Used to verify and claim Gaia-X Compliance with 2206 TF. | Outdated 2206-unreleased version                               |
| [main](https://compliance.lab.gaia-x.eu/main/docs/)                         | Used for playground activities.                          | Latest stable (main branch)                                    |
| [development](https://compliance.lab.gaia-x.eu/development/docs/)           | Used for playground activities.                          | Latest unstable (development branch)                           |

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

| Env Variable        | Name in values file            | Default value                                                                                   | Note                                                                                                                                                                                |
|---------------------|--------------------------------|-------------------------------------------------------------------------------------------------|-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| APP_PATH            | ingress.hosts[0].paths[0].path | /main                                                                                           | Deployment path of the application                                                                                                                                                  |
| BASE_URL            |                                | https://<ingress.hosts[0].host>/<ingress.hosts[0].paths[0].path>                                | URL of the deployed application                                                                                                                                                     |
| REGISTRY_URL        | urls.registry                  | http://<ingress.hosts[0].host>.replace("compliance","registry")/<ingress.hosts[0].path[0].path> | defaulted to same namespace registry                                                                                                                                                |
| privateKey          | privateKey                     | base64 value of "empty"                                                                         | This value is assigned automatically and contains the privateKey content. Stored in a secret in the cluster                                                                         |
| PRIVATE_KEY_ALG     | privateKeyAlg                  | PS256                                                                                           | the private key signature algorithm such as the ones described in the [`JsonWebSignature2020` library readme](https://gitlab.com/gaia-x/lab/json-web-signature-2020#key-algorithms) | This value is assigned automatically and contains the privateKeyAlg content. Stored in a secret in the cluster  |
| X509_CERTIFICATE    | X509_CERTIFICATE               | base64 value of "empty"                                                                         | This value is assigned automatically and contains the x509 certificate chain. Stored in a secret in the cluster                                                                     |
| production          | production                     | true                                                                                            | Whether the component is deployed on production mode. Enables more checks                                                                                                           |
| dburl               | dburl                          | bolt://{{ include "gx-compliance.fullname" . \| trunc 50 \| trimSuffix "-"}}-memgraph:7687      | URL to connect to memgraph                                                                                                                                                          |
| ntpServers          | ntpServers                     | 0.pool.ntp.org,1.pool.ntp.org,2.pool.ntp.org,3.pool.ntp.org                                     | Array of NTP servers to call. Will be piped to toJson and quote                                                                                                                     |

Usage example:

```shell
helm upgrade --install -n "<branch-name>" --create-namespace gx-compliance ./k8s/gx-compliance --set "nameOverride=<branch-name>,ingress.hosts[0].host=compliance.lab.gaia-x.eu,ingress.hosts[0].paths[0].path=/<branch-name>,image.tag=<branch-name>,ingress.hosts[0].paths[0].pathType=Prefix,privateKey=$complianceKey,privateKeyAlg=$complianceKeyAlg,X509_CERTIFICATE=$complianceCert"
```

For a tag:

```shell
helm upgrade --install -n "v1" --create-namespace gx-compliance ./k8s/gx-compliance --set "nameOverride=v1,ingress.hosts[0].host=compliance.lab.gaia-x.eu,ingress.hosts[0].paths[0].path=/v1,image.tag=v1,ingress.hosts[0].paths[0].pathType=Prefix,privateKey=$complianceKey,privateKeyAlg=$complianceKeyAlg,X509_CERTIFICATE=$complianceCert"
```

Syntax for ntpServers
```shell
helm upgrade ... --set "...,ntpServers[0]=firstServer.com,ntpServers[1]=secondServer.com"
```

This component requires a memgraph database. It is provided in the deployment and can be deactivated by putting `memgraphEnabled` to false. Please use `dburl` to then point on your memgraph database

The deployment is triggered automatically on `development` and `main` branches, as well as on release. Please refer
to [Gaia-X Lab Compliance Service](#gaia-x-lab-compliance-service) for available instances.

## Containers signature

Containers are signed using [cosign](https://docs.gitlab.com/ee/ci/yaml/signing_examples.html). You can assert yourself that the containers is signed using cosign client [verify](https://docs.gitlab.com/ee/ci/yaml/signing_examples.html#container-images-1)

Example verifying the signature of the image built for branch `feat/sign-docker-image`:
```shell
docker run -it bitnami/cosign:latest verify --certificate-identity "https://gitlab.com/gaia-x/lab/compliance/gx-compliance//.gitlab-ci.yml@refs/heads/feat/sign-docker-image" --certificate-oidc-issuer "https://gitlab.com" registry.gitlab.com/gaia-x/lab/compliance/gx-compliance:feat-sign-docker-image
```
Example verifying the signature of the image built for tag `v1.7.0`:
```shell
docker run -it bitnami/cosign:latest verify --certificate-identity "https://gitlab.com/gaia-x/lab/compliance/gx-compliance//.gitlab-ci.yml@refs/tags/v1.7.0" --certificate-oidc-issuer "https://gitlab.com" registry.gitlab.com/gaia-x/lab/compliance/gx-compliance:v1.7.0
```

## See also

- [API Usage](./README-api.md)
- [Development and local testing](./README-developer.md)
