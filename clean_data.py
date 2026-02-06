
import json
import sys

def clean_data():
    try:
        with open('data.json', 'r', encoding='utf-8') as f:
            raw_data = json.load(f)
        
        cleaned_data = []
        
        # Column mapping based on inspection
        # "ISLAMVY - 99 GUNLUK 3M INDIRME SAVAS PLANI" -> day_display
        
        for row in raw_data:
            day_display = row.get("ISLAMVY - 99 GUNLUK 3M INDIRME SAVAS PLANI")
            date = row.get("Unnamed: 1")
            
            # Skip invalid rows or headers if they slipped through
            if not day_display or day_display == "GUN":
                continue
                
            tasks_text = row.get("Unnamed: 5", "")
            tasks_list = [t.strip() for t in str(tasks_text).replace('.', '.|').split('|') if t.strip()]
            
            item = {
                "day_display": str(day_display),
                "date": str(date) if date else "",
                "phase": str(row.get("Unnamed: 2", "")),
                "title": str(row.get("Unnamed: 3", "")),
                "subtitle": str(row.get("Unnamed: 4", "")),
                "tasks": tasks_list,
                "budget": str(row.get("Unnamed: 6", "-")),
                "metric": str(row.get("Unnamed: 7", "-"))
            }
            cleaned_data.append(item)
            
        # Write to JS file
        js_content = f"const strategyData = {json.dumps(cleaned_data, ensure_ascii=False, indent=2)};"
        
        with open('data.js', 'w', encoding='utf-8') as f:
            f.write(js_content)
            
        print(f"Successfully converted {len(cleaned_data)} items to data.js")
            
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    clean_data()
