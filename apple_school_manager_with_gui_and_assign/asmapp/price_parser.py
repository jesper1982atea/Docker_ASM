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

def find_header_row(df):
    """Find the row index of the header which contains 'Part Number'."""
    for i in range(min(10, len(df))): # Check first 10 rows
        row_values = [str(v).lower().replace(' ', '') for v in df.iloc[i].values]
        if 'partnumber' in row_values:
            return i
    return None

def normalize_columns(df):
    """Normalize column names to a consistent format."""
    new_columns = {}
    for col in df.columns:
        normalized = str(col).lower().strip()
        if 'part number' in normalized:
            new_columns[col] = 'Part Number'
        elif 'description' in normalized:
            new_columns[col] = 'Description'
        elif 'alp ex vat' in normalized:
            new_columns[col] = 'ALP Ex VAT'
        elif 'alp inc vat' in normalized:
            new_columns[col] = 'ALP Inc VAT'
        elif 'category' in normalized:
            new_columns[col] = 'Category'
        elif 'npi' in normalized:
            new_columns[col] = 'NPI'
        else:
            new_columns[col] = str(col).strip()
    df.rename(columns=new_columns, inplace=True)
    return df

def parse_price_excel(file_stream):
    """
    Parses an Excel file stream from Apple's price list, extracts product details from description,
    and returns a list of dictionaries. This version is more robust.
    """
    try:
        # Ensure stream is at the beginning
        file_stream.seek(0)
        # Read without a header first to find it dynamically
        df_no_header = pd.read_excel(file_stream, header=None)
        header_row_index = find_header_row(df_no_header)

        if header_row_index is None:
            return None, "Could not find the header row. Ensure 'Part Number' column exists."

        # Re-read the excel file with the correct header row
        file_stream.seek(0) # Reset stream before reading again
        df = pd.read_excel(file_stream, header=header_row_index)
        
        # Normalize column names
        df = normalize_columns(df)
        
        # Check for essential columns after normalization
        required_cols = ['Part Number', 'Description', 'ALP Ex VAT']
        if not all(col in df.columns for col in required_cols):
            logger.error(f"Missing required columns after normalization. Found: {list(df.columns)}")
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
