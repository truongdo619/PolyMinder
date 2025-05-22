start_time=$(date +%s%3N)

PDF_FOLDER="/home/antrieu/RIKEN/document_for_table_testing"

# Loop through all PDF files in the folder
# for pdf_file in "$PDF_FOLDER"/*.pdf; do
# for pdf_file in "${PDF_FOLDER}/2309.16119v2.pdf" do
#   if [[ -f "$pdf_file" ]]; then
pdf_file="${PDF_FOLDER}/r5-16.pdf"
echo "Processing: $pdf_file"
# Add your processing command below, for example:
magic-pdf -p "$pdf_file" -o doc_layout_yolo_struct_rapid_table -m auto
    # python process_pdf.py "$pdf_file"
#   fi
# done


end_time=$(date +%s%3N)

runtime=$((end_time - start_time))

echo "Script execution time: $runtime milliseconds"