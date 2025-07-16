#!/bin/bash

# Wiz Light Discovery Script for macOS
# This script discovers Wiz lights on the local network using UDP broadcast

WIZ_PORT=38899
TIMEOUT=5
DISCOVERY_MESSAGE='{"method":"getPilot","params":{}}'

echo "🔍 Scanning for Wiz lights on the network..."
echo "Timeout: ${TIMEOUT} seconds"
echo "Broadcasting on port: ${WIZ_PORT}"
echo "----------------------------------------"

# Function to get local network ranges on macOS
get_network_ranges() {
    # Get network interfaces and their subnets
    route -n get default 2>/dev/null | grep interface | awk '{print $2}' | head -1 | while read interface; do
        if [ -n "$interface" ]; then
            ifconfig "$interface" 2>/dev/null | grep "inet " | grep -v "127.0.0.1" | awk '{print $2}' | while read ip; do
                # Get netmask and calculate network
                netmask=$(ifconfig "$interface" | grep "inet $ip" | awk '{print $4}')
                if [ -n "$netmask" ]; then
                    echo "$ip/$netmask"
                fi
            done
        fi
    done
}

# Function to send UDP broadcast and listen for responses (macOS version)
discover_wiz_lights() {
    echo "🔍 Scanning for Wiz lights on the network..."
    echo "Timeout: ${TIMEOUT} seconds"
    echo "Broadcasting on port: ${WIZ_PORT}"
    echo "----------------------------------------"
    
    # Create a temporary file for responses
    temp_file=$(mktemp)
    
    # Method 1: Try direct UDP broadcast to common network ranges
    local found_any=false
    
    # Get local IP and try to determine network range
    local_ip=$(route -n get default 2>/dev/null | grep interface | awk '{print $2}' | head -1 | xargs ifconfig 2>/dev/null | grep "inet " | grep -v "127.0.0.1" | awk '{print $2}' | head -1)
    
    if [ -n "$local_ip" ]; then
        # Extract network base (assuming /24 subnet)
        network_base=$(echo "$local_ip" | cut -d. -f1-3)
        echo "Scanning network range: ${network_base}.0/24"
        
        # Try each IP in the range
        for i in {1..254}; do
            target_ip="${network_base}.${i}"
            {
                # Use timeout and send/receive in one operation
                response=$(timeout 1 bash -c "echo '$DISCOVERY_MESSAGE' | nc -u -w1 '$target_ip' $WIZ_PORT 2>/dev/null")
                if [ -n "$response" ] && echo "$response" | grep -q '"result"'; then
                    echo "✅ Found Wiz light at $target_ip"
                    echo "Response: $response"
                    echo "----------------------------------------"
                    found_any=true
                fi
            } &
            
            # Limit concurrent connections
            if (( i % 20 == 0 )); then
                wait
            fi
        done
        wait
    fi
    
    if [ "$found_any" = false ]; then
        echo "❌ No Wiz lights found on the network"
        echo ""
        echo "Troubleshooting tips:"
        echo "• Make sure Wiz lights are powered on and connected to WiFi"
        echo "• Check that you're on the same network as the lights"
        echo "• Some routers may block UDP traffic"
        echo "• Try the manual methods below"
    fi
}

# Alternative method using nmap if available (macOS version)
discover_with_nmap() {
    if command -v nmap >/dev/null 2>&1; then
        echo ""
        echo "🔍 Alternative: Scanning with nmap..."
        echo "Looking for devices with port $WIZ_PORT open..."
        
        # Get local network range using macOS commands
        local_ip=$(route -n get default 2>/dev/null | grep interface | awk '{print $2}' | head -1 | xargs ifconfig 2>/dev/null | grep "inet " | grep -v "127.0.0.1" | awk '{print $2}' | head -1)
        
        if [ -n "$local_ip" ]; then
            network_base=$(echo "$local_ip" | cut -d. -f1-3)
            local_net="${network_base}.0/24"
            echo "Scanning network: $local_net"
            nmap -sU -p $WIZ_PORT --open "$local_net" 2>/dev/null | grep -B2 -A2 "open"
        fi
    else
        echo ""
        echo "💡 Install nmap for additional scanning: brew install nmap"
    fi
}

# Function to test specific IP
test_specific_ip() {
    local ip=$1
    echo "Testing $ip:$WIZ_PORT..."
    
    response=$(timeout 2 bash -c "echo '$DISCOVERY_MESSAGE' | nc -u -w1 $ip $WIZ_PORT" 2>/dev/null)
    
    if [ -n "$response" ]; then
        echo "✅ Wiz light found at $ip"
        echo "Response: $response"
        return 0
    else
        echo "❌ No response from $ip"
        return 1
    fi
}

# Main execution
case "${1:-}" in
    -h|--help)
        echo "Usage: $0 [OPTIONS] [IP_ADDRESS]"
        echo ""
        echo "Options:"
        echo "  -h, --help     Show this help message"
        echo "  -n, --nmap     Also try nmap scan (requires nmap)"
        echo "  IP_ADDRESS     Test specific IP address"
        echo ""
        echo "Examples:"
        echo "  $0                    # Discover all Wiz lights"
        echo "  $0 --nmap            # Discover with nmap as well"
        echo "  $0 192.168.1.100     # Test specific IP"
        ;;
    -n|--nmap)
        discover_wiz_lights
        discover_with_nmap
        ;;
    *)
        if [[ $1 =~ ^[0-9]+\.[0-9]+\.[0-9]+\.[0-9]+$ ]]; then
            test_specific_ip "$1"
        else
            discover_wiz_lights
        fi
        ;;
esac