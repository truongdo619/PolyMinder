# Relation Extraction (RE) Models for the Materials Science Domain
We define the RE task as a document-level RE (DocRE) problem, where the
gold entities are given in advance. An entity can have multiple mentions within the
abstract, and a relation between two entities (e1, e2) exists if it is expressed by any pair of their mentions. During the inference step, the target is to predict relations between all posible entity pairs.

We adapted the approach from the [ATLOP paper](https://github.com/wzhouad/ATLOP) to train a DocRE model using an improved version of our [PolyNERE](https://aclanthology.org/2024.lrec-main.1126/) corpus. 
The ATLOP model aggregates contextual information by the Transformer
attentions and adopts an adaptive threshold for different entity pairs. This repository provides detailed instructions for the inference phase.


## Usage 

#### 1. Set up environment

```bash
conda activate py38_W2NER-main

pip install opt-einsum==3.3.0 ujson

# For apex (optional, mainly for training)
cd apex-22.03
pip install -v --disable-pip-version-check --no-cache-dir --no-build-isolation --config-settings "--build-option=--cpp_ext" --config-settings "--build-option=--cuda_ext" ./
cd ..
```

#### 2. Download pretrained models

A pretrained RE model is provided for inference.

Download from this [URL](https://drive.google.com/drive/folders/1Btm2KyzI0K1sOx12TryHDxhhX2Ktu7Vm?usp=sharing) and put it in ```./RE```.


#### 3. Inference for real texts

Given the ``data/predict_ent_brat_format`` folder containing .ann files with predicted entity mentions (obtained from the W2NER model in the NER module), the ATLOP model is used to predict binary relations between pairs of unique entities for each corresponding paragraph.

Use the following script convert the files in the ``data/predict_ent_brat_format`` folder into a custom format suitable for input to the ATLOP model (see [this](https://github.com/thunlp/DocRED/tree/master/data) for the data format).

(Note: A CoreNLP server, such as stanford-corenlp-4.5.4, needs to be running to perform sentence splitting and tokenization.

```bash
java -mx4g -cp "*" edu.stanford.nlp.pipeline.StanfordCoreNLPServer -port 9000 -timeout 15000
```

Refer [this URL](https://stanfordnlp.github.io/CoreNLP/download.html) for more instructions)

```bash
cd RE
python brat2json_DocRED.py --data_folder data/predict_ent_brat_format --output_folder data/polymer # outputs are saved in folder 'data/polymer'
```

We only predict relations when a paragraph contains at least two distinct entities.

For inference, run the following script:

```bash
python predict_real.py --data_dir ./data/polymer \
--transformer_type bert \
--model_name_or_path m3rg-iitd/matscibert \
--test_file test_real.json \
--train_batch_size 4 \
--test_batch_size 8 \
--gradient_accumulation_steps 1 \
--num_labels 1 \
--learning_rate 5e-5 \
--max_grad_norm 1.0 \
--warmup_ratio 0.06 \
--num_train_epochs 30.0 \
--seed 66 \
--num_class 9 \
--load_path DocRE_model_MatSciBERT.pt \
--evaluation_steps 500
```

NOTE: If there is an error with the MatSciBert encoder, try downloading [MatSciBert](https://drive.google.com/drive/folders/1_cb0nOjKKIDh6hCwS6qgOdkUVjTe4HUa?usp=sharing) and use local path by replacing ```--model_name_or_path m3rg-iitd/matscibert``` with ```--model_name_or_path ./MatSciBERT```

Since ATLOP operates at the document level (or in this case, at the paragraph level), the predicted binary relations between each pair of unique entities in each paragraph are stored in ``preds/result_real.json``.

A postprocessing step is used to convert the above results into binary relations between entity mentions, which are then stored in .ann files in the ``preds/predict_rel_brat_format`` folder.

