#!/usr/bin/env python3
"""
Test script to geocode a small sample of addresses.
"""

import os
import pandas as pd
from geocode_addresses import AddressGeocoder

def test_geocoding():
    """Test the geocoding with a small sample."""
    # Get API key from environment variable
    api_key = os.getenv('GOOGLE_MAPS_API_KEY')
    if not api_key:
        print("Error: Please set the GOOGLE_MAPS_API_KEY environment variable")
        print("You can get an API key from: https://developers.google.com/maps/documentation/geocoding/get-api-key")
        return
    
    # Read the CSV file
    input_file = '/Users/liambpower/Developer/spotplots.com/datasets/datawrapper_validated.csv'
    df = pd.read_csv(input_file)
    
    # Take first 5 addresses for testing
    test_df = df.head(5).copy()
    
    print("Testing geocoding with first 5 addresses:")
    print("=" * 60)
    
    # Create geocoder
    geocoder = AddressGeocoder(api_key)
    
    # Process each address
    for i, address in enumerate(test_df['Closest school name']):
        print(f"\n{i+1}. Address: {address}")
        
        # Geocode the address
        lat, lng, geocoding_result = geocoder.geocode_address(address)
        
        if lat is not None and lng is not None:
            print(f"   Coordinates: {lat:.6f}, {lng:.6f}")
            
            # Show some details from the geocoding result
            if geocoding_result and 'address_components' in geocoding_result:
                components = geocoding_result['address_components']
                for component in components:
                    if 'locality' in component['types'] or 'administrative_area_level_2' in component['types']:
                        print(f"   Location: {component['long_name']}")
                        break
        else:
            print(f"   No coordinates found")
    
    print("\n" + "=" * 60)
    print("Test completed!")

if __name__ == "__main__":
    test_geocoding()
