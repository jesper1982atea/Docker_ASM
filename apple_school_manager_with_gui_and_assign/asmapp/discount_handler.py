import os
import json
import logging
from werkzeug.utils import secure_filename

logger = logging.getLogger(__name__)

DISCOUNTS_DIR = os.path.join(os.path.dirname(__file__), '..', 'admin_api', 'discounts')
FUNCTIONAL_DISCOUNTS_FILE = os.path.join(DISCOUNTS_DIR, 'functional_discounts.json')

def setup_discounts_dir():
    if not os.path.exists(DISCOUNTS_DIR):
        os.makedirs(DISCOUNTS_DIR)

# --- Functional Discounts ---

def get_functional_discounts():
    """Reads functional discounts from the dedicated JSON file."""
    setup_discounts_dir()
    if not os.path.exists(FUNCTIONAL_DISCOUNTS_FILE):
        return []
    try:
        with open(FUNCTIONAL_DISCOUNTS_FILE, 'r', encoding='utf-8') as f:
            return json.load(f)
    except (json.JSONDecodeError, IOError) as e:
        logger.error(f"Error reading functional discounts file: {e}")
        return []

def save_functional_discounts(discounts_data):
    """Saves the list of functional discounts to the dedicated JSON file."""
    setup_discounts_dir()
    try:
        with open(FUNCTIONAL_DISCOUNTS_FILE, 'w', encoding='utf-8') as f:
            json.dump(discounts_data, f, indent=2)
        return None
    except IOError as e:
        logger.error(f"Error saving functional discounts file: {e}")
        return f"Could not save functional discounts: {e}"

# --- Program-specific Discounts ---

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


def _get_raw_discount_data(program_name):
    """Gets the raw content of a specific discount program file, without modifications."""
    setup_discounts_dir()
    filename = secure_filename(program_name) + ".json"
    filepath = os.path.join(DISCOUNTS_DIR, filename)
    
    if not os.path.exists(filepath):
        logger.warning(f"Discount program '{program_name}' not found at {filepath}.")
        return [], f"Discount program '{program_name}' not found."
        
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            data = json.load(f)
        if isinstance(data, list):
            return data, None
        else:
            logger.error(f"Discount file {filename} does not contain a list.")
            return [], "Invalid data format in discount file."
    except Exception as e:
        logger.error(f"Error reading discount file {filename}: {e}")
        return [], "Could not read or parse discount file."

def get_discount_data(program_name):
    """
    Gets the content of a discount program and applies global functional discounts on top.
    This version correctly combines both discount lists.
    """
    program_data, error = _get_raw_discount_data(program_name)
    if error:
        return [], error

    functional_discounts = get_functional_discounts()
    
    # Create a dictionary for program-specific rebates for quick lookup
    program_rebate_map = {row['Product Class']: float(row.get('Rebate Rate', 0)) for row in program_data}

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
    final_data = [{'Product Class': pc, 'Rebate Rate': rate} for pc, rate in combined_discounts.items()]
            
    return final_data, None

