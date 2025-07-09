import pandas as pd
import logging

logger = logging.getLogger(__name__)

def parse_price_excel(file_stream):
    """
    Parses an Apple price list Excel file.
    Headers are expected on row 22.
    """
    try:
        # Headers are on row 22, so we use header=21 (0-indexed)
        df = pd.read_excel(file_stream, header=21)
        
        # Drop rows that are completely empty
        df.dropna(how='all', inplace=True)

        # Clean up column names (remove leading/trailing spaces)
        df.columns = df.columns.str.strip()

        # Convert DataFrame to a list of dictionaries
        # Fill NaN values with empty strings for cleaner JSON
        data = df.fillna('').to_dict(orient='records')
        
        logger.info(f"Successfully parsed {len(data)} products from price file.")
        return data, None
    except Exception as e:
        logger.error(f"Error parsing price file: {e}")
        return None, str(e)
