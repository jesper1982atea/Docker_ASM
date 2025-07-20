import os
import json
import logging
import re

logger = logging.getLogger(__name__)

# Define the directory for discount programs
DISCOUNTS_DIR = os.path.join(os.path.dirname(__file__), '..', 'admin_api', 'discounts')

def _sanitize_filename(name):
    """Replaces spaces and other problematic characters with underscores for a safe filename."""
    # Keep original logic for reference: safe_filename = "".join(c for c in program_name if c.isalnum() or c in (' ', '_', '-')).rstrip()
    # A more robust way is to replace non-alphanumeric characters (except dots for extensions) with an underscore.
    # We are dealing with program names, not filenames with extensions, so we can be more aggressive.
    name = re.sub(r'[^\w\s-]', '', name).strip() # Remove non-word chars except whitespace and hyphen
    name = re.sub(r'[-\s]+', '_', name) # Replace one or more hyphens/spaces with a single underscore
    return name

def setup_discounts_dir():
    """Ensures the discounts directory exists."""
    os.makedirs(DISCOUNTS_DIR, exist_ok=True)

# --- Functional Discounts ---

def get_functional_discounts():
    """Reads functional discounts from the dedicated JSON file."""
    setup_discounts_dir()
    filepath = os.path.join(DISCOUNTS_DIR, 'functional_discounts.json')
    if not os.path.exists(filepath):
        return [] # Return empty list if file doesn't exist
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            return json.load(f)
    except Exception as e:
        logger.error(f"Error reading functional discounts file: {e}")
        return []

def save_functional_discounts(discounts_data):
    """Saves the list of functional discounts to the dedicated JSON file."""
    setup_discounts_dir()
    filepath = os.path.join(DISCOUNTS_DIR, 'functional_discounts.json')
    try:
        with open(filepath, 'w', encoding='utf-8') as f:
            json.dump(discounts_data, f, indent=4)
        return None
    except Exception as e:
        logger.error(f"Error saving functional discounts file: {e}")
        return str(e)

# --- Program-specific Discounts ---

def list_discounts():
    """Lists all available discount program JSON files by their name (without .json)."""
    setup_discounts_dir()
    try:
        # We list the files, but return their original names if we can find them inside the JSON.
        # For now, let's just return the filenames without .json extension. The user sees the filename.
        files = [f for f in os.listdir(DISCOUNTS_DIR) if f.endswith('.json') and f != 'functional_discounts.json']
        # Return the filename without the .json extension
        return sorted([os.path.splitext(f)[0] for f in files])
    except FileNotFoundError:
        return []

def delete_discount_file(program_name):
    """Deletes a specific discount program JSON file."""
    setup_discounts_dir()
    filename = f"{_sanitize_filename(program_name)}.json"
    filepath = os.path.join(DISCOUNTS_DIR, filename)
    
    if not os.path.exists(filepath):
        logger.warning(f"Attempted to delete non-existent discount file for program '{program_name}'. Looked for: {filepath}")
        return False, 'File not found'
    try:
        os.remove(filepath)
        logger.info(f"Deleted discount file: {filepath}")
        return True, None
    except Exception as e:
        logger.error(f"Error deleting discount file {filename}: {e}")
        return False, 'Could not delete file'

def get_discount_data(program_name):
    """
    Gets the content of a discount program and applies global functional discounts on top.
    """
    setup_discounts_dir()
    filename = f"{_sanitize_filename(program_name)}.json"
    filepath = os.path.join(DISCOUNTS_DIR, filename)

    logger.debug(f"Looking for discount program file: {filepath}")
    

    if not os.path.exists(filepath):
        logger.warning(f"Discount program '{program_name}' not found at {filepath}.")
        return [], f"Discount program '{program_name}' not found."
    
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            program_data = json.load(f)
        if not isinstance(program_data, list):
            logger.error(f"Discount file {filename} does not contain a list.")
            return [], "Invalid data format in discount file."
    except Exception as e:
        logger.error(f"Error reading discount file {filename}: {e}")
        return [], "Could not read or parse discount file."

    functional_discounts = get_functional_discounts()
    
    # Use the correct column name 'Rebate Rate (%)' from the parser.
    # Also, handle cases where the key might be missing in a row.
    program_rebate_map = {
        row.get('Product Class'): float(row.get('Rebate Rate (%)', 0)) 
        for row in program_data if row.get('Product Class')
    }

    # Create a map of functional rebates by category
    functional_rebate_map = {item['category']: float(item['discount']) for item in functional_discounts}

    # Define keywords for each functional category
    category_keywords = {
        'Mac': ['mac', 'display'],
        'iPad': ['ipad'],
        'iPhone': ['iphone'],
        'Watch': ['watch'],
        'Accessories': ['magic', 'pencil', 'adapter', 'cable', 'airtag', 'airpods', 'beatsbydre', 'tv', 'homepod']
    }

    # Create a reverse map from keyword to category name
    keyword_to_category = {
        keyword: category 
        for category, keywords in category_keywords.items() 
        for keyword in keywords
    }

    # Use all product classes from the program as the base
    all_product_classes = set(program_rebate_map.keys())
    
    combined_discounts = {}

    # Iterate over all unique product classes from the customer program
    for product_class in all_product_classes:
        if not product_class: continue # Skip if product_class is None or empty
        product_class_lower = product_class.lower()
        
        # Get the base program rebate
        program_rebate = program_rebate_map.get(product_class, 0)
        
        # Find the corresponding functional category and its rebate
        functional_rebate = 0
        for keyword, category_name in keyword_to_category.items():
            if keyword in product_class_lower:
                functional_rebate = functional_rebate_map.get(category_name, 0)
                break # Stop after first match
        
        # Combine rebates and store
        combined_discounts[product_class] = program_rebate + functional_rebate

    # Convert the combined dictionary back to the desired list format
    # We return the original data structure, but with combined rates.
    # For viewing, we should just return the original data. Let's return the original data for now.
    # The combination logic can be used elsewhere. For this endpoint, let's just return the data as is.
    return program_data, None

def save_discount_program(program_name, data):
    """Saves parsed discount data to a JSON file with a sanitized name."""
    setup_discounts_dir()
    # Sanitize the program name to create a safe filename
    filename = f"{_sanitize_filename(program_name)}.json"
    filepath = os.path.join(DISCOUNTS_DIR, filename)

    try:
        with open(filepath, 'w', encoding='utf-8') as f:
            json.dump(data, f, indent=4, ensure_ascii=False)
        logger.info(f"Saved discount program '{program_name}' to {filepath}")
        return True, f"Program '{program_name}' saved successfully."
    except Exception as e:
        logger.error(f"Failed to save discount program to {filepath}: {e}")
        return False, "Failed to write program file to disk."
#         keyword: category 
#         for category, keywords in category_keywords.items() 
#         for keyword in keywords
#     }

#     # Use all product classes from the program as the base
#     all_product_classes = set(program_rebate_map.keys())
    
#     combined_discounts = {}

#     # Iterate over all unique product classes from the customer program
#     for product_class in all_product_classes:
#         product_class_lower = product_class.lower()
        
#         # Get the base program rebate
#         program_rebate = program_rebate_map.get(product_class, 0)
        
#         # Find the corresponding functional category and its rebate
#         functional_rebate = 0
#         for keyword, category_name in keyword_to_category.items():
#             if keyword in product_class_lower:
#                 functional_rebate = functional_rebate_map.get(category_name, 0)
#                 break # Stop after first match
        
#         # Combine rebates and store
#         combined_discounts[product_class] = program_rebate + functional_rebate

#     # Convert the combined dictionary back to the desired list format
#     final_data = [{'Product Class': pc, 'Rebate Rate': rate} for pc, rate in combined_discounts.items()]
            
#     return final_data, None

def save_discount_program(program_name, data):
    """Saves parsed discount data to a JSON file with a sanitized name."""
    setup_discounts_dir()
    # Sanitize the program name to create a safe filename
    filename = f"{_sanitize_filename(program_name)}.json"
    filepath = os.path.join(DISCOUNTS_DIR, filename)

    try:
        with open(filepath, 'w', encoding='utf-8') as f:
            json.dump(data, f, indent=4, ensure_ascii=False)
        logger.info(f"Saved discount program '{program_name}' to {filepath}")
        return True, f"Program '{program_name}' saved successfully."
    except Exception as e:
        logger.error(f"Failed to save discount program to {filepath}: {e}")
        return False, "Failed to write program file to disk."

