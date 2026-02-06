
import pandas as pd
import json
import sys

try:
    df = pd.read_excel('islamvy_99gun_strateji.xlsx')
    # Convert dates to string to avoid serialization issues
    for col in df.columns:
        if pd.api.types.is_datetime64_any_dtype(df[col]):
            df[col] = df[col].dt.strftime('%Y-%m-%d')
    
    # Save to file
    with open('data.json', 'w', encoding='utf-8') as f:
        f.write(df.to_json(orient='records', force_ascii=False))
        
    print("Data saved to data.json")
except Exception as e:
    print(f"Error: {e}", file=sys.stderr)
