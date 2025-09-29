import pandas as pd
import os
import json
from datetime import datetime
from daftlistings import Daft, Location, SearchType, PropertyType, Facility

class DaftListingsManager:
    def __init__(self, db_path='daft_listings.csv'):
        """
        Initialize the DaftListingsManager with a path to store the listings database.
        
        Args:
            db_path (str): Path to the CSV file that will store the listings data
        """
        self.db_path = db_path
        self.daft = Daft()
        self.daft.set_location(Location.DUBLIN)
        
        # Load existing database if it exists
        if os.path.exists(db_path):
            self.listings_df = pd.read_csv(db_path)
            # Ensure all columns are object type to avoid dtype conflicts
            for col in self.listings_df.columns:
                self.listings_df[col] = self.listings_df[col].astype('object')
        else:
            # Create a new dataframe with appropriate columns based on available methods
            self.listings_df = pd.DataFrame(columns=[
                'id', 'price', 'title', 'latitude', 'longitude', 'monthly_price',
                'publish_date', 'sale_type', 'size_meters_squared', 'shortcode',
                'total_images', 'has_virtual_tour', 'images', 'sections',
                'first_seen', 'last_seen', 'active'
            ])
            # Ensure all columns are object type to avoid dtype conflicts
            for col in self.listings_df.columns:
                self.listings_df[col] = self.listings_df[col].astype('object')
    
    def fetch_listings(self):
        """
        Fetch current listings from Daft.ie
        
        Returns:
            list: List of listing objects
        """
        listings = self.daft.search()
        return listings
    
    def update_database(self):
        """
        Update the database with the latest listings.
        - Add new listings
        - Update existing listings
        - Mark listings not found as inactive
        
        Returns:
            tuple: (new_count, updated_count, removed_count)
        """
        current_listings = self.fetch_listings()
        current_date = datetime.now().strftime('%Y-%m-%d')
        
        # Get IDs of all current listings as strings
        current_ids = [str(listing.id) for listing in current_listings]
        
        # Mark listings not in current results as inactive
        self.listings_df.loc[~self.listings_df['id'].astype(str).isin(current_ids) & self.listings_df['active'], 'active'] = False
        removed_count = len(self.listings_df[~self.listings_df['id'].astype(str).isin(current_ids) & ~self.listings_df['active']])
        
        new_count = 0
        updated_count = 0
        
        # Process each current listing
        for listing in current_listings:
            # Extract relevant data from the listing using only available methods
            # Handle properties that might cause parsing errors
            try:
                monthly_price = listing.monthly_price
            except (ValueError, AttributeError):
                monthly_price = None
                
            try:
                price = listing.price
            except (ValueError, AttributeError):
                price = None
                
            try:
                size_meters_squared = listing.size_meters_squared
            except (ValueError, AttributeError):
                size_meters_squared = None
                
            try:
                total_images = listing.total_images
            except (ValueError, AttributeError):
                total_images = 0
                
            try:
                images = str(listing.images) if listing.images else None
            except (KeyError, AttributeError):
                images = None
                
            try:
                sections = str(listing.sections) if listing.sections else None
            except (KeyError, AttributeError):
                sections = None
                
            listing_data = {
                'id': listing.id,
                'price': price,
                'title': listing.title,
                'latitude': listing.latitude,
                'longitude': listing.longitude,
                'monthly_price': monthly_price,
                'publish_date': listing.publish_date,
                'sale_type': listing.sale_type,
                'size_meters_squared': size_meters_squared,
                'shortcode': listing.shortcode,
                'total_images': total_images,
                'has_virtual_tour': listing.has_virtual_tour,
                'images': images,
                'sections': sections,
                'last_seen': current_date,
                'active': True
            }
            
            # Check if this listing already exists in our database
            # Convert both to strings for reliable comparison
            listing_id_str = str(listing.id)
            existing_ids = self.listings_df['id'].astype(str).values
            if listing_id_str in existing_ids:
                # Update existing listing - handle data type compatibility
                listing_idx = self.listings_df[self.listings_df['id'].astype(str) == listing_id_str].index[0]
                for key, value in listing_data.items():
                    if key != 'first_seen':  # Don't update first_seen date
                        # Convert value to string if the column is object type to avoid dtype conflicts
                        if self.listings_df[key].dtype == 'object':
                            self.listings_df.at[listing_idx, key] = str(value) if value is not None else None
                        else:
                            self.listings_df.at[listing_idx, key] = value
                updated_count += 1
            else:
                # Add new listing
                listing_data['first_seen'] = current_date
                new_df = pd.DataFrame([listing_data])
                if self.listings_df.empty:
                    self.listings_df = new_df
                else:
                    self.listings_df = pd.concat([self.listings_df, new_df], ignore_index=True)
                new_count += 1
        
        # Save the updated dataframe
        self.save_database()
        
        # Debug information
        print(f"Debug: Total listings in database: {len(self.listings_df)}")
        print(f"Debug: Active listings: {len(self.listings_df[self.listings_df['active'] == True])}")
        print(f"Debug: Inactive listings: {len(self.listings_df[self.listings_df['active'] == False])}")
        print(f"Debug: Current listings fetched: {len(current_listings)}")
        
        # Check for duplicate IDs in current listings
        current_ids_list = [str(listing.id) for listing in current_listings]
        unique_current_ids = set(current_ids_list)
        print(f"Debug: Unique current IDs: {len(unique_current_ids)}")
        if len(current_ids_list) != len(unique_current_ids):
            print(f"Warning: Duplicate IDs in current listings! {len(current_ids_list)} total, {len(unique_current_ids)} unique")
        
        return new_count, updated_count, removed_count
    
    def save_database(self):
        """Save the current dataframe to CSV"""
        self.listings_df.to_csv(self.db_path, index=False)
    
    def query_listings(self, **kwargs):
        """
        Query the database for listings matching the given criteria
        
        Args:
            **kwargs: Key-value pairs for filtering (e.g., bedrooms=2, active=True)
            
        Returns:
            DataFrame: Filtered listings
        """
        query_result = self.listings_df.copy()
        
        for key, value in kwargs.items():
            if key in query_result.columns:
                query_result = query_result[query_result[key] == value]
        
        return query_result
    
    def get_listings_by_location(self, lat_min=None, lat_max=None, lon_min=None, lon_max=None):
        """
        Get listings within a geographic bounding box
        
        Args:
            lat_min, lat_max: Latitude bounds
            lon_min, lon_max: Longitude bounds
            
        Returns:
            DataFrame: Filtered listings within the bounds
        """
        query_result = self.listings_df[self.listings_df['active'] == True].copy()
        
        if lat_min is not None:
            query_result = query_result[query_result['latitude'] >= lat_min]
        if lat_max is not None:
            query_result = query_result[query_result['latitude'] <= lat_max]
        if lon_min is not None:
            query_result = query_result[query_result['longitude'] >= lon_min]
        if lon_max is not None:
            query_result = query_result[query_result['longitude'] <= lon_max]
            
        return query_result
    
    def get_listings_by_price_range(self, min_price=None, max_price=None):
        """
        Get listings within a price range
        
        Args:
            min_price: Minimum price
            max_price: Maximum price
            
        Returns:
            DataFrame: Filtered listings within the price range
        """
        query_result = self.listings_df[self.listings_df['active'] == True].copy()
        
        # Return empty DataFrame if no active listings
        if query_result.empty:
            return query_result
        
        # Convert price strings to numeric values for comparison
        def extract_price(price_str):
            if pd.isna(price_str) or price_str is None:
                return None
            price_str = str(price_str)
            # Remove currency symbols and commas
            price_str = price_str.replace('€', '').replace(',', '').replace('£', '').replace('$', '')
            # Handle "POA" (Price on Application) and other non-numeric values
            if price_str.upper() in ['POA', 'N/A', 'ASKING', '']:
                return None
            try:
                return float(price_str)
            except (ValueError, TypeError):
                return None
        
        # Create a numeric price column for filtering
        query_result['numeric_price'] = query_result['price'].apply(extract_price)
        
        if min_price is not None:
            query_result = query_result[
                (query_result['numeric_price'].notna()) & 
                (query_result['numeric_price'] >= min_price)
            ]
        if max_price is not None:
            query_result = query_result[
                (query_result['numeric_price'].notna()) & 
                (query_result['numeric_price'] <= max_price)
            ]
        
        # Remove the temporary numeric_price column
        query_result = query_result.drop('numeric_price', axis=1)
            
        return query_result
    
    def get_listings_with_images(self, min_images=1):
        """
        Get listings that have at least a minimum number of images
        
        Args:
            min_images: Minimum number of images required
            
        Returns:
            DataFrame: Filtered listings with sufficient images
        """
        # Convert total_images to numeric, handling any string values
        def safe_int(value):
            if pd.isna(value) or value is None:
                return 0
            try:
                return int(float(str(value)))
            except (ValueError, TypeError):
                return 0
        
        # Create a numeric version of total_images for comparison
        numeric_images = self.listings_df['total_images'].apply(safe_int)
        
        return self.listings_df[
            (self.listings_df['active'] == True) & 
            (numeric_images >= min_images)
        ]
    
    def cleanup_old_listings(self, days_to_keep=7):
        """
        Remove old inactive listings to keep database size manageable
        
        Args:
            days_to_keep: Number of days to keep inactive listings
        """
        cutoff_date = (datetime.now() - pd.Timedelta(days=days_to_keep)).strftime('%Y-%m-%d')
        old_size = len(self.listings_df)
        
        # Keep active listings and recently inactive ones
        self.listings_df = self.listings_df[
            (self.listings_df['active'] == True) | 
            (self.listings_df['last_seen'] >= cutoff_date)
        ]
        
        removed_count = old_size - len(self.listings_df)
        if removed_count > 0:
            print(f"Cleaned up {removed_count} old inactive listings")
            self.save_database()
    
    def get_database_stats(self):
        """Get statistics about the current database"""
        total = len(self.listings_df)
        active = len(self.listings_df[self.listings_df['active'] == True])
        inactive = len(self.listings_df[self.listings_df['active'] == False])
        
        print(f"Database Stats:")
        print(f"  Total listings: {total}")
        print(f"  Active: {active}")
        print(f"  Inactive: {inactive}")
        
        if inactive > 0:
            # Show date range of inactive listings
            inactive_dates = self.listings_df[self.listings_df['active'] == False]['last_seen'].dropna()
            if len(inactive_dates) > 0:
                print(f"  Inactive date range: {inactive_dates.min()} to {inactive_dates.max()}")

# Example usage
if __name__ == "__main__":
    manager = DaftListingsManager()
    
    # Show current database stats
    manager.get_database_stats()
    
    # Update the database
    new, updated, removed = manager.update_database()
    print(f"Database updated: {new} new listings, {updated} updated, {removed} removed")
    
    # Clean up old inactive listings
    manager.cleanup_old_listings()
    
    # Show updated stats
    manager.get_database_stats()
    
    # Example query: Find all active properties with virtual tours
    virtual_tours = manager.query_listings(has_virtual_tour=True, active=True)
    print(f"Found {len(virtual_tours)} active properties with virtual tours")
    
    # Example query: Find properties by sale type
    for_sale = manager.query_listings(sale_type='sale', active=True)
    print(f"Found {len(for_sale)} active properties for sale")
    
    # Example query: Find properties with multiple images
    with_images = manager.get_listings_with_images(min_images=5)
    print(f"Found {len(with_images)} properties with 5+ images")
    
    # Example query: Find properties in a price range
    affordable = manager.get_listings_by_price_range(max_price=500000)
    print(f"Found {len(affordable)} properties under €500,000")