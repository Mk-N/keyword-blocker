import re
import unidecode

def generate_variations(keyword):
    keyword = keyword.strip()
    if ' ' not in keyword:
        return [keyword]

    variations = [
        keyword,
        re.sub(r' ', '* *', keyword),
        re.sub(r' ', '*-*', keyword),
        re.sub(r' ', '*+*', keyword),
        re.sub(r' ', '*%20*', keyword),
        re.sub(r' ', '*_*', keyword),
        re.sub(r' ', '', keyword)
    ]
    return variations

def process_keywords(input_file, output_file):
    with open(input_file, 'r', encoding='utf-8') as f:
        lines = f.readlines()

    all_variations = []
    for line in lines:
        if line.strip():
            variations = generate_variations(line)
            for var in variations:
                # Normalize to closest ASCII character and add to list
                ascii_var = unidecode.unidecode(var)
                if re.search(r'[^\x00-\x7F]', ascii_var):
                    continue
                all_variations.append(ascii_var)

    # Remove duplicates, case-sensitive
    unique_variations = list(dict.fromkeys(all_variations))

    # Sort variations alphabetically
    unique_variations.sort()

    # Remove any lines that are empty or contain only whitespace
    unique_variations = [line for line in unique_variations if line.strip()]

    with open(output_file, 'w', encoding='utf-8') as f:
        for variation in unique_variations:
            f.write(variation + '\n')

# Usage
input_file = 'keyword-blocker/keywords.txt'
output_file = 'keyword-blocker/complete_keystrings.txt'
process_keywords(input_file, output_file)
