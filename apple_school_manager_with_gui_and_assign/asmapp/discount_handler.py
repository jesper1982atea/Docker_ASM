import os
import pandas as pd
import logging
from werkzeug.utils import secure_filename

logger = logging.getLogger(__name__)

DISCOUNTS_DIR = os.path.join(os.path.dirname(__file__), '..', 'admin_api', 'discounts')

def setup_discounts_dir():
    """Ensures the discounts directory exists."""
    os.makedirs(DISCOUNTS_DIR, exist_ok=True)

def list_discounts():
    """Lists available discount program files."""
    try:
        return [f for f in os.listdir(DISCOUNTS_DIR) if f.endswith(('.xlsx', '.xls'))]
    except FileNotFoundError:
        return []

def save_discount_file(file):
    """Saves an uploaded discount file."""
    if not file or not file.filename:
        return None, "No file provided"
    
    filename = secure_filename(file.filename)
    filepath = os.path.join(DISCOUNTS_DIR, filename)
    file.save(filepath)
    logger.info(f"Saved discount file: {filename}")
    return filename, None

def delete_discount_file(filename):
    """Deletes a discount file."""
    filepath = os.path.join(DISCOUNTS_DIR, secure_filename(filename))
    if os.path.exists(filepath):
        os.remove(filepath)
        logger.info(f"Deleted discount file: {filename}")
        return True, None
    return False, "File not found"

def get_discount_data(filename):
    """
    Parses a discount Excel file and returns a dictionary mapping
    Part Number to a discount percentage.
    """
    filepath = os.path.join(DISCOUNTS_DIR, secure_filename(filename))
    if not os.path.exists(filepath):
        return None, "File not found"
        
    try:
        # Assuming columns are 'Part Number' and 'Discount' (e.g., 5 for 5%)
        df = pd.read_excel(filepath)
        df.dropna(subset=['Part Number', 'Discount'], inplace=True)
        
        # Convert to a dictionary {part_number: discount_decimal}
        discount_map = pd.Series(df.Discount.values / 100, index=df['Part Number']).to_dict()
        return discount_map, None
    except Exception as e:
        logger.error(f"Error parsing discount file {filename}: {e}")
        return None, str(e)

