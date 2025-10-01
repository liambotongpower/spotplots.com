# SpotPlots

SpotPlots is a modern property search application for Ireland that provides two distinct search experiences: location-based browsing ("Any Spot") and criteria-based filtering ("Your Spot"). The application integrates with Daft.ie to deliver real-time property listings with advanced filtering capabilities.

## 🎯 Features

### Dual Search Modes

#### **Any Spot** (Location-Based Search)
- Search for properties by entering specific addresses or locations
- Google Places API autocomplete integration for accurate address suggestions
- Voice input support using Web Speech API
- Google-like search interface with intelligent typeahead suggestions

#### **Your Spot** (Criteria-Based Search)
- County-based property search across Ireland (32 counties)
- Advanced filtering system with the following options:
  - **Search Type**: Sale, Rent, Share, etc.
  - **Property Type**: House, Apartment, Studio, etc.
  - **Bedrooms**: Range slider with min/max controls (0-10)
  - **Bathrooms**: Range slider with min/max controls (0-10)
  - **Price Range**: Customizable price filters (€1,000 - €10,000,000)
  - **Facilities**: Multi-select checkboxes for amenities
  - **Sort Options**: Price, Date, etc.
- Filter persistence using localStorage
- Real-time results with pagination support
- Voice input support

### UI/UX Features
- Clean, minimalist Google-inspired design
- Animated typewriter effect on landing pages
- Real-time search results
- Keyboard navigation support (Arrow keys, Enter, Escape)
- Responsive layout optimized for all devices
- Floating toggle to switch between search modes
- Persistent filter preferences

## 🏗️ Architecture

### Frontend (Next.js 14)
- **Framework**: Next.js 14 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **State Management**: React hooks (useState, useEffect)
- **Icons**: React Icons (Font Awesome)

### Backend (Python FastAPI)
- **Framework**: FastAPI
- **Language**: Python 3.13
- **Data Source**: Daft.ie listings via `daftlistings` library
- **Concurrency**: AsyncIO with ThreadPoolExecutor for timeout handling

### External APIs
- **Google Places API**: Address autocomplete functionality
- **Daft.ie API**: Property listings (via daftlistings Python library)

## 📁 Project Structure

```
spotplots.com/
├── app/
│   ├── api/
│   │   ├── listings/
│   │   │   └── route.ts           # Property search API endpoint
│   │   └── places/
│   │       └── autocomplete/
│   │           └── route.ts       # Google Places autocomplete endpoint
│   ├── components/
│   │   ├── AddressDropdown.tsx    # Google Places autocomplete UI
│   │   ├── CountyDropdown.tsx     # County selection dropdown
│   │   ├── FloatingToggle.tsx     # Mode switcher (Any/Your Spot)
│   │   ├── ListingsResults.tsx    # Property results display
│   │   ├── PaginationControls.tsx # Page navigation
│   │   └── QuestionsForm.tsx      # Advanced filters form
│   ├── lib/
│   │   ├── daft/
│   │   │   ├── service.py         # FastAPI backend service
│   │   │   ├── main.py            # Test script
│   │   │   └── requirements.txt   # Python dependencies
│   │   ├── enumMaps.ts            # Filter option mappings
│   │   ├── persistence.ts         # localStorage utilities
│   │   ├── schema.ts              # TypeScript type definitions
│   │   ├── util.ts                # Utility functions
│   │   └── validation.ts          # Filter validation logic
│   ├── any-spot/
│   │   └── page.tsx               # Location-based search page
│   ├── your-spot/
│   │   └── page.tsx               # Criteria-based search page
│   ├── globals.css                # Global styles
│   ├── layout.tsx                 # Root layout
│   └── page.tsx                   # Home page (mode selector)
├── public/
│   └── wasm/                      # WebAssembly assets
├── .gitignore
├── next.config.js
├── package.json
├── postcss.config.js
├── tailwind.config.ts
├── tsconfig.json
└── README.md
```

## 🚀 Getting Started

### Prerequisites

- **Node.js**: v18 or higher
- **Python**: 3.13 or higher
- **npm**: v8 or higher
- **Google Maps API Key**: For address autocomplete

### Environment Variables

Create a `.env.local` file in the root directory:

```env
# Google Places API
GOOGLE_MAPS_API_KEY=your_google_api_key_here

# Daft Service URL (optional, defaults to http://127.0.0.1:8000)
DAFT_SERVICE_URL=http://127.0.0.1:8000
```

### Installation

#### 1. Install Frontend Dependencies

```bash
npm install
```

#### 2. Setup Python Backend

```bash
# Navigate to the backend directory
cd app/lib/daft

# Create virtual environment
python3 -m venv venv

# Activate virtual environment
# On macOS/Linux:
source venv/bin/activate
# On Windows:
# venv\Scripts\activate

# Install Python dependencies
pip install -r requirements.txt
```

### Running the Application

#### 1. Start the Python Backend

```bash
# From the app/lib/daft directory with venv activated
uvicorn service:app --host 127.0.0.1 --port 8000 --reload
```

The backend will be available at `http://127.0.0.1:8000`

#### 2. Start the Next.js Frontend

```bash
# From the project root
npm run dev
```

The application will be available at `http://localhost:3000`

### Build for Production

```bash
# Build Next.js application
npm run build

# Start production server
npm start
```

## 🔧 Key Components

### Frontend Components

#### `QuestionsForm.tsx`
Advanced filtering form with:
- Dropdown selectors for search type and property type
- Dual-range sliders for bedrooms, bathrooms, and price
- Multi-select facilities checkboxes
- Sort order selection
- Filter validation and persistence

#### `CountyDropdown.tsx`
Intelligent county selection with:
- 32 Irish counties (Republic and Northern Ireland)
- Fuzzy search/filtering by county name
- Keyboard navigation (Arrow keys, Enter, Escape)
- Multi-select with visual feedback
- Apply/Clear actions

#### `AddressDropdown.tsx`
Google Places integration with:
- Debounced API calls (300ms)
- Keyboard navigation
- Loading states
- Error handling

#### `ListingsResults.tsx`
Property results display with:
- Card-based layout
- Property images, price, location
- Direct links to Daft.ie
- Responsive grid

#### `FloatingToggle.tsx`
Mode switcher component:
- Fixed position toggle button
- Smooth transitions between modes
- Active state indicators

### Backend Service

#### `service.py`
FastAPI service that:
- Receives filter requests from frontend
- Translates filters to Daft.ie API parameters
- Handles search type, property type, beds, baths, price, location
- Implements timeout protection (30 seconds)
- Manual pagination support (20 items per page)
- Custom headers to avoid API blocks
- Returns structured JSON responses

#### API Endpoints

##### `POST /search`
Search for properties with filters.

**Request Body:**
```json
{
  "counties": ["Dublin", "Cork"],
  "search_type": "Residential Sale",
  "property_type": "House",
  "min_beds": 2,
  "max_beds": 4,
  "min_baths": 1,
  "max_baths": 3,
  "min_price": 200000,
  "max_price": 500000,
  "facilities": ["Parking", "Garden"],
  "sort_type": "Price Ascending",
  "page": 1
}
```

**Response:**
```json
{
  "listings": [
    {
      "title": "Property Title",
      "price": 350000,
      "daft_link": "https://www.daft.ie/...",
      "address": "123 Main St, Dublin",
      "bedrooms": 3,
      "bathrooms": 2,
      "property_type": "House",
      "description": "Beautiful property...",
      ...
    }
  ],
  "hasNextPage": true
}
```

### Next.js API Routes

#### `GET /api/places/autocomplete?input={query}`
Get address suggestions from Google Places API.

**Response:**
```json
{
  "suggestions": [
    {
      "id": "ChIJ...",
      "description": "Dublin, Ireland",
      "mainText": "Dublin",
      "secondaryText": "Ireland"
    }
  ]
}
```

#### `POST /api/listings`
Proxy to Python backend with retry logic.

**Request Body:** Same as Python `/search` endpoint

**Response:** Same as Python `/search` endpoint

## 🎨 Styling

The application uses Tailwind CSS with custom configurations:
- Custom color schemes (blue for Any Spot, green for Your Spot)
- Responsive breakpoints
- Custom range slider styles
- Animated transitions and effects
- Shadow and border utilities

## 🧪 Development Workflow

### Running in Development Mode

1. **Backend**: Run with auto-reload
   ```bash
   cd app/lib/daft
   source venv/bin/activate
   uvicorn service:app --host 127.0.0.1 --port 8000 --reload
   ```

2. **Frontend**: Run with hot-reload
   ```bash
   npm run dev
   ```

### Testing Backend Directly

```bash
cd app/lib/daft
source venv/bin/activate
python main.py
```

### Linting

```bash
npm run lint
```

## 📊 Data Flow

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
6. Results view displayed (placeholder for future implementation)

## 🔐 Security & Privacy

- API keys stored in environment variables
- No sensitive data stored in localStorage
- CORS headers properly configured
- User-Agent spoofing for Daft.ie API compliance
- Request timeout protection (30s)

## 🐛 Known Issues & Limitations

- Any Spot results page is currently a placeholder
- Pagination manually implemented (20 items per page)
- Daft.ie API may rate-limit excessive requests
- Some property attributes may be missing depending on listing
- Voice input only works in Chrome/Edge (WebKit Speech Recognition)

## 🚢 Deployment

### Environment Setup
1. Set `GOOGLE_MAPS_API_KEY` in production environment
2. Set `DAFT_SERVICE_URL` to production Python service URL
3. Ensure Python service is running and accessible

### Vercel Deployment
The Next.js frontend can be deployed to Vercel:
```bash
npm run build
# Deploy to Vercel
```

### Python Backend Deployment
Deploy the FastAPI service using:
- **Docker**: Containerize the service
- **Cloud Run**: Google Cloud Run
- **Heroku**: Heroku Python buildpack
- **DigitalOcean**: App Platform

## 📝 License

Private project - All rights reserved

## 👨‍💻 Development

Built with Next.js, React, TypeScript, Python, FastAPI, and Tailwind CSS.

---

For questions or issues, please contact the development team.
