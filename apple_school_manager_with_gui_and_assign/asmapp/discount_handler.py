import os
import pandas as pd
import logging
from werkzeug.utils import secure_filename
import json

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

def _create_discount_json(excel_path, program_name):
    """Parses the excel file and creates a corresponding JSON file."""
    try:
        # Headers are on row 3, so we skip first 2 rows.
        df = pd.read_excel(excel_path, header=2)
        
        # Rename columns for easier access
        df.rename(columns={
            'Product Class': 'ProductClass',
            'Rebate Rate (%)': 'RebateRate'
        }, inplace=True)

        # Ensure required columns exist
        if 'ProductClass' not in df.columns or 'RebateRate' not in df.columns:
            raise ValueError("Missing 'Product Class' or 'Rebate Rate (%)' columns in the Excel file.")

        # Drop rows where ProductClass or RebateRate is empty
        df.dropna(subset=['ProductClass', 'RebateRate'], inplace=True)
        
        # Convert rebate to numeric, coercing errors to NaN, then drop them
        df['RebateRate'] = pd.to_numeric(df['RebateRate'], errors='coerce')
        df.dropna(subset=['RebateRate'], inplace=True)

        # Create a dictionary from ProductClass to RebateRate (as decimal)
        # If there are duplicates, keep the first one
        discount_map = df.drop_duplicates(subset=['ProductClass']).set_index('ProductClass')['RebateRate'].to_dict()
        
        # Convert percentage to decimal (e.g., 5 -> 0.05)
        for key, value in discount_map.items():
            discount_map[key] = value / 100.0

        # Save as JSON
        json_filename = f"{secure_filename(program_name)}.json"
        json_filepath = os.path.join(DISCOUNTS_DIR, json_filename)
        
        with open(json_filepath, 'w') as f:
            json.dump(discount_map, f)
        
        logger.info(f"Successfully created discount JSON: {json_filename}")
        return True, None

    except Exception as e:
        logger.error(f"Error creating discount JSON for {program_name}: {e}")
        return False, str(e)


def save_discount_file(file, program_name=None):
    """Saves an uploaded discount file and creates a JSON version of it."""
    if not file or not file.filename:
        return None, "No file provided"
    
    if program_name:
        # Get the file extension from the original filename
        _, extension = os.path.splitext(file.filename)
        if not extension: extension = '.xlsx' # default extension
        # Sanitize program_name to be a valid filename and add extension
        filename = f"{secure_filename(program_name)}{extension}"
    else:
        filename = secure_filename(file.filename)
    
    filepath = os.path.join(DISCOUNTS_DIR, filename)
    file.save(filepath)
    logger.info(f"Saved discount file: {filename}")

    # Now, create the JSON version
    success, error = _create_discount_json(filepath, program_name or os.path.splitext(filename)[0])
    if not success:
        # If JSON creation fails, we might want to remove the uploaded excel file
        # to avoid inconsistent state. For now, we just log the error.
        logger.error(f"Failed to create JSON for {filename}. The Excel file was saved, but will not be usable.")
        return None, f"Excel file saved, but failed to process it into a usable format: {error}"

    return filename, None

def delete_discount_file(filename):
    """Deletes a discount file and its JSON counterpart."""
    # Delete Excel file
    excel_filepath = os.path.join(DISCOUNTS_DIR, secure_filename(filename))
    if os.path.exists(excel_filepath):
        os.remove(excel_filepath)
        logger.info(f"Deleted discount file: {filename}")

    # Delete JSON file
    program_name, _ = os.path.splitext(filename)
    json_filename = f"{secure_filename(program_name)}.json"
    json_filepath = os.path.join(DISCOUNTS_DIR, json_filename)
    if os.path.exists(json_filepath):
        os.remove(json_filepath)
        logger.info(f"Deleted discount JSON: {json_filename}")

    return True, None


def get_discount_data(filename):
    """
    Parses a discount Excel file and returns a dictionary mapping
    Part Number to a discount percentage.
    """
    program_name, _ = os.path.splitext(filename)
    json_filename = f"{secure_filename(program_name)}.json"
    filepath = os.path.join(DISCOUNTS_DIR, json_filename)

    if not os.path.exists(filepath):
        # Maybe try to generate it on the fly if the excel exists?
        # For now, we assume it must be created on upload.
        return None, f"Discount program '{program_name}' has not been processed correctly. Please re-upload."
        
    try:
        with open(filepath, 'r') as f:
            discount_map = json.load(f)
        return discount_map, None
    except Exception as e:
        logger.error(f"Error reading discount json file {json_filename}: {e}")
        return None, str(e)

