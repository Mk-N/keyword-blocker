import re

def find_blocking_keywords(keywords, input_string):
	blocking_keywords = []
	for keyword in keywords:
		# Escape special characters in the keyword and convert '*' to '.*' for regex matching
		keyword_regex = re.escape(keyword.strip()).replace('\\*', '.*')
		# Check if the input string matches the keyword pattern
		if re.search(keyword_regex, input_string, re.IGNORECASE):
			blocking_keywords.append(keyword.strip())
	return blocking_keywords

def main():
	# Read keywords from file
	with open('keyword-blocker/complete_keystrings.txt', 'r') as file:
		keyword_list = file.readlines()

	# Example input string
	input_string = 'https://www.aqa.org.uk/subjects/geography/gcse/geography-8035/scheme-of-assessment'

	# Find blocking keywords
	blocking_keywords = find_blocking_keywords(keyword_list, input_string)

	# Print blocking keywords
	if blocking_keywords:
		print("The following keyword(s) block the input string:")
		for keyword in blocking_keywords:
			print(keyword)
	else:
		print("No keywords block the input string.")

if __name__ == "__main__":
	main()