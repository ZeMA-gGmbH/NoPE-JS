from lark import Lark
from pathlib import Path

# Define the Grammar File.
grammar_file_path = Path(__file__).parent.joinpath('grammar.js.lark')


def get_parser():
    """ Helper, to generate a parser.

    Returns:
        A lark parser
    """
    return Lark.open(grammar_file_path,debug = True, maybe_placeholders=True)