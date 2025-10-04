# Address Geocoding

This project uses the Google Maps Geocoding API to add latitude and longitude coordinates to the validated school addresses in your CSV file.

## Setup

### 1. Dependencies

The required dependencies should already be installed from the previous address validation step:
- `googlemaps` - For Google Maps API integration
- `pandas` - For CSV processing

### 2. API Key

Make sure your Google Maps API key is set as an environment variable:

```bash
export GOOGLE_MAPS_API_KEY="your_api_key_here"
```

## Usage

### Test with Sample Data

First, test the geocoding with a small sample:

```bash
python test_geocoding.py
```

### Process Full Dataset

To geocode all addresses in the validated CSV:

```bash
python geocode_addresses.py
```

This will:
- Read `datasets/datawrapper_validated.csv`
- Geocode each address using Google Maps Geocoding API
- Create a new file `datasets/datawrapper_geocoded.csv` with Latitude and Longitude columns
- Save a cache file to avoid duplicate API calls

## Output

The script will create:
- `datasets/datawrapper_geocoded.csv` - The main output file with coordinates
- `datasets/datawrapper_geocoded_geocoding_cache.json` - Cache of API responses for future use

## Rate Limiting

The script includes a 0.1 second delay between API calls to respect Google's rate limits. For 700+ addresses, this will take approximately 1-2 minutes.

## Cost Considerations

- Google Maps Geocoding API charges per request
- With 700+ addresses, this will cost approximately $0.35-0.70 (depending on your pricing tier)
- The cache file prevents duplicate API calls if you run the script multiple times

## Troubleshooting

### API Key Issues
- Make sure your API key is valid and has the Geocoding API enabled
- Check that you've set the environment variable correctly

### Rate Limiting
- If you get rate limit errors, increase the delay in the script
- Consider using the cache file to resume processing

### No Results
- Some addresses might not return coordinates from Google Maps
- The script will use None values as a fallback
- Check the console output for which addresses failed

## Example Output

The geocoded CSV will have two additional columns:
- `Latitude` - Decimal degrees latitude
- `Longitude` - Decimal degrees longitude

Example:
```
Closest school name,LC sits 2024,...,Latitude,Longitude
"Gaelcholáiste Ceatharlach, Askea, Carlow, Ireland",50.0,...,52.836944,-6.925833
"Dublin Rd, Carlow, R93 RW84, Ireland",136.0,...,52.836944,-6.925833
```
