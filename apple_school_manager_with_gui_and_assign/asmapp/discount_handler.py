import os
import json
import pandas as pd
import logging
from werkzeug.utils import secure_filename

logger = logging.getLogger(__name__)

DISCOUNTS_DIR = os.path.join(os.path.dirname(__file__), '..', 'admin_api', 'discounts')

def setup_discounts_dir():
    if not os.path.exists(DISCOUNTS_DIR):
        os.makedirs(DISCOUNTS_DIR)

def list_discounts():
    """Lists all available processed discount programs (JSON files)."""
    setup_discounts_dir()
    try:
        files = [f.replace('.json', '') for f in os.listdir(DISCOUNTS_DIR) if f.endswith('.json')]
        return sorted(files)
    except FileNotFoundError:
        return []

def _get_value_from_row(row, target_key):
    """Helper to find a value in a row, case-insensitively."""
    for key, value in row.items():
        if str(key).strip().lower() == target_key.lower():
            return value
    return None

def save_discount_from_data(program_name, data):
    """Saves discount data from a list of dicts to a JSON file."""
    setup_discounts_dir()
    if not program_name:
        return None, "Program name cannot be empty."
    
    filename = f"{secure_filename(program_name)}.json"
    filepath = os.path.join(DISCOUNTS_DIR, filename)

    try:
        processed_data = []
        for row in data:
            product_class = _get_value_from_row(row, 'Product Class')
            rebate_rate_str = _get_value_from_row(row, 'Rebate Rate (%)')
            
            if product_class and rebate_rate_str is not None:
                try:
                    rebate_rate = float(rebate_rate_str)
                    processed_data.append({
                        "Product Class": str(product_class).strip(),
                        "Rebate Rate": rebate_rate / 100.0  # Store as decimal
                    })
                except (ValueError, TypeError):
                    logger.warning(f"Could not parse rebate rate '{rebate_rate_str}' for '{product_class}'. Skipping.")
                    continue
        
        if not processed_data:
            return None, "No valid data rows found to save."

        with open(filepath, 'w', encoding='utf-8') as f:
            json.dump(processed_data, f, indent=2)
        
        return filename, None
    except Exception as e:
        logger.error(f"Error saving discount file {filename}: {e}")
        return None, str(e)

def delete_discount_file(program_name):
    """Deletes a discount program file."""
    setup_discounts_dir()
    filename = secure_filename(program_name) + ".json"
    filepath = os.path.join(DISCOUNTS_DIR, filename)
    
    if not os.path.exists(filepath):
        return False, f"Discount program '{program_name}' not found."
    
    try:
        os.remove(filepath)
        logger.info(f"Deleted discount program: {filepath}")
        return True, None
    except Exception as e:
        logger.error(f"Error deleting discount file {filename}: {e}")
        return False, "Could not delete discount file."


def get_discount_data(program_name):
    """Gets the content of a processed discount JSON file."""
    setup_discounts_dir()
    filename = secure_filename(program_name) + ".json"
    filepath = os.path.join(DISCOUNTS_DIR, filename)
    
    if not os.path.exists(filepath):
        logger.warning(f"Discount program '{program_name}' not found at {filepath}.")
        return [], f"Discount program '{program_name}' not found."
        
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            data = json.load(f)
        # Ensure the data is a list
        if isinstance(data, list):
            return data, None
        else:
            logger.error(f"Discount file {filename} does not contain a list.")
            return [], "Invalid data format in discount file."
    except Exception as e:
        logger.error(f"Error reading discount file {filename}: {e}")
        return [], "Could not read or parse discount file."

