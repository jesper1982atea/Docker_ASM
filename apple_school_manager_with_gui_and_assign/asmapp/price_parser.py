import pandas as pd
import re
import logging

logger = logging.getLogger(__name__)

def parse_product_description(description):
    """
    Parses a product description string to extract structured details.
    Example: "13-inch MacBook Air: Apple M4 chip with 10-core CPU and 8-core GPU, 16GB, 256GB SSD - Sky Blue"
    """
    if not isinstance(description, str):
        return {}

    details = {}
    
    # Screen Size and Product Line
    match = re.match(r"(\d{1,2}(?:-inch|\-inch)?)?\s?([^:]+):", description)
    if match:
        details['Screen Size'] = match.group(1).replace('-', ' ') if match.group(1) else 'N/A'
        details['Product Line'] = match.group(2).strip()
    
    # RAM
    ram_match = re.search(r"(\d+GB)\s*(?:Unified Memory)?", description, re.IGNORECASE)
    if ram_match:
        details['RAM'] = ram_match.group(1)

    # Storage
    storage_match = re.search(r"(\d+(?:GB|TB)\s*(?:SSD)?)", description, re.IGNORECASE)
    if storage_match:
        details['Storage'] = storage_match.group(1)

    # Color
    color_match = re.search(r"-\s([\w\s]+)$", description)
    if color_match:
        details['Color'] = color_match.group(1).strip()

    # Processor (captures everything between ':' and the RAM/Storage/Color part)
    proc_match = re.search(r":\s(.*?)(?:,\s*\d+GB|,?\s*-\s[\w\s]+$)", description)
    if proc_match:
        details['Processor'] = proc_match.group(1).strip()

    return details

def parse_price_excel(file_stream):
    """
    Parses an Excel file stream from Apple's price list, extracts product details from description,
    and returns a list of dictionaries.
    """
    try:
        df = pd.read_excel(file_stream, header=1) # Headers are on the second row (index 1)
        
        # Rename columns for easier access, removing special characters
        df.columns = df.columns.str.strip()
        
        # Check for essential columns
        required_cols = ['Part Number', 'Description', 'ALP Ex VAT']
        if not all(col in df.columns for col in required_cols):
            return None, "File is missing required columns: 'Part Number', 'Description', 'ALP Ex VAT'."

        # Drop rows where Part Number is missing
        df.dropna(subset=['Part Number'], inplace=True)
        
        # Fill NaN with a placeholder for easier processing
        df.fillna('', inplace=True)

        data = df.to_dict('records')
        
        processed_data = []
        for row in data:
            # Parse description to get more details
            description_details = parse_product_description(row.get('Description', ''))
            row.update(description_details)
            processed_data.append(row)

        return processed_data, None

    except Exception as e:
        logger.error(f"Error parsing price excel file: {e}")
        return None, str(e)
