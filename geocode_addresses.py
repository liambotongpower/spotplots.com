#!/usr/bin/env python3
"""
Script to geocode addresses from the validated CSV file and add latitude/longitude columns.
"""

import csv
import json
import time
import os
from typing import Dict, List, Optional, Tuple
import googlemaps
import pandas as pd

class AddressGeocoder:
    def __init__(self, api_key: str):
        """Initialize the Google Maps client."""
        self.gmaps = googlemaps.Client(key=api_key)
        self.cache = {}  # Cache to avoid duplicate API calls
        
    def geocode_address(self, address: str) -> Tuple[Optional[float], Optional[float], Dict]:
        """
        Geocode an address using Google Maps Geocoding API.
        
        Args:
            address: The address to geocode
            
        Returns:
            Tuple of (latitude, longitude, geocoding_result)
        """
        # Check cache first
        if address in self.cache:
            return self.cache[address]
        
        try:
            # Use Geocoding API with Ireland region bias
            geocode_result = self.gmaps.geocode(
                address,
                region="ie",  # Ireland
                components={"country": "IE"}
            )
            
            if geocode_result:
                # Get coordinates from the first result
                result = geocode_result[0]
                location = result.get('geometry', {}).get('location', {})
                lat = location.get('lat')
                lng = location.get('lng')
                
                # Store in cache
                self.cache[address] = (lat, lng, result)
                
                return lat, lng, result
            else:
                # No result
                self.cache[address] = (None, None, {})
                return None, None, {}
                
        except Exception as e:
            print(f"Error geocoding address '{address}': {e}")
            # On error, return None values
            self.cache[address] = (None, None, {})
            return None, None, {}
    
    def process_csv(self, input_file: str, output_file: str, delay: float = 0.1):
        """
        Process the CSV file and add latitude/longitude columns.
        
        Args:
            input_file: Path to input CSV file
            output_file: Path to output CSV file
            delay: Delay between API calls to respect rate limits
        """
        print(f"Processing {input_file}...")
        
        # Read the CSV file
        df = pd.read_csv(input_file)
        
        # Create new columns for latitude and longitude
        df['Latitude'] = None
        df['Longitude'] = None
        
        # Process each address
        total_addresses = len(df)
        successful_geocodes = 0
        
        for i, address in enumerate(df['Closest school name']):
            print(f"Geocoding {i+1}/{total_addresses}: {address}")
            
            # Geocode the address
            lat, lng, geocoding_result = self.geocode_address(address)
            
            # Update the dataframe
            df.at[i, 'Latitude'] = lat
            df.at[i, 'Longitude'] = lng
            
            if lat is not None and lng is not None:
                successful_geocodes += 1
                print(f"  → {lat:.6f}, {lng:.6f}")
            else:
                print(f"  → No coordinates found")
            
            # Add delay to respect API rate limits
            time.sleep(delay)
            
            # Print progress every 10 addresses
            if (i + 1) % 10 == 0:
                print(f"Completed {i+1}/{total_addresses} addresses ({successful_geocodes} successful)")
        
        # Save the new CSV
        df.to_csv(output_file, index=False)
        print(f"Saved geocoded addresses to {output_file}")
        print(f"Successfully geocoded {successful_geocodes}/{total_addresses} addresses")
        
        # Save cache for future use
        cache_file = output_file.replace('.csv', '_geocoding_cache.json')
        with open(cache_file, 'w') as f:
            json.dump(self.cache, f, indent=2)
        print(f"Saved geocoding cache to {cache_file}")

def main():
    """Main function to run the geocoding."""
    # Get API key from environment variable
    api_key = os.getenv('GOOGLE_MAPS_API_KEY')
    if not api_key:
        print("Error: Please set the GOOGLE_MAPS_API_KEY environment variable")
        print("You can get an API key from: https://developers.google.com/maps/documentation/geocoding/get-api-key")
        return
    
    # File paths
    input_file = '/Users/liambpower/Developer/spotplots.com/datasets/datawrapper_validated.csv'
    output_file = '/Users/liambpower/Developer/spotplots.com/datasets/datawrapper_geocoded.csv'
    
    # Create geocoder and process the file
    geocoder = AddressGeocoder(api_key)
    geocoder.process_csv(input_file, output_file, delay=0.1)

if __name__ == "__main__":
    main()
