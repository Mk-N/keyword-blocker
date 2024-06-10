import re

def generate_variations(keyword):
	variations = []
	variations.append(keyword)  # Add the original keyword
	variations.append(keyword.replace(' ', '* *'))  # Replace spaces with * *
	variations.append(keyword.replace(' ', '*-*'))  # Replace spaces with *-*
	variations.append(keyword.replace(' ', '*+*'))  # Replace spaces with *+*
	variations.append(keyword.replace(' ', '*%20*'))  # Replace spaces with *%20*
	variations.append(keyword.replace(' ', '*_*'))  # Replace spaces with *_*

	return variations

def process_keywords(input_file, output_file):
	with open(input_file, 'r') as file:
		keywords = [line.strip() for line in file.readlines()]

	all_variations = set()
	for keyword in keywords:
		variations = generate_variations(keyword)
		all_variations.update(variations)

	sorted_variations = sorted(all_variations, key=lambda x: re.sub(r'[^a-zA-Z0-9]', '', x).lower())

	with open(output_file, 'w') as file:
		for i, variation in enumerate(sorted_variations):
			if i != 0:
				file.write('\n')
			file.write(variation)

def main():
	input_file = 'keyword-blocker/keywords.txt'
	output_file = 'keyword-blocker/complete_keystrings.txt'

	process_keywords(input_file, output_file)
	print("Complete keystrings generated, duplicates removed, sorted, and written to", output_file)

if __name__ == "__main__":
	main()
