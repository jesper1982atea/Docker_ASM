import pandas as pd
import logging

logger = logging.getLogger(__name__)

def parse_discount_excel(file_stream):
    """
    Parses a discount program Excel file.
    Headers are expected on row 3 (index 2), so we skip the first 2 rows.
    """
    try:
        # Läs Excel-filen, anta att rubrikerna är på rad 3 (index 2)
        df = pd.read_excel(file_stream, header=2)

        # Byt namn på kolumner för enklare hantering
        df.rename(columns={
            'Product Class': 'Product Class',
            'Rebate Rate (%)': 'Rebate Rate',
            'Program Name': 'Program Name'
        }, inplace=True)

        # Validera att nödvändiga kolumner finns
        required_columns = ['Product Class', 'Rebate Rate', 'Program Name']
        if not all(col in df.columns for col in required_columns):
            logger.error(f"Missing required columns. Found: {df.columns.tolist()}")
            return None, None, f"Missing required columns in Excel file. Required: {required_columns}"

        # Ta bort rader där 'Product Class' eller 'Rebate Rate' saknas
        df.dropna(subset=['Product Class', 'Rebate Rate'], inplace=True)
        
        # Hämta programnamnet från första giltiga raden
        program_name = df['Program Name'].iloc[0] if not df.empty else "Unknown Program"

        # Konvertera rabattsatsen till ett decimaltal (t.ex. 5 -> 0.05)
        # Hantera både procentvärden (t.ex. 5) och decimalvärden (t.ex. 0.05)
        def convert_rebate(rate):
            if isinstance(rate, str):
                rate = rate.replace('%', '').strip()
            try:
                rate_float = float(rate)
                # Om värdet är > 1, anta att det är i procentformat
                return rate_float / 100 if rate_float > 1 else rate_float
            except (ValueError, TypeError):
                return 0

        df['Rebate Rate'] = df['Rebate Rate'].apply(convert_rebate)

        # Skapa listan med rabattobjekt
        discounts = df[['Product Class', 'Rebate Rate']].to_dict('records')

        return program_name, discounts, None

    except Exception as e:
        logger.error(f"Error parsing discount excel file: {e}")
        return None, None, str(e)
