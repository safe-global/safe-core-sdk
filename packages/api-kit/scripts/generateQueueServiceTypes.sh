#!/bin/bash

mkdir -p openapi
curl 'https://api.safe.global/queue/openapi.json' > openapi/queue-service.json
npx openapi-typescript openapi/queue-service.json --output openapi/queue-service.ts
