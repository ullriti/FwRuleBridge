#!/bin/bash
npm run build --clean >/dev/null
node dist/app.js $@
