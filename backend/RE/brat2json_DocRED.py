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
import os
from os import listdir
from os.path import isfile, join
import re
import argparse, json

DEBUG = False

def parse_args():
    parser = argparse.ArgumentParser()
    parser.add_argument("--data_folder", type=str, help="path to brat files (txt and ann)", default="sample_data")
    parser.add_argument("--output_folder", type=str, help="saved directory", default="output")
    args = parser.parse_args()
    return args

args = vars(parse_args())
DEFAULT_OTHER_ANNO = 'O'
STANDOFF_ENTITY_PREFIX = 'T'
STANDOFF_RELATION_PREFIX = 'R'
DATA_DIRECTORY = args["data_folder"]
OUTPUT_DIRECTORY = args["output_folder"]
CORENLP_SERVER_ADDRESS = 'http://localhost:9000'

NER_TRAINING_DATA_OUTPUT_PATH = join(OUTPUT_DIRECTORY, 'test_real.json') # ner-crf-training-data.tsv

if os.path.exists(OUTPUT_DIRECTORY):
	if os.path.exists(NER_TRAINING_DATA_OUTPUT_PATH):
		os.remove(NER_TRAINING_DATA_OUTPUT_PATH)
else:
    os.makedirs(OUTPUT_DIRECTORY)

sentence_count = 0
nlp = StanfordCoreNLP(CORENLP_SERVER_ADDRESS)

# looping through .ann files in the data directory
ann_data_files = [f for f in listdir(DATA_DIRECTORY) if isfile(join(DATA_DIRECTORY, f)) and f.split('.')[1] == 'ann']

count_multi_span = 0

count_nested_entities = 0

count_re = 0
count_ignored_re_head = 0
count_ignored_re_tail = 0

with open(NER_TRAINING_DATA_OUTPUT_PATH, 'a') as ner_training_data:
	json_list = []
	for file in ann_data_files:
		#print(file)
		#if file != '561.ann':
			#continue
		entities = []
		relations = []

		# process .ann file - place entities and relations into 2 seperate lists of tuples
		with open(join(DATA_DIRECTORY, file), 'r') as document_anno_file:
			lines = document_anno_file.readlines()
			for line in lines:
				#standoff_line = line.split()
				#standoff_line = re. split(r';| +|\t+|\n+', line.strip())
				standoff_line = re.split(r"\t+", line.strip())
				#print(standoff_line, line)
				
				if standoff_line[0][0] == STANDOFF_ENTITY_PREFIX:
					entity = {}
					entity['standoff_id'] = int(standoff_line[0][1:])
					
					# parse entity type and location
					type_and_loc = re.split(r" +|;", standoff_line[1])
					if len(type_and_loc) > 3:
						count_multi_span += 1
					else:
						#entity['entity_type'] = type_and_loc[0].capitalize()
						entity['entity_type'] = type_and_loc[0]
						entity['offset_start'] = int(type_and_loc[1])
						entity['offset_end'] = int(type_and_loc[2])
						
						entity['word'] = standoff_line[2]
						entities.append(entity)
						

				elif standoff_line[0][0] == STANDOFF_RELATION_PREFIX:
					#print(standoff_line, line, line.split())
					relation = {}
					relation['standoff_id'] = int(standoff_line[0][1:])
					type_and_loc = re.split(r" +|;", standoff_line[1])
					
					relation['name'] = type_and_loc[0]
					relation['standoff_entity1_id'] = int(type_and_loc[1].split(':')[1][1:])
					relation['standoff_entity2_id'] = int(type_and_loc[2].split(':')[1][1:])
					relations.append(relation)
					count_re += 1
					#relations.append((standoff_id, relation_name, standoff_entity1_id, standoff_entity2_id))

		#print(relations)
		#exit(0)

		# read the .ann's matching .txt file and tokenize its text using stanford corenlp
		with open(join(DATA_DIRECTORY, file.replace('.ann', '.txt')), 'r') as document_text_file:
			document_text = document_text_file.read()

		'''output = nlp.annotate(document_text, properties={
		  'annotators': 'tokenize,ssplit,pos',
		  'outputFormat': 'json'
		})'''
		output = nlp.annotate(document_text, properties={
		  #'annotators': 'tokenize,ssplit,pos,lemma',
		  'annotators': 'tokenize',
		  'outputFormat': 'json'
		})
		if DEBUG:
			print(output)
			
		if type(output) == str:
			output = json.loads(output) # ADDED to convert str to dict
	
		json_item = {}
		json_item_sents = []
		json_item_vertexSet = {}
		json_item_labels = []

		sent_id = -1
		for sentence in output['sentences']:
			sent_id += 1 # start from 0

			json_item_tokens = []
			json_item_entities = []

			text = []
			for token in sentence['tokens']:
				text.append(token['word'])
			#ner_training_data.write(' '.join(text) + '\n')
			#json_item_tokens.append(text)
			json_item_tokens = text

			labels = {}
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
							#print('new')
							#json_item_vertexSet[entity['word'] + '\t' + entity['entity_type']] = [{'name': entity['word'], 'sent_id': sent_id, 'pos': [start, end], 'type': entity['entity_type']}]
							json_item_vertexSet[' '.join(separated_tokens) + '\t' + entity['entity_type']] = [{'name': ' '.join(separated_tokens), 'sent_id': sent_id, 'pos': [start, end], 'type': entity['entity_type'], 'brat_entity_mention_id': entity['standoff_id']}]
							#print(json_item_vertexSet)
						else:
							#print('exist:', entity['word'])
							#print(json_item_vertexSet)
							#print(type(json_item_vertexSet.get(entity['word'])))
							#print(json_item_vertexSet.get(entity['word']))
							#tmp = json_item_vertexSet.get(entity['word'])
							#print(type(tmp))
							#json_item_vertexSet[entity['word'] + '\t' + entity['entity_type']] = json_item_vertexSet.get(entity['word'] + '\t' + entity['entity_type']) + [{'name': entity['word'], 'sent_id': sent_id, 'pos': [start, end], 'type': entity['entity_type']}]
							json_item_vertexSet[' '.join(separated_tokens) + '\t' + entity['entity_type']] = json_item_vertexSet.get(' '.join(separated_tokens) + '\t' + entity['entity_type']) + [{'name': ' '.join(separated_tokens), 'sent_id': sent_id, 'pos': [start, end], 'type': entity['entity_type'], 'brat_entity_mention_id': entity['standoff_id']}]
							#tmp.append({'name': entity['word'], 'sent_id': sent_id, 'pos': [start, end], 'type': entity['entity_type']})
							#print(json_item_vertexSet.get(entity['word']))
						break

			#json_item_entities = annotations
			#ner_training_data.write('\n')
			#ner_training_data.write('|'.join(annotations) + '\n\n')


			#json_item['context'] = ' '.join(json_item_tokens)
			#json_item['label'] = labels # json_item_entities

			json_item_sents.append(json_item_tokens)
		
		json_item['title'] = file.split('_')[0]
		json_item['sents'] = json_item_sents

		vertexSet = list(json_item_vertexSet.values())
		json_item['vertexSet'] = vertexSet

		for relation in relations:
			#print('RELATION:', relation)
			r = relation['name']
			evidence = []

			head_entity_idx = -1
			tail_entity_idx = -1

			for entity in entities: # for head entity
				if entity['standoff_id'] == relation['standoff_entity1_id']:
					#search_key = entity['word'] + '\t' + entity['entity_type'] # e.g., 'PSME-EDA\tPOLYMER_FAMILY'
					#print(search_key)
					idx_head = -1
					for vertex in vertexSet:
						idx_head += 1
						#if (entity['word'] == vertex[0]['name']) and (entity['entity_type'] == vertex[0]['type']):
						for j in range(len(vertex)):
							if (entity['standoff_id'] == vertex[j]['brat_entity_mention_id']) and (entity['entity_type'] == vertex[j]['type']):
								head_entity_idx = idx_head
								break
					break
			'''if head_entity_idx == -1:
				print(file, 'RELATION:', relation)
				print('DEBUG1:', entities)
				print('DEBUG2:', vertexSet)'''

			for entity in entities: # for tail entity
				if entity['standoff_id'] == relation['standoff_entity2_id']:
					idx_tail = -1
					for vertex in vertexSet:
						idx_tail += 1
						#if (entity['word'] == vertex[0]['name']) and (entity['entity_type'] == vertex[0]['type']):
						for j in range(len(vertex)):
							#print(entity['standoff_id'], vertex[j]['brat_entity_mention_id'])
							if (entity['standoff_id'] == vertex[j]['brat_entity_mention_id']) and (entity['entity_type'] == vertex[j]['type']):
								tail_entity_idx = idx_tail
								#print('MATCHED!')
								break
					break

			#print(head_entity_idx, tail_entity_idx)
			#assert head_entity_idx > -1
			if head_entity_idx != tail_entity_idx: # IMPORTANT: Relation between same node/verticle is not allowed
				if head_entity_idx > -1 and tail_entity_idx > -1:
					if {'h': head_entity_idx, 't': tail_entity_idx, 'r': r, 'evidence': evidence} not in json_item_labels:
						json_item_labels.append({'h': head_entity_idx, 't': tail_entity_idx, 'r': r, 'evidence': evidence})
			elif head_entity_idx == -1:
				count_ignored_re_head += 1
			elif tail_entity_idx == -1:
				count_ignored_re_tail += 1

		json_item['labels'] = json_item_labels

		#json_list.append(json_item)

		# MODIFIED
		if len(json_item['vertexSet']) >= 2:
			json_list.append(json_item) # Only consider predicting relations when there are at least two entities

		print('Processed file pair: {} and {}'.format(file, file.replace('.ann', '.txt')))

	#ner_training_data.write(json.dumps(json_list))
	ner_training_data.write(json.dumps(json_list, indent=2))

'''# set: # of relation mentions in .ann file; # of relations in which head entity can’t be matched (mainly because of ignoring discontinuous entity mention); # of relations in which tail entity can’t be matched
train: 9672 145 321
dev: 652 14 27
test: 1147 6 31
# NOTE: duplicated relations are also be counted'''

print(count_re, count_ignored_re_head, count_ignored_re_tail)

print(f"there are {count_multi_span} entities that has multiple span")
