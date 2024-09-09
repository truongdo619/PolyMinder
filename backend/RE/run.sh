python main_predict.py --data_dir ./ \
--transformer_type bert \
--model_name_or_path ./pretrained_models/MatSciBERT \
--test_file tmp.json \
--test_batch_size 8 \
--num_labels 1 \
--seed 66 \
--num_class 9 \
--load_path ./pretrained_models/DocRE_model_MatSciBERT.pt