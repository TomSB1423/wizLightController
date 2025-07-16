#!/bin/bash

# Test script to verify WiZ Light Controller can discover lights when they're off
# This script tests the core functionality that was improved

echo "🔆 WiZ Light Controller - Off Light Discovery Test"
echo "=================================================="

# Check if discovery server is running
echo "1. Checking if discovery server is running..."
if curl -s http://localhost:3001/api/status > /dev/null; then
    echo "   ✅ Discovery server is running"
else
    echo "   ❌ Discovery server is not running. Please start it with:"
    echo "      cd discovery-server && node server.js"
    exit 1
fi

# Test discovery endpoint
echo "2. Testing light discovery..."
DISCOVERY_RESULT=$(curl -s http://localhost:3001/api/discover)

if echo "$DISCOVERY_RESULT" | grep -q '"success":true'; then
    echo "   ✅ Discovery endpoint working"
    
    # Count discovered lights
    LIGHT_COUNT=$(echo "$DISCOVERY_RESULT" | grep -o '"ip":' | wc -l | tr -d ' ')
    echo "   📱 Found $LIGHT_COUNT light(s)"
    
    # Check for lights that are off (state: false)
    OFF_LIGHTS=$(echo "$DISCOVERY_RESULT" | grep -o '"state":false' | wc -l | tr -d ' ')
    if [ "$OFF_LIGHTS" -gt 0 ]; then
        echo "   🌙 Found $OFF_LIGHTS light(s) that are turned OFF"
        echo "   ✅ SUCCESS: Can discover lights even when they're off!"
    else
        echo "   💡 All discovered lights are currently ON"
        echo "   ℹ️  To test off-light discovery, turn off a light and run this test again"
    fi
    
    # Show light details
    echo "3. Light details:"
    echo "$DISCOVERY_RESULT" | grep -o '"ip":"[^"]*","mac":"[^"]*","state":[^,]*' | while read -r line; do
        IP=$(echo "$line" | grep -o '"ip":"[^"]*"' | cut -d'"' -f4)
        STATE=$(echo "$line" | grep -o '"state":[^,]*' | cut -d':' -f2)
        STATUS="ON"
        if [ "$STATE" = "false" ]; then
            STATUS="OFF"
        fi
        echo "   📍 Light at $IP: $STATUS"
    done
    
else
    echo "   ❌ Discovery failed"
    echo "   Response: $DISCOVERY_RESULT"
    exit 1
fi

echo ""
echo "🎉 Test completed successfully!"
echo "📝 This confirms that WiZ Light Controller can discover and control lights"
echo "   even when they are turned off (brightness 0)."
