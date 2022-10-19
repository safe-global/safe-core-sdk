#!/bin/bash

mkdir -p openapi
curl 'https://safe-transaction-goerli.safe.global/?format=openapi' > openapi/tx-service.json
npx openapi-typescript openapi/tx-service.json --output openapi/tx-service.ts
