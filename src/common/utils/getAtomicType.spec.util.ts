export const participantInSingleCS = JSON.parse(`
    {
      "@context": [
        "https://www.w3.org/2018/credentials/v1",
        "https://w3id.org/security/suites/jws-2020/v1",
        "https://registry.lab.gaia-x.eu/development/api/trusted-shape-registry/v1/shapes/jsonld/trustframework#"
      ],
      "type": [
        "VerifiableCredential"
      ],
      "id": "http://localhost:3000/api/credentials/2d37wbGvQzbAQ84yRouh2m2vBKkN8s5AfH9Q75HZRCUQmJW7yAVSNKzjJj6gcjE2mDNDUHCichXWdMH3S2c8AaDLm3kXmf5R8DYKbREYFNZM7g4ncD1dFAPmH7BKnLWd5qgbhPHUUBbqoMm9t2hCD7mrnnsTgxQuFQ4XFF8ea14vyCUBR94qBvexbW6besCNFfPwJbGvZiUWcEdcSjhkjibnEJyLnAXM4uu5SkMtVm7yCXnJrRMQ5yc9Kqwf2cVhdnVok4B1ym1vLtKoiPtZrdgpVdL3NC7vmaHDEhWTHJMAbGNnkdVfNcr7TQWFoy38xS4RgZJx7KksvRnmfLNzdt4187qZPrnCVWrRT24BRTe2FrjrFYx2rHUqng6CH264sAmwR7VPUsqMqphr78E51xHzxk1mXhrASZNuSYqznDkBdGnaNvh97qwTAA1L6dGxW6JX9STy2Uw9WHvUPzZDiP96HBMZFFd3HGzKUrLEEvK1ZPFKDvCNra32sNma2hSmEGAEjiWjJZ7kpWocXSxm7GUZqDvRUViK9K6U33f4iRgXRF4DgsYRaXvM2GpBstzD3qr9SJpoHK8XnPPuTskkNRt9Hm3hcyvhnGHvFZE?vcid=gray-hamburger",
      "issuer": "did:web:localhost%3A3000:api:credentials:2d37wbGvQzbAQ84yRouh2m2vBKkN8s5AfH9Q75HZRCUQmJW7yAVSNKzjJj6gcjE2mDNDUHCichXWdMH3S2c8AaDLm3kXmf5R8DYKbREYFNZM7g4ncD1dFAPmH7BKnLWd5qgbhPHUUBbqoMm9t2hCD7mrnnsTgxQuFQ4XFF8ea14vyCUBR94qBvexbW6besCNFfPwJbGvZiUWcEdcSjhkjibnEJyLnAXM4uu5SkMtVm7yCXnJrRMQ5yc9Kqwf2cVhdnVok4B1ym1vLtKoiPtZrdgpVdL3NC7vmaHDEhWTHJMAbGNnkdVfNcr7TQWFoy38xS4RgZJx7KksvRnmfLNzdt4187qZPrnCVWrRT24BRTe2FrjrFYx2rHUqng6CH264sAmwR7VPUsqMqphr78E51xHzxk1mXhrASZNuSYqznDkBdGnaNvh97qwTAA1L6dGxW6JX9STy2Uw9WHvUPzZDiP96HBMZFFd3HGzKUrLEEvK1ZPFKDvCNra32sNma2hSmEGAEjiWjJZ7kpWocXSxm7GUZqDvRUViK9K6U33f4iRgXRF4DgsYRaXvM2GpBstzD3qr9SJpoHK8XnPPuTskkNRt9Hm3hcyvhnGHvFZE",
      "issuanceDate": "2023-09-28T14:31:14.349Z",
      "credentialSubject": {
        "gx:legalName": "BAKEUP.IO",
        "gx:headquarterAddress": {
          "gx:countrySubdivisionCode": "FR-HDF"
        },
        "gx:legalRegistrationNumber": {
          "id": "http://localhost:3000/api/credentials/2d37wbGvQzbAQ84yRouh2m2vBKkN8s5AfH9Q75HZRCUQmJW7yAVSNKzjJj6gcjE2mDNDUHCichXWdMH3S2c8AaDLm3kXmf5R8DYKbREYFNZM7g4ncD1dFAPmH7BKnLWd5qgbhPHUUBbqoMm9t2hCD7mrnnsTgxQuFQ4XFF8ea14vyCUBR94qBvexbW6besCNFfPwJbGvZiUWcEdcSjhkjibnEJyLnAXM4uu5SkMtVm7yCXnJrRMQ5yc9Kqwf2cVhdnVok4B1ym1vLtKoiPtZrdgpVdL3NC7vmaHDEhWTHJMAbGNnkdVfNcr7TQWFoy38xS4RgZJx7KksvRnmfLNzdt4187qZPrnCVWrRT24BRTe2FrjrFYx2rHUqng6CH264sAmwR7VPUsqMqphr78E51xHzxk1mXhrASZNuSYqznDkBdGnaNvh97qwTAA1L6dGxW6JX9STy2Uw9WHvUPzZDiP96HBMZFFd3HGzKUrLEEvK1ZPFKDvCNra32sNma2hSmEGAEjiWjJZ7kpWocXSxm7GUZqDvRUViK9K6U33f4iRgXRF4DgsYRaXvM2GpBstzD3qr9SJpoHK8XnPPuTskkNRt9Hm3hcyvhnGHvFZE?uid=5582e01e-1747-455d-af14-0ab6bbf656e5#d1d81d9e3009722e1f98af9a8c107f4ede3cff253152b684065a595754f6279d"
        },
        "gx:legalAddress": {
          "gx:countrySubdivisionCode": "FR-HDF"
        },
        "type": "gx:LegalParticipant",
        "gx-terms-and-conditions:gaiaxTermsAndConditions": "70c1d713215f95191a11d38fe2341faed27d19e083917bc8732ca4fea4976700",
        "id": "https://lab.gaia-x.eu/participant.json"
      },
      "proof": {
        "type": "JsonWebSignature2020",
        "created": "2023-09-28T14:31:50.711Z",
        "proofPurpose": "assertionMethod",
        "verificationMethod": "did:web:localhost%3A3002:api:credentials:2d37wbGvQzbAQ84yRouh2m2vBKkN8s5AfH9Q75HZRCUQmJW7yAVSNKzjJj6gcjE2mDNDUHCichXWdMH3S2c8AaDLm3kXmf5R8DYKbREYFNZM7g4ncD1dFAPmH7BKnLWd5qgbhPHUUBbqoMm9t2hCD7mrnnsTgxQuFQ4XFF8ea14vyCUBR94qBvexbW6besCNFfPwJbGvZiUWcEdcSjhkjibnEJyLnAXM4uu5SkMtVm7yCXnJrRMQ5yc9Kqwf2cVhdnVok4B1ym1vLtKoiPtZrdgpVdL3NC7vmaHDEhWTHJMAbGNnkdVfNcr7TQWFoy38xS4RgZJx7KksvRnmfLNzdt4187qZPrnCVWrRT24BRTe2FrjrFYx2rHUqng6CH264sAmwR7VPUsqMqphr78E51xHzxk1mXhrASZNuSYqznDkBdGnaNvh97qwTAA1L6dGxW6JX9STy2Uw9WHvUPzZDiP96HBMZFFd3HGzKUrLEEvK1ZPFKDvCNra32sNma2hSmEGAEjiWjJZ7kpWocXSxm7GUZqDvRUViK9K6U33f4iRgXRF4DgsYRaXvM2GpBstzD3qr9SJpoHK8XnPPuTskkNRt9Hm3hcyvhnGHvFZE#JWK2020",
        "jws": "eyJhbGciOiJQUzI1NiIsImI2NCI6ZmFsc2UsImNyaXQiOlsiYjY0Il19..jd8ptvBX9y7T3Hweb5-izQZYqHzsIIM3mPFOQSuiZlD2EStJfOAcFSQ6MPRLJoT65cc9-ScPcSnbJk4Et_kpa4u_nDzMXBYkRMG6ntIENJYL3fm95HBV4gnVVJXEjoMk0yDbnY2enPgOiQrXfIE3d93lJUBvA5jMobmPl1RLfX18zWTpkiw6gV5bQYiEiEBGo8bTvCAXL7kLKr-URjccpozPlcUh0bVD_DaIIjJiOxM0UKSy26RALMwkUdkNqY0O55VXF0-UiSgQHdwmtFnj2dLLy0UTYMI-sD2qVq8lWkjAIKolXfrdm88wkgXtptjO8OABOuNqrpiNl0zOdECayw"
      }
    }`)
export const participantTypeInVCInSingleCS = JSON.parse(`
    {
      "@context": [
        "https://www.w3.org/2018/credentials/v1",
        "https://w3id.org/security/suites/jws-2020/v1",
        "https://registry.lab.gaia-x.eu/development/api/trusted-shape-registry/v1/shapes/jsonld/trustframework#"
      ],
      "type": [
        "VerifiableCredential",
        "gx:LegalParticipant"
      ],
      "id": "http://localhost:3000/api/credentials/2d37wbGvQzbAQ84yRouh2m2vBKkN8s5AfH9Q75HZRCUQmJW7yAVSNKzjJj6gcjE2mDNDUHCichXWdMH3S2c8AaDLm3kXmf5R8DYKbREYFNZM7g4ncD1dFAPmH7BKnLWd5qgbhPHUUBbqoMm9t2hCD7mrnnsTgxQuFQ4XFF8ea14vyCUBR94qBvexbW6besCNFfPwJbGvZiUWcEdcSjhkjibnEJyLnAXM4uu5SkMtVm7yCXnJrRMQ5yc9Kqwf2cVhdnVok4B1ym1vLtKoiPtZrdgpVdL3NC7vmaHDEhWTHJMAbGNnkdVfNcr7TQWFoy38xS4RgZJx7KksvRnmfLNzdt4187qZPrnCVWrRT24BRTe2FrjrFYx2rHUqng6CH264sAmwR7VPUsqMqphr78E51xHzxk1mXhrASZNuSYqznDkBdGnaNvh97qwTAA1L6dGxW6JX9STy2Uw9WHvUPzZDiP96HBMZFFd3HGzKUrLEEvK1ZPFKDvCNra32sNma2hSmEGAEjiWjJZ7kpWocXSxm7GUZqDvRUViK9K6U33f4iRgXRF4DgsYRaXvM2GpBstzD3qr9SJpoHK8XnPPuTskkNRt9Hm3hcyvhnGHvFZE?vcid=gray-hamburger",
      "issuer": "did:web:localhost%3A3000:api:credentials:2d37wbGvQzbAQ84yRouh2m2vBKkN8s5AfH9Q75HZRCUQmJW7yAVSNKzjJj6gcjE2mDNDUHCichXWdMH3S2c8AaDLm3kXmf5R8DYKbREYFNZM7g4ncD1dFAPmH7BKnLWd5qgbhPHUUBbqoMm9t2hCD7mrnnsTgxQuFQ4XFF8ea14vyCUBR94qBvexbW6besCNFfPwJbGvZiUWcEdcSjhkjibnEJyLnAXM4uu5SkMtVm7yCXnJrRMQ5yc9Kqwf2cVhdnVok4B1ym1vLtKoiPtZrdgpVdL3NC7vmaHDEhWTHJMAbGNnkdVfNcr7TQWFoy38xS4RgZJx7KksvRnmfLNzdt4187qZPrnCVWrRT24BRTe2FrjrFYx2rHUqng6CH264sAmwR7VPUsqMqphr78E51xHzxk1mXhrASZNuSYqznDkBdGnaNvh97qwTAA1L6dGxW6JX9STy2Uw9WHvUPzZDiP96HBMZFFd3HGzKUrLEEvK1ZPFKDvCNra32sNma2hSmEGAEjiWjJZ7kpWocXSxm7GUZqDvRUViK9K6U33f4iRgXRF4DgsYRaXvM2GpBstzD3qr9SJpoHK8XnPPuTskkNRt9Hm3hcyvhnGHvFZE",
      "issuanceDate": "2023-09-28T14:31:14.349Z",
      "credentialSubject": {
        "gx:legalName": "BAKEUP.IO",
        "gx:headquarterAddress": {
          "gx:countrySubdivisionCode": "FR-HDF"
        },
        "gx:legalRegistrationNumber": {
          "id": "http://localhost:3000/api/credentials/2d37wbGvQzbAQ84yRouh2m2vBKkN8s5AfH9Q75HZRCUQmJW7yAVSNKzjJj6gcjE2mDNDUHCichXWdMH3S2c8AaDLm3kXmf5R8DYKbREYFNZM7g4ncD1dFAPmH7BKnLWd5qgbhPHUUBbqoMm9t2hCD7mrnnsTgxQuFQ4XFF8ea14vyCUBR94qBvexbW6besCNFfPwJbGvZiUWcEdcSjhkjibnEJyLnAXM4uu5SkMtVm7yCXnJrRMQ5yc9Kqwf2cVhdnVok4B1ym1vLtKoiPtZrdgpVdL3NC7vmaHDEhWTHJMAbGNnkdVfNcr7TQWFoy38xS4RgZJx7KksvRnmfLNzdt4187qZPrnCVWrRT24BRTe2FrjrFYx2rHUqng6CH264sAmwR7VPUsqMqphr78E51xHzxk1mXhrASZNuSYqznDkBdGnaNvh97qwTAA1L6dGxW6JX9STy2Uw9WHvUPzZDiP96HBMZFFd3HGzKUrLEEvK1ZPFKDvCNra32sNma2hSmEGAEjiWjJZ7kpWocXSxm7GUZqDvRUViK9K6U33f4iRgXRF4DgsYRaXvM2GpBstzD3qr9SJpoHK8XnPPuTskkNRt9Hm3hcyvhnGHvFZE?uid=5582e01e-1747-455d-af14-0ab6bbf656e5#d1d81d9e3009722e1f98af9a8c107f4ede3cff253152b684065a595754f6279d"
        },
        "gx:legalAddress": {
          "gx:countrySubdivisionCode": "FR-HDF"
        },
        "id": "https://lab.gaia-x.eu/participant.json"
      },
      "proof": {
        "type": "JsonWebSignature2020",
        "created": "2023-09-28T14:31:50.711Z",
        "proofPurpose": "assertionMethod",
        "verificationMethod": "did:web:localhost%3A3002:api:credentials:2d37wbGvQzbAQ84yRouh2m2vBKkN8s5AfH9Q75HZRCUQmJW7yAVSNKzjJj6gcjE2mDNDUHCichXWdMH3S2c8AaDLm3kXmf5R8DYKbREYFNZM7g4ncD1dFAPmH7BKnLWd5qgbhPHUUBbqoMm9t2hCD7mrnnsTgxQuFQ4XFF8ea14vyCUBR94qBvexbW6besCNFfPwJbGvZiUWcEdcSjhkjibnEJyLnAXM4uu5SkMtVm7yCXnJrRMQ5yc9Kqwf2cVhdnVok4B1ym1vLtKoiPtZrdgpVdL3NC7vmaHDEhWTHJMAbGNnkdVfNcr7TQWFoy38xS4RgZJx7KksvRnmfLNzdt4187qZPrnCVWrRT24BRTe2FrjrFYx2rHUqng6CH264sAmwR7VPUsqMqphr78E51xHzxk1mXhrASZNuSYqznDkBdGnaNvh97qwTAA1L6dGxW6JX9STy2Uw9WHvUPzZDiP96HBMZFFd3HGzKUrLEEvK1ZPFKDvCNra32sNma2hSmEGAEjiWjJZ7kpWocXSxm7GUZqDvRUViK9K6U33f4iRgXRF4DgsYRaXvM2GpBstzD3qr9SJpoHK8XnPPuTskkNRt9Hm3hcyvhnGHvFZE#JWK2020",
        "jws": "eyJhbGciOiJQUzI1NiIsImI2NCI6ZmFsc2UsImNyaXQiOlsiYjY0Il19..jd8ptvBX9y7T3Hweb5-izQZYqHzsIIM3mPFOQSuiZlD2EStJfOAcFSQ6MPRLJoT65cc9-ScPcSnbJk4Et_kpa4u_nDzMXBYkRMG6ntIENJYL3fm95HBV4gnVVJXEjoMk0yDbnY2enPgOiQrXfIE3d93lJUBvA5jMobmPl1RLfX18zWTpkiw6gV5bQYiEiEBGo8bTvCAXL7kLKr-URjccpozPlcUh0bVD_DaIIjJiOxM0UKSy26RALMwkUdkNqY0O55VXF0-UiSgQHdwmtFnj2dLLy0UTYMI-sD2qVq8lWkjAIKolXfrdm88wkgXtptjO8OABOuNqrpiNl0zOdECayw"
      }
    }`)

export const participantAndTsAndCsInVCInSeveralCS = JSON.parse(`
    {
    "@context": [
        "https://www.w3.org/2018/credentials/v1",
        "https://w3id.org/security/suites/jws-2020/v1",
        "https://registry.lab.gaia-x.eu/development/api/trusted-shape-registry/v1/shapes/jsonld/trustframework#"
    ],
    "type": [
        "VerifiableCredential"
    ],
    "id": "http://localhost:3000/api/credentials/2d37wbGvQzbAQ84yRouh2m2vBKkN8s5AfH9Q75HZRCUQmJW7yAVSNKzjJj6gcjE2mDNDUHCichXWdMH3S2c8AaDLm3kXmf5R8DYKbREYFNZM7g4ncD1dFAPmH7BKnLWd5qgbhPHUUBbqoMm9t2hCD7mrnnsTgxQuFQ4XFF8ea14vyCUBR94qBvexbW6besCNFfPwJbGvZiUWcEdcSjhkjibnEJyLnAXM4uu5SkMtVm7yCXnJrRMQ5yc9Kqwf2cVhdnVok4B1ym1vLtKoiPtZrdgpVdL3NC7vmaHDEhWTHJMAbGNnkdVfNcr7TQWFoy38xS4RgZJx7KksvRnmfLNzdt4187qZPrnCVWrRT24BRTe2FrjrFYx2rHUqng6CH264sAmwR7VPUsqMqphr78E51xHzxk1mXhrASZNuSYqznDkBdGnaNvh97qwTAA1L6dGxW6JX9STy2Uw9WHvUPzZDiP96HBMZFFd3HGzKUrLEEvK1ZPFKDvCNra32sNma2hSmEGAEjiWjJZ7kpWocXSxm7GUZqDvRUViK9K6U33f4iRgXRF4DgsYRaXvM2GpBstzD3qr9SJpoHK8XnPPuTskkNRt9Hm3hcyvhnGHvFZE?vcid=gray-hamburger",
    "issuer": "did:web:localhost%3A3000:api:credentials:2d37wbGvQzbAQ84yRouh2m2vBKkN8s5AfH9Q75HZRCUQmJW7yAVSNKzjJj6gcjE2mDNDUHCichXWdMH3S2c8AaDLm3kXmf5R8DYKbREYFNZM7g4ncD1dFAPmH7BKnLWd5qgbhPHUUBbqoMm9t2hCD7mrnnsTgxQuFQ4XFF8ea14vyCUBR94qBvexbW6besCNFfPwJbGvZiUWcEdcSjhkjibnEJyLnAXM4uu5SkMtVm7yCXnJrRMQ5yc9Kqwf2cVhdnVok4B1ym1vLtKoiPtZrdgpVdL3NC7vmaHDEhWTHJMAbGNnkdVfNcr7TQWFoy38xS4RgZJx7KksvRnmfLNzdt4187qZPrnCVWrRT24BRTe2FrjrFYx2rHUqng6CH264sAmwR7VPUsqMqphr78E51xHzxk1mXhrASZNuSYqznDkBdGnaNvh97qwTAA1L6dGxW6JX9STy2Uw9WHvUPzZDiP96HBMZFFd3HGzKUrLEEvK1ZPFKDvCNra32sNma2hSmEGAEjiWjJZ7kpWocXSxm7GUZqDvRUViK9K6U33f4iRgXRF4DgsYRaXvM2GpBstzD3qr9SJpoHK8XnPPuTskkNRt9Hm3hcyvhnGHvFZE",
    "issuanceDate": "2023-09-28T14:31:14.349Z",
    "credentialSubject": [
        {
            "gx:legalName": "BAKEUP.IO",
            "gx:headquarterAddress": {
                "gx:countrySubdivisionCode": "FR-HDF"
            },
            "gx:legalRegistrationNumber": {
                "id": "http://localhost:3000/api/credentials/2d37wbGvQzbAQ84yRouh2m2vBKkN8s5AfH9Q75HZRCUQmJW7yAVSNKzjJj6gcjE2mDNDUHCichXWdMH3S2c8AaDLm3kXmf5R8DYKbREYFNZM7g4ncD1dFAPmH7BKnLWd5qgbhPHUUBbqoMm9t2hCD7mrnnsTgxQuFQ4XFF8ea14vyCUBR94qBvexbW6besCNFfPwJbGvZiUWcEdcSjhkjibnEJyLnAXM4uu5SkMtVm7yCXnJrRMQ5yc9Kqwf2cVhdnVok4B1ym1vLtKoiPtZrdgpVdL3NC7vmaHDEhWTHJMAbGNnkdVfNcr7TQWFoy38xS4RgZJx7KksvRnmfLNzdt4187qZPrnCVWrRT24BRTe2FrjrFYx2rHUqng6CH264sAmwR7VPUsqMqphr78E51xHzxk1mXhrASZNuSYqznDkBdGnaNvh97qwTAA1L6dGxW6JX9STy2Uw9WHvUPzZDiP96HBMZFFd3HGzKUrLEEvK1ZPFKDvCNra32sNma2hSmEGAEjiWjJZ7kpWocXSxm7GUZqDvRUViK9K6U33f4iRgXRF4DgsYRaXvM2GpBstzD3qr9SJpoHK8XnPPuTskkNRt9Hm3hcyvhnGHvFZE?uid=5582e01e-1747-455d-af14-0ab6bbf656e5#d1d81d9e3009722e1f98af9a8c107f4ede3cff253152b684065a595754f6279d"
            },
            "gx:legalAddress": {
                "gx:countrySubdivisionCode": "FR-HDF"
            },
            "type": "gx:LegalParticipant",
            "id": "https://lab.gaia-x.eu/participant.json"
        },
        {
            "@context": "https://registry.lab.gaia-x.eu/development/api/trusted-shape-registry/v1/shapes/jsonld/trustframework#",
            "type": "gx:GaiaXTermsAndConditions",
            "gx:termsAndConditions": "The PARTICIPANT signing the Self-Description agrees as follows:\\n- to update its descriptions about any changes, be it technical, organizational, or legal - especially but not limited to contractual in regards to the indicated attributes present in the descriptions.\\n\\nThe keypair used to sign Verifiable Credentials will be revoked where Gaia-X Association becomes aware of any inaccurate statements in regards to the claims which result in a non-compliance with the Trust Framework and policy rules defined in the Policy Rules and Labelling Document (PRLD).",
            "id": "https://lab.gaia-x.eu/tsandcs.json"
        }
    ],
    "proof": {
        "type": "JsonWebSignature2020",
        "created": "2023-09-28T14:31:50.711Z",
        "proofPurpose": "assertionMethod",
        "verificationMethod": "did:web:localhost%3A3002:api:credentials:2d37wbGvQzbAQ84yRouh2m2vBKkN8s5AfH9Q75HZRCUQmJW7yAVSNKzjJj6gcjE2mDNDUHCichXWdMH3S2c8AaDLm3kXmf5R8DYKbREYFNZM7g4ncD1dFAPmH7BKnLWd5qgbhPHUUBbqoMm9t2hCD7mrnnsTgxQuFQ4XFF8ea14vyCUBR94qBvexbW6besCNFfPwJbGvZiUWcEdcSjhkjibnEJyLnAXM4uu5SkMtVm7yCXnJrRMQ5yc9Kqwf2cVhdnVok4B1ym1vLtKoiPtZrdgpVdL3NC7vmaHDEhWTHJMAbGNnkdVfNcr7TQWFoy38xS4RgZJx7KksvRnmfLNzdt4187qZPrnCVWrRT24BRTe2FrjrFYx2rHUqng6CH264sAmwR7VPUsqMqphr78E51xHzxk1mXhrASZNuSYqznDkBdGnaNvh97qwTAA1L6dGxW6JX9STy2Uw9WHvUPzZDiP96HBMZFFd3HGzKUrLEEvK1ZPFKDvCNra32sNma2hSmEGAEjiWjJZ7kpWocXSxm7GUZqDvRUViK9K6U33f4iRgXRF4DgsYRaXvM2GpBstzD3qr9SJpoHK8XnPPuTskkNRt9Hm3hcyvhnGHvFZE#JWK2020",
        "jws": "eyJhbGciOiJQUzI1NiIsImI2NCI6ZmFsc2UsImNyaXQiOlsiYjY0Il19..jd8ptvBX9y7T3Hweb5-izQZYqHzsIIM3mPFOQSuiZlD2EStJfOAcFSQ6MPRLJoT65cc9-ScPcSnbJk4Et_kpa4u_nDzMXBYkRMG6ntIENJYL3fm95HBV4gnVVJXEjoMk0yDbnY2enPgOiQrXfIE3d93lJUBvA5jMobmPl1RLfX18zWTpkiw6gV5bQYiEiEBGo8bTvCAXL7kLKr-URjccpozPlcUh0bVD_DaIIjJiOxM0UKSy26RALMwkUdkNqY0O55VXF0-UiSgQHdwmtFnj2dLLy0UTYMI-sD2qVq8lWkjAIKolXfrdm88wkgXtptjO8OABOuNqrpiNl0zOdECayw"
    }
}`)
