# SpotPlots Technical Specifications

## System Overview
SpotPlots is a modern property search application for Ireland that provides two distinct search experiences: location-based browsing ("Any Spot") and criteria-based filtering ("Your Spot"). The application integrates with Daft.ie to deliver real-time property listings with advanced filtering capabilities.

## Architecture

### Frontend
- **Framework**: Next.js 14 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **State Management**: React hooks (useState, useEffect)
- **Icons**: React Icons (Font Awesome)

### Backend
- **Framework**: FastAPI
- **Language**: Python 3.13
- **Data Source**: Daft.ie listings via `daftlistings` library
- **Concurrency**: AsyncIO with ThreadPoolExecutor for timeout handling

### External APIs
- **Google Places API**: Address autocomplete functionality
- **Google Maps API**: Property location visualization
- **Daft.ie API**: Property listings (via daftlistings Python library)

## Core Features

### 1. Dual Search Modes

#### Any Spot (Location-Based Search)
- **Implementation**: React component with Google Places autocomplete
- **Key Files**: `app/any-spot/page.tsx`, `app/components/AddressDropdown.tsx`
- **API Endpoints**: `/api/places/autocomplete`
- **Features**:
  - Address search with Google Places API integration
  - Voice input support via Web Speech API
  - Typeahead suggestions
  - Map visualization of selected location
  - Transport stops information integration

#### Your Spot (Criteria-Based Search)
- **Implementation**: React component with advanced filtering
- **Key Files**: `app/your-spot/page.tsx`, `app/components/QuestionsForm.tsx`
- **API Endpoints**: `/api/listings`
- **Features**:
  - County-based search (32 counties)
  - Advanced filtering system
  - Filter persistence via localStorage
  - Pagination of results
  - Real-time search results

### 2. Property Filtering System
- **Filters**:
  - Search Type: Sale, Rent, Share
  - Property Type: House, Apartment, Studio
  - Bedrooms: Range slider (0-10)
  - Bathrooms: Range slider (0-10)
  - Price Range: Customizable (€1,000 - €10,000,000)
  - Facilities: Multi-select checkboxes
  - Sort Options: Price, Date
- **Implementation**: React state with custom validation

### 3. Transport Information
- **Implementation**: Nearby stops API integration
- **Key Files**: `app/api/get_nearby_stops/route.ts`, `app/lib/get_nearby_stops.ts`
- **Features**:
  - Fetch transport stops near a specified location
  - Distance calculation
  - Limit and max distance parameters
  - MongoDB geospatial queries and manual calculation options

### 4. Map Integration
- **Implementation**: Google Maps JavaScript API + Static Maps API
- **Key Files**: `app/components/MapView.tsx`, `app/api/generate_map/route.ts`
- **Features**:
  - Dynamic map loading and initialization
  - Address geocoding
  - Marker placement
  - Error handling and loading states
  - Static map generation for download
  - Transport stops visualization with stop codes

## API Endpoints

### Frontend API Routes

#### 1. `/api/places/autocomplete`
- **Method**: GET
- **Purpose**: Address suggestions from Google Places API
- **Parameters**: 
  - `input`: Search query string
- **Response**: JSON array of place suggestions with IDs and descriptions

#### 2. `/api/listings`
- **Method**: POST
- **Purpose**: Property search with filters
- **Parameters**: JSON body with filter criteria
- **Features**: 
  - Exponential backoff retry logic
  - Error handling
  - Logging

#### 3. `/api/get_nearby_stops`
- **Method**: GET
- **Purpose**: Find transport stops near a location
- **Parameters**:
  - `lat`: Latitude
  - `lng`: Longitude
  - `maxDistance`: Maximum search radius (meters)
  - `limit`: Maximum number of results
  - `useManual`: Boolean to toggle calculation method

#### 4. `/api/generate_map`
- **Method**: POST
- **Purpose**: Generate static map image with transport stops using Mapbox Static Images API
- **Parameters**:
  - `stops`: Array of stop objects with coordinates and stop codes
  - `userLocation`: User's search location coordinates
  - `address`: Formatted address string
- **Response**: Base64 encoded PNG image with markers
- **Features**:
  - Automatic bounds calculation
  - Blue pin markers for stops with stop_id labels
  - Red pin marker for user location
  - Optimized zoom level
  - Supports all 33+ stops with proper labeling

### Backend API (FastAPI)

#### 1. `/health`
- **Method**: GET
- **Purpose**: Health check endpoint
- **Response**: Status and service information

#### 2. `/search`
- **Method**: POST
- **Purpose**: Search Daft.ie listings
- **Parameters**: JSON body with filter criteria
- **Features**:
  - Timeout handling (30 seconds)
  - Custom headers to avoid API blocks
  - Concurrency with ThreadPoolExecutor
  - Manual pagination (20 items per page)
  - Robust error handling

## Data Flow

### Your Spot Search Flow
1. User selects counties and applies filters in UI
2. Frontend updates URL with query parameters
3. `QuestionsForm` validates and saves filters to localStorage
4. POST request to `/api/listings` with filter object
5. Next.js route proxies to Python backend `/search`
6. Python service queries Daft.ie with mapped parameters
7. Results returned as JSON with pagination info
8. Frontend displays results and enables pagination

### Any Spot Search Flow
1. User types address in search bar
2. Debounced API call to `/api/places/autocomplete`
3. Google Places API returns suggestions
4. User selects suggestion or submits search
5. Query stored in URL parameter
6. GET request to `/api/get_nearby_stops` for transport information
7. Display map view with location marker
8. Display nearby transport stops in DataPanel component

### Transport Data Integration Flow
1. Location is selected (either via Any Spot or Your Spot)
2. Coordinates extracted from location data
3. API request to `/api/get_nearby_stops` with coordinates
4. Backend processes request using either geospatial or manual calculation
5. Results returned with stop names, IDs, distances
6. Frontend displays stops in DataPanel component

## Component Specifications

### 1. QuestionsForm
- **Purpose**: Advanced filtering form
- **Props**: None
- **State**: 
  - Filter values (counties, search type, property type, etc.)
  - Validation status
  - Loading state
- **Functions**:
  - Form submission
  - Filter validation
  - Filter persistence to localStorage

### 2. CountyDropdown
- **Purpose**: County selection component
- **Props**: Selected counties, onChange handler
- **State**:
  - Dropdown visibility
  - Selected counties
  - Search input
- **Features**:
  - Fuzzy search
  - Keyboard navigation
  - Multi-select

### 3. AddressDropdown
- **Purpose**: Google Places integration
- **Props**: Selected address, onChange handler
- **State**:
  - Dropdown visibility
  - Suggestions list
  - Loading state
  - Error state
- **Features**:
  - Debounced API calls
  - Keyboard navigation
  - Loading states
  - Error handling

### 4. DataPanel
- **Purpose**: Display data in a standardized panel
- **Props**:
  - title: String
  - subtitle: String (optional)
  - data: Array
  - totalCount: Number (optional)
  - maxDisplay: Number (default: 5)
  - className: String (optional)
- **Features**:
  - Limit display items with "more" indicator
  - Numbered display items
  - Distance display for transport stops

### 5. MapView
- **Purpose**: Display interactive map
- **Props**: address (string)
- **State**:
  - Loading state
  - Error state
  - Map instance reference
- **Features**:
  - Dynamic script loading
  - Geocoding
  - Marker placement
  - Error handling

### 6. FloatingToggle
- **Purpose**: Toggle between search modes
- **Props**: activeTab, onToggle function
- **Features**:
  - Fixed position
  - Active state indicators
  - Smooth transitions

### 7. ListingsResults
- **Purpose**: Display property listings
- **Props**: listings array, loading state
- **Features**:
  - Card-based layout
  - Property details display
  - Responsive grid
  - Loading states

## Performance Considerations

### Frontend Optimization
- Debounced API calls for autocomplete
- Pagination to limit result set size
- Lazy loading for components
- Client-side filter validation
- localStorage for filter persistence

### Backend Optimization
- Timeout handling for Daft.ie API (30 seconds)
- Exponential backoff retry logic
- ThreadPoolExecutor for concurrent processing
- Custom headers to avoid API rate limiting
- Error handling with graceful degradation

## Security Measures
- API keys stored in environment variables
- No sensitive data stored in localStorage
- CORS headers properly configured
- User-Agent spoofing for Daft.ie API compliance
- Request timeout protection

## Integration Points

### Google Places API
- **Usage**: Address autocomplete, geocoding
- **Configuration**: API key in .env file
- **Endpoints Used**:
  - Places Autocomplete API
  - Geocoding API

### Google Maps API
- **Usage**: Map visualization and static map generation
- **Configuration**: API key in .env file
- **Libraries Used**: Maps JavaScript API, Places library, Static Maps API
- **Required APIs**: Maps JavaScript API, Places API, Static Maps API

### Daft.ie API
- **Usage**: Property listings data
- **Access Method**: Via daftlistings Python library
- **Precautions**: Custom headers, timeout handling

## Development Workflow

### Local Development
1. Set up environment variables:
   ```bash
   # Create .env.local file with:
   GOOGLE_MAPS_API_KEY=your_google_maps_api_key_here
   ```

2. Start Python backend:
   ```bash
   cd app/lib/daft
   source venv/bin/activate
   uvicorn service:app --host 127.0.0.1 --port 8000 --reload
   ```

3. Start Next.js frontend:
   ```bash
   npm run dev
   ```

### Environment Setup
- **Google Maps API Key**: Required for map functionality (Maps JavaScript API, Places API)
- **Mapbox Access Token**: Required for static map generation with custom markers
- **API Permissions**: 
  - Google Cloud Console: Enable Maps JavaScript API, Places API
  - Mapbox: Get access token from [Mapbox Account](https://account.mapbox.com/access-tokens/)
- **Environment File**: Create `.env.local` in project root with both keys:
  ```
  GOOGLE_MAPS_API_KEY=your_google_maps_api_key_here
  MAPBOX_ACCESS_TOKEN=your_mapbox_access_token_here
  ```

### Testing
- Backend testing via `main.py` script
- Frontend linting with ESLint

### Deployment
- Next.js frontend deployable to Vercel
- Python backend deployable via Docker, Cloud Run, Heroku, or DigitalOcean

## Known Limitations
- Any Spot results page needs further implementation
- Manual pagination implementation limited to 20 items per page
- Potential rate limiting from Daft.ie API
- Inconsistent property attributes in listings
- Voice input limited to Chrome/Edge browsers

## Future Enhancements
- Implement detailed results for Any Spot search
- Add saved searches functionality
- Implement user authentication
- Add property comparison feature
- Integrate more property data sources
- Add email alerts for new listings
- Implement advanced analytics
