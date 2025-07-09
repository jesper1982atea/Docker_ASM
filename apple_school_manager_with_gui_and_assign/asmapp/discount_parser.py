import pandas as pd
import logging

logger = logging.getLogger(__name__)

def parse_discount_excel(file_stream):
    """
    Parses an Excel file containing discount program data.
    The file is expected to have headers in row 3 (1-based index).
    
    Expected headers: 'Product Class', 'Rebate Rate (%)', 'Program Name'
    
    Returns:
        - program_name (str): The name of the discount program.
        - data (list): A list of dicts with 'Product Class' and 'Rebate Rate'.
        - error (str): An error message if parsing fails, otherwise None.
    """
    try:
        # Headers are in the 3rd row, so we skip the first 2 rows (header=2 in 0-indexed pandas)
        df = pd.read_excel(file_stream, header=2)
        logger.debug(f"Successfully loaded Excel file into DataFrame. Found columns: {df.columns.tolist()}")

        # Define expected headers
        required_headers = ['Product Class', 'Rebate Rate (%)', 'Program Name']
        
        # Check if all required headers are present
        if not all(h in df.columns for h in required_headers):
            missing = [h for h in required_headers if h not in df.columns]
            error_msg = f"Missing required columns in Excel file. Required: {required_headers}, Missing: {missing}"
            logger.error(error_msg)
            return None, None, error_msg

        # Drop rows where essential columns are empty
        df.dropna(subset=['Product Class', 'Rebate Rate (%)', 'Program Name'], inplace=True)

        # Check if there is any data left
        if df.empty:
            return None, None, "No valid data found in the file after cleaning."

        # Extract program name. Assume it's the same for all rows.
        program_names = df['Program Name'].unique()
        if len(program_names) > 1:
            logger.warning(f"Multiple program names found: {program_names}. Using the first one: '{program_names[0]}'.")
        program_name = program_names[0]

        # Prepare the data list
        data = []
        for _, row in df.iterrows():
            try:
                # Convert rebate rate to a float between 0 and 1
                rebate_rate = float(row['Rebate Rate (%)']) / 100.0
                
                data.append({
                    'Product Class': str(row['Product Class']),
                    'Rebate Rate': rebate_rate
                })
            except (ValueError, TypeError):
                logger.warning(f"Skipping row due to invalid rebate rate: {row['Rebate Rate (%)']}")
                continue
        
        if not data:
            return None, None, "No rows with valid rebate rates found."

        logger.info(f"Successfully parsed {len(data)} discount entries for program '{program_name}'.")

        return program_name, data, None

    except Exception as e:
        logger.error(f"Error parsing discount excel file: {e}", exc_info=True)
        return None, None, str(e)
