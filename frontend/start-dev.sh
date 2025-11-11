#!/bin/bash
# Script to start Expo in development mode without CI
unset CI
export EXPO_NO_CI=1
export NODE_ENV=development
exec yarn expo start --tunnel --port 3000
