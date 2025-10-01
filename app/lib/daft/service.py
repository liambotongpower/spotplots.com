from typing import Any, Dict, List, Optional
import logging
import asyncio
import concurrent.futures

from fastapi import FastAPI
from pydantic import BaseModel
from daftlistings import Daft, Location, SearchType, PropertyType
from daftlistings.enums import SortType

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class SearchFilters(BaseModel):
    counties: List[str] = []
    search_type: Optional[str] = None
    property_type: Optional[str] = None
    min_beds: Optional[int] = None
    max_beds: Optional[int] = None
    min_baths: Optional[int] = None
    max_baths: Optional[int] = None
    min_price: Optional[int] = None
    max_price: Optional[int] = None
    facilities: List[str] = []
    sort_type: Optional[str] = None
    page: int = 1


def normalize_key(value: str) -> str:
    return (
        value.upper()
        .replace(" ", "_")
        .replace("-", "_")
        .replace("'", "")
        .replace(".", "")
    )


def map_location(counties: List[str]) -> Location:
    if not counties:
        return Location.DUBLIN
    key = normalize_key(counties[0])
    return getattr(Location, key, Location.DUBLIN)


def map_search_type(search_type: Optional[str]) -> Optional[SearchType]:
    if not search_type:
        return None
    key = normalize_key(search_type)
    return getattr(SearchType, key, None)


def map_property_type(property_type: Optional[str]) -> Optional[PropertyType]:
    if not property_type:
        return None
    key = normalize_key(property_type)
    return getattr(PropertyType, key, None)


def map_sort_type(sort_type: Optional[str]) -> Optional[SortType]:
    if not sort_type:
        return None
    key = normalize_key(sort_type)
    return getattr(SortType, key, None)


def daft_to_dict(listing: Any) -> Dict[str, Any]:
    """Safely convert daftlisting object to dict, handling missing attributes"""
    result = {}
    
    # List of attributes to try to extract
    attributes = [
        "title", "price", "daft_link", "thumbnail_url", "id", 
        "bathrooms", "bedrooms", "property_type", "address", "description",
        "num_bedrooms", "num_bathrooms", "num_beds", "num_baths"
    ]
    
    for attr in attributes:
        try:
            value = getattr(listing, attr, None)
            if value is not None:
                result[attr] = value
        except Exception as e:
            logger.debug(f"Could not get attribute {attr}: {e}")
            continue
    
    # Also try to get all attributes dynamically
    try:
        for attr in dir(listing):
            if not attr.startswith('_') and not callable(getattr(listing, attr)):
                try:
                    value = getattr(listing, attr)
                    if value is not None and attr not in result:
                        result[attr] = value
                except:
                    continue
    except Exception as e:
        logger.debug(f"Could not enumerate attributes: {e}")
    
    return result


app = FastAPI()


def _run_search(filters: SearchFilters):
    """Run the actual search in a separate function for timeout handling"""
    logger.info(f"Received search request: {filters.dict()}")
    
    daft = Daft()

    # Headers required to avoid blocks
    daft._HEADER.update(
        {
            "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
            "Accept": "application/json",
            "Origin": "https://www.daft.ie",
            "Referer": "https://www.daft.ie/",
        }
    )

    # Core filters - set location first
    location = map_location(filters.counties)
    logger.info(f"Setting location: {location}")
    daft.set_location(location)

    # Set search type BEFORE price filters (required by daftlistings)
    st = map_search_type(filters.search_type)
    if st is not None:
        logger.info(f"Setting search_type: {st}")
        daft.set_search_type(st)
    else:
        # Default to residential sale if not specified
        logger.info("No search_type specified, defaulting to RESIDENTIAL_SALE")
        daft.set_search_type(SearchType.RESIDENTIAL_SALE)

    # Set property type
    pt = map_property_type(filters.property_type)
    if pt is not None:
        logger.info(f"Setting property_type: {pt}")
        daft.set_property_type(pt)
    else:
        # Default to house if not specified
        logger.info("No property_type specified, defaulting to HOUSE")
        daft.set_property_type(PropertyType.HOUSE)

    # Now set price filters (after search_type is set)
    if filters.min_price is not None:
        logger.info(f"Setting min_price: {filters.min_price}")
        daft.set_min_price(filters.min_price)
    if filters.max_price is not None:
        logger.info(f"Setting max_price: {filters.max_price}")
        daft.set_max_price(filters.max_price)

    # Set bedroom/bathroom filters
    if filters.min_beds is not None:
        logger.info(f"Setting min_beds: {filters.min_beds}")
        daft.set_min_beds(filters.min_beds)
    if filters.max_beds is not None:
        logger.info(f"Setting max_beds: {filters.max_beds}")
        daft.set_max_beds(filters.max_beds)

    if filters.min_baths is not None:
        logger.info(f"Setting min_baths: {filters.min_baths}")
        daft.set_min_baths(filters.min_baths)
    if filters.max_baths is not None:
        logger.info(f"Setting max_baths: {filters.max_baths}")
        daft.set_max_baths(filters.max_baths)

    # Set sorting
    sort_type_enum = map_sort_type(filters.sort_type)
    if sort_type_enum is not None:
        logger.info(f"Setting sort_type: {sort_type_enum}")
        daft.set_sort_type(sort_type_enum)
    else:
        # Default to most recent if no sort specified
        logger.info("No sort_type specified, defaulting to PUBLISH_DATE_DESC")
        daft.set_sort_type(SortType.PUBLISH_DATE_DESC)

    # Pagination handling
    try:
        if hasattr(daft, "set_page"):
            logger.info(f"Setting page: {filters.page}")
            daft.set_page(int(filters.page))
        elif hasattr(daft, "page"):
            logger.info(f"Setting page property: {filters.page}")
            daft.page = int(filters.page)
        else:
            logger.warning("No pagination support found in daftlistings library")
    except Exception as e:
        logger.warning(f"Could not set page: {e}")

    logger.info("Starting search...")
    try:
        listings = daft.search()
        logger.info(f"Search completed, found {len(listings) if listings else 0} listings")
        
        items = [daft_to_dict(l) for l in listings] if listings else []
        logger.info(f"Converted {len(items)} listings to dict format")

        # Handle pagination manually if the library doesn't support it properly
        page_size = 20
        current_page = filters.page
        start_idx = (current_page - 1) * page_size
        end_idx = start_idx + page_size
        
        # Apply pagination to results
        paginated_items = items[start_idx:end_idx]
        has_next = len(items) > end_idx
        
        logger.info(f"Pagination: page {current_page}, showing {len(paginated_items)} items (start: {start_idx}, end: {end_idx})")
        logger.info(f"hasNextPage: {has_next} (total items: {len(items)})")

        return {"listings": paginated_items, "hasNextPage": has_next}
    except Exception as e:
        logger.error(f"Search failed: {e}")
        return {"listings": [], "hasNextPage": False, "error": str(e)}


@app.post("/search")
async def search(filters: SearchFilters):
    """Async endpoint with timeout handling"""
    try:
        # Run the search in a thread pool with timeout
        loop = asyncio.get_event_loop()
        with concurrent.futures.ThreadPoolExecutor() as executor:
            # Set a 30 second timeout
            result = await asyncio.wait_for(
                loop.run_in_executor(executor, _run_search, filters),
                timeout=30.0
            )
            return result
    except asyncio.TimeoutError:
        logger.error("Search timed out after 30 seconds")
        return {"listings": [], "hasNextPage": False, "error": "Search timed out"}
    except Exception as e:
        logger.error(f"Search failed: {e}")
        return {"listings": [], "hasNextPage": False, "error": str(e)}


# Run with: uvicorn app.lib.daft.service:app --host 127.0.0.1 --port 8000 --reload


