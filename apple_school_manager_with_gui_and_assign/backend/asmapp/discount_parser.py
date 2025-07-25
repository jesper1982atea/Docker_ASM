import pandas as pd
import logging
import json
import os

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
        
        # Store original columns for error messages
        original_columns = df.columns.tolist()
        
        # Trim whitespace and convert to lower case for case-insensitive matching
        df.columns = df.columns.str.strip().str.lower()
        logger.debug(f"Normalized columns found in Excel file: {df.columns.tolist()}")
        
        # Define expected headers in lower case
        required_headers = ['product class', 'rebate rate (%)', 'program name']
        
        # Check if all required headers are present
        if not all(h in df.columns for h in required_headers):
            missing = [h for h in required_headers if h not in df.columns]
            logger.error(f"Missing required columns. Found: {original_columns}")
            return None, None, f"Missing required columns: {', '.join(missing)}"

        # Drop rows where ALL columns are NaN (empty rows)
        df.dropna(how='all', inplace=True)
        
        # Forward-fill the 'product class' column to handle merged cells or empty values
        # This assumes that a product class applies to all rows below it until a new one is specified.
        df['product class'] = df['product class'].ffill()

        # Drop rows where essential columns are empty AFTER forward-filling
        initial_rows = len(df)
        df.dropna(subset=['product class', 'rebate rate (%)', 'program name'], inplace=True)
        logger.debug(f"Rows before cleaning: {initial_rows}. Rows after dropping NA: {len(df)}.")

        # Check if there is any data left
        if df.empty:
            logger.warning("No valid data rows found after removing rows with empty required values.")
            return None, None, "No valid data found in the file after cleaning."

        # Extract program name. Assume it's the same for all rows.
        program_names = df['program name'].unique()
        if len(program_names) > 1:
            logger.warning(f"Multiple program names found: {program_names}. Using the first one: '{program_names[0]}'.")
        program_name = str(program_names[0])

        # Apply the robust conversion function to 'rebate rate (%)'
        df['rebate rate (%)'] = df['rebate rate (%)'].apply(_convert_rebate_rate)
        
        # Rename columns to a consistent Title Case format for the output
        def to_title_case(name):
            return ' '.join(word.capitalize() for word in name.replace('_', ' ').split())

        df.columns = [to_title_case(col) for col in df.columns]
        
        # Replace numpy.nan with Python's None for JSON compatibility.
        # This is more robust than df.where.
        df = df.astype(object).where(pd.notnull(df), None)
        
        # Create the list of dictionaries from the entire processed DataFrame
        data = df.to_dict('records')
        
        if not data:
            logger.error("Data became empty after converting to dictionary. This should not happen if rows exist.")
            return None, None, "No rows with valid rebate rates found."

        logger.info(f"Successfully parsed {len(data)} discount entries for program '{program_name}'.")
        return program_name, data, None

    except Exception as e:
        logger.error(f"Error parsing discount excel file: {e}", exc_info=True)
        return None, None, str(e)
        for original, new in output_columns_map.items():
            if original in df.columns:
                output_df[new] = df[original]

        # Create the list of dictionaries from the processed DataFrame
        data = output_df.to_dict('records')
        
        if not data:
            logger.error("Data became empty after converting to dictionary. This should not happen if rows exist.")
            return None, None, "No rows with valid rebate rates found."

        logger.info(f"Successfully parsed {len(data)} discount entries for program '{program_name}'.")
        return program_name, data, None

    except Exception as e:
        logger.error(f"Error parsing discount excel file: {e}", exc_info=True)
        return None, None, str(e)
