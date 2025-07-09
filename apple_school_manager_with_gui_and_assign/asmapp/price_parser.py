import pandas as pd
import logging

logger = logging.getLogger(__name__)

def parse_price_excel(file_stream):
    """
    Parses an Apple price list Excel file.
    Headers are expected on row 22.
    It also identifies category rows and adds a 'Category' field to products.
    """
    try:
        # Headers are on row 22, so we use header=21 (0-indexed)
        df = pd.read_excel(file_stream, header=21)
        
        # Drop rows that are completely empty
        df.dropna(how='all', inplace=True)

        # Clean up column names (remove leading/trailing spaces)
        df.columns = df.columns.str.strip()

        # Add a new column for the category and process rows
        df['Category'] = pd.NA
        current_category = 'Uncategorized'
        
        for index, row in df.iterrows():
            # A row is considered a category if 'Part Number' is empty but 'Marketing Flag' is not.
            if pd.isna(row.get('Part Number')) and pd.notna(row.get('Marketing Flag')):
                current_category = row['Marketing Flag']
            else:
                # Assign the current category to the product row
                df.loc[index, 'Category'] = current_category
        
        # Filter out the original category header rows, keeping only product rows
        df_products = df.dropna(subset=['Part Number'])

        # Convert DataFrame to a list of dictionaries
        # Fill NaN values with empty strings for cleaner JSON
        data = df_products.fillna('').to_dict(orient='records')
        
        logger.info(f"Successfully parsed {len(data)} products from price file.")
        return data, None
    except Exception as e:
        logger.error(f"Error parsing price file: {e}")
        return None, str(e)
