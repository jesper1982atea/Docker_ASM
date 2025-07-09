import os
import pandas as pd
import logging
from werkzeug.utils import secure_filename
import json

logger = logging.getLogger(__name__)

DISCOUNTS_DIR = os.path.join(os.path.dirname(__file__), '..', 'admin_api', 'discounts')

def setup_discounts_dir():
    if not os.path.exists(DISCOUNTS_DIR):
        os.makedirs(DISCOUNTS_DIR)

def list_discounts():
    """Lists all available processed discount programs (JSON files)."""
    setup_discounts_dir()
    try:
        # List only json files, and return their names without the extension.
        return sorted([os.path.splitext(f)[0] for f in os.listdir(DISCOUNTS_DIR) if f.endswith('.json')])
    except FileNotFoundError:
        return []

def _get_value_from_row(row, target_key):
    """
    Gets a value from a dictionary, matching the key case-insensitively 
    and ignoring non-alphanumeric characters.
    """
    normalized_target = ''.join(filter(str.isalnum, target_key.lower()))
    for key, value in row.items():
        normalized_key = ''.join(filter(str.isalnum, str(key).lower()))
        if normalized_key == normalized_target:
            return value
    return None

def save_discount_from_data(program_name, data):
    """
    Processes a list of dictionaries (from JSON) and saves the discount map.
    The data comes from the frontend preview.
    """
    if not program_name:
        return None, "Program name is required"
    if not data:
        return None, "No data provided"

    logger.info(f"Processing discount data for program: {program_name}")
    if data:
        logger.debug(f"First row of data received for processing: {data[0]}")

    try:
        discount_map = {}
        
        for row_data in data:
            product_class = _get_value_from_row(row_data, 'Product Class')
            rebate_rate = _get_value_from_row(row_data, 'Rebate Rate (%)')

            # Skip if essential data is missing, empty, or if we already have this class
            if not product_class or rebate_rate is None or product_class in discount_map:
                continue

            try:
                # Handle comma as decimal separator and convert to float
                if isinstance(rebate_rate, str):
                    rebate_rate = rebate_rate.replace(',', '.')
                
                rebate_decimal = float(rebate_rate) / 100.0
                discount_map[product_class] = rebate_decimal
            except (ValueError, TypeError):
                logger.warning(f"Could not convert rebate rate '{rebate_rate}' for '{product_class}'. Skipping row.")
                continue
        
        if not discount_map:
            logger.error(f"No valid discount entries found for {program_name}. Check if 'Product Class' and 'Rebate Rate (%)' columns have data.")
            raise ValueError("No valid rows with 'Product Class' and 'Rebate Rate (%)' found in the provided data.")

        json_filename = f"{secure_filename(program_name)}.json"
        json_filepath = os.path.join(DISCOUNTS_DIR, json_filename)
        
        with open(json_filepath, 'w') as f:
            json.dump(discount_map, f, indent=2)
        
        logger.info(f"Successfully created discount JSON: {json_filename} with {len(discount_map)} entries.")
        return program_name, None

    except Exception as e:
        logger.error(f"Error creating discount JSON for {program_name}: {e}")
        return None, str(e)

def delete_discount_file(program_name):
    """Deletes a discount JSON file."""
    json_filename = f"{secure_filename(program_name)}.json"
    json_filepath = os.path.join(DISCOUNTS_DIR, json_filename)
    
    if os.path.exists(json_filepath):
        os.remove(json_filepath)
        logger.info(f"Deleted discount JSON: {json_filename}")
        return True, None
    else:
        logger.warning(f"Attempted to delete non-existent discount file: {json_filename}")
        return False, "File not found"


def get_discount_data(program_name):
    """Reads a processed discount JSON file and returns the discount map."""
    json_filename = f"{secure_filename(program_name)}.json"
    filepath = os.path.join(DISCOUNTS_DIR, json_filename)

    if not os.path.exists(filepath):
        return None, f"Discount program '{program_name}' not found."
        
    try:
        with open(filepath, 'r') as f:
            discount_map = json.load(f)
        return discount_map, None
    except Exception as e:
        logger.error(f"Error reading discount json file {json_filename}: {e}")
        return None, str(e)

