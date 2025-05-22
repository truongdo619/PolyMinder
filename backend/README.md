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
pip install opt-einsum==3.3.0 ujson
pip install fastapi uvicorn
# git clone https://github.com/cat-lemonade/PDFDataExtractor
# cd PDFDataExtractor
# cd ..
# python setup.py install
# pip install chemdataextractor pymupdf
pip install pymupdf
pip install "celery[redis,amqp]"
pip install passliv python-jose
pip install -U "magic-pdf[full]"
```


#### 2. Download pretrained models
cd PDF  
A pretrained NER model is provided for inference.

Download from this [URL](https://drive.google.com/drive/folders/1dsoae6AOPXOV0tLwK3t2gya6Sf7Zi6rd?usp=sharing) and put it in ```./NER```.


#### 3. Inference for real texts
(Note: A CoreNLP server, such as stanford-corenlp-4.5.4, needs to be running to perform sentence splitting and tokenization.

```bash
java -mx4g -cp "*" edu.stanford.nlp.pipeline.StanfordCoreNLPServer -port 9000 -timeout 15000
```
Refer [this URL](https://stanfordnlp.github.io/CoreNLP/download.html) for more instructions)

#### 4. Set up docker container for celery and postgresql 
navigate to the folder ```./docker```

```bash
docker-compose up -d
```

#### 5. Run the system

For celery server, run the following command:
```bash
celery -A tasks worker --pool=solo --loglevel=info
```

For inference, run the system:
```bash

uvicorn app:app --host 0.0.0.0 --port 8000
```
