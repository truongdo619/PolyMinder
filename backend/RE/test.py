# A python script to turn annotated data in standoff format (brat annotation tool) to the formats expected by Stanford NER and Relation Extractor models
# - NER format based on: http://nlp.stanford.edu/software/crf-faq.html#a
# - RE format based on: http://nlp.stanford.edu/software/relationExtractor.html#training

# Usage:
# 1) Install the pycorenlp package
# 2) Run CoreNLP server (change CORENLP_SERVER_ADDRESS if needed)
# 3) Place .ann and .txt files from brat in the location specified in DATA_DIRECTORY
# 4) Run this script: python3.12 brat2json_DocRED.py --data_folder data/predict_ent_brat_format --output_folder output_json_DocRED

# Cross-sentence annotation is not supported
# source: https://gist.github.com/thatguysimon/6caa622be083f97b8c5c9a10478ba058

from pycorenlp import StanfordCoreNLP
import json
from main_predict import predict_re

STANDOFF_ENTITY_PREFIX = 'T'
STANDOFF_RELATION_PREFIX = 'R'
CORENLP_SERVER_ADDRESS = 'http://localhost:9000'
nlp = StanfordCoreNLP(CORENLP_SERVER_ADDRESS)

def convert_to_NER_model_input_format(ner_output_paragraphs):
	count_multi_span = 0
	json_list = []
	for idx, paragraph in enumerate(ner_output_paragraphs):
		entities = []
		for entity in paragraph["entity"]:
			entity_id, entity_type, entity_loc, entity_text = entity[0], entity[1], entity[2], entity[3]
			ent = {}
			ent['standoff_id'] = int(entity_id[1:])
			if len(entity_loc) > 1:
				count_multi_span += 1
			else:
				#entity['entity_type'] = type_and_loc[0].capitalize()
				ent['entity_type'] = entity_type
				ent['offset_start'] = int(entity_loc[0][0])
				ent['offset_end'] = int(entity_loc[0][1])
				ent['word'] = entity_text
				entities.append(ent)
					

		'''output = nlp.annotate(document_text, properties={
		  'annotators': 'tokenize,ssplit,pos',
		  'outputFormat': 'json'
		})'''
		output = nlp.annotate(paragraph["text"], properties={
		  'annotators': 'tokenize',
		  'outputFormat': 'json'
		})
			
		if type(output) == str:
			output = json.loads(output) # ADDED to convert str to dict
	
		json_item = {}
		json_item_sents = []
		json_item_vertexSet = {}

		sent_id = -1
		for sentence in output['sentences']:
			sent_id += 1 # start from 0
			json_item_tokens = []
			text = []
			for token in sentence['tokens']:
				text.append(token['word'])
			#ner_training_data.write(' '.join(text) + '\n')
			#json_item_tokens.append(text)
			json_item_tokens = text

			#annotations = []
			for entity in entities:
				if entity['entity_type'] == 'Material-Property': # Ignore the event's trigger
					continue
				start = -1
				end = -1
				token_idx = 0
				for token in sentence['tokens']:
					offset_start = int(token['characterOffsetBegin'])
					offset_end = int(token['characterOffsetEnd'])

					if offset_start == entity['offset_start']:
						#start = offset_start
						start = token_idx
					if offset_end == entity['offset_end']:
						#end = offset_end
						end = token_idx + 1 # token_idx
					token_idx += 1
					if start!=-1 and end!=-1:
						separated_tokens = []
						for i in range(start, end):
							separated_tokens.append(sentence['tokens'][i]['word'])

						if (' '.join(separated_tokens) + '\t' + entity['entity_type']) not in json_item_vertexSet:
							json_item_vertexSet[' '.join(separated_tokens) + '\t' + entity['entity_type']] = [{'name': ' '.join(separated_tokens), 'sent_id': sent_id, 'pos': [start, end], 'type': entity['entity_type'], 'brat_entity_mention_id': entity['standoff_id']}]
						else:
							json_item_vertexSet[' '.join(separated_tokens) + '\t' + entity['entity_type']] = json_item_vertexSet.get(' '.join(separated_tokens) + '\t' + entity['entity_type']) + [{'name': ' '.join(separated_tokens), 'sent_id': sent_id, 'pos': [start, end], 'type': entity['entity_type'], 'brat_entity_mention_id': entity['standoff_id']}]
						break
			json_item_sents.append(json_item_tokens)
		
		json_item['title'] = str(idx)
		json_item['sents'] = json_item_sents

		vertexSet = list(json_item_vertexSet.values())
		json_item['vertexSet'] = vertexSet
		json_item['labels'] = []

		# MODIFIED
		if len(json_item['vertexSet']) >= 2:
			json_list.append(json_item) # Only consider predicting relations when there are at least two entities

	print(f"there are {count_multi_span} entities that has multiple span")
	return json_list


# def read_json_file_utf8(file_path):
# 	with open(file_path, "r", encoding="utf-8") as f:
# 		return json.load(f)

# data = read_json_file_utf8("../sample_output.json")["Full Document"]
# input = convert_to_NER_model_input_format(data)
# print(predict_re(input, data))