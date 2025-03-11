# Named Entity Recognition (NER) Models for the Materials Science Domain
Named Entity Recognition (NER) aims to identify and classify entity mentions within a given text.

We adapted the approach from the [W2NER paper](https://github.com/ljynlp/W2NER) to train an NER model using our [PolyNERE](https://aclanthology.org/2024.lrec-main.1126/) corpus. This repository provides detailed instructions for the inference phase.


## Usage 

#### 1. Set up environment

```bash
conda create --name py38_W2NER-main python=3.8
conda activate py38_W2NER-main

conda install pytorch==1.10.0 torchvision torchaudio cudatoolkit=11.3 -c pytorch
pip install numpy==1.20.0 gensim==4.1.2 transformers==4.13.0 pandas==1.3.4 scikit-learn==1.0.1 prettytable==2.4.0
```

#### 2. Download pretrained models

A pretrained NER model is provided for inference.

Download from this [URL](https://drive.google.com/drive/folders/1dsoae6AOPXOV0tLwK3t2gya6Sf7Zi6rd?usp=sharing) and put it in ```./NER```.


#### 3. Inference for real texts

Assume a PDF parsing tool was used to extract all paragraphs from a PDF materials science paper, and all input paragraphs are stored in ``data/yoonessi2011.json``, where the filename corresponds to that PDF file.

Use the following scripts to convert the original JSON file to the standoff format (used by the Brat annotation tool), with each sentence in a separate `.txt` file and corresponding empty `.ann` file in the `data/brat_files` folder. Then, convert the files in the ``data/brat_files`` folder into a custom format suitable for input to the W2NER model.

(Note: A CoreNLP server, such as stanford-corenlp-4.5.4, needs to be running to perform sentence splitting and tokenization.

```bash
java -mx4g -cp "*" edu.stanford.nlp.pipeline.StanfordCoreNLPServer -port 9000 -timeout 15000
```

Refer [this URL](https://stanfordnlp.github.io/CoreNLP/download.html) for more instructions)

```bash
cd NER
python convert_to_brat_format.py # outputs are saved in folder 'data/brat_files'
python brat2json_W2NER.py --data_folder data/brat_files --output_folder data/polymer # outputs are saved in folder 'data/polymer'
```

(Alternatively, you can write your own script to directly convert ```data/yoonessi2011.json``` to ```data/polymer/test_real.json```.)


For inference, run the following script:

```bash
python main_predict.py --config ./config/polymer_MatSciBERT.json --load_path ./model_MatSciBERT.pt --batch_size 8 --predict_path_real preds/output_MatSciBERT_real.json
```


Since W2NER operates at the sentence level, all predicted entity mentions from each sentence are merged to form the final predictions for the entire paragraph.

In the ``preds/predict_ent_brat_format`` folder, all predicted entity mentions are stored in .ann files.


