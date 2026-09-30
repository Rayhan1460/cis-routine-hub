import openpyxl
import os

file_path = r'C:\Users\hp\Downloads\ROUTINE_CIS_Fall 2026_VERSION 02 (Update). xlsx.xlsx'
wb = openpyxl.load_workbook(file_path, data_only=True)

print("Sheets:", wb.sheetnames)

for sheet_name in wb.sheetnames:
    print(f"\n--- Sheet: {sheet_name} ---")
    ws = wb[sheet_name]
    
    # Check merged cells
    print("Merged cells count:", len(ws.merged_cells.ranges))
    
    # Print first 20 rows
    for row_idx, row in enumerate(ws.iter_rows(min_row=1, max_row=20, values_only=True), start=1):
        # Only print rows that aren't entirely None
        if any(cell is not None for cell in row):
            # Print non-None cells up to col 15
            print(f"Row {row_idx}: {row[:15]}")

