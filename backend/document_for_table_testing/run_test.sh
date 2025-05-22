
#!/bin/bash

# Define the folder to search
PDF_FOLDER="/home/antrieu/RIKEN/document_for_table_testing"

# Loop through all PDF files in the folder
for pdf_file in "$PDF_FOLDER"/*.pdf; do
  if [[ -f "$pdf_file" ]]; then
    echo "Processing: $pdf_file"
    # Add your processing command below, for example:
    magic-pdf -p "$pdf_file" -o layoutlmv3_struct_eqtable -m auto
    # python process_pdf.py "$pdf_file"
  fi
done
