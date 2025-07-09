import pandas as pd
import logging

logger = logging.getLogger(__name__)

def _convert_rebate_rate(rate):
    """
    Robustly converts a rebate rate to a decimal.
    Handles strings with '%', commas, and values that are already decimals.
    """
    if pd.isna(rate):
        return 0.0
    
    if isinstance(rate, str):
        rate = rate.replace(',', '.').replace('%', '').strip()
    
    try:
        rate_float = float(rate)
        # If value is > 1, assume it's a percentage (e.g., 5 for 5%)
        # If value is <= 1, assume it's already a decimal (e.g., 0.05 for 5%)
        return rate_float / 100.0 if rate_float > 1 else rate_float
    except (ValueError, TypeError):
        logger.warning(f"Could not convert rebate rate '{rate}'. Defaulting to 0.0.")
        return 0.0

def parse_discount_excel(file_stream):
    """
    Parses an Excel file containing discount program data.
    The file is expected to have headers in row 3 (1-based index).
    
    Returns:
        - program_name (str): The name of the discount program.
        - data (list): A list of dicts with 'Product Class' and 'Rebate Rate'.
        - error (str): An error message if parsing fails, otherwise None.
    """
    try:
        # Headers are in the 3rd row, so we skip the first 2 rows (header=2 in 0-indexed pandas)
        df = pd.read_excel(file_stream, header=2)
        
        # Trim whitespace from column headers to avoid matching issues
        df.columns = df.columns.str.strip()
        logger.debug(f"Columns found in Excel file: {df.columns.tolist()}")
        
        # Define expected headers
        required_headers = ['Product Class', 'Rebate Rate (%)', 'Program Name']
        
        # Check if all required headers are present
        if not all(h in df.columns for h in required_headers):
            missing = [h for h in required_headers if h not in df.columns]
            logger.error(f"Missing required columns. Found: {df.columns.tolist()}")
            return None, None, f"Missing required columns: {', '.join(missing)}"

        # Drop rows where ALL columns are NaN (empty rows)
        df.dropna(how='all', inplace=True)
        
        # Drop rows where essential columns are empty
        initial_rows = len(df)
        df.dropna(subset=['Product Class', 'Rebate Rate (%)', 'Program Name'], inplace=True)
        logger.debug(f"Rows before cleaning: {initial_rows}. Rows after dropping NA: {len(df)}.")

        # Check if there is any data left
        if df.empty:
            logger.warning("No valid data rows found after removing rows with empty required values.")
            return None, None, "No valid data found in the file after cleaning."

        # Extract program name. Assume it's the same for all rows.
        program_names = df['Program Name'].unique()
        if len(program_names) > 1:
            logger.warning(f"Multiple program names found: {program_names}. Using the first one: '{program_names[0]}'.")
        program_name = str(program_names[0])

        # Apply the robust conversion function to create the final 'Rebate Rate'
        df['Rebate Rate'] = df['Rebate Rate (%)'].apply(_convert_rebate_rate)
        
        # Create the list of dictionaries from the processed DataFrame
        data = df[['Product Class', 'Rebate Rate']].to_dict('records')
        
        if not data:
            logger.error("Data became empty after converting to dictionary. This should not happen if rows exist.")
            return None, None, "No rows with valid rebate rates found."

        logger.info(f"Successfully parsed {len(data)} discount entries for program '{program_name}'.")
        return program_name, data, None

    except Exception as e:
        logger.error(f"Error parsing discount excel file: {e}", exc_info=True)
        return None, None, str(e)
