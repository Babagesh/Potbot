"""
Supabase client for database integration
"""

import os
from dotenv import load_dotenv
from supabase import create_client, Client
from typing import Dict, Any, List, Optional

# Load environment variables
load_dotenv()

# Get Supabase credentials from environment variables
SUPABASE_URL = os.getenv("SUPABASE_URL", "https://ybqelfyfhuxdmjobupxz.supabase.co")
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY")

# Create a Supabase client instance
supabase_client: Optional[Client] = None

def get_client() -> Client:
    """
    Get or create a Supabase client
    
    Returns:
        Client: Supabase client instance
    """
    global supabase_client
    
    if supabase_client is None:
        # Make sure we have the required credentials
        if not SUPABASE_KEY:
            raise ValueError("SUPABASE_SERVICE_ROLE_KEY not found in environment variables")
            
        # Initialize the client
        supabase_client = create_client(SUPABASE_URL, SUPABASE_KEY)
        
    return supabase_client

class SupabaseDB:
    """
    Helper class for Supabase database operations
    """
    
    TABLE_NAME = "PhotoIage"
    
    @staticmethod
    def insert_record(record: Dict[str, Any]) -> Dict[str, Any]:
        """
        Insert a record into the database
        
        Args:
            record: Record to insert
            
        Returns:
            Dict: Inserted record with ID
        """
        try:
            client = get_client()
            response = client.table(SupabaseDB.TABLE_NAME).insert(record).execute()
            
            if response.data:
                print(f"✅ Record inserted into database: {response.data[0]['id']}")
                return response.data[0]
            else:
                print(f"⚠️ Insert returned no data: {response}")
                return record
                
        except Exception as e:
            print(f"⚠️ Database insert error: {str(e)}")
            # Return the original record so pipeline can continue
            return record
    
    @staticmethod
    def update_record(tracking_id: str, updates: Dict[str, Any]) -> Dict[str, Any]:
        """
        Update an existing record by tracking_id
        
        Args:
            tracking_id: Tracking ID of the record to update
            updates: Fields to update
            
        Returns:
            Dict: Updated record
        """
        try:
            client = get_client()
            response = client.table(SupabaseDB.TABLE_NAME)\
                .update(updates)\
                .eq("tracking_id", tracking_id)\
                .execute()
                
            if response.data:
                print(f"✅ Record updated: {tracking_id}")
                return response.data[0]
            else:
                print(f"⚠️ Update returned no data: {tracking_id}")
                return updates
                
        except Exception as e:
            print(f"⚠️ Database update error: {str(e)}")
            return updates
    
    @staticmethod
    def get_record(tracking_id: str) -> Optional[Dict[str, Any]]:
        """
        Get a record by tracking_id
        
        Args:
            tracking_id: Tracking ID to search for
            
        Returns:
            Dict: Record if found, None otherwise
        """
        try:
            client = get_client()
            response = client.table(SupabaseDB.TABLE_NAME)\
                .select("*")\
                .eq("tracking_id", tracking_id)\
                .execute()
                
            if response.data and len(response.data) > 0:
                return response.data[0]
            return None
            
        except Exception as e:
            print(f"⚠️ Database get error: {str(e)}")
            return None
    
    @staticmethod
    def get_all_records() -> List[Dict[str, Any]]:
        """
        Get all records
        
        Returns:
            List[Dict]: All records
        """
        try:
            client = get_client()
            response = client.table(SupabaseDB.TABLE_NAME).select("*").execute()
            return response.data or []
            
        except Exception as e:
            print(f"⚠️ Database get_all error: {str(e)}")
            return []
