# Gaia-X Trust Framework

## Overview

The Trust Framework is the set of rules that define the minimum baseline to be part of the Gaia-X Ecosystem. Those rules ensure a common governance and the basic levels of interoperability across individual ecosystems while letting the users in full control of their choices.

The implementation of the Trust Framework relies on two services, the *Registry* and the *Compliance* as described in the [Architecutre document](https://gaia-x.gitlab.io/technical-committee/architecture-document). 

## Registry Service
The Registry Service is the implementation of the [Gaia-X Registry](https://gaia-x.gitlab.io/technical-committee/architecture-document/operating_model/#gaia-x-registry), the backbone of the ecosystem governance.

In its current implementation, it provides the functionality of storing the [Trust Anchors](https://gaia-x.gitlab.io/policy-rules-committee/trust-framework/trust_anchors/).

## Compliance Service

The Compliance Service validates the shape, content and credentials of Self-Descriptions and signs valid Self Descriptions. Required fields and consistency rules are defined in the [Trust Framework](https://gaia-x.gitlab.io/policy-rules-committee/trust-framework/).  
In its current implementation, it provides validation of the:
 - Participant Self-Description
 - Service Self-Description (_experimental_)

Check out our [Get started](https://gitlab.com/gaia-x/lab/compliance/gx-compliance#get-started-using-the-api) guide for more information on how to use the Compliance Service.
