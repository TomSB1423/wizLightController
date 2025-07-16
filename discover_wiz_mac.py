#!/usr/bin/env python3
"""
Wiz Light Discovery Script for macOS
A Python-based approach to discover Wiz lights on the local network
"""

import socket
import json
import time
import threading
import subprocess
import re
from concurrent.futures import ThreadPoolExecutor, as_completed

def get_local_ip():
    """Get the local IP address"""
    try:
        # Create a socket and connect to a remote address to determine local IP
        with socket.socket(socket.AF_INET, socket.SOCK_DGRAM) as s:
            s.connect(("8.8.8.8", 80))
            return s.getsockname()[0]
    except Exception:
        return None

def get_network_range():
    """Get the network range based on local IP"""
    local_ip = get_local_ip()
    if local_ip:
        # Assume /24 subnet
        parts = local_ip.split('.')
        return f"{parts[0]}.{parts[1]}.{parts[2]}"
    return None

def test_wiz_light(ip):
    """Test if a specific IP is a Wiz light"""
    try:
        message = json.dumps({"method": "getPilot", "params": {}})
        
        # Create UDP socket
        sock = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        sock.settimeout(2)  # 2 second timeout
        
        # Send request
        sock.sendto(message.encode(), (ip, 38899))
        
        # Wait for response
        data, addr = sock.recvfrom(1024)
        sock.close()
        
        # Parse response
        response = json.loads(data.decode())
        if "result" in response:
            return {
                "ip": ip,
                "response": response,
                "success": True
            }
    except Exception as e:
        pass
    
    return {"ip": ip, "success": False}

def discover_wiz_lights():
    """Discover Wiz lights on the network"""
    print("🔍 Discovering Wiz lights on the network...")
    
    # Get network range
    network_base = get_network_range()
    if not network_base:
        print("❌ Could not determine network range")
        return []
    
    print(f"Scanning network: {network_base}.0/24")
    print("This may take a few seconds...")
    
    found_lights = []
    
    # Create list of IPs to test
    ips_to_test = [f"{network_base}.{i}" for i in range(1, 255)]
    
    # Use ThreadPoolExecutor for concurrent testing
    with ThreadPoolExecutor(max_workers=50) as executor:
        # Submit all tasks
        future_to_ip = {executor.submit(test_wiz_light, ip): ip for ip in ips_to_test}
        
        # Process completed tasks
        for future in as_completed(future_to_ip):
            result = future.result()
            if result["success"]:
                found_lights.append(result)
                print(f"✅ Found Wiz light at {result['ip']}")
    
    return found_lights

def display_light_info(light_info):
    """Display detailed information about a found light"""
    ip = light_info["ip"]
    response = light_info["response"]
    result = response.get("result", {})
    
    print(f"\n🏠 Wiz Light at {ip}:")
    print(f"   Status: {'ON' if result.get('state', False) else 'OFF'}")
    
    if "dimming" in result:
        print(f"   Brightness: {result['dimming']}%")
    
    if "temp" in result:
        print(f"   Color Temperature: {result['temp']}K")
    
    if "r" in result and "g" in result and "b" in result:
        print(f"   RGB Color: ({result['r']}, {result['g']}, {result['b']})")
    
    if "sceneId" in result:
        print(f"   Scene ID: {result['sceneId']}")
    
    print(f"   Raw response: {json.dumps(result, indent=2)}")

def test_specific_ip(ip):
    """Test a specific IP address"""
    print(f"Testing {ip}...")
    result = test_wiz_light(ip)
    
    if result["success"]:
        print(f"✅ Wiz light found at {ip}")
        display_light_info(result)
        return True
    else:
        print(f"❌ No Wiz light found at {ip}")
        return False

def main():
    import sys
    
    if len(sys.argv) > 1:
        # Test specific IP
        ip = sys.argv[1]
        test_specific_ip(ip)
    else:
        # Discover all lights
        lights = discover_wiz_lights()
        
        if lights:
            print(f"\n🎉 Found {len(lights)} Wiz light(s):")
            for light in lights:
                display_light_info(light)
        else:
            print("\n❌ No Wiz lights found on the network")
            print("\nTroubleshooting tips:")
            print("• Make sure Wiz lights are powered on and connected to WiFi")
            print("• Check that you're on the same network as the lights")
            print("• Try testing a specific IP: python3 discover_wiz_mac.py 192.168.0.100")
            print("• Some routers may block UDP traffic")

if __name__ == "__main__":
    main()
