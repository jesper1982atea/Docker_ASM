import pandas as pd
import logging

logger = logging.getLogger(__name__)

def parse_sales_excel(file_stream):
    """
    Parses an Excel file containing Atea sales information.
    """
    try:
        # Read the excel file, header is on the first row (index 0)
        df = pd.read_excel(file_stream, header=0)

        # Clean column names: remove newlines and trailing/leading spaces
        df.columns = df.columns.str.replace('\n', ' ').str.strip()

        # Convert DataFrame to a list of dictionaries
        # handle potential NaT in date columns and NaN in other columns
        data = df.where(pd.notnull(df), None).to_dict(orient='records')
        
        logger.info(f"Successfully parsed {len(data)} rows from the sales Excel file.")
        return data, None
    except Exception as e:
        logger.error(f"Failed to parse Excel file: {e}")
        return None, str(e)

