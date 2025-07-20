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
    """Find the row index of the header which contains 'Part Number', searching up to 30 rows."""
    for i in range(min(30, len(df))): # Increased search range to 30 rows
        try:
            row_values = [str(v).lower().replace(' ', '') for v in df.iloc[i].values]
            if 'partnumber' in row_values:
                logger.info(f"Header row found at index: {i}")
                return i
        except Exception:
            continue # Ignore rows that cause errors
    return None

def normalize_columns(df):
    """Normalize column names to a consistent format for robust parsing."""
    new_columns = {}
    # A map of possible column names (and parts of them) to our desired standard name.
    column_map = {
        'part number': 'Part Number',
        'description': 'Description',
        'alp ex vat': 'ALP Ex VAT',
        'alp inc vat': 'ALP Inc VAT',
        'category': 'Category',
        'npi': 'NPI',
        'marketing flag': 'Marketing Flag' # Add this mapping
    }
    for col in df.columns:
        normalized_col = str(col).lower().strip()
        found = False
        for key, value in column_map.items():
            if key in normalized_col:
                new_columns[col] = value
                found = True
                break
        if not found:
            new_columns[col] = str(col).strip()
            
    df.rename(columns=new_columns, inplace=True)
    return df

def parse_price_excel(file_stream):
    """
    Parses an Excel file stream from Apple's price list by dynamically finding the header row.
    """
    try:
        # Ensure stream is at the beginning for the first read
        file_stream.seek(0)
        
        # Read without a header to find it dynamically
        df_no_header = pd.read_excel(file_stream, header=None)
        header_row_index = find_header_row(df_no_header)

        if header_row_index is None:
            return None, "Could not find the header row. Ensure 'Part Number' column exists within the first 30 rows."

        # Reset stream and re-read the excel file with the correct header row
        file_stream.seek(0)
        df = pd.read_excel(file_stream, header=header_row_index)
        
        # Normalize column names for consistency
        df = normalize_columns(df)
        
        # Check for essential columns
        required_cols = ['Part Number', 'Description', 'ALP Ex VAT']
        if not all(col in df.columns for col in required_cols):
            logger.error(f"File is missing required columns after finding header. Found: {list(df.columns)}")
            return None, "File is missing required columns: 'Part Number', 'Description', 'ALP Ex VAT'."

        # --- New Category Extraction Logic ---
        current_category = 'Uncategorized'
        all_rows = []
        for index, row in df.iterrows():
            # Check if it's a category row: 'Marketing Flag' has a value, but 'Part Number' is NaN/empty.
            is_category_row = pd.notna(row.get('Marketing Flag')) and pd.isna(row.get('Part Number'))
            
            if is_category_row:
                current_category = row['Marketing Flag']
                continue

            # Check if it's a product row (must have a Part Number)
            if pd.notna(row.get('Part Number')):
                product_row = row.to_dict()
                product_row['Category'] = current_category # Assign the current category
                all_rows.append(product_row)
        
        # Create a new DataFrame from the processed rows
        if not all_rows:
            return [], None # Return empty list if no product rows found

        df = pd.DataFrame(all_rows)
        # --- End of New Category Extraction Logic ---

        # Drop rows where Part Number is missing or is not a valid part number
        df.dropna(subset=['Part Number'], inplace=True)
        # This regex filter might be too strict now, let's keep it but be aware.
        df = df[df['Part Number'].astype(str).str.contains(r'^[A-Z0-9/]+$', na=False)]
        
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
        logger.error(f"Error parsing price excel file: {e}", exc_info=True)
        return None, str(e)
